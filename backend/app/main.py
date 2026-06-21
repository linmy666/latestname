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
Latestname - FastAPI 主应用 v1.0
提供 REST API：易经查询、塔罗查询、占卜（易经/塔罗/融合）、AI解读、设置
© 2026 Ruihan Lin (@linmy666)

v0.2 新增：
  - POST /api/interpret          AI叙事化解读（OpenAI兼容，用户自配Endpoint）
  - combined 结果集成卦变关系+五维度评分
  - CORS 从环境变量读取（安全收敛）
"""

import json
import os
import httpx
from pathlib import Path
from typing import Optional, AsyncGenerator
from pydantic import BaseModel, Field

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles

from app import divination
from app._authorship import verify_integrity as _verify_authorship, _integrity_beacon as _beacon
from app.divination import (
    generate_seed, coins_hexagram, draw_tarot, analyze_resonance,
    compute_hexagram_relations, compute_fortune_scores,
    daily_hexagram, analyze_hexagram,
)
from app.i18n_helpers import localize, localize_list, get_lang as _get_lang, localize_smart
from app.bazi import compute_bazi
from app.geo import search_city, list_cities
from app.tarot_spreads import get_spread, list_spreads, TAROT_SPREADS
from app.question_router import classify_question
import datetime as _datetime


def attach_yao_texts(hex_obj):
    """v0.5-D 兼容接口：转调 divination.attach_yao_lines"""
    return divination.attach_yao_lines(hex_obj)


# ============================================================
# v2.2: 配额闸门 helpers
# ============================================================

def _check_divination_quota(request: Request):
    """
    卦象测算配额闸门 — 必须登录才能起卦。
    未登录返回 401（引导前端跳转登录）；
    登录用户检查 divination_count，超额返回 429。
    """
    from app.auth import AUTH_ENABLED, verify_token, SessionLocal, User, check_quota
    if not AUTH_ENABLED:
        return
    auth = request.headers.get("Authorization", "")
    token = auth.replace("Bearer ", "") if auth.startswith("Bearer ") else ""
    if not token:
        raise HTTPException(status_code=401, detail="请先登录后再起卦")
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="登录已过期，请重新登录")
    user_id = int(payload.get("sub", 0))
    if not user_id:
        raise HTTPException(status_code=401, detail="登录已过期，请重新登录")
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return
        ok, msg, remaining = check_quota(user, "divination", db)
        if not ok:
            raise HTTPException(status_code=429, detail=msg)
    finally:
        db.close()


def _check_mbti_quota(request: Request):
    """卦名测算配额闸门 — 强制要求登录（必须识别用户）"""
    from app.auth import AUTH_ENABLED, verify_token, SessionLocal, User, check_quota
    if not AUTH_ENABLED:
        return
    auth = request.headers.get("Authorization", "")
    token = auth.replace("Bearer ", "") if auth.startswith("Bearer ") else ""
    if not token:
        raise HTTPException(status_code=401, detail="请先登录后再测算卦名")
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="登录已过期，请重新登录")
    user_id = int(payload.get("sub", 0))
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="用户不存在")
        if not getattr(user, 'is_active', True):
            raise HTTPException(status_code=403, detail="账户已被禁用")
        ok, msg, remaining = check_quota(user, "mbti", db)
        if not ok:
            raise HTTPException(status_code=429, detail=msg)
    finally:
        db.close()


# ============================================================
# 应用初始化
# ============================================================

app = FastAPI(
    title="Latestname API",
    description="东西方占卜融合平台 - 易经 + 塔罗双系统共振",
    version="0.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS - 从环境变量读取，默认开发期全开
_allowed_origins = os.environ.get("ONYX_CORS_ORIGINS", "*")
_cors_list = [o.strip() for o in _allowed_origins.split(",")] if _allowed_origins != "*" else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# 认证路由（通过环境变量 ENABLE_AUTH=true 开启）
# ============================================================
from app.auth import router as auth_router, AUTH_ENABLED
app.include_router(auth_router)


# ============================================================
# 数据加载
# ============================================================

DATA_DIR = Path(__file__).parent.parent / "data"

divination._load_data()

# Authorship beacon — embedded in app startup, invisible to users
_app_meta = _verify_authorship()


def iching_data():
    return divination._iching_data or []

def tarot_data_all():
    return divination._tarot_data or []

# 静态文件：卦格角色形象图
STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
PERSONALITIES_DIR = os.path.join(STATIC_DIR, "personalities_final")
app.mount("/static/personalities", StaticFiles(directory=PERSONALITIES_DIR), name="personalities")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# CORS for canvas image loading (share card)
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# 路由：健康检查
# ============================================================

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "service": "Latestname",
        "version": app.version,
        "iching_count": len(iching_data()),
        "tarot_count": len(tarot_data_all()),
    }


# Hidden authorship endpoint — not linked in UI, not in docs
@app.get("/api/_meta", include_in_schema=False)
def _meta():
    """Authorship verification endpoint. Not shown in API docs."""
    return _app_meta


# ============================================================
# 路由：易经
# ============================================================

@app.get("/api/iching")
def list_iching(fortune: Optional[str] = Query(None, description="筛选吉凶: 大吉/吉/中/凶/大凶"),
                lang: str = Query("zh", description="语言: zh/en")):
    """列出全部64卦（精简版，可选按吉凶筛选）"""
    lang = _get_lang(lang)
    items = iching_data()
    if fortune:
        items = [h for h in items if h["fortune"] == fortune]
    out = [{
        "id": h["id"], "name": h["name"], "name_en": h["name_en"],
        "binary": h["binary"], "symbol": h["symbol"],
        "fortune": h["fortune"], "keywords": h["keywords"],
    } for h in items]
    return localize_list(out, lang)


@app.get("/api/iching/{hex_id}")
def get_iching(hex_id: int, lang: str = Query("zh")):
    """获取单卦完整数据"""
    lang = _get_lang(lang)
    data = iching_data()
    for h in data:
        if h["id"] == hex_id:
            return localize_smart(h, lang, domain='iching')
    raise HTTPException(404, f"卦象 {hex_id} 不存在（范围 1-64）")


@app.get("/api/iching/binary/{binary}")
def get_iching_by_binary(binary: str, lang: str = Query("zh")):
    """按二进制查找卦象"""
    lang = _get_lang(lang)
    if len(binary) != 6 or not all(c in "01" for c in binary):
        raise HTTPException(400, "binary 必须是 6 位 0/1 字符串")
    for h in iching_data():
        if h["binary"] == binary:
            return localize_smart(h, lang, domain='iching')
    raise HTTPException(404, f"卦象 binary={binary} 不存在")


# ============================================================
# 路由：塔罗
# ============================================================

@app.get("/api/tarot")
def list_tarot(
    arcana: Optional[str] = Query(None, description="major/minor"),
    suit: Optional[str] = Query(None, description="cups/wands/swords/pentacles"),
    lang: str = Query("zh"),
):
    """列出全部78张牌（精简）"""
    lang = _get_lang(lang)
    items = tarot_data_all()
    if arcana:
        items = [c for c in items if c["arcana"] == arcana]
    if suit:
        items = [c for c in items if c.get("suit") == suit]
    out = [{
        "id": c["id"], "name": c["name"], "name_cn": c["name_cn"],
        "arcana": c["arcana"], "suit": c.get("suit"),
    } for c in items]
    return localize_list(out, lang)


@app.get("/api/tarot/{card_id}")
def get_tarot(card_id: int, lang: str = Query("zh")):
    """获取单牌完整数据"""
    lang = _get_lang(lang)
    data = tarot_data_all()
    for c in data:
        if c["id"] == card_id:
            return localize_smart(c, lang, domain='tarot')
    raise HTTPException(404, f"塔罗牌 {card_id} 不存在（范围 0-77）")


# ============================================================
# 路由：城市搜索（v0.5-A 真太阳时用）
# ============================================================

@app.get("/api/cities")
def search_cities(q: str = Query("", description="城市名或拼音（可模糊）")):
    """搜索城市（中文/拼音/部分匹配）"""
    if not q:
        return []
    result = search_city(q)
    if not result:
        return []
    return [result]


# ============================================================
# 路由：塔罗牌阵（v0.5-B）
# ============================================================

@app.get("/api/spreads")
def list_tarot_spreads():
    """列出所有可选牌阵"""
    return list_spreads()


@app.get("/api/daily")
def api_daily_hexagram(date: Optional[str] = None, lang: str = Query("zh")):
    """
    每日一卦：基于日期生成稳定种子
    - 不传 date → 今天
    - 传 date (YYYY-MM-DD) → 那天
    同一天所有人看到同一卦
    """
    lang = _get_lang(lang)
    if date:
        try:
            target = _datetime.date.fromisoformat(date)
        except ValueError:
            return {"error": f"日期格式错误：{date}（应为 YYYY-MM-DD）"}
    else:
        target = _datetime.date.today()
    result = daily_hexagram(target)
    # 附爻辞
    if "hexagram" in result and result["hexagram"]:
        result["hexagram"] = attach_yao_texts(result["hexagram"])
        result["hexagram"] = localize_smart(result["hexagram"], lang, domain='iching')
    return result


# ============================================================
# 占卜请求模型
# ============================================================

class DivineRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=200, description="所问之事")
    seed: Optional[int] = Field(None, description="可选种子（默认根据问题+时辰生成）")
    extra: Optional[str] = Field(None, description="可选辅助种子（用户标识等）")
    lang: Optional[str] = Field('zh', description="语言: zh/en")
    # v0.4: 八字信息
    birth_year: Optional[int] = Field(None, description="出生年（公历）")
    birth_month: Optional[int] = Field(None, description="出生月（公历）")
    birth_day: Optional[int] = Field(None, description="出生日（公历）")
    birth_hour: Optional[int] = Field(None, description="出生时辰（0-23，可为空）")
    gender: Optional[str] = Field('unknown', description="male/female/unknown")
    name: Optional[str] = Field('', description="姓名（可选）")
    # v0.5-A: 出生城市（用于真太阳时校正）
    birth_city: Optional[str] = Field('', description="出生城市（如：上海/北京/杭州）")
    # Latestname v1.1: 问卷四问（名前登记）
    survey_domain: Optional[str] = Field('general', description="所求领域：career/love/health/decision/general")
    survey_mood: Optional[str] = Field('calm', description="此刻心境：calm/anxious/lost/hopeful/decisive")
    survey_urgency: Optional[str] = Field('normal', description="紧迫程度：now/soon/relax")
    survey_openness: Optional[str] = Field('open', description="愿闻逆耳：open/hesitant/comfort")
    # v2.0: 卦格人格问卷答案
    personality_answers: Optional[list] = Field(None, description="卦格问卷答案列表 [{question_id, choice}]")
    # v2.1: 手动认领卦格代码（用户跳过问卷，直接选卦格时用）
    personality_code: Optional[str] = Field(None, description="手动认领的卦格代码（如: 动明刚通）")

class CombinedRequest(DivineRequest):
    tarot_count: int = Field(3, ge=1, le=10, description="塔罗牌数量（兼容旧字段）")
    spread: Optional[str] = Field("three_card", description="塔罗牌阵（v0.5-B）")


# ============================================================
# 路由：易经占卜
# ============================================================

@app.post("/api/divine/iching")
def divine_iching(req: DivineRequest, request: Request):
    """金钱卦起卦，返回本卦+变卦+动爻+卦变关系+六爻爻辞"""
    _check_divination_quota(request)
    lang = _get_lang(req.lang)
    seed = req.seed if req.seed is not None else generate_seed(req.question, req.extra)
    result = coins_hexagram(seed)
    # v0.5-D: 附加六爻爻辞（公有领域《周易》原文）
    result["original"] = attach_yao_texts(result.get("original"))
    if result.get("changed"):
        result["changed"] = attach_yao_texts(result["changed"])
    # 本地化卦象字段
    if "original" in result and result["original"]:
        result["original"] = localize_smart(result["original"], lang, domain='iching')
    if "changed" in result and result["changed"]:
        result["changed"] = localize_smart(result["changed"], lang, domain='iching')
    return {
        "question": req.question,
        "seed": seed,
        "hexagram": result,
    }


# ============================================================
# 路由：塔罗占卜
# ============================================================

@app.post("/api/divine/tarot")
def divine_tarot(req: CombinedRequest, request: Request):
    """抽取塔罗牌（默认3张），含正逆位和位置语义。同时生成选牌牌堆供前端交互。"""
    _check_divination_quota(request)
    lang = _get_lang(req.lang)
    seed = req.seed if req.seed is not None else generate_seed(req.question, req.extra)
    cards = draw_tarot(req.tarot_count, seed)

    # v5: 生成选牌牌堆（3个位置×4张候选），与融合模式一致
    from app.divination import draw_tarot_candidates
    tarot_pick_deck = draw_tarot_candidates(3, 4, seed + 7777)

    # 本地化塔罗字段（最终牌 + 候选牌堆）
    for card in cards:
        if "card" in card:
            card["card"] = localize_smart(card["card"], lang, domain='tarot')
    for pos in tarot_pick_deck:
        for cand in pos.get("candidates", []):
            if "card" in cand:
                cand["card"] = localize_smart(cand["card"], lang, domain='tarot')

    return {
        "question": req.question,
        "seed": seed,
        "count": req.tarot_count,
        "cards": cards,
        "tarot_pick_deck": tarot_pick_deck,
    }


@app.post("/api/divine/tarot/deck")
def divine_tarot_deck(req: CombinedRequest):
    """
    生成塔罗选牌牌堆——每个位置返回多张候选牌（牌面朝下），
    供用户在前端「选牌」交互中使用。
    """
    from app.divination import draw_tarot_candidates
    seed = req.seed if req.seed is not None else generate_seed(req.question, req.extra)
    positions = 3  # 过去/现在/未来
    candidates_per_pos = 4  # 每个位置4张候选
    deck = draw_tarot_candidates(positions, candidates_per_pos, seed)
    return {
        "question": req.question,
        "seed": seed,
        "positions": positions,
        "candidates_per_pos": candidates_per_pos,
        "deck": deck,
    }


# ============================================================
# 路由：东西方融合占卜（核心特色，v0.2增强）
# ============================================================

@app.post("/api/divine/combined")
def divine_combined(req: CombinedRequest, request: Request):
    """易经 + 塔罗 双系统同时占卜，返回三层共振+卦变关系+五维度评分+八字"""
    # v2.2: 配额闸门（仅 AUTH_ENABLED 模式生效；用可选 Authorization 头）
    _check_divination_quota(request)
    # 如果有八字信息，融入种子
    bazi_extra = req.extra or ''
    bazi_data = None
    if req.birth_year and req.birth_month and req.birth_day:
        bazi_data = compute_bazi(
            req.birth_year, req.birth_month, req.birth_day,
            req.birth_hour, req.gender or 'unknown', req.name or '',
            birth_city=req.birth_city or '',
        )
        # 八字四柱字符串作为 extra 种子的一部分
        bazi_extra = bazi_data['four_pillars_str'].replace(' ', '')

    # Latestname v1.1: 问卷维度融入种子
    from app.naming import questionnaire_to_extra
    survey_extra = questionnaire_to_extra(
        req.survey_domain or 'general',
        req.survey_mood or 'calm',
        req.survey_urgency or 'normal',
        req.survey_openness or 'open',
    )
    combined_extra = f"{bazi_extra}:{survey_extra}" if bazi_extra else survey_extra

    # v2.0: 卦格人格融入种子
    personality_data = None
    if req.personality_answers:
        from app.personality import compute_personality, personality_to_seed_component
        personality_data = compute_personality(req.personality_answers)
        combined_extra += f":{personality_to_seed_component(personality_data)}"
    elif req.personality_code:
        # v2.1: 手动认领卦格 — 直接用代码查
        from app.personality import get_personality_by_code, personality_to_seed_component
        personality_data = get_personality_by_code(req.personality_code)
        if personality_data:
            combined_extra += f":{personality_to_seed_component(personality_data)}"

    seed = req.seed if req.seed is not None else generate_seed(req.question, combined_extra)

    # 1. 易经起卦（含卦变关系）
    iching_result = coins_hexagram(seed)
    # v0.5-D: 附加六爻爻辞
    iching_result["original"] = attach_yao_texts(iching_result.get("original"))
    if iching_result.get("changed"):
        iching_result["changed"] = attach_yao_texts(iching_result["changed"])  # type: ignore[arg-type]

    # 2. 塔罗抽牌（用 spread 决定牌数和位置语义）
    spread_def = get_spread(req.spread or "three_card")
    tarot_cards = draw_tarot(
        spread_def["card_count"],
        seed,
        spread_positions=spread_def["positions"],
    )

    # 2b. 塔罗选牌牌堆（每个位置4张候选，供前端「选牌」交互）
    from app.divination import draw_tarot_candidates
    tarot_pick_deck = draw_tarot_candidates(3, 4, seed + 7777)

    # 3. 三层共振分析（主题×五行×关键词）
    hex_ids = [iching_result["original"]["id"]]
    if iching_result["changed"]:
        hex_ids.append(iching_result["changed"]["id"])
    tarot_deck_indices = [c["deck_index"] for c in tarot_cards]
    resonance = analyze_resonance(
        hex_ids, tarot_deck_indices,
        hexagram_data=iching_data(), tarot_data=tarot_data_all(),
    )

    # 4. 问题分类（先于评分，以便评分使用 question_type）
    question_analysis = classify_question(req.question)
    qtype = question_analysis.get("type", "general")

    # 5. 五维度运势评分（v0.7: 动态维度跟随问题类型）
    fortune_scores = compute_fortune_scores(iching_result, tarot_cards, question_type=qtype)

    # 6. v0.7: 叩玄结论卡 TL;DR（确定性生成，无需 AI）
    from app.divination import generate_verdict
    verdict = generate_verdict(
        iching_result, resonance, fortune_scores,
        question_type=qtype, question=req.question,
    )

    # 7. Latestname v1.2: 从卦象爻辞中生成「此刻之名」
    from app.naming import generate_latest_name
    hex_id = iching_result["original"].get("id")
    changed_id = iching_result.get("changed", {}).get("id") if iching_result.get("changed") else None
    latest_name = generate_latest_name(
        seed=seed,
        question_type=qtype,
        mood=req.survey_mood or 'calm',
        fortune=verdict.get("fortune", "中") if verdict else "中",
        hexagram_id=hex_id,
        changed_hexagram_id=changed_id,
    )

    # 本地化所有卦象 / 塔罗字段
    lang = _get_lang(req.lang)
    if iching_result.get("original"):
        iching_result["original"] = localize_smart(iching_result["original"], lang, domain='iching')
    if iching_result.get("changed"):
        iching_result["changed"] = localize_smart(iching_result["changed"], lang, domain='iching')
    for card in tarot_cards:
        if "card" in card:
            card["card"] = localize_smart(card["card"], lang, domain='tarot')

    return {
        "question": req.question,
        "seed": seed,
        "name": req.name or "",
        "gender": req.gender or "unknown",
        "iching": iching_result,
        "tarot": tarot_cards,
        "tarot_pick_deck": tarot_pick_deck,
        "spread": {
            "id": req.spread or "three_card",
            "name": spread_def["name"],
            "name_en": spread_def["name_en"],
            "card_count": spread_def["card_count"],
        },
        "question_analysis": question_analysis,
        "resonance": resonance,
        "fortune_scores": fortune_scores,
        "verdict": verdict,
        "bazi": bazi_data,
        "latest_name": latest_name,
        "hexagram_analysis": analyze_hexagram(iching_result, tarot_cards),
        "survey": {
            "domain": req.survey_domain or "general",
            "mood": req.survey_mood or "calm",
            "urgency": req.survey_urgency or "normal",
            "openness": req.survey_openness or "open",
        },
        "personality": personality_data,
    }


# ============================================================
# 路由：AI 叙事化解读（v0.2 核心 - 用户自配 LLM Endpoint）
# ============================================================

class LLMConfig(BaseModel):
    base_url: str = Field("https://api.openai.com/v1", description="OpenAI兼容API地址")
    api_key: str = Field(..., description="API Key")
    model: str = Field("gpt-4o-mini", description="模型名")

class InterpretRequest(BaseModel):
    question: str = Field(..., description="用户的问题")
    divination: dict = Field(..., description="完整的占卜结果（combined 返回）")
    llm_config: LLMConfig = Field(..., description="LLM 配置")


def _build_interpret_prompt(question: str, divination: dict) -> tuple[str, str]:
    """
    构建 system prompt 和 user prompt。
    关键原则：把已确认的占卜结果作为"事实"，让AI只做叙事化解读，不允许重新排盘。
    """
    system_prompt = """你是一位精通东西方占卜体系的解读者。你的角色是：
