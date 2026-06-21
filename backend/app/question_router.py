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
Onyx - 问题分类路由
根据用户的问题关键词，自动匹配最合适的占卜策略（推荐牌阵 + 解读视角）
"""
from typing import Dict

QUESTION_TYPES: Dict[str, Dict] = {
    "career": {
        "keywords_zh": ["工作", "面试", "跳槽", "升职", "离职", "创业", "事业", "薪资", "老板", "同事",
                        "职位", "offer", "入职", "辞职", "裁员", "团队", "创业"],
        "keywords_en": ["job", "career", "interview", "promotion", "quit", "business",
                        "salary", "boss", "work", "company"],
        "recommended_spread": "decision",
        "recommended_mode": "combined",
        "iching_focus": "事业运势中的行动时机和方向",
        "iching_focus_en": "Career timing and direction",
        "tarot_focus": "职业发展中的隐含因素和外部环境",
        "tarot_focus_en": "Hidden factors and external environment in career",
        "synergy_prompt": "结合东方的时势观和西方的心理分析",
        "synergy_prompt_en": "Combine Eastern timing with Western psychological analysis",
    },
    "relationship": {
        "keywords_zh": ["感情", "恋爱", "分手", "复合", "婚姻", "相亲", "暗恋", "表白", "出轨", "前任",
                        "对象", "男友", "女友", "老公", "老婆", "夫妻"],
        "keywords_en": ["love", "relationship", "marriage", "breakup", "ex", "crush",
                        "date", "boyfriend", "girlfriend", "spouse"],
        "recommended_spread": "relationship",
        "recommended_mode": "combined",
        "iching_focus": "关系的本质和长远走向",
        "iching_focus_en": "Essence and long-term direction of the relationship",
        "tarot_focus": "双方的情感状态和互动模式",
        "tarot_focus_en": "Both parties' emotional states and interaction patterns",
        "synergy_prompt": "东方看缘分因果，西方看当下心理",
        "synergy_prompt_en": "Eastern: fate and karma; Western: present psychology",
    },
    "finance": {
        "keywords_zh": ["投资", "赚钱", "财运", "股票", "基金", "买房", "负债", "理财", "收入",
                        "亏", "赚", "涨", "跌", "加仓", "抄底"],
        "keywords_en": ["money", "invest", "finance", "stock", "wealth", "income",
                        "profit", "loss", "real estate"],
        "recommended_spread": "horseshoe",
        "recommended_mode": "combined",
        "iching_focus": "财运的时令和旺衰",
        "iching_focus_en": "Financial timing and prosperity",
        "tarot_focus": "财务决策中的风险与机遇",
        "tarot_focus_en": "Risk and opportunity in financial decisions",
        "synergy_prompt": "东方看天时地利，西方看人为抉择",
        "synergy_prompt_en": "Eastern timing + Western choice analysis",
    },
    "health": {
        "keywords_zh": ["健康", "生病", "身体", "失眠", "焦虑", "抑郁", "减肥", "运动",
                        "病", "痛", "累", "虚弱", "睡眠"],
        "keywords_en": ["health", "sick", "illness", "sleep", "anxiety", "depression",
                        "exercise", "weight"],
        "recommended_spread": "three_card",
        "recommended_mode": "iching",
        "iching_focus": "身体状况的整体趋势",
        "iching_focus_en": "Overall health trend",
        "tarot_focus": "身心连接和情绪根源",
        "tarot_focus_en": "Mind-body connection and emotional roots",
        "synergy_prompt": "以东方为主，西方为辅",
        "synergy_prompt_en": "Primary: Eastern; Supplementary: Western",
    },
    "decision": {
        "keywords_zh": ["应该", "要不要", "该不该", "选择", "决定", "怎么办", "能不能",
                        "是不是"],
        "keywords_en": ["should", "must", "choose", "decide", "whether", "or not"],
        "recommended_spread": "decision",
        "recommended_mode": "combined",
        "iching_focus": "决断的时机和方向",
        "iching_focus_en": "Decision timing and direction",
        "tarot_focus": "两条路的各自利弊",
        "tarot_focus_en": "Pros and cons of each path",
        "synergy_prompt": "东方给方向，西方给细节",
        "synergy_prompt_en": "Eastern: direction; Western: details",
    },
    "exam": {
        "keywords_zh": ["考试", "高考", "考研", "考公", "面试通过", "雅思", "托福", "期末",
                        "上岸", "绩点", "成绩", "及格", "录取", "复试", "笔试", "考证",
                        "四级", "六级", "gre", "gmat", "sat", "ap"],
        "keywords_en": ["exam", "test", "score", "pass", "fail", "grade", "admission",
                        "college", "university", "sat", "gre", "ielts", "toefl"],
        "recommended_spread": "decision",
        "recommended_mode": "combined",
        "iching_focus": "备考状态与临场发挥的时机",
        "iching_focus_en": "Preparation state and exam-day timing",
        "tarot_focus": "心理状态、竞争环境与潜在变数",
        "tarot_focus_en": "Psychological state, competition, and hidden variables",
        "synergy_prompt": "东方看天时学运，西方看心理准备",
        "synergy_prompt_en": "Eastern: cosmic timing for study; Western: psychological readiness",
    },
    "study": {
        "keywords_zh": ["选专业", "转专业", "读博", "留学", "报班", "学什么", "考研方向",
                        "导师", "论文", "毕业", "选课", "进修", "培训", "技能"],
        "keywords_en": ["major", "study", "phd", "abroad", "course", "learn", "skill",
                        "training", "mentor", "thesis"],
        "recommended_spread": "decision",
        "recommended_mode": "combined",
        "iching_focus": "学业方向与长远发展的契合度",
        "iching_focus_en": "Alignment between study direction and long-term development",
        "tarot_focus": "兴趣天赋与外部环境的平衡",
        "tarot_focus_en": "Balance between passion, talent, and external environment",
        "synergy_prompt": "东方看方向大势，西方看内心驱动",
        "synergy_prompt_en": "Eastern: macro direction; Western: inner motivation",
    },
    "travel": {
        "keywords_zh": ["出差", "旅行", "搬家", "出行", "签证", "出行安全", "回国",
                        "航班", "机票", "自驾", "出国", "迁徙"],
        "keywords_en": ["travel", "trip", "move", "flight", "visa", "relocate",
                        "abroad", "journey", "drive", "relocation"],
        "recommended_spread": "horseshoe",
        "recommended_mode": "combined",
        "iching_focus": "出行的时机吉凶与方位宜忌",
        "iching_focus_en": "Travel timing and directional fortune",
        "tarot_focus": "旅途中的变数与安全因素",
        "tarot_focus_en": "Journey variables and safety factors",
        "synergy_prompt": "东方看天时方位，西方看旅途细节",
        "synergy_prompt_en": "Eastern: timing and direction; Western: journey details",
    },
    "legal": {
        "keywords_zh": ["官司", "仲裁", "维权", "合同", "起诉", "纠纷", "诉讼",
                        "赔偿", "违约", "知识产权", "侵权", "被告", "原告"],
        "keywords_en": ["lawsuit", "court", "legal", "contract", "sue", "arbitration",
                        "dispute", "settlement", " attorney"],
        "recommended_spread": "decision",
        "recommended_mode": "combined",
        "iching_focus": "讼事走向与公正天平",
        "iching_focus_en": "Legal trajectory and the scales of justice",
        "tarot_focus": "对方法的真实立场与隐藏因素",
        "tarot_focus_en": "True positions and hidden factors of both parties",
        "synergy_prompt": "东方看理势因果，西方看人心博弈",
        "synergy_prompt_en": "Eastern: cosmic justice; Western: human strategy",
    },
    "general": {
        "keywords_zh": [],
        "keywords_en": [],
        "recommended_spread": "three_card",
        "recommended_mode": "combined",
        "iching_focus": "事情的整体走向",
        "iching_focus_en": "Overall direction",
        "tarot_focus": "当下能量与潜在影响",
        "tarot_focus_en": "Current energy and potential influences",
        "synergy_prompt": "全维度综合解读",
        "synergy_prompt_en": "Holistic multi-dimensional reading",
    },
}


# ============================================================
# 动态五维评分维度 — 每种问题类型有不同的 5 个维度标签
# ============================================================
DYNAMIC_DIMENSIONS: Dict[str, list] = {
    "career": ["career", "relationship", "finance", "health", "timing"],
    "exam":   ["performance", "preparation", "competition", "mindset", "timing"],
    "study":  ["direction", "passion", "opportunity", "difficulty", "timing"],
    "finance": ["finance", "risk", "timing", "growth", "stability"],
    "relationship": ["harmony", "commitment", "passion", "stability", "timing"],
    "health": ["health", "recovery", "energy", "mindset", "timing"],
    "travel": ["safety", "timing", "smoothness", "opportunity", "cost"],
    "legal": ["justice", "evidence", "timing", "opponent", "outcome"],
    "decision": ["clarity", "risk", "opportunity", "support", "timing"],
    "general": ["career", "relationship", "finance", "health", "timing"],
}

# 每种维度的中英文标签
DIMENSION_LABELS: Dict[str, Dict[str, str]] = {
    # 基础
    "career":      {"label": "事业", "label_en": "Career"},
    "relationship":{"label": "感情", "label_en": "Relationship"},
    "finance":     {"label": "财运", "label_en": "Finance"},
    "health":      {"label": "健康", "label_en": "Health"},
    "timing":      {"label": "时机", "label_en": "Timing"},
    # 考试
    "performance": {"label": "发挥", "label_en": "Performance"},
    "preparation": {"label": "准备", "label_en": "Preparation"},
    "competition": {"label": "竞争", "label_en": "Competition"},
    "mindset":     {"label": "心态", "label_en": "Mindset"},
    # 学业
    "direction":   {"label": "方向", "label_en": "Direction"},
    "passion":     {"label": "热情", "label_en": "Passion"},
    "opportunity": {"label": "机遇", "label_en": "Opportunity"},
    "difficulty":  {"label": "难度", "label_en": "Difficulty"},
    # 财务
    "risk":        {"label": "风险", "label_en": "Risk"},
    "growth":      {"label": "增长", "label_en": "Growth"},
    "stability":   {"label": "稳定", "label_en": "Stability"},
    # 感情
    "harmony":     {"label": "和谐", "label_en": "Harmony"},
    "commitment":  {"label": "承诺", "label_en": "Commitment"},
    # 健康
    "recovery":    {"label": "康复", "label_en": "Recovery"},
    "energy":      {"label": "精力", "label_en": "Energy"},
    # 出行
    "safety":      {"label": "安全", "label_en": "Safety"},
    "smoothness":  {"label": "顺利", "label_en": "Smoothness"},
    "cost":        {"label": "开销", "label_en": "Cost"},
    # 法律
    "justice":     {"label": "理据", "label_en": "Justice"},
    "evidence":    {"label": "证据", "label_en": "Evidence"},
    "opponent":    {"label": "对手", "label_en": "Opponent"},
    "outcome":     {"label": "结局", "label_en": "Outcome"},
    # 决策
    "clarity":     {"label": "清晰", "label_en": "Clarity"},
    "support":     {"label": "助力", "label_en": "Support"},
}


def get_dimensions_for_type(qtype: str) -> list:
    """返回某个问题类型的 5 个维度 key 列表"""
    return DYNAMIC_DIMENSIONS.get(qtype, DYNAMIC_DIMENSIONS["general"])


def classify_question(question: str) -> Dict:
    """
    分析问题，返回推荐的占卜配置。
    根据关键词匹配多个类型，取命中关键词最多的类型。

    Returns:
        包含 type, recommended_spread, recommended_mode, iching_focus, tarot_focus, synergy_prompt
    """
    if not question:
        return {"type": "general", **QUESTION_TYPES["general"]}

    q = question.lower()
    best_type = "general"
    best_score = 0
    matched_keywords = []

    for qtype, config in QUESTION_TYPES.items():
        if qtype == "general":
            continue
        # 中英文关键词都算
        all_keywords = config.get("keywords_zh", []) + config.get("keywords_en", [])
        score = 0
        matched = []
        for kw in all_keywords:
            if kw.lower() in q:
                score += 1
                matched.append(kw)
        if score > best_score:
            best_score = score
            best_type = qtype
            matched_keywords = matched

    return {
        "type": best_type,
        "matched_keywords": matched_keywords,
        **QUESTION_TYPES[best_type],
    }


if __name__ == "__main__":
    import json
    test_questions = [
        "我该跳槽吗",
        "近期面试能否通过",
        "我和前男友还能复合吗",
        "这支股票该加仓吗",
        "最近总是失眠",
        "我应该开始学 Python 吗",
        "明天天气怎么样",
    ]
    for q in test_questions:
        r = classify_question(q)
        print(f"  「{q}」 → {r['type']} (matched: {r.get('matched_keywords', [])})")
        print(f"     spread: {r['recommended_spread']}, mode: {r['recommended_mode']}")

_LN_WM = "4c3a8f2e7b1d9065a2c8e4f1b7d3096e8a5c2f4d"  # linmy666/latestname
