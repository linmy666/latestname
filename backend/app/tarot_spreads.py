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
Onyx - 塔罗牌阵体系
定义 6 种经典牌阵，每种牌阵有位置数量和位置语义
"""
from typing import Dict, List

TAROT_SPREADS: Dict[str, Dict] = {
    "single": {
        "name": "单张牌",
        "name_en": "Single Card",
        "card_count": 1,
        "positions": [
            {"position": 1, "label": "今日提示", "label_en": "Daily Guidance",
             "meaning": "宇宙此刻给你的信号"},
        ],
        "best_for": "日常指引、快速决策",
        "best_for_en": "Daily guidance, quick decisions",
    },
    "three_card": {
        "name": "三张牌·时间流",
        "name_en": "Three Card · Timeline",
        "card_count": 3,
        "positions": [
            {"position": 1, "label": "过去", "label_en": "Past",
             "meaning": "来因——为什么会走到今天"},
            {"position": 2, "label": "现在", "label_en": "Present",
             "meaning": "核心——当下的真实状态"},
            {"position": 3, "label": "未来", "label_en": "Future",
             "meaning": "走向——若顺此势发展的结果"},
        ],
        "best_for": "时间线问题（事情会怎么发展）",
        "best_for_en": "Timeline questions",
    },
    "celtic_cross": {
        "name": "凯尔特十字",
        "name_en": "Celtic Cross",
        "card_count": 10,
        "positions": [
            {"position": 1, "label": "核心", "label_en": "The Heart",
             "meaning": "事情的核心真相"},
            {"position": 2, "label": "阻碍", "label_en": "The Challenge",
             "meaning": "横亘在前的主要障碍"},
            {"position": 3, "label": "根基", "label_en": "Foundation",
             "meaning": "深层的潜意识动因"},
            {"position": 4, "label": "过往", "label_en": "Recent Past",
             "meaning": "近期已发生的影响"},
            {"position": 5, "label": "可能", "label_en": "Possible Outcome",
             "meaning": "可能的结果（可改变）"},
            {"position": 6, "label": "即将", "label_en": "Near Future",
             "meaning": "即将到来的事"},
            {"position": 7, "label": "自我", "label_en": "Your Position",
             "meaning": "你自己的态度和立场"},
            {"position": 8, "label": "环境", "label_en": "Environment",
             "meaning": "周围人和外部环境"},
            {"position": 9, "label": "希望", "label_en": "Hopes & Fears",
             "meaning": "内心的希望与恐惧"},
            {"position": 10, "label": "终局", "label_en": "Final Outcome",
             "meaning": "最终走向"},
        ],
        "best_for": "复杂问题的全面分析",
        "best_for_en": "Comprehensive analysis of complex issues",
    },
    "relationship": {
        "name": "关系牌阵",
        "name_en": "Relationship Spread",
        "card_count": 5,
        "positions": [
            {"position": 1, "label": "你自己", "label_en": "You",
             "meaning": "你在关系中的状态"},
            {"position": 2, "label": "对方", "label_en": "Partner",
             "meaning": "对方在关系中的状态"},
            {"position": 3, "label": "连接", "label_en": "Connection",
             "meaning": "你们之间的纽带"},
            {"position": 4, "label": "挑战", "label_en": "Challenge",
             "meaning": "关系中的核心矛盾"},
            {"position": 5, "label": "潜能", "label_en": "Potential",
             "meaning": "关系的发展方向"},
        ],
        "best_for": "感情/合作/人际关系问题",
        "best_for_en": "Love, partnership, interpersonal issues",
    },
    "decision": {
        "name": "抉择牌阵",
        "name_en": "Decision Spread",
        "card_count": 5,
        "positions": [
            {"position": 1, "label": "现状", "label_en": "Current",
             "meaning": "当下的处境"},
            {"position": 2, "label": "选项A", "label_en": "Path A",
             "meaning": "如果走这条路"},
            {"position": 3, "label": "选项B", "label_en": "Path B",
             "meaning": "如果走另一条路"},
            {"position": 4, "label": "关键", "label_en": "Key Factor",
             "meaning": "决策的核心因素"},
            {"position": 5, "label": "建议", "label_en": "Advice",
             "meaning": "宇宙的建议"},
        ],
        "best_for": "二选一的决策（该不该跳槽/分手/投资）",
        "best_for_en": "Two-option decisions",
    },
    "horseshoe": {
        "name": "马蹄铁牌阵",
        "name_en": "Horseshoe",
        "card_count": 7,
        "positions": [
            {"position": 1, "label": "过去", "label_en": "Past",
             "meaning": "影响当下的过去事件"},
            {"position": 2, "label": "现在", "label_en": "Present",
             "meaning": "当下的状况"},
            {"position": 3, "label": "隐藏", "label_en": "Hidden",
             "meaning": "你不知道的影响因素"},
            {"position": 4, "label": "阻碍", "label_en": "Obstacles",
             "meaning": "需要克服的障碍"},
            {"position": 5, "label": "环境", "label_en": "Environment",
             "meaning": "外部影响"},
            {"position": 6, "label": "建议", "label_en": "Advice",
             "meaning": "应该怎么做"},
            {"position": 7, "label": "结果", "label_en": "Outcome",
             "meaning": "如果遵循建议的结果"},
        ],
        "best_for": "中等复杂度的问题",
        "best_for_en": "Medium-complexity questions",
    },
}


def get_spread(spread_id: str) -> Dict:
    """根据 id 取牌阵定义，找不到默认三牌阵"""
    return TAROT_SPREADS.get(spread_id, TAROT_SPREADS["three_card"])


def list_spreads() -> List[Dict]:
    """列出所有牌阵（精简）"""
    return [{
        "id": k,
        "name": v["name"],
        "name_en": v["name_en"],
        "card_count": v["card_count"],
        "best_for": v["best_for"],
        "best_for_en": v["best_for_en"],
    } for k, v in TAROT_SPREADS.items()]


if __name__ == "__main__":
    import json
    print(json.dumps(list_spreads(), ensure_ascii=False, indent=2))

_LN_WM = "4c3a8f2e7b1d9065a2c8e4f1b7d3096e8a5c2f4d"  # linmy666/latestname