1. 将确定性的占卜结果翻译成有温度、有洞察力的叙事
2. 针对用户的具体问题给出解读，而非泛泛而谈
3. 综合易经卦象和塔罗牌的信息，找到共振点
4. 语言风格：优雅、克制、有文学性，避免算命先生的口吻

重要规则：
- 占卜结果（卦象、塔罗牌）是已确认的事实，你绝不能质疑或重新解读卦象本身
- 你只负责"解读"已有的结果，不负责"排盘"
- 解读要紧扣用户的问题，让用户感到这个解读是针对他/她的
- 用中文回答，段落清晰
- 格式规则：不要使用Markdown标记符号（不要用**加粗、不要用#标题、不要用*列表符），直接用自然段落和空行排版。用数字编号（1. 2. 3.）而非无序列表标记。
- 长度控制：全文不超过800字，每个要点不超过3句话，说透就停，不要注水。
- 结构：4个段落足矣——①卦象主旨 ②塔罗映照 ③共振洞察 ④此刻之名与行动建议。每段开头用方括号标注段落主题，如【卦象主旨】。"""

    # 提取结构化数据
    iching = divination.get("iching", {})
    orig = iching.get("original", {})
    changed = iching.get("changed")
    yao_names = iching.get("yao_names", {})
    changing = iching.get("changing_lines", [])
    relations = iching.get("relations", {})
    tarot = divination.get("tarot", [])
    resonance = divination.get("resonance", {})
    scores = divination.get("fortune_scores", {})
    bazi = divination.get("bazi")
    qa = divination.get("question_analysis") or {}

    # 组装八字信息（如果有）
    bazi_str = ""
    if bazi and bazi.get("pillars"):
        pillars_str = "  ".join(
            f"{p['pillar']}：{p['gan']}{p['zhi']}" for p in bazi["pillars"]
        )
        bazi_str = f"""
