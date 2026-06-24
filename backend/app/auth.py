#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ╔══════════════════════════════════════════════════════════════════╗
# ║  Latestname — 此刻之名                                          ║
# ║  东西方占卜融合平台 (易经 × 塔罗 × 卦格人格)                       ║
# ╠══════════════════════════════════════════════════════════════════╣
# ║  Copyright © 2026 Lin Ruihan (linmy666)                          ║
# ║  SPDX-License-Identifier: AGPL-3.0-or-later                      ║
# ║  https://github.com/linmy666/latestname                          ║
# ║                                                                  ║
# ║  This program is free software: you can redistribute it and/or   ║
# ║  modify it under the terms of the GNU Affero General Public      ║
# ║  License v3.0 as published by the Free Software Foundation.      ║
# ║                                                                  ║
# ║  This program is distributed in the hope that it will be useful, ║
# ║  but WITHOUT ANY WARRANTY; without even the implied warranty of  ║
# ║  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.            ║
# ║  See the GNU Affero General Public License for more details.     ║
# ╚══════════════════════════════════════════════════════════════════╝
# Authorship: Lin Ruihan | GitHub: linmy666 | Project: Latestname
# Watermark hash: 4c3a8f2e7b1d9065a2c8e4f1b7d3096e8a5c2f4d

"""
Latestname — 认证与管理系统 (fastapi-users 重写版)
支持：邮箱密码、Google/GitHub OAuth、Magic Link 登录、邮箱验证
管理员：配置全局LLM API、管理用户、查看统计
限额：每日100用户、每用户每天1次AI深度解读
通过环境变量 ENABLE_AUTH=true 开启
"""
import os
import datetime
import secrets
import hashlib
import json
import contextlib
from typing import Optional, AsyncGenerator

import bcrypt
import jwt
from sqlalchemy import (
    create_engine, Column, Integer, String, Boolean, DateTime, Text, ForeignKey
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.ext.asyncio import (
    AsyncSession, create_async_engine, async_sessionmaker
)
from fastapi import APIRouter, Depends, HTTPException, Request, Body
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr, Field

# fastapi-users
from fastapi_users import FastAPIUsers, BaseUserManager, IntegerIDMixin, models
from fastapi_users.authentication import (
    AuthenticationBackend, BearerTransport, JWTStrategy
)
from fastapi_users.db import (
    SQLAlchemyBaseUserTable, SQLAlchemyBaseOAuthAccountTable,
    SQLAlchemyUserDatabase
)

# ============================================================
# 配置
# ============================================================

AUTH_ENABLED = os.getenv("ENABLE_AUTH", "false").lower() == "true"
JWT_SECRET = os.getenv("JWT_SECRET", "latestname-dev-secret-change-me")
JWT_ALGO = "HS256"
JWT_EXPIRE_HOURS = 72

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
OAUTH_REDIRECT_BASE = os.getenv("OAUTH_REDIRECT_BASE", "")

DAILY_USER_LIMIT = 100
DAILY_AI_LIMIT = 1  # 已废弃：用 QUOTA_LIMITS 替代

# v2.2: 用户分级配额表
# action_type: 'mbti'(卦名) | 'divination'(卦象) | 'ai'(深度分析)
QUOTA_LIMITS = {
    "standard": {"mbti": 1, "divination": 5, "ai": 1},
    "pro":      {"mbti": 10, "divination": 20, "ai": 10},
}

QUOTA_ACTION_NAMES = {
    "mbti": "卦名测算",
    "divination": "卦象测算",
    "ai": "深度分析",
}

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "auth.db")
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

# ============================================================
# 数据库 — 同步引擎（admin/usage 等旧功能）+ 异步引擎（fastapi-users）
# ============================================================

Base = declarative_base()

# 同步
engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

# 异步（fastapi-users 要求）
async_engine = create_async_engine(f"sqlite+aiosqlite:///{DB_PATH}", echo=False)
AsyncSessionLocal = async_sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)


# ============================================================
# 数据模型
# ============================================================

class User(SQLAlchemyBaseUserTable[int], Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=True)
    avatar_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    # 兼容旧字段（迁移后仍在 DB 中，ORM 映射）
    oauth_provider = Column(String(20), nullable=True)
    oauth_id = Column(String(255), nullable=True)
    # v2.2: 用户分级 — standard(默认) / pro(管理员授权)
    # 此字段永不在 /api/auth/me 返回，避免泄露
    tier = Column(String(20), default="standard", nullable=True)


class OAuthAccount(SQLAlchemyBaseOAuthAccountTable[int], Base):
    __tablename__ = "oauth_accounts"
    id = Column(Integer, primary_key=True, autoincrement=True)


class MagicLink(Base):
    """Magic Link / 邮箱验证 token 表"""
    __tablename__ = "magic_links"
    id = Column(Integer, primary_key=True, autoincrement=True)
    token = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(320), index=True, nullable=False)
    purpose = Column(String(20), default="login")  # login / verify / reset
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class UsageRecord(Base):
    __tablename__ = "usage_records"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, index=True, nullable=False)
    date = Column(String(10), nullable=False)
    ai_count = Column(Integer, default=0)  # 深度分析
    divination_count = Column(Integer, default=0)  # 卦象测算（占卜）
    mbti_count = Column(Integer, default=0)  # 卦名测算（MBTI）


class DailyCounter(Base):
    __tablename__ = "daily_counters"
    date = Column(String(10), primary_key=True)
    unique_users = Column(Integer, default=0)


class SystemConfig(Base):
    __tablename__ = "system_config"
    key = Column(String(50), primary_key=True)
    value = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)


