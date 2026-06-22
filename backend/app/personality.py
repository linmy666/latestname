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
卦格人格引擎 — MBTI 式自适应问卷系统

维度体系（4维×2极=16卦格）：
  决断：动(震·雷) / 静(坤·地)
  判断：明(离·火) / 幽(坎·水)
  处事：刚(乾·天) / 柔(巽·风)
  变通：通(兑·泽) / 止(艮·山)

自适应算法：
  Phase 1 — 基础阶段：每维度先出 5 题（共 20 题必答）
  Phase 2 — 评分：统计每维度倾向比例
  Phase 3 — 追问阶段：
    - 倾向明确（4:1 或 5:0）→ 跳过
    - 轻微倾向（3:2）→ 从追加池抽 3 题确认
    - 矛盾/模糊（反复反转）→ 抽 5 题重点确认
  Phase 4 — 反向计分检测：池中反向题选 A 实际计 B
"""

import json
import random
import os
from typing import Optional

_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

# 维度配置
DIMENSIONS = {
    "decisive": {
        "pole_a": "动", "pole_b": "静",
        "trigram_a": "震·雷", "trigram_b": "坤·地",
        "base_key": "base_questions", "pool_key": "pool_questions"
    },
    "judgment": {
        "pole_a": "明", "pole_b": "幽",
        "trigram_a": "离·火", "trigram_b": "坎·水",
        "base_key": "base_questions", "pool_key": "pool_questions"
    },
    "social": {
        "pole_a": "刚", "pole_b": "柔",
        "trigram_a": "乾·天", "trigram_b": "巽·风",
        "base_key": "base_questions", "pool_key": "pool_questions"
    },
    "attribution": {
        "pole_a": "通", "pole_b": "止",
        "trigram_a": "兑·泽", "trigram_b": "艮·山",
        "base_key": "base_questions", "pool_key": "pool_questions"
    }
}

# 维度中文映射
DIM_CN = {
    "decisive": "决断",
    "judgment": "判断",
    "social": "处事",
    "attribution": "变通"
}

_questions_cache: Optional[dict] = None
_types_cache: Optional[dict] = None


def _load_questions() -> dict:
    global _questions_cache
    if _questions_cache is None:
        path = os.path.join(_DATA_DIR, "personality_questions.json")
        with open(path, "r", encoding="utf-8") as f:
            _questions_cache = json.load(f)
    return _questions_cache


def _load_types() -> dict:
    global _types_cache
    if _types_cache is None:
        path = os.path.join(_DATA_DIR, "personality_types.json")
        with open(path, "r", encoding="utf-8") as f:
            _types_cache = json.load(f)
    return _types_cache


# ============================================================
# 评分核心
# ============================================================

def _score_dimension(answers: list, dim_key: str) -> dict:
    """
    对单个维度评分。
    
    answers: [{question_id, choice: "A"|"B"}, ...]
    dim_key: "decisive" | "judgment" | "social" | "attribution"
    
    返回:
    {
        "a_count": int,       # A极得分（考虑反向题）
        "b_count": int,       # B极得分
        "total": int,         # 该维度已答题数
        "winner": "A"|"B",    # 胜出极
        "confidence": float,  # 置信度 0-1（a_count / total 的偏离程度）
        "is_clear": bool,     # 是否已明确（4:1+ 或差距≥2）
        "poles": {"A": int, "B": int}
    }
    """
    questions = _load_questions()
    dim_data = questions["dimensions"][dim_key]
    all_questions = dim_data["base_questions"] + dim_data["pool_questions"]
    q_map = {q["id"]: q for q in all_questions}
    
    a_count = 0
    b_count = 0
    answered_ids = set()
    
    for ans in answers:
        qid = ans.get("question_id", "")
        choice = ans.get("choice", "")
        if qid not in q_map or qid in answered_ids:
            continue
        
        q = q_map[qid]
        answered_ids.add(qid)
        
        # 反向题：选 A 实际计 B，选 B 实际计 A
        if q.get("reverse"):
            actual = "B" if choice == "A" else "A"
        else:
            actual = choice
        
        if actual == "A":
            a_count += 1
        elif actual == "B":
            b_count += 1
    
    total = a_count + b_count
    if total == 0:
        return {"a_count": 0, "b_count": 0, "total": 0, "winner": None, "confidence": 0, "is_clear": False, "poles": {"A": 0, "B": 0}}
    
    winner = "A" if a_count > b_count else ("B" if b_count > a_count else None)
    # 置信度：偏离 50% 的程度 × 2（0-1）
    confidence = abs(a_count - b_count) / total
    
    # 明确标准：已答≥4题且差距≥2，或已答≥5题
    is_clear = (total >= 5 and confidence >= 0.6) or (total >= 4 and abs(a_count - b_count) >= 3)
    
    return {
        "a_count": a_count,
        "b_count": b_count,
        "total": total,
        "winner": winner,
        "confidence": round(confidence, 2),
        "is_clear": is_clear,
        "poles": {"A": a_count, "B": b_count}
    }


def _dim_to_code_char(dim_key: str, winner: str) -> str:
    """维度胜出极 → 中文代号字"""
    return DIMENSIONS[dim_key][f"pole_{winner.lower()}"]


def _dim_to_trigram(dim_key: str, winner: str) -> str:
    return DIMENSIONS[dim_key][f"trigram_{winner.lower()}"]


# ============================================================
# 自适应问卷流程
# ============================================================

def get_next_questions(
    answers: list,
    seed: int = 42,
) -> dict:
    """
    根据当前已答列表，返回下一批题目。
    
    返回:
    {
        "questions": [...],      # 下一步要答的题目列表（1-3题）
        "phase": "base"|"followup"|"done",
        "progress": {"answered": int, "estimated_total": int},
        "dim_status": {dim_key: {winner, confidence, is_clear, ...}},
        "is_complete": bool
    }
    """
    questions_data = _load_questions()
    rng = random.Random(seed)
    
    answered_ids = {a.get("question_id") for a in answers}
    
    # --- Phase 1: 基础题 ---
    # 每维度5题，按顺序出，但混合各维度（D1,J1,S1,A1 → D2,J2,...）
    base_order = []
    for i in range(5):
        for dim_key in DIMENSIONS:
            dim_data = questions_data["dimensions"][dim_key]
            if i < len(dim_data["base_questions"]):
                base_order.append(dim_data["base_questions"][i]["id"])
    
    unasked_base = [qid for qid in base_order if qid not in answered_ids]
    
    if unasked_base:
        # 每次出4题（每维度1题），保持节奏
        batch = unasked_base[:4]
        q_list = []
        for qid in batch:
            for dim_key, dim_data in questions_data["dimensions"].items():
                for q in dim_data["base_questions"] + dim_data["pool_questions"]:
                    if q["id"] == qid:
                        q_list.append(q)
                        break
        
        # 评分各维度
        dim_status = {}
        for dk in DIMENSIONS:
            dim_status[dk] = _score_dimension(answers, dk)
        
        clear_count = sum(1 for dk in DIMENSIONS if dim_status[dk]["is_clear"])
        
        return {
            "questions": q_list,
            "phase": "base",
            "progress": {
                "answered": len(answered_ids),
                "estimated_total": _estimate_total(answers),
            },
            "dim_status": dim_status,
            "is_complete": False
        }
    
    # --- Phase 2/3: 基础题做完，评分决定追问 ---
    # 安全上限：总答题数超过 35 → 强制完成
    if len(answered_ids) > 35:
        return {
            "questions": [],
            "phase": "done",
            "progress": {"answered": len(answered_ids), "estimated_total": len(answered_ids)},
            "dim_status": {dk: _score_dimension(answers, dk) for dk in DIMENSIONS},
            "is_complete": True
        }
    
    dim_status = {}
    followup_questions = []
    
    for dim_key in DIMENSIONS:
        status = _score_dimension(answers, dim_key)
        dim_status[dim_key] = status
        
        if status["is_clear"]:
            continue  # 已明确，跳过
        
        # 需要追问
        dim_data = questions_data["dimensions"][dim_key]
        pool = dim_data["pool_questions"]
        unasked_pool = [q for q in pool if q["id"] not in answered_ids]
        
        # 题池用尽 → 强制判定为明确（用当前得分做最终判定）
        if not unasked_pool:
            status["is_clear"] = True
            continue
        
        # 追问题数：confidence < 0.3 → 5题，否则 3题
        num_followup = 5 if status["confidence"] < 0.3 else 3
        num_followup = min(num_followup, len(unasked_pool))
        
        if num_followup > 0:
            sampled = rng.sample(unasked_pool, num_followup)
            followup_questions.extend(sampled)
            answered_ids.update(q["id"] for q in sampled)  # 模拟已分配
    
    # 限制每轮最多出4题（保持节奏一致）
    followup_questions = followup_questions[:4]
    
    real_answered = len({a.get("question_id") for a in answers})
    est_total = real_answered + len(followup_questions)
    # 对未明确维度再估一轮
    for dim_key in DIMENSIONS:
        if not dim_status[dim_key]["is_clear"]:
            est_total += 3  # 预估还需要确认
    
    if not followup_questions:
        # 全部明确，完成
        return {
            "questions": [],
            "phase": "done",
            "progress": {"answered": real_answered, "estimated_total": real_answered},
            "dim_status": dim_status,
            "is_complete": True
        }
    
    return {
        "questions": followup_questions,
        "phase": "followup",
        "progress": {
            "answered": real_answered,
            "estimated_total": est_total,
        },
        "dim_status": dim_status,
        "is_complete": False
    }


def _estimate_total(answers: list) -> int:
    """估算总题数（基于当前模糊程度）"""
    base_total = 20  # 基础题
    answered_ids = {a.get("question_id") for a in answers}
    
    if len(answered_ids) < 20:
        # 还在基础阶段，估算
        # 先假设基础阶段之后需要追问
        return 28  # 20基础 + 平均8追问
    
    # 基础题做完，算实际追问需求
    extra = 0
    for dim_key in DIMENSIONS:
        status = _score_dimension(answers, dim_key)
        if not status["is_clear"]:
            extra += 5 if status["confidence"] < 0.3 else 3
    
    return 20 + extra


# ============================================================
# 最终结果
# ============================================================

def compute_personality(answers: list) -> dict:
    """
    根据所有答案计算最终卦格。
    
    返回:
    {
        "code": "动明刚通",            # 四字代号
        "code_display": "动·明·刚·通",  # 带分隔的展示
        "name": "潜龙格",
        "slogan": "...",
        "trigrams": ["震·雷", "离·火", "乾·天", "兑·泽"],
        "affinity_hexagrams": [1, 34, 24],
        "mbti_map": "ENTJ",
        "rarity": "...",
        "dim_scores": {dim_key: {winner, confidence, poles, ...}},
        "portrait": "...",
        "psychology": "...",
        "relationships": "...",
        "career": "...",
        "growth": "..."
    }
    """
    types = _load_types()
    
    # 评分各维度
    dim_scores = {}
    code_chars = []
    trigrams = []
    
    for dim_key in ["decisive", "judgment", "social", "attribution"]:
        status = _score_dimension(answers, dim_key)
        dim_scores[dim_key] = status
        
        winner = status["winner"] or "A"  # 平局默认A
        code_chars.append(_dim_to_code_char(dim_key, winner))
        trigrams.append(_dim_to_trigram(dim_key, winner))
    
    code = "".join(code_chars)
    
    # 查找卦格数据
    personality = types.get(code)
    if not personality:
        # 回退：用最接近的
        personality = list(types.values())[0]
    
    result = {
        "code": code,
        "code_display": "·".join(code_chars),
        "name": personality.get("name", ""),
        "slogan": personality.get("slogan", ""),
        "trigrams": trigrams,
        "affinity_hexagrams": personality.get("affinity_hexagrams", []),
        "mbti_map": personality.get("mbti_map", ""),
        "rarity": personality.get("rarity", ""),
        "dim_scores": {
            DIM_CN[dk]: {
                "winner_label": _dim_to_code_char(dk, v["winner"] or "A"),
                "trigram": _dim_to_trigram(dk, v["winner"] or "A"),
                "confidence": v["confidence"],
                "poles": v["poles"],
                "total": v["total"],
            }
            for dk, v in dim_scores.items()
        },
        "portrait": personality.get("portrait", ""),
        "psychology": personality.get("psychology", ""),
        "relationships": personality.get("relationships", ""),
        "career": personality.get("career", ""),
        "growth": personality.get("growth", ""),
        "voice_intro": personality.get("voice_intro", ""),
        "questions_for_you": personality.get("questions_for_you", []),
        "dim_comments": personality.get("dim_comments", {}),
        "portrait_fp": personality.get("portrait_fp", ""),
        "psychology_fp": personality.get("psychology_fp", ""),
        "relationships_fp": personality.get("relationships_fp", ""),
        "career_fp": personality.get("career_fp", ""),
        "growth_fp": personality.get("growth_fp", ""),
    }

    return result


def personality_to_seed_component(personality: dict) -> str:
    """卦格代号转化为种子组件"""
    return personality.get("code", "动明刚通")


def get_personality_by_code(code: str) -> dict | None:
    """
    根据卦格代码（如"动明刚通"）直接获取卦格数据。
    用于用户手动认领卦格（跳过问卷）的场景。
    """
    types = _load_types()
    personality = types.get(code)
    if not personality:
        return None

    # code_display 从 code 自动生成
    code_display = "·".join(list(code))
    # trigrams 从数据获取，如果没有则从 code 推导
    trigrams = personality.get("trigrams", [])
    if not trigrams:
        _TRIGRAM_MAP = {"动": "震·雷", "静": "巽·风", "明": "离·火", "幽": "坎·水",
                        "刚": "乾·天", "柔": "坤·地", "通": "兑·泽", "止": "艮·山"}
        trigrams = [_TRIGRAM_MAP.get(c, "") for c in code]

    return {
        "code": code,
        "code_display": code_display,
        "name": personality.get("name", ""),
        "slogan": personality.get("slogan", ""),
        "trigrams": trigrams,
        "affinity_hexagrams": personality.get("affinity_hexagrams", []),
        "mbti_map": personality.get("mbti_map", ""),
        "rarity": personality.get("rarity", ""),
        "dim_scores": {},  # 手动认领无评分数据
        "portrait": personality.get("portrait", ""),
        "psychology": personality.get("psychology", ""),
        "relationships": personality.get("relationships", ""),
        "career": personality.get("career", ""),
        "growth": personality.get("growth", ""),
        "voice_intro": personality.get("voice_intro", ""),
        "questions_for_you": personality.get("questions_for_you", []),
        "dim_comments": personality.get("dim_comments", {}),
        "portrait_fp": personality.get("portrait_fp", ""),
        "psychology_fp": personality.get("psychology_fp", ""),
        "relationships_fp": personality.get("relationships_fp", ""),
        "career_fp": personality.get("career_fp", ""),
        "growth_fp": personality.get("growth_fp", ""),
    }


def build_personality_prompt_section(personality: dict) -> str:
    """构建 AI 解读 prompt 中的卦格人格部分"""
    parts = []
    parts.append(f"\n【卦格人格：{personality['name']}（{personality['code_display']}）】")
    parts.append(f"特质：{personality['slogan']}")
    parts.append(f"八卦组合：{' / '.join(personality['trigrams'])}")
    if personality.get('mbti_map'):
        parts.append(f"MBTI参照：{personality['mbti_map']}")
    parts.append(f"人格画像：{personality.get('portrait', '')}")
    parts.append(f"深层心理：{personality.get('psychology', '')}")
    parts.append(f"成长方向：{personality.get('growth', '')}")
    parts.append("请在解读中融入此人的人格特质，让解读与TA的卦格性格产生呼应。例如：如果此人是「潜龙格」（行动型），解读应鼓励其行动但提醒复盘；如果是「观象格」（谋士型），解读应肯定其深思熟虑但提醒不要过度拖延。")
    return "\n".join(parts)

_LN_WM = "4c3a8f2e7b1d9065a2c8e4f1b7d3096e8a5c2f4d"  # linmy666/latestname