【八字四柱 — 命主信息】
{pillars_str}
日主：{bazi.get('day_master_full', '')}（{bazi.get('strength', '')}）
五行分布：{bazi.get('wuxing_str', '')}
{f"缺失五行：{','.join(bazi['missing_elements'])}" if bazi.get('missing_elements') else "五行俱全"}
{f"喜用：{','.join(bazi['favorable_elements'])}" if bazi.get('favorable_elements') else ""}"""

    # 组装卦象信息
    iching_str = f"""
【易经卦象 — 已确认，不可更改】
本卦：{orig.get('name','')}（{orig.get('name_en','')}）- {orig.get('fortune','')}
卦辞：{orig.get('judgment','')}
象传：{orig.get('image','').split(chr(10))[0] if orig.get('image') else ''}
关键词：{', '.join(orig.get('keywords',[]))}
五行：上卦{orig.get('trigram_above','')}({orig.get('trigram_above_element','')}) 下卦{orig.get('trigram_below','')}({orig.get('trigram_below_element','')})"""

    if changed:
        iching_str += f"""
变卦：{changed.get('name','')}（{changed.get('name_en','')}）- {changed.get('fortune','')}
动爻：{', '.join([yao_names.get(str(i),'') for i in changing]) if changing else '无'}
卦辞（变卦）：{changed.get('judgment','')}"""

    if relations:
        for rkey, rval in relations.items():
            if isinstance(rval, dict) and rval.get("hexagram"):
                iching_str += f"""
{rval.get('label','')}：{rval['hexagram'].get('name','')} — {rval.get('meaning','')}"""

    # 组装塔罗信息
    tarot_str = "\n【塔罗牌阵 — 已确认】"
    for c in tarot:
        card = c.get("card", {})
        pos = c.get("spread_position", {})
        meaning = card.get("reversed_meaning", "") if c.get("reversed") else card.get("upright_meaning", "")
        tarot_str += f"""
