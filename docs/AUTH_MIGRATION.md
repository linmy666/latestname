# 鉴权系统迁移计划 — fastapi-users 全量集成

> 状态：待开工
> 预计改动：300-400 行（auth.py 重写 + 前端 AuthContext 适配 + 数据迁移脚本）

---

## 一、目标

将现有手写 auth.py 替换为 **fastapi-users** 框架，保留：
- 邮箱 + 密码登录
- Google / GitHub OAuth
- 管理员系统
- JWT 鉴权
- guest 模式（ENABLE_AUTH=*** 时）

新增：
- **Magic Link 登录**（输邮箱 → 收到邮件 → 点链接直接登录）
- **邮箱必验证**（注册时发验证邮件，未验证不能登录）
- **密码重置**（走 Magic Link 流程）
- **统一 OAuth 适配器**（用 fastapi-users 的 OAuth 客户端）

---

## 二、技术选型

| 组件 | 选择 | 理由 |
|------|------|------|
| fastapi-users | ≥14.0 | 最新稳定版 |
| 数据库适配器 | fastapi-users-db-sqlalchemy ≥7.0 | 与现有 SQLAlchemy 兼容 |
| 密码哈希 | Argon2 | fastapi-users 默认（更安全） |
| JWT | pyjwt | 已有 |
| OAuth | httpx | 已有 |
| 邮件发送 | **Resend** | 5 分钟集成，HTTP API |
| 模板渲染 | jinja2 | 邮件模板 |

---

## 三、实施步骤（按顺序）

### Step 1：装依赖（30 分钟）
```bash
pip install "fastapi-users[sqlalchemy,oauth]>=14.0" resend jinja2
# requirements.txt 同步更新
```

### Step 2：数据库迁移（1 小时）

**2a. 改造 User 表**

旧字段：
```
id, email, name, password_hash, oauth_provider, oauth_id, avatar_url, created_at, is_active, is_admin
```

新字段（fastapi-users 要求）：
```
id (PK), email (unique), hashed_password, is_active, is_superuser, is_verified
```

迁移映射：
| 旧字段 | 新字段 |
|--------|--------|
| `id` | `id` (不变) |
| `email` | `email` (不变) |
| `password_hash` | `hashed_password` (改名) |
| `is_active` | `is_active` (不变) |
| `is_admin` | `is_superuser` (改名 — 语义调整) |
| `oauth_provider` | 删除（OAuth 走独立表） |
| `oauth_id` | 删除 |
| `name` | 移到 OAuthAccount 表 / 单独 UserProfile |
| `avatar_url` | 同上 |
| 新增 | `is_verified` (默认 False，注册后强制验证) |

**2b. 新增 OAuthAccount 表**

fastapi-users 推荐结构：
```
oauth_accounts (
  id, user_id (FK), oauth_name ('google'/'github'), 
  account_id, account_email, created_at, updated_at
)
```

**2c. 新增 magic_links 表（手写）**

fastapi-users 没有内建 magic link，需要：
- 自己写 `request_magic_link` / `verify_magic_link` 接口
- 或者用 fastapi-users 的 `verify_token` 机制 + 自己的邮件

```
magic_links (
  token (PK), email, expires_at, used
)
```

**2d. 数据迁移脚本** `backend/scripts/migrate_auth.py`

```python
# 1. 重命名 password_hash -> hashed_password
# 2. 重命名 is_admin -> is_superuser
# 3. 把现有 oauth_provider/oauth_id 转写到 oauth_accounts 表
# 4. 新增 is_verified 字段（默认 True，向后兼容旧用户）
# 5. 新增 magic_links 表
```

### Step 3：重写 auth.py（4 小时）

**3a. fastapi-users 集成**