class DivinationRecord(Base):
    """卜辞记录 — 用户每次占卜的完整结果存档"""
    __tablename__ = "divination_records"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, index=True, nullable=False)
    question = Column(String(200), nullable=True)
    mode = Column(String(20), default="combined")  # combined/iching/tarot
    result_json = Column(Text, nullable=False)  # 完整占卜结果 JSON
    latest_name = Column(String(50), nullable=True)  # 此刻之名（快速索引）
    hexagram_name = Column(String(20), nullable=True)  # 卦名（快速索引）
    personality_name = Column(String(20), nullable=True)  # 卦格名（快速索引）
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Feedback(Base):
    """用户反馈 — 建议 / bug / 功能请求"""
    __tablename__ = "feedbacks"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, index=True, nullable=True)   # null = 未登录用户
    user_email = Column(String(200), nullable=True)         # 联系邮箱（可选）
    category = Column(String(20), default="suggestion")     # suggestion / bug / praise / other
    content = Column(Text, nullable=False)
    status = Column(String(20), default="open")             # open / reviewed / resolved
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


# 不调 create_all（DB 已由迁移脚本创建），仅确保表存在
Base.metadata.create_all(engine)


# ============================================================
# fastapi-users 基础设施
# ============================================================

async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    yield SQLAlchemyUserDatabase(session, User, OAuthAccount)


class UserManager(IntegerIDMixin, BaseUserManager[User, int]):
    reset_password_token_secret = JWT_SECRET
    verification_token_secret = JWT_SECRET

    async def on_after_register(self, user: User, request: Optional[Request] = None):
        print(f"[auth] 用户注册: {user.email}")
        # 注册后自动发验证邮件
        if AUTH_ENABLED and not user.is_verified:
            await self.request_verify(user, request)

    async def on_after_verify(self, user: User, request: Optional[Request] = None):
        print(f"[auth] 邮箱已验证: {user.email}")

    async def on_after_login(
        self, user: User, request: Optional[Request] = None, response=None
    ):
        print(f"[auth] 用户登录: {user.email}")


async def get_user_manager(user_db=Depends(get_user_db)):
    yield UserManager(user_db)


# 认证后端
bearer_transport = BearerTransport(tokenUrl="/api/auth/jwt/login")


def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(secret=JWT_SECRET, lifetime_seconds=JWT_EXPIRE_HOURS * 3600)


auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)

fastapi_users = FastAPIUsers[User, int](get_user_manager, [auth_backend])

current_active_user = fastapi_users.current_user(active=True)
current_superuser = fastapi_users.current_user(active=True, superuser=True)


# ============================================================
# JWT 兼容层（旧 API 用旧 token 格式）
# ============================================================

def create_token(user_id: int, email: str, is_admin: bool = False) -> str:
    """旧版 JWT token 创建（兼容前端 AuthContext）"""
    payload = {
        "sub": str(user_id),
        "email": email,
        "admin": is_admin,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRE_HOURS),
        "iat": datetime.datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def verify_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    if not hashed:
        return False
    return bcrypt.checkpw(password.encode(), hashed.encode())


# ============================================================
# 管理员初始化
# ============================================================

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@latestname.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")
ADMIN_NAME = os.getenv("ADMIN_NAME", "管理员")


def init_admin():
    if not AUTH_ENABLED:
        return
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if admin:
            if not admin.is_superuser:
                admin.is_superuser = True
                db.commit()
                print(f"[auth] 已将 {ADMIN_EMAIL} 提升为管理员")
            return
        if not ADMIN_PASSWORD:
            # v2.4: ADMIN_PASSWORD 未设置时，自动生成一个随机强密码并打印到日志
            # 这样容器重启后管理员账户不会 lock-out，且我们能在 Railway logs 里看到
            import secrets, string
            generated = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(20))
            ADMIN_PASSWORD = generated
            print(f"[auth] ⚠ ADMIN_PASSWORD 未设置，已自动生成临时管理员密码: {generated}")
            print(f"[auth] 强烈建议在 Railway 环境变量中设置 ADMIN_PASSWORD 以避免下次重启再次变化")
        admin = User(
            email=ADMIN_EMAIL,
            name=ADMIN_NAME,
            hashed_password=hash_password(ADMIN_PASSWORD),
            is_superuser=True,
            is_verified=True,
            is_active=True,
        )
        db.add(admin)
        db.commit()
        print(f"[auth] 管理员账户已创建: {ADMIN_EMAIL}")
    finally:
        db.close()


init_admin()


# ============================================================
# 同步 DB 工具（admin/usage 保留）
# ============================================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_llm_config(db: Session) -> Optional[dict]:
    row = db.query(SystemConfig).filter(SystemConfig.key == "llm_config").first()
    if row and row.value:
        try:
            return json.loads(row.value)
        except Exception:
            pass
    return None


def save_llm_config(db: Session, config: dict):
    row = db.query(SystemConfig).filter(SystemConfig.key == "llm_config").first()
    if row:
        row.value = json.dumps(config, ensure_ascii=False)
        row.updated_at = datetime.datetime.utcnow()
    else:
        row = SystemConfig(key="llm_config", value=json.dumps(config, ensure_ascii=False))
        db.add(row)
    db.commit()


def get_system_setting(db: Session, key: str, default=None):
    row = db.query(SystemConfig).filter(SystemConfig.key == key).first()
    if row and row.value:
        return row.value
    return default


# ============================================================
# 兼容旧版 get_current_user / require_user / require_admin
# ============================================================

security = HTTPBearer(auto_error=False)


def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if not AUTH_ENABLED:
        return None
    if not creds:
        return None
    payload = verify_token(creds.credentials)
    if not payload:
        return None
    user_id = int(payload.get("sub", 0))
    return db.query(User).filter(User.id == user_id).first()


def require_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if not AUTH_ENABLED:
        return User(id=0, email=None, name="guest", hashed_password=None, is_active=True,
                    is_superuser=False, is_verified=True)
    user = get_current_user(creds, db)
    if not user:
        raise HTTPException(status_code=401, detail="请先登录")
    return user