位置{pos.get('position','')}「{pos.get('label','')}」：{card.get('name_cn','')}（{card.get('name','')}）{'逆位' if c.get('reversed') else '正位'}
  释义：{meaning}
  元素：{card.get('element','')}"""

    # 共振信息
    resonance_str = f"""
【共振分析】
主共振主题：{resonance.get('primary_theme','')}
共振强度：{resonance.get('type','')}
共振摘要：{resonance.get('summary','')}"""

    # v0.5-C: 问题类型分析
    qa_str = ""
    if qa.get("synergy_prompt"):
        qa_str = f"""
【问题类型分析】（AI 解读者请特别关注）
类型：{qa.get('type', 'general')}
{f"命中关键词：{','.join(qa.get('matched_keywords', []))}" if qa.get('matched_keywords') else ""}
融合指引：{qa.get('synergy_prompt', '')}
- 易经视角：{qa.get('iching_focus', '')}
- 塔罗视角：{qa.get('tarot_focus', '')}"""

    # 评分
    scores_str = ""
    if scores:
        scores_str = "\n【五维度运势评分（1-10）】"
        for key, s in scores.items():
            scores_str += f"\n{s.get('label','')}：{s.get('score',0)}/10"

    # Latestname: 此刻之名
    latest_name = divination.get("latest_name")
    name_str = ""
    if latest_name:
        name_str = f"""