```python
from fastapi_users import FastAPIUsers
from fastapi_users.db import SQLAlchemyUserDatabase
from fastapi_users.authentication import (
    AuthenticationBackend, BearerTransport, JWTStrategy
)

# 保留你的数据库 / 模型 / SessionLocal
# User 模型必须继承 SQLAlchemyBaseUserTable[int]

class User(SQLAlchemyBaseUserTable[int], Base):
    # 标准字段已包含：id, email, hashed_password, is_active, is_superuser, is_verified
    # 你的扩展字段：
    name = Column(String(100))
    avatar_url = Column(Text)

class OAuthAccount(SQLAlchemyBaseOAuthAccountTable[int], Base):
    pass

# 数据库适配器
async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    yield SQLAlchemyUserDatabase(session, User, OAuthAccount)

# JWT 策略
def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(secret=JWT_SECRET, lifetime_seconds=JWT_EXPIRE_HOURS*3600)

auth_backend = AuthenticationBackend(
    name="jwt",
    transport=BearerTransport(tokenUrl="auth/jwt/login"),
    get_strategy=get_jwt_strategy,
)

fastapi_users = FastAPIUsers[User, int](
    get_user_manager,
    [auth_backend],
)

# 路由
app.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/auth/jwt",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_register_router(),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_reset_password_router(),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_verify_router(),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_users_router(),
    prefix="/users",
    tags=["users"],
)
```

**3b. 自定义路由（保留你的 OAuth + admin）**

```python
# Google OAuth - 改用 fastapi-users 的 OAuth 适配器
oauth_router = fastapi_users.get_oauth_router(
    GoogleOAuth2,
    auth_backend,
    state_secret=JWT_SECRET,
    redirect_url=f"{BASE_URL}/auth/oauth/google/callback",
)

# GitHub OAuth
oauth_router = fastapi_users.get_oauth_router(
    GitHubOAuth2,
    auth_backend,
    state_secret=JWT_SECRET,
    redirect_url=f"{BASE_URL}/auth/oauth/github/callback",
)

# Magic Link 路由（自写，~80 行）
@router.post("/auth/request-magic-link")
async def request_magic_link(email: str):
    """生成 token，存表，发邮件"""

@router.get("/auth/verify-magic-link")
async def verify_magic_link(token: str):
    """校验 token，返回 JWT"""

# Admin 初始化（保留）
async def init_admin():
    """首次启动时创建 is_superuser=True 的 admin"""

# 兼容老 API（前端过渡期）
@router.post("/api/auth/login")
async def legacy_login(...):
    """兼容旧前端，转发到 /auth/jwt/login"""
```

**3c. 邮件发送（Resend）**

```python
import resend
resend.api_key = os.getenv("RESEND_API_KEY")

async def send_email(to: str, subject: str, html: str):
    resend.Emails.send({
        "from": "Latestname <noreply@latestname.com>",
        "to": [to],
        "subject": subject,
        "html": html,
    })

# 邮件模板（jinja2）
async def render_magic_link_email(token: str, base_url: str) -> str:
    link = f"{base_url}/auth/verify-magic-link?token={token}"
    return jinja_template.render(link=link)
```

### Step 4：环境变量 + 部署文档（30 分钟）

新增到 `.env` / `onyx_env.sh`：

```bash
# Resend (邮件服务，注册 https://resend.com 免费 100/天)
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@latestname.com

# Magic Link 前端回调地址（部署域名）
FRONTEND_BASE_URL=https://latestname.com
```

文档：`docs/AUTH_SETUP.md` 写入完整部署步骤。

### Step 5：前端适配（2 小时）

**5a. `AuthContext` 适配**

`src/contexts/AuthContext.tsx` 从依赖 `axios.post('/api/auth/login')` 改为 `/auth/jwt/login`：

```typescript
// 改前：
const login = async (email, password) => {
  const r = await axios.post('/api/auth/login', {email, password})
  setToken(r.data.token)
}

// 改后：
const login = async (email, password) => {
  const r = await axios.post('/auth/jwt/login', 
    new URLSearchParams({username: email, password}),
    {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
  )
  setToken(r.data.access_token)
}
```