def require_admin(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if not AUTH_ENABLED:
        raise HTTPException(status_code=403, detail="开源模式无管理后台")
    user = get_current_user(creds, db)
    if not user:
        raise HTTPException(status_code=401, detail="请先登录")
    if not user.is_superuser:
        raise HTTPException(status_code=403, detail="需要管理员权限")
    return user


def check_daily_limit(user: User, db: Session) -> tuple[bool, str]:
    if not AUTH_ENABLED:
        return True, ""
    today = datetime.date.today().isoformat()
    counter = db.query(DailyCounter).filter(DailyCounter.date == today).first()
    if not counter:
        counter = DailyCounter(date=today, unique_users=0)
        db.add(counter)
    usage = db.query(UsageRecord).filter(
        UsageRecord.user_id == user.id, UsageRecord.date == today
    ).first()
    if not usage:
        if counter.unique_users >= DAILY_USER_LIMIT:
            return False, f"今日用户数已达上限（{DAILY_USER_LIMIT}人），请明天再来"
        counter.unique_users += 1
        usage = UsageRecord(user_id=user.id, date=today, ai_count=0, divination_count=0)
        db.add(usage)
        db.commit()
    return True, ""


def check_ai_limit(user: User, db: Session) -> tuple[bool, str, int]:
    """向后兼容的旧 API，内部委托给新的配额系统"""
    return check_quota(user, "ai", db)


def check_quota(user: User, action_type: str, db: Session) -> tuple[bool, str, int]:
    """
    v2.2 配额系统 — 按用户分级返回 (ok, error_msg, remaining)

    action_type: 'mbti' | 'divination' | 'ai'
    """
    if not AUTH_ENABLED:
        return True, "", -1

    tier = getattr(user, "tier", "standard") or "standard"
    if tier not in QUOTA_LIMITS:
        tier = "standard"

    # v2.3: 管理员（is_superuser=True）无限额度
    if getattr(user, "is_superuser", False):
        return True, "", -1

    limit = QUOTA_LIMITS[tier][action_type]

    today = datetime.date.today().isoformat()
    usage = db.query(UsageRecord).filter(
        UsageRecord.user_id == user.id, UsageRecord.date == today
    ).first()

    if not usage:
        # 新的一天，检查每日全局上限
        ok, msg = check_daily_limit(user, db)
        if not ok:
            return False, msg, 0
        usage = db.query(UsageRecord).filter(
            UsageRecord.user_id == user.id, UsageRecord.date == today
        ).first()

    # 检查当日该 action 已用次数
    if action_type == "ai":
        current = usage.ai_count
    elif action_type == "divination":
        current = usage.divination_count
    elif action_type == "mbti":
        current = usage.mbti_count
    else:
        return False, f"未知配额类型: {action_type}", 0

    if current >= limit:
        action_name = QUOTA_ACTION_NAMES.get(action_type, action_type)
        return False, f"今日{action_name}次数已用完（{limit}次/天），请明天再来", 0

    # 增加用量
    if action_type == "ai":
        usage.ai_count += 1
    elif action_type == "divination":
        usage.divination_count += 1
    elif action_type == "mbti":
        usage.mbti_count += 1
    db.commit()

    return True, "", limit - (current + 1)


def get_user_quota(user: User, db: Session) -> dict:
    """
    获取用户当天三种配额的使用情况。
    返回字段包含剩余配额、限额 — 不返回 tier 字段（前端无需知道分级）。
    """
    if not AUTH_ENABLED:
        return {"mbti": {"used": 0, "limit": -1, "unlimited": True},
                "divination": {"used": 0, "limit": -1, "unlimited": True},
                "ai": {"used": 0, "limit": -1, "unlimited": True}}

    tier = getattr(user, "tier", "standard") or "standard"
    if tier not in QUOTA_LIMITS:
        tier = "standard"
    limits = QUOTA_LIMITS[tier]

    # v2.3: 管理员（is_superuser=True）无限额度
    is_admin = getattr(user, "is_superuser", False)
    if is_admin:
        return {
            "mbti": {"used": 0, "limit": -1, "unlimited": True},
            "divination": {"used": 0, "limit": -1, "unlimited": True},
            "ai": {"used": 0, "limit": -1, "unlimited": True},
            "reset_at": "00:00:00",
        }

    today = datetime.date.today().isoformat()
    usage = db.query(UsageRecord).filter(
        UsageRecord.user_id == user.id, UsageRecord.date == today
    ).first()

    return {
        "mbti": {
            "used": usage.mbti_count if usage else 0,
            "limit": limits["mbti"],
        },
        "divination": {
            "used": usage.divination_count if usage else 0,
            "limit": limits["divination"],
        },
        "ai": {
            "used": usage.ai_count if usage else 0,
            "limit": limits["ai"],
        },
        "reset_at": "00:00:00",  # 提示用户何时重置
    }


# ============================================================
# API 模型
# ============================================================

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class MagicLinkRequest(BaseModel):
    email: EmailStr
    purpose: str = "login"  # login / reset


class UserResponse(BaseModel):
    id: int
    email: Optional[str]
    name: Optional[str]
    avatar_url: Optional[str]
    oauth_provider: Optional[str]
    is_admin: Optional[bool] = False
    is_verified: Optional[bool] = False
    created_at: Optional[str]
    token: Optional[str] = None
    quota: Optional[dict] = None  # v2.2: 当日三种配额使用情况


class UsageResponse(BaseModel):
    ai_remaining: int
    ai_limit: int
    mbti_remaining: int
    mbti_limit: int
    divination_remaining: int
    divination_limit: int
    divination_count: int


# ============================================================
# 路由 — 兼容层（前端 /api/auth/* 不变）
# ============================================================

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/status")
async def auth_status():
    return {
        "auth_enabled": AUTH_ENABLED,
        "daily_user_limit": DAILY_USER_LIMIT,
        "daily_ai_limit": DAILY_AI_LIMIT,
        "features": {
            "magic_link": True,
            "email_verify": AUTH_ENABLED,
            "oauth_google": bool(GOOGLE_CLIENT_ID),
            "oauth_github": bool(GITHUB_CLIENT_ID),
        },
    }


@router.post("/register", response_model=UserResponse)
async def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """邮箱注册 — 创建用户并发验证邮件"""
    if not AUTH_ENABLED:
        raise HTTPException(status_code=400, detail="开源模式，无需注册")
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="该邮箱已注册")
    user = User(
        email=req.email,
        name=req.name or req.email.split("@")[0],
        hashed_password=hash_password(req.password),
        is_active=True,
        is_superuser=False,
        is_verified=False,  # 必须验证
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # 发验证邮件
    try:
        from app.email import send_email, render_verify_email
        token = _create_magic_token(req.email, purpose="verify")
        link = f"{FRONTEND_URL}/login?verify_token={token}"
        html = render_verify_email(link)
        await send_email(req.email, "验证你的邮箱 · Latestname", html)
    except Exception as e:
        print(f"[auth] 验证邮件发送失败: {e}")

    token = create_token(user.id, user.email, False)
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "avatar_url": user.avatar_url,
        "oauth_provider": "email",
        "is_admin": user.is_superuser,
        "is_verified": user.is_verified,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "token": token,
    }