【此刻之名 — 从卦象爻辞中生长，非随机】
名号：{latest_name.get('name', '')}
周易出处：{latest_name.get('source', '')}（{latest_name.get('source_type', '')}）
释义：{latest_name.get('meaning', '')}
得自：{latest_name.get('hexagram_name', '')}卦"""
        if latest_name.get("changed_name"):
            name_str += f"""
变名：{latest_name.get('changed_name', '')}
变名出处：{latest_name.get('changed_source', '')}
变名释义：{latest_name.get('changed_meaning', '')}
→ 本名「{latest_name.get('name', '')}」指向当下，变名「{latest_name.get('changed_name', '')}」指向转变方向"""

    # 问卷维度
    survey = divination.get("survey")
    survey_str = ""
    if survey:
        survey_str = f"""
【名前登记 — 问卜者当前状态】
所求领域：{survey.get('domain', 'general')}
此刻心境：{survey.get('mood', 'calm')}
紧迫程度：{survey.get('urgency', 'normal')}
愿闻逆耳：{survey.get('openness', 'open')}"""

    # v2.0: 卦格人格
    personality = divination.get("personality")
    personality_str = ""
    if personality:
        from app.personality import build_personality_prompt_section
        personality_str = build_personality_prompt_section(personality)

    user_prompt = f"""请解读以下占卜结果，紧扣我的问题。