**5b. Login 页加 Magic Link 入口**

UI 加：
- 「用邮件链接登录」按钮 → 输邮箱 → 调 `/auth/request-magic-link` → "已发送，请查收"
- 注册成功后弹窗 → "请验证邮箱"

**5c. 兼容层**

保留 `/api/auth/login` 旧路径一段时间（用新接口转发），等所有客户端升级后删除。

### Step 6：测试 + 部署（1 小时）

- 单元测试：register → verify → login 流程
- 集成测试：邮件是否真发出（用 Resend 测试 API key）
- 部署文档更新

---

## 四、文件清单

```
backend/
├── app/
│   ├── auth.py            # 重写（~250 行）
│   ├── email.py           # 新增（~60 行，Resend 封装 + jinja 模板）
│   ├── magic_link.py      # 新增（~80 行，token 生成/校验）
│   └── main.py            # 改 1 处：include_router
├── scripts/
│   └── migrate_auth.py    # 新增（数据迁移脚本）
├── templates/email/       # 新增目录
│   ├── magic_link.html
│   ├── verify_email.html
│   └── reset_password.html
├── requirements.txt        # 改：加 fastapi-users / resend / jinja2
└── docs/
    └── AUTH_SETUP.md      # 新增

frontend/src/
├── contexts/
│   └── AuthContext.tsx    # 改：适配 fastapi-users 接口
└── pages/
    └── Login.tsx          # 改：加 Magic Link 入口
```

---

## 五、回滚方案

如果改造中发现严重问题：
1. Git 恢复 `auth.py` 到旧版本
2. 不跑 `migrate_auth.py`
3. 前端 AuthContext 退回

由于数据迁移脚本会先备份 `users.db` 到 `users.db.bak`，可以零损失回滚。

---

## 六、工作量估算

| Step | 时间 | 风险 |
|------|------|------|
| Step 1：装依赖 | 30 分钟 | 低 |
| Step 2：数据迁移 | 1 小时 | 中（迁移脚本必须有备份） |
| Step 3：重写 auth.py | 4 小时 | 中（OAuth + Magic Link 联调） |
| Step 4：环境变量 + 文档 | 30 分钟 | 低 |
| Step 5：前端适配 | 2 小时 | 中（不能破坏登录流程） |
| Step 6：测试 + 部署 | 1 小时 | 低 |
| **合计** | **~9 小时** | |

---

## 七、关键决策点（需要你确认）

1. **Resend vs SendGrid** — 推荐 Resend（更简）
2. **OAuth 是否保留** — 你目前没配 client_id，要不要顺便配置上？（需要去 Google/GitHub 后台建 OAuth App）
3. **is_admin → is_superuser 重命名** — 是否有其他地方依赖这个字段？（需要 grep）
4. **guest 模式** — 保留 ENABLE_AUTH=*** 时跳过所有验证
5. **每日配额逻辑** — 你的 `daily_user_limit=100` 是基于 IP 还是 user？保留

---

## 八、风险点（提前警示）

1. **SQLAlchemy 同步/异步混用** — 你现有 auth.py 用 `Depends(get_db)` 同步 session，fastapi-users 默认异步。需要选 `async_session` 还是包装同步。
2. **现有前端 AuthContext 接口契约** — 必须保持 `useAuth()` 返回的字段不变（auth_enabled/user/login/logout/loading/isAdmin）
3. **OAuth callback URL** — Google/GitHub 后台要加新 callback path
4. **Resend 域名验证** — `noreply@latestname.com` 需要在 Resend 后台验证域名（部署后才能用，开发环境用 `onboarding@resend.dev`）

---

## 九、不在本次范围

- 密码强度策略（fastapi-users 默认最小 8 字符）
- 双因素认证 (2FA)
- 社交账号绑定（一个用户多个 OAuth）
- 账号合并

---

**确认后按 Step 1 → Step 6 顺序执行。每完成一个 Step 我会跑构建+测试再进下一个。**