@router.post("/login", response_model=UserResponse)
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    """邮箱+密码登录"""
    if not AUTH_ENABLED:
        raise HTTPException(status_code=400, detail="开源模式，无需登录")
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="邮箱或密码错误")
    if not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="邮箱或密码错误")
    token = create_token(user.id, user.email, user.is_superuser)
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "avatar_url": user.avatar_url,
        "oauth_provider": user.oauth_provider or "email",
        "is_admin": user.is_superuser,
        "is_verified": user.is_verified,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "token": token,
    }


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(require_user), db: Session = Depends(get_db)):
    """当前用户信息 — 不返回 tier 字段（避免泄露分级）"""
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "avatar_url": user.avatar_url,
        "oauth_provider": user.oauth_provider,
        "is_admin": user.is_superuser if user.id else False,
        "is_verified": getattr(user, "is_verified", True),
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "quota": get_user_quota(user, db),  # v2.2: 当日配额使用情况
    }


@router.get("/usage", response_model=UsageResponse)
async def get_usage(user: User = Depends(require_user), db: Session = Depends(get_db)):
    if not AUTH_ENABLED:
        return {"ai_remaining": -1, "ai_limit": -1, "divination_count": 0}
    quota = get_user_quota(user, db)
    today = datetime.date.today().isoformat()
    usage = db.query(UsageRecord).filter(
        UsageRecord.user_id == user.id, UsageRecord.date == today
    ).first()
    return {
        "ai_remaining": max(0, quota["ai"]["limit"] - quota["ai"]["used"]),
        "ai_limit": quota["ai"]["limit"],
        "mbti_remaining": max(0, quota["mbti"]["limit"] - quota["mbti"]["used"]),
        "mbti_limit": quota["mbti"]["limit"],
        "divination_remaining": max(0, quota["divination"]["limit"] - quota["divination"]["used"]),
        "divination_limit": quota["divination"]["limit"],
        "divination_count": quota["divination"]["used"],
    }


# ============================================================
# Magic Link
# ============================================================

def _create_magic_token(email: str, purpose: str = "login") -> str:
    """生成 Magic Link token 并存表"""
    token = secrets.token_urlsafe(32)
    db = SessionLocal()
    try:
        link = MagicLink(
            token=token,
            email=email,
            purpose=purpose,
            expires_at=datetime.datetime.utcnow() + datetime.timedelta(minutes=30),
        )
        db.add(link)
        db.commit()
    finally:
        db.close()
    return token


@router.post("/request-magic-link")
async def request_magic_link(req: MagicLinkRequest):
    """请求 Magic Link — 发送登录/重置密码邮件"""
    if not AUTH_ENABLED:
        raise HTTPException(status_code=400, detail="开源模式无需登录")

    # 检查用户是否存在（reset 时必须存在）
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == req.email).first()
    finally:
        db.close()

    if req.purpose == "reset" and not user:
        # 安全：不透露邮箱是否注册
        return {"status": "ok", "message": "如果该邮箱已注册，你将收到一封邮件"}

    action_text = "重置密码" if req.purpose == "reset" else "登录"
    token = _create_magic_token(req.email, purpose=req.purpose)
    link = f"{FRONTEND_URL}/login?magic_token={token}&purpose={req.purpose}"

    try:
        from app.email import send_email, render_magic_link_email
        html = render_magic_link_email(link, purpose=req.purpose)
        await send_email(req.email, f"{action_text} · Latestname", html)
    except Exception as e:
        print(f"[auth] Magic Link 邮件发送失败: {e}")
        raise HTTPException(status_code=500, detail="邮件发送失败，请稍后重试")

    return {"status": "ok", "message": f"{action_text}链接已发送到你的邮箱"}


@router.post("/verify-magic-link", response_model=UserResponse)
async def verify_magic_link(token: str = Body(..., embed=True), db: Session = Depends(get_db)):
    """校验 Magic Link token 并返回登录信息"""
    link = db.query(MagicLink).filter(MagicLink.token == token).first()
    if not link:
        raise HTTPException(status_code=400, detail="无效的链接")
    if link.used:
        raise HTTPException(status_code=400, detail="链接已使用")
    if link.expires_at < datetime.datetime.utcnow():
        raise HTTPException(status_code=400, detail="链接已过期")

    link.used = True
    db.commit()

    # login/reset: 查找用户
    user = db.query(User).filter(User.email == link.email).first()
    if not user:
        # Magic Link 登录：如果用户不存在，自动创建
        user = User(
            email=link.email,
            name=link.email.split("@")[0],
            hashed_password=None,
            is_active=True,
            is_superuser=False,
            is_verified=True,  # Magic Link 验证了邮箱
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    jwt_token = create_token(user.id, user.email, user.is_superuser)
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "avatar_url": user.avatar_url,
        "oauth_provider": user.oauth_provider or "magic_link",
        "is_admin": user.is_superuser,
        "is_verified": user.is_verified,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "token": jwt_token,
    }