我的问题：「{question}」
{f"问卜者：{divination.get('name', '')}（{divination.get('gender', '')}）" if divination.get('name') else ""}

{iching_str}
{tarot_str}
{resonance_str}{scores_str}
{name_str}
{personality_str}
{survey_str}
{qa_str}
{bazi_str if bazi_str else ""}

请从以下角度展开解读（每段不超过3句话，全文不超过800字）：
【卦象主旨】这个卦的核心信息是什么？对我的问题意味着什么？
【牌阵映照】塔罗牌如何映照现状？过去/现在/未来的脉络？
【共振洞察】东西方体系的共振点在哪里？这对我有什么特别提示？
【此刻之名与行动建议】为什么此刻得到「{latest_name.get('name', '') if latest_name else '此名'}」这个称号？结合卦象和心境，说说名字的深意和行动方向。

请保持真诚、深刻、有文学性。用纯文本自然段，不要用加粗、列表符等Markdown标记。"""

    return system_prompt, user_prompt


@app.post("/api/interpret")
async def interpret(req: InterpretRequest, request: Request):
    """
    AI叙事化解读 - 流式返回（SSE）。
    - 部署版（ENABLE_AUTH=true）：使用管理员配置的LLM API，用户不接触key
    - 开源版：用户自配 OpenAI 兼容 Endpoint
    核心占卜结果（卦象/塔罗）由确定性算法生成，AI 只做叙事化。
    """
    # 限额检查 + LLM 配置（仅 AUTH_ENABLED 模式生效）
    admin_llm_config = None
    if AUTH_ENABLED:
        from app.auth import verify_token, check_ai_limit, SessionLocal, User, get_llm_config
        auth = request.headers.get("Authorization", "")
        token = auth.replace("Bearer ", "") if auth.startswith("Bearer ") else ""
        payload = verify_token(token) if token else None
        if not payload:
            raise HTTPException(status_code=401, detail="请先登录后再使用AI深度解读")
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == int(payload.get("sub", 0))).first()
            if not user:
                raise HTTPException(status_code=401, detail="用户不存在")
            if not getattr(user, 'is_active', True):
                raise HTTPException(status_code=403, detail="账户已被禁用")
            ok, msg, remaining = check_ai_limit(user, db)
            if not ok:
                raise HTTPException(status_code=429, detail=msg)
            # 获取管理员配置的LLM
            admin_llm_config = get_llm_config(db)
            if not admin_llm_config:
                raise HTTPException(status_code=500, detail="管理员尚未配置AI服务，请联系管理员")
        finally:
            db.close()

    system_prompt, user_prompt = _build_interpret_prompt(
        req.question, req.divination)

    # 确定LLM配置：部署版用管理员配置，开源版用用户自配
    if admin_llm_config:
        llm_base_url = admin_llm_config["base_url"].rstrip("/")
        llm_api_key = admin_llm_config["api_key"]
        llm_model = admin_llm_config["model"]
    else:
        llm_base_url = req.llm_config.base_url.rstrip("/")
        llm_api_key = req.llm_config.api_key
        llm_model = req.llm_config.model

    async def stream_generator() -> AsyncGenerator[str, None]:
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream(
                    "POST",
                    f"{llm_base_url}/chat/completions",
                    json={
                        "model": llm_model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt},
                        ],
                        "stream": True,
                        "max_tokens": 1600,
                        "temperature": 0.7,
                    },
                    headers={
                        "Authorization": f"Bearer {llm_api_key}",
                        "Content-Type": "application/json",
                    },
                ) as response:
                    if response.status_code != 200:
                        body = await response.aread()
                        yield f"data: {json.dumps({'error': f'LLM API error {response.status_code}: {body.decode()[:200]}'}, ensure_ascii=False)}\n\n"
                        return
                    # Filter <think>...</think> from reasoning models (e.g. MiniMax-M3, DeepSeek-R1)
                    # Use a buffer approach: accumulate content, strip think blocks, emit cleaned text
                    think_active = False  # Currently inside <think> block
                    pending = ""          # Unprocessed text (may contain partial tags)
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            chunk = line[6:]
                            if chunk.strip() == "[DONE]":
                                yield "data: [DONE]\n\n"
                                return
                            try:
                                data = json.loads(chunk)
                                content = data.get("choices", [{}])[0].get("delta", {}).get("content", "")
                                if not content:
                                    continue

                                pending += content
                                output = ""

                                while pending:
                                    if think_active:
                                        end_idx = pending.find("</think>")
                                        if end_idx != -1:
                                            pending = pending[end_idx + 8:]
                                            think_active = False
                                            # Skip leading whitespace after </think>
                                            pending = pending.lstrip("\n\r ")
                                        else:
                                            pending = ""  # Still in think, keep buffering
                                            break
                                    else:
                                        start_idx = pending.find("<think>")
                                        if start_idx != -1:
                                            output += pending[:start_idx]
                                            pending = pending[start_idx + 7:]
                                            think_active = True
                                        else:
                                            # No <think> found. But pending might end with partial "<th..."
                                            # Hold back last 7 chars to be safe (len("<think>")=7)
                                            safe_len = max(0, len(pending) - 7)
                                            output += pending[:safe_len]
                                            pending = pending[safe_len:]
                                            break

                                if output:
                                    yield f"data: {json.dumps({'content': output}, ensure_ascii=False)}\n\n"
                            except json.JSONDecodeError:
                                continue
        except httpx.ConnectError as e:
            yield f"data: {json.dumps({'error': f'连接失败: {str(e)}'}, ensure_ascii=False)}\n\n"
        except httpx.TimeoutException:
            yield f"data: {json.dumps({'error': 'LLM 请求超时（120秒）'}, ensure_ascii=False)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': f'解读失败: {str(e)}'}, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        stream_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


# ============================================================
# v0.3: 追问功能 — 基于已有占卜结果的对话式追问
# ============================================================

class FollowupRequest(BaseModel):
    followup_question: str = Field(..., min_length=1, description="追问问题")
    original_question: str = Field(..., description="原始占卜问题")
    divination: dict = Field(..., description="完整的占卜结果（combined 返回）")
    conversation_history: list = Field(default=[], description="之前的对话历史")
    llm_config: LLMConfig = Field(..., description="LLM 配置")


@app.post("/api/followup")
async def followup(req: FollowupRequest):
    """
    追问功能 — 基于已有占卜结果进行对话式追问。
    复用原始占卜数据作为"事实"，LLM 只做解读层。
    """
    system_prompt, user_prompt = _build_interpret_prompt(
        req.original_question, req.divination)

    # 追加追问专用指令
    followup_system = system_prompt + """