@router.post("/verify-email")
async def verify_email(token: str = Body(..., embed=True), db: Session = Depends(get_db)):
    """验证邮箱 token"""
    link = db.query(MagicLink).filter(
        MagicLink.token == token, MagicLink.purpose == "verify"
    ).first()
    if not link:
        raise HTTPException(status_code=400, detail="无效的验证链接")
    if link.used:
        raise HTTPException(status_code=400, detail="链接已使用")
    if link.expires_at < datetime.datetime.utcnow():
        raise HTTPException(status_code=400, detail="链接已过期")

    link.used = True
    user = db.query(User).filter(User.email == link.email).first()
    if user:
        user.is_verified = True
    db.commit()

    return {"status": "ok", "message": "邮箱验证成功"}


@router.post("/resend-verification")
async def resend_verification(email: str = Body(..., embed=True)):
    """重新发送验证邮件"""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
    finally:
        db.close()
    if not user:
        return {"status": "ok", "message": "如果该邮箱已注册，你将收到验证邮件"}
    if user.is_verified:
        return {"status": "ok", "message": "邮箱已验证"}

    token = _create_magic_token(email, purpose="verify")
    link = f"{FRONTEND_URL}/login?verify_token={token}"
    try:
        from app.email import send_email, render_verify_email
        html = render_verify_email(link)
        await send_email(email, "验证你的邮箱 · Latestname", html)
    except Exception as e:
        print(f"[auth] 验证邮件发送失败: {e}")
    return {"status": "ok", "message": "验证邮件已发送"}


# ============================================================
# OAuth — Google（保留手写，不依赖 httpx-oauth client）
# ============================================================

@router.get("/oauth/google")
async def google_redirect(request: Request):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=400, detail="Google OAuth 未配置")
    if OAUTH_REDIRECT_BASE:
        redirect_uri = f"{OAUTH_REDIRECT_BASE}/api/auth/oauth/google/callback"
    else:
        redirect_uri = str(request.url_for("google_callback"))
    url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={GOOGLE_CLIENT_ID}&"
        f"redirect_uri={redirect_uri}&"
        f"response_type=code&"
        f"scope=openid email profile&"
        f"prompt=select_account"
    )
    return RedirectResponse(url)


@router.get("/oauth/google/callback")
async def google_callback(code: str, request: Request, db: Session = Depends(get_db)):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=400, detail="Google OAuth 未配置")
    redirect_uri = str(request.url_for("google_callback")).split("?")[0]
    import httpx
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Google OAuth token 交换失败")
        access_token = token_resp.json().get("access_token")
        user_resp = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if user_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Google 用户信息获取失败")
        google_user = user_resp.json()

    oauth_id = google_user.get("id")
    email = google_user.get("email")
    name = google_user.get("name")
    avatar = google_user.get("picture")

    user = db.query(User).filter(
        User.oauth_provider == "google", User.oauth_id == oauth_id
    ).first()
    if not user and email:
        user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            name=name,
            oauth_provider="google",
            oauth_id=oauth_id,
            avatar_url=avatar,
            hashed_password=None,
            is_active=True,
            is_superuser=False,
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_token(user.id, user.email, user.is_superuser)
    return RedirectResponse(f"{FRONTEND_URL}/login?token={token}")


# ============================================================
# OAuth — GitHub
# ============================================================

@router.get("/oauth/github")
async def github_redirect(request: Request):
    if not GITHUB_CLIENT_ID:
        raise HTTPException(status_code=400, detail="GitHub OAuth 未配置")
    if OAUTH_REDIRECT_BASE:
        redirect_uri = f"{OAUTH_REDIRECT_BASE}/api/auth/oauth/github/callback"
    else:
        redirect_uri = str(request.url_for("github_callback"))
    url = (
        f"https://github.com/login/oauth/authorize?"
        f"client_id={GITHUB_CLIENT_ID}&"
        f"redirect_uri={redirect_uri}&"
        f"scope=user:email&"
        f"allow_signup=true"
    )
    return RedirectResponse(url)


@router.get("/oauth/github/callback")
async def github_callback(code: str, request: Request, db: Session = Depends(get_db)):
    if not GITHUB_CLIENT_ID:
        raise HTTPException(status_code=400, detail="GitHub OAuth 未配置")
    redirect_uri = str(request.url_for("github_callback")).split("?")[0]
    import httpx
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "code": code,
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "redirect_uri": redirect_uri,
            },
            headers={"Accept": "application/json"},
        )
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="GitHub OAuth token 交换失败")
        access_token = token_resp.json().get("access_token")
        user_resp = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if user_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="GitHub 用户信息获取失败")
        gh_user = user_resp.json()

    oauth_id = str(gh_user.get("id"))
    email = gh_user.get("email")
    name = gh_user.get("name") or gh_user.get("login")
    avatar = gh_user.get("avatar_url")

    if not email:
        async with httpx.AsyncClient() as client:
            emails_resp = await client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if emails_resp.status_code == 200:
                for e in emails_resp.json():
                    if e.get("primary"):
                        email = e.get("email")
                        break

    user = db.query(User).filter(
        User.oauth_provider == "github", User.oauth_id == oauth_id
    ).first()
    if not user and email:
        user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            name=name,
            oauth_provider="github",
            oauth_id=oauth_id,
            avatar_url=avatar,
            hashed_password=None,
            is_active=True,
            is_superuser=False,
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_token(user.id, user.email, user.is_superuser)
    return RedirectResponse(f"{FRONTEND_URL}/login?token={token}")


# ============================================================
# 管理后台 API（保留，改 is_admin -> is_superuser）
# ============================================================