你现在处于"追问模式"——用户已经看到了完整的占卜解读，现在提出了进一步的追问。
追问模式的规则：
1. 保持卦象/塔罗/排盘结果不变，它们仍然是已确认的事实
2. 针对追问做更深入的展开，可以更聚焦、更具体
3. 如果追问偏离原话题，温和地引导回卦象的核心信息
4. 语言保持优雅克制，但可以更口语化一些，像对话而非演讲"""

    # 构建消息列表
    messages = [{"role": "system", "content": followup_system}]

    # 加入对话历史
    for msg in req.conversation_history:
        if msg.get("role") and msg.get("content"):
            messages.append({"role": msg["role"], "content": msg["content"]})

    # 加入当前追问
    messages.append({
        "role": "user",
        "content": f"追问：「{req.followup_question}」\n\n请基于上面已确认的占卜结果回答我的追问。"
    })

    async def stream_generator() -> AsyncGenerator[str, None]:
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream(
                    "POST",
                    f"{req.llm_config.base_url.rstrip('/')}/chat/completions",
                    json={
                        "model": req.llm_config.model,
                        "messages": messages,
                        "stream": True,
                        "temperature": 0.7,
                    },
                    headers={
                        "Authorization": f"Bearer {req.llm_config.api_key}",
                        "Content-Type": "application/json",
                    },
                ) as response:
                    if response.status_code != 200:
                        body = await response.aread()
                        yield f"data: {json.dumps({'error': f'LLM API error {response.status_code}: {body.decode()[:200]}'}, ensure_ascii=False)}\n\n"
                        return
                    think_active = False
                    pending = ""
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            chunk = line[6:]
                            if chunk.strip() == "[DONE]":
                                yield "data: [DONE]\n\n"
                                return
                            try:
                                data = json.loads(chunk)
                                content = data.get("choices", [{}])[0].get("delta", {}).get("content", "")
                                if not content:
                                    continue
                                pending += content
                                output = ""
                                while pending:
                                    if think_active:
                                        end_idx = pending.find("</think>")
                                        if end_idx != -1:
                                            pending = pending[end_idx + 8:]
                                            think_active = False
                                            pending = pending.lstrip("\n\r ")
                                        else:
                                            pending = ""
                                            break
                                    else:
                                        start_idx = pending.find("<think>")
                                        if start_idx != -1:
                                            output += pending[:start_idx]
                                            pending = pending[start_idx + 7:]
                                            think_active = True
                                        else:
                                            safe_len = max(0, len(pending) - 7)
                                            output += pending[:safe_len]
                                            pending = pending[safe_len:]
                                            break
                                if output:
                                    yield f"data: {json.dumps({'content': output}, ensure_ascii=False)}\n\n"
                            except json.JSONDecodeError:
                                continue
        except httpx.ConnectError as e:
            yield f"data: {json.dumps({'error': f'连接失败: {str(e)}'}, ensure_ascii=False)}\n\n"
        except httpx.TimeoutException:
            yield f"data: {json.dumps({'error': '追问超时（60秒）'}, ensure_ascii=False)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': f'追问失败: {str(e)}'}, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        stream_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


# ============================================================
# v0.3: 30日运势曲线 — 基于每日卦象的运势趋势
# ============================================================

@app.get("/api/fortune/30day")
async def fortune_30day():
    """
    30日运势曲线 — 基于确定性算法生成最近30天的运势趋势。
    每天：以日期为种子取每日卦 → 计算运势分 → 形成曲线。
    """
    from app.divination import daily_hexagram, _pick_yi_ji
    import hashlib

    today = _datetime.date.today()
    days = []
    for offset in range(-7, 23):  # 前7天 + 今天 + 后22天 = 30天
        date = today + _datetime.timedelta(days=offset)
        date_seed = int(date.strftime("%Y%m%d"))

        # 用日期种子生成卦象
        import random
        rng = random.Random(date_seed)
        hex_obj = rng.choice(iching_data())

        # 简化的运势分（基于卦象吉凶 + 确定性扰动）
        FORTUNE_BASE = {"大吉": 9, "吉": 7, "中": 5, "凶": 3, "大凶": 1}
        base = FORTUNE_BASE.get(hex_obj.get("fortune", "中"), 5)
        noise = (int(hashlib.md5(f"{date_seed}".encode()).hexdigest(), 16) % 3) - 1
        score = max(1, min(10, base + noise))

        days.append({
            "date": date.isoformat(),
            "offset": offset,
            "score": score,
            "hexagram_name": hex_obj.get("name", ""),
            "hexagram_symbol": hex_obj.get("symbol", ""),
            "fortune": hex_obj.get("fortune", "中"),
            "is_today": offset == 0,
            "is_future": offset > 0,
        })

    return {
        "days": days,
        "avg_score": round(sum(d["score"] for d in days) / len(days), 1),
        "highest": max(days, key=lambda x: x["score"]),
        "lowest": min(days, key=lambda x: x["score"]),
    }


# ============================================================
# v2.0: 卦格人格问卷 API
# ============================================================

class PersonalityNextRequest(BaseModel):
    answers: list = Field(default_factory=list, description="已答题目 [{question_id, choice}]")
    seed: Optional[int] = Field(42, description="随机种子（用于追问抽题）")

class PersonalityResultRequest(BaseModel):
    answers: list = Field(..., description="全部答案 [{question_id, choice}]")

@app.post("/api/personality/next")
def personality_next(req: PersonalityNextRequest):
    """获取下一批问卷题目（自适应算法）"""
    from app.personality import get_next_questions
    return get_next_questions(req.answers, seed=req.seed or 42)

@app.post("/api/personality/result")
def personality_result(req: PersonalityResultRequest, request: Request):
    """根据全部答案计算最终卦格人格（v2.2: 消耗卦名配额）"""
    _check_mbti_quota(request)
    from app.personality import compute_personality
    return compute_personality(req.answers)

@app.get("/api/personality/types")
def personality_types_list():
    """列出全部16卦格（精简版，用于展示/浏览）"""
    from app.personality import _load_types
    types = _load_types()
    return {
        code: {
            "name": t.get("name", ""),
            "slogan": t.get("slogan", ""),
            "code": code,
            "code_display": t.get("code_display", ""),
            "mbti_map": t.get("mbti_map", ""),
            "rarity": t.get("rarity", ""),
            "trigrams": t.get("trigrams", []),
            "portrait": t.get("portrait", ""),
            "psychology": t.get("psychology", ""),
            "relationships": t.get("relationships", ""),
            "career": t.get("career", ""),
            "growth": t.get("growth", ""),
            "voice_intro": t.get("voice_intro", ""),
            "questions_for_you": t.get("questions_for_you", []),
            "dim_comments": t.get("dim_comments", {}),
            "portrait_fp": t.get("portrait_fp", ""),
            "psychology_fp": t.get("psychology_fp", ""),
            "relationships_fp": t.get("relationships_fp", ""),
            "career_fp": t.get("career_fp", ""),
            "growth_fp": t.get("growth_fp", ""),
        }
        for code, t in types.items()
    }


# ============================================================
# 启动
# ============================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