class LLMConfigRequest(BaseModel):
    base_url: str
    api_key: str
    model: str


class LLMConfigResponse(BaseModel):
    base_url: str
    model: str
    has_key: bool


@router.get("/admin/llm-config", response_model=LLMConfigResponse)
async def admin_get_llm_config(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    config = get_llm_config(db)
    if not config:
        return {"base_url": "", "model": "", "has_key": False}
    return {
        "base_url": config.get("base_url", ""),
        "model": config.get("model", ""),
        "has_key": bool(config.get("api_key")),
    }


@router.post("/admin/llm-config")
async def admin_save_llm_config(
    req: LLMConfigRequest, admin: User = Depends(require_admin), db: Session = Depends(get_db)
):
    existing = get_llm_config(db) or {}
    api_key = req.api_key
    if api_key == "__KEEP__" or (not api_key and existing.get("api_key")):
        api_key = existing.get("api_key", "")
    save_llm_config(db, {"base_url": req.base_url, "api_key": api_key, "model": req.model})
    return {"status": "ok", "message": "LLM 配置已保存"}


class LLMTestRequest(BaseModel):
    base_url: str = Field(..., description="API Base URL")
    api_key: str = Field(..., description="API Key（即使是占位也用之测试）")
    model: str = Field(..., description="模型名")


@router.post("/admin/llm-test")
async def admin_llm_test(
    req: LLMTestRequest,
    admin: User = Depends(require_admin),
):
    """用当前填写的 base_url/api_key/model 测试连通性。
    返回 {"ok": bool, "status": int|None, "message": str, "latency_ms": int}
    注意：不写入数据库，仅用作 UI 验证。
    """
    import time
    import httpx

    if not req.base_url or not req.api_key or not req.model:
        return {"ok": False, "status": None, "message": "base_url / api_key / model 都不能为空", "latency_ms": 0}

    # v2.5: 智能拼接 endpoint — 支持两种格式
    # 格式 A: base_url 已含 /chat/completions（如 https://integrate.api.nvidia.com/v1/chat/completions）
    # 格式 B: base_url 是根 URL（如 https://api.openai.com/v1），需要拼 /chat/completions
    base = req.base_url.rstrip("/")
    if base.endswith("/chat/completions"):
        url = base
    else:
        url = f"{base}/chat/completions"

    payload = {
        "model": req.model,
        "messages": [{"role": "user", "content": "ping"}],
        "max_tokens": 8,
        "stream": False,
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {req.api_key}",
    }

    t0 = time.time()
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(url, json=payload, headers=headers)
        latency = int((time.time() - t0) * 1000)
        if r.status_code == 200:
            return {"ok": True, "status": 200, "message": f"✓ 连接成功（{latency}ms）", "latency_ms": latency}
        else:
            text = r.text[:300]
            return {"ok": False, "status": r.status_code, "message": f"HTTP {r.status_code}: {text}", "latency_ms": latency}
    except httpx.TimeoutException:
        return {"ok": False, "status": None, "message": "请求超时（30s）", "latency_ms": 30000}
    except Exception as e:
        return {"ok": False, "status": None, "message": f"{type(e).__name__}: {str(e)[:200]}", "latency_ms": int((time.time() - t0) * 1000)}


@router.get("/admin/stats")
async def admin_stats(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    today = datetime.date.today().isoformat()
    total_users = db.query(User).count()
    today_active = db.query(UsageRecord).filter(UsageRecord.date == today).count()
    today_ai_used = db.query(UsageRecord).filter(
        UsageRecord.date == today, UsageRecord.ai_count > 0
    ).count()
    today_divinations = db.query(UsageRecord).filter(
        UsageRecord.date == today
    ).with_entities(
        __import__('sqlalchemy').func.coalesce(
            __import__('sqlalchemy').func.sum(UsageRecord.divination_count), 0
        )
    ).scalar()

    seven_days_ago = (datetime.date.today() - datetime.timedelta(days=7)).isoformat()
    recent_usage = db.query(UsageRecord).filter(UsageRecord.date >= seven_days_ago).all()
    daily_stats = {}
    for u in recent_usage:
        if u.date not in daily_stats:
            daily_stats[u.date] = {"users": 0, "ai": 0, "divinations": 0}
        daily_stats[u.date]["users"] += 1
        daily_stats[u.date]["ai"] += u.ai_count
        daily_stats[u.date]["divinations"] += u.divination_count

    return {
        "total_users": total_users,
        "today_active": today_active,
        "today_ai_used": today_ai_used,
        "today_divinations": today_divinations or 0,
        "daily_limit_users": DAILY_USER_LIMIT,
        "daily_limit_ai": DAILY_AI_LIMIT,
        "recent_7days": [{"date": d, **stats} for d, stats in sorted(daily_stats.items())],
    }


@router.get("/admin/users")
async def admin_list_users(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
    page: int = 1,
    per_page: int = 20,
):
    offset = (page - 1) * per_page
    users = db.query(User).order_by(User.id.desc()).offset(offset).limit(per_page).all()
    total = db.query(User).count()
    return {
        "users": [
            {
                "id": u.id,
                "email": u.email,
                "name": u.name,
                "oauth_provider": u.oauth_provider,
                "is_admin": u.is_superuser,
                "is_verified": u.is_verified,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "avatar_url": u.avatar_url,
            }
            for u in users
        ],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.post("/admin/users/{user_id}/toggle-active")
async def admin_toggle_user_active(
    user_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="用户不存在")
    if u.is_superuser:
        raise HTTPException(status_code=400, detail="不能禁用管理员")
    u.is_active = not u.is_active
    db.commit()
    return {"status": "ok", "is_active": u.is_active}


# ============================================================
# 卜辞记录 API — 用户占卜历史云端同步
# ============================================================

@router.get("/history")
async def get_history(
    request: Request,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """获取当前登录用户的占卜历史"""
    auth = request.headers.get("Authorization", "")
    token = auth.replace("Bearer ", "") if auth.startswith("Bearer ") else ""
    if not token:
        raise HTTPException(status_code=401, detail="请先登录")
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="登录已过期")
    user_id = int(payload.get("sub", 0))
    if not user_id:
        raise HTTPException(status_code=401, detail="无效用户")

    records = db.query(DivinationRecord).filter(
        DivinationRecord.user_id == user_id
    ).order_by(
        DivinationRecord.created_at.desc()
    ).offset(offset).limit(limit).all()

    # v2.2: 隐式标记 — Pro 用户的所有记录打上 _vip 字段
    # 前端看到 _vip=true 时加金色微光，看不到概念上"Pro"的字眼
    is_pro = _is_pro_user(db.query(User).filter(User.id == user_id).first()) if user_id else False

    return {
        "records": [
            {
                "id": r.id,
                "question": r.question,
                "mode": r.mode,
                "result": json.loads(r.result_json) if r.result_json else {},
                "latest_name": r.latest_name,
                "hexagram_name": r.hexagram_name,
                "personality_name": r.personality_name,
                "at": r.created_at.isoformat() if r.created_at else None,
                "_vip": is_pro,  # 隐性标记，前端据此加金色微光
            }
            for r in records
        ],
        "total": db.query(DivinationRecord).filter(DivinationRecord.user_id == user_id).count(),
    }


@router.post("/history")
async def save_history(
    request: Request,
    body: dict = Body(...),
    db: Session = Depends(get_db),
):
    """保存一条占卜记录到云端。Standard 用户记录只保留 30 天，Pro/Admin 永久保留。"""
    auth = request.headers.get("Authorization", "")
    token = auth.replace("Bearer ", "") if auth.startswith("Bearer ") else ""
    if not token:
        raise HTTPException(status_code=401, detail="请先登录")
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="登录已过期")
    user_id = int(payload.get("sub", 0))

    # v2.3: Standard 用户每次保存前清理 30 天前的记录
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        is_pro_or_admin = (getattr(user, "tier", "standard") == "pro") or getattr(user, "is_superuser", False)
        if not is_pro_or_admin:
            cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=30)
            deleted = db.query(DivinationRecord).filter(
                DivinationRecord.user_id == user_id,
                DivinationRecord.created_at < cutoff,
            ).delete(synchronize_session=False)
            if deleted:
                db.commit()
                print(f"[History] Cleared {deleted} expired records (>30d) for user {user_id}")

    result = body.get("result", {})
    record = DivinationRecord(
        user_id=user_id,
        question=body.get("question", "")[:200],
        mode=body.get("mode", "combined"),
        result_json=json.dumps(result, ensure_ascii=False),
        latest_name=result.get("latest_name", {}).get("name", "") if isinstance(result.get("latest_name"), dict) else "",
        hexagram_name=result.get("iching", {}).get("original", {}).get("name", "") if isinstance(result.get("iching"), dict) else "",
        personality_name=result.get("personality", {}).get("name", "") if isinstance(result.get("personality"), dict) else "",
    )
    db.add(record)
    db.commit()
    return {"status": "ok", "id": record.id}


@router.delete("/history/{record_id}")
async def delete_history(
    record_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """删除一条占卜记录"""
    auth = request.headers.get("Authorization", "")
    token = auth.replace("Bearer ", "") if auth.startswith("Bearer ") else ""
    payload = verify_token(token) if token else None
    user_id = int(payload.get("sub", 0)) if payload else 0
    if not user_id:
        raise HTTPException(status_code=401, detail="请先登录")

    record = db.query(DivinationRecord).filter(
        DivinationRecord.id == record_id,
        DivinationRecord.user_id == user_id,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    db.delete(record)
    db.commit()
    return {"status": "ok"}


# ============================================================
# v2.2: 管理员 tier 切换 + Pro 专属个性化分析
# ============================================================

class TierUpdateRequest(BaseModel):
    tier: str = Field(..., description="用户分级: standard | pro")


@router.patch("/admin/users/{user_id}/tier")
async def admin_update_user_tier(
    user_id: int,
    req: TierUpdateRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """管理员设置用户分级（standard <-> pro）"""
    if req.tier not in ("standard", "pro"):
        raise HTTPException(status_code=400, detail="tier 必须是 standard 或 pro")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    user.tier = req.tier
    db.commit()
    return {"status": "ok", "user_id": user.id, "tier": req.tier}


@router.get("/admin/users-with-tier")
async def admin_list_users_with_tier(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """管理员视角的用户列表（包含 tier）"""
    users = db.query(User).order_by(User.id).all()
    return {
        "users": [
            {
                "id": u.id,
                "email": u.email,
                "name": u.name,
                "tier": getattr(u, "tier", "standard") or "standard",
                "is_superuser": u.is_superuser,
                "is_active": getattr(u, "is_active", True),
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ]
    }


def _is_pro_user(user: User) -> bool:
    """判断是否为 Pro 用户 — 用于保护 Pro 专属 API"""
    if not AUTH_ENABLED:
        return False  # 未启用 auth 时，所有功能按需另算
    return getattr(user, "tier", "standard") == "pro"


@router.get("/personalized-analysis")
async def get_personalized_analysis(
    request: Request,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    """
    Pro 专属 — 基于用户历史占卜数据的个性化分析。
    Standard 用户访问返回 404（不暴露功能存在性）。

    分析维度：
    1. 卦频统计（最常出现哪些卦）
    2. 领域分组（career/love/health 等占比）
    3. 心境变化曲线（survey_mood 时间序列）
    4. 下次提问推荐（基于历史模式）
    """
    if not AUTH_ENABLED:
        raise HTTPException(status_code=404, detail="功能未启用")

    auth = request.headers.get("Authorization", "")
    token = auth.replace("Bearer ", "") if auth.startswith("Bearer ") else ""
    if not token:
        raise HTTPException(status_code=401, detail="请先登录")
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="登录已过期")
    user_id = int(payload.get("sub", 0))
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    # Pro 校验 — Standard 用户返回 404（不暴露功能存在）
    if not _is_pro_user(user):
        raise HTTPException(status_code=404, detail="功能不存在")

    # 拉取最近 N 条占卜记录
    records = db.query(DivinationRecord).filter(
        DivinationRecord.user_id == user_id
    ).order_by(DivinationRecord.created_at.desc()).limit(limit).all()

    if not records:
        return {
            "total_records": 0,
            "message": "暂无历史数据，请先进行几次占卜",
            "hex_frequency": [],
            "domain_distribution": [],
            "mood_curve": [],
            "recommendation": "请先进行一次占卜，解锁个性化分析",
        }

    # 1. 卦频统计
    hex_count: dict = {}
    for r in records:
        h = r.hexagram_name or "未知"
        hex_count[h] = hex_count.get(h, 0) + 1
    hex_freq = sorted(
        [{"hex": k, "count": v} for k, v in hex_count.items()],
        key=lambda x: -x["count"]
    )

    # 2. 领域分组（从 question 推断 + record.question 文本匹配）
    domain_keywords = {
        "事业": ["工作", "事业", "职场", "公司", "辞职", "跳槽", "升职", "项目", "创业", "生意"],
        "感情": ["感情", "爱情", "恋爱", "分手", "复合", "婚姻", "对象", "男朋友", "女朋友", "暗恋"],
        "健康": ["健康", "身体", "生病", "睡眠", "焦虑", "压力", "心理"],
        "财运": ["钱", "财", "投资", "股票", "理财", "买房", "收入"],
        "学业": ["学", "考试", "考研", "留学", "论文", "毕业"],
        "人际": ["朋友", "同事", "关系", "社交", "家人", "父母"],
    }
    domain_count: dict = {d: 0 for d in domain_keywords}
    domain_count["其他"] = 0
    for r in records:
        q = r.question or ""
        matched = False
        for d, keywords in domain_keywords.items():
            if any(kw in q for kw in keywords):
                domain_count[d] += 1
                matched = True
                break
        if not matched:
            domain_count["其他"] += 1
    domain_dist = [{"domain": k, "count": v} for k, v in domain_count.items() if v > 0]

    # 3. 心境曲线 — 需要从 result_json 中提取 survey_mood
    mood_curve = []
    for r in reversed(records):  # 时间正序
        try:
            res = json.loads(r.result_json) if r.result_json else {}
            mood = res.get("survey", {}).get("mood", "")
            mood_curve.append({
                "at": r.created_at.isoformat() if r.created_at else None,
                "mood": mood,
            })
        except Exception:
            pass

    # 4. 下次提问推荐（基于最频繁卦 + 主题）
    top_hex = hex_freq[0]["hex"] if hex_freq else None
    top_domain = max(domain_count.items(), key=lambda x: x[1])[0] if any(domain_count.values()) else None

    recs = []
    if top_hex and top_hex != "未知":
        recs.append(f"你最近常起「{top_hex}」卦 — 可以问：『我与『{top_hex}』的能量关系是什么？怎样与它共处？』")
    if top_domain and top_domain != "其他":
        recs.append(f"你最近{top_domain}相关占卜较多 — 可以具体问：『我在{top_domain}上最该看清的一件事是什么？』")
    if not recs:
        recs.append("请继续做几次占卜，积累更多数据，解锁更深度的分析")

    return {
        "total_records": len(records),
        "hex_frequency": hex_freq[:10],  # 最多显示10个卦
        "domain_distribution": domain_dist,
        "mood_curve": mood_curve,
        "recommendation": " | ".join(recs),
        "top_hex": top_hex,
        "top_domain": top_domain,
        "generated_at": datetime.datetime.utcnow().isoformat(),
    }


# ============================================================
# 用户反馈系统
# ============================================================

class FeedbackRequest(BaseModel):
    category: str = Field(default="suggestion", max_length=20)
    content: str = Field(..., min_length=5, max_length=2000)
    email: Optional[str] = Field(default=None, max_length=200)


class FeedbackStatusRequest(BaseModel):
    status: str = Field(..., max_length=20)


@router.post("/feedback")
async def submit_feedback(
    req: FeedbackRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """提交反馈 — 登录/未登录均可（未登录 user_id = null）"""
    if req.category not in ("suggestion", "bug", "praise", "other"):
        raise HTTPException(status_code=400, detail="category 不合法")
    fb = Feedback(
        user_id=user.id if user else None,
        user_email=req.email,
        category=req.category,
        content=req.content.strip(),
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)
    return {"status": "ok", "id": fb.id}


@router.get("/admin/feedbacks")
async def admin_list_feedbacks(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
    status: Optional[str] = None,
):
    """管理员查看所有反馈"""
    q = db.query(Feedback)
    if status and status in ("open", "reviewed", "resolved"):
        q = q.filter(Feedback.status == status)
    items = q.order_by(Feedback.created_at.desc()).limit(200).all()
    return {
        "feedbacks": [
            {
                "id": f.id,
                "user_id": f.user_id,
                "user_email": f.user_email,
                "category": f.category,
                "content": f.content,
                "status": f.status,
                "created_at": f.created_at.isoformat() if f.created_at else None,
            }
            for f in items
        ],
        "total": len(items),
    }


@router.patch("/admin/feedbacks/{feedback_id}")
async def admin_update_feedback(
    feedback_id: int,
    req: FeedbackStatusRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """管理员更新反馈状态"""
    if req.status not in ("open", "reviewed", "resolved"):
        raise HTTPException(status_code=400, detail="status 必须是 open / reviewed / resolved")
    fb = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="反馈不存在")
    fb.status = req.status
    db.commit()
    return {"status": "ok", "id": fb.id, "new_status": req.status}
