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
Onyx 占卜核心算法模块
包含：易经金钱卦起卦、塔罗抽牌、东西方共振分析、卦变关系

v0.2 更新：
  - 修复可复现种子（时辰制，去掉 time.time 随机性）
  - 新增错卦/综卦/互卦计算
  - 共振分析增强：五行×元素×关键词三层
  - 动爻九/六命名由阴阳决定（修 bug）
  - 塔罗牌阵位置语义
"""

import json
import random
import hashlib
import datetime
from pathlib import Path
from typing import Optional


# ============================================================
# 数据加载
# ============================================================

_DATA_DIR = Path(__file__).parent.parent / "data"

_iching_data = None
_tarot_data = None
_iching_by_id = {}
_iching_by_binary = {}


def _load_data():
    global _iching_data, _tarot_data, _iching_by_id, _iching_by_binary
    if _iching_data is None:
        iching_path = _DATA_DIR / "iching.json"
        if iching_path.exists():
            with open(iching_path, encoding="utf-8") as f:
                _iching_data = json.load(f)
            for hexagram in _iching_data:
                _iching_by_binary[hexagram["binary"]] = hexagram
                _iching_by_id[hexagram["id"]] = hexagram
    if _tarot_data is None:
        tarot_path = _DATA_DIR / "tarot.json"
        if tarot_path.exists():
            with open(tarot_path, encoding="utf-8") as f:
                _tarot_data = json.load(f)


# ============================================================
# 种子生成（可复现：时辰制）
# ============================================================

# 地支时辰：子(23-1) 丑(1-3) 寅(3-5) 卯(5-7) 辰(7-9) 巳(9-11)
#           午(11-13) 未(13-15) 申(15-17) 酉(17-19) 戌(19-21) 亥(21-23)
_ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]


def _current_shichen(now: Optional[datetime.datetime] = None) -> str:
    """获取当前地支时辰（每两小时一个单位）。"""
    if now is None:
        now = datetime.datetime.now()
    hour = now.hour
    # 子时跨日：23-1点 → idx 0
    idx = ((hour + 1) // 2) % 12
    return _ZHI[idx]


def generate_seed(question: str, extra: Optional[str] = None,
                  now: Optional[datetime.datetime] = None) -> int:
    """
    根据问题+时辰生成种子，保证可复现：
    同一问题在同一地支时辰（约2小时）内结果一致。
    可通过 extra 传入"用户标识"进一步区分不同人。
    """
    shichen = _current_shichen(now)
    date_str = (now or datetime.datetime.now()).strftime("%Y-%m-%d")
    raw = f"{question}:{date_str}:{shichen}:{extra or ''}"
    h = hashlib.md5(raw.encode("utf-8")).hexdigest()
    return int(h[:8], 16)


# ============================================================
# 易经：金钱卦算法
# ============================================================

def coins_hexagram(seed: int) -> dict:
    """
    金钱卦起卦法：
    6爻，每爻抛3枚铜钱。正面(字)=3，反面(背)=2。
    之和：6=老阴(动)、7=少阳、8=少阴、9=老阳(动)
    """
    rng = random.Random(seed)

    lines = []        # 本卦6爻（从下到上），1=阳 0=阴
    changing = []     # 动爻位置（0-5）
    line_totals = []  # 每爻铜钱之和（6/7/8/9），用于确定九/六
    coin_throws = []  # 每爻三铜钱结果，供前端动画用

    for i in range(6):
        coins = [rng.choice([2, 3]) for _ in range(3)]
        coin_throws.append(coins)
        total = sum(coins)
        line_totals.append(total)

        if total == 6:       # 老阴 → 动爻，该爻为阴
            lines.append(0)
            changing.append(i)
        elif total == 7:     # 少阳 → 静爻，阳
            lines.append(1)
        elif total == 8:     # 少阴 → 静爻，阴
            lines.append(0)
        elif total == 9:     # 老阳 → 动爻，该爻为阳
            lines.append(1)
            changing.append(i)

    # 变卦：动爻阴阳互变
    changed_lines = lines[:]
    for pos in changing:
        changed_lines[pos] = 1 - changed_lines[pos]

    binary = ''.join(str(b) for b in lines)
    changed_binary = ''.join(str(b) for b in changed_lines) if changing else None

    _load_data()

    original = _iching_by_binary.get(binary)
    changed = _iching_by_binary.get(changed_binary) if changing else None

    # 计算卦变关系
    relations = compute_hexagram_relations(binary)

    # 动爻命名（九/六由该爻阴阳决定）
    yao_names = _format_yao_names(lines, changing)

    return {
        "binary": binary,
        "changed_binary": changed_binary,
        "original": _slim_hexagram(original),
        "changed": _slim_hexagram(changed) if changed else None,
        "changing_lines": changing,
        "yao_names": yao_names,  # ["初九", None, None, "六四", None, None] 等
        "has_transformation": len(changing) > 0,
        "coin_throws": coin_throws,
        "line_totals": line_totals,  # 供前端展示铜钱结果
        "relations": relations,      # 错卦/综卦/互卦
    }


def _format_yao_names(lines: list, changing: list) -> dict:
    """
    根据每爻阴阳生成传统爻名。
    位置（从下到上）：初/二/三/四/五/上
    阳爻=九，阴爻=六
    传统写法：
      - 初爻/上爻：前缀 + 九/六（如「初九」「上六」）
      - 中间四爻：九/六 + 位置（如「九二」「六三」，NOT「二九」）
    返回 {"0": "初九", ..., "5": "上九"} 全部6爻，并标记哪些是动爻。
    """
    positions = ["初", "二", "三", "四", "五", "上"]
    names = {}
    for i in range(6):
        yin_yang = "六" if lines[i] == 0 else "九"
        if i == 0 or i == 5:
            # 初爻/上爻：前缀 + 九/六
            names[str(i)] = positions[i] + yin_yang
        else:
            # 中间四爻：九/六 + 位置
            names[str(i)] = yin_yang + positions[i]
    names["changing"] = [positions[i] for i in changing]
    return names


def _slim_hexagram(h: Optional[dict]) -> Optional[dict]:
    """提取前端需要的卦象精简数据。"""
    if not h:
        return None
    return {
        "id": h["id"],
        "name": h["name"],
        "name_en": h.get("name_en", ""),
        "symbol": h.get("symbol", ""),
        "binary": h["binary"],
        "trigram_above": h.get("trigram_above", ""),
        "trigram_below": h.get("trigram_below", ""),
        "trigram_above_symbol": h.get("trigram_above_symbol", ""),
        "trigram_below_symbol": h.get("trigram_below_symbol", ""),
        "trigram_above_element": h.get("trigram_above_element", ""),
        "trigram_below_element": h.get("trigram_below_element", ""),
        "judgment": h.get("judgment", ""),
        "image": h.get("image", ""),
        "tuanshu": h.get("tuanshu", ""),
        "fortune": h.get("fortune", "中"),
        "keywords": h.get("keywords", []),
        "interpretation": h.get("interpretation", ""),
        "vernacular_judgment": h.get("vernacular_judgment", ""),
        "vernacular_image": h.get("vernacular_image", ""),
    }


# ============================================================
# 卦变关系：错卦 / 综卦 / 互卦
# ============================================================

def compute_hexagram_relations(binary: str) -> dict:
    """
    计算卦象的三种关系：
    - 错卦（旁通卦）：所有爻阴阳互换。代表"反面视角/对立面"。
    - 综卦（覆卦）：整个卦上下颠倒（0↔5, 1↔4, 2↔3）。代表"换位思考"。
    - 互卦：取2-3-4爻为新下卦，3-4-5爻为新上卦。代表"内在动因/隐藏趋势"。

    注意：乾/坤等8个纯卦，错卦/综卦可能等于自己。
    """
    _load_data()

    # 错卦：每位取反
    cuo_binary = ''.join('1' if b == '0' else '0' for b in binary)
    cuo = _iching_by_binary.get(cuo_binary)

    # 综卦：上下翻转（binary[0]是最下爻，翻过来后变最上爻）
    zong_binary = binary[::-1]
    zong = _iching_by_binary.get(zong_binary)

    # 互卦：下卦=2,3,4爻，上卦=3,4,5爻（0-indexed）
    # binary 从下到上：[0][1][2][3][4][5]
    # 新下卦 = lines[2][3][4]，新上卦 = lines[3][4][5]
    hu_binary = binary[2] + binary[3] + binary[4] + binary[3] + binary[4] + binary[5]
    hu = _iching_by_binary.get(hu_binary)

    def slim(h):
        if not h:
            return None
        return {"id": h["id"], "name": h["name"], "name_en": h.get("name_en", ""),
                "binary": h["binary"], "fortune": h.get("fortune", "中"),
                "keywords": h.get("keywords", [])}

    return {
        "cuo": {"label": "错卦", "label_en": "Opposition",
                "meaning": "对立面的视角——这件事从反面看是什么样",
                "hexagram": slim(cuo)},
        "zong": {"label": "综卦", "label_en": "Reversed",
                 "meaning": "换位思考——对方或另一角度看这件事",
                 "hexagram": slim(zong)},
        "hu": {"label": "互卦", "label_en": "Nucleus",
               "meaning": "内在动因——这件事底层的隐藏趋势",
               "hexagram": slim(hu)},
    }


# ============================================================
# 塔罗牌：Fisher-Yates 洗牌 + 位置语义
# ============================================================

# 三牌阵经典位置含义（过去/现在/未来）
_THREE_CARD_SPREAD = [
    {"position": 1, "label": "过去", "label_en": "Past", "meaning": "来因——为什么会走到今天"},
    {"position": 2, "label": "现在", "label_en": "Present", "meaning": "核心——当下的真实状态"},
    {"position": 3, "label": "未来", "label_en": "Future", "meaning": "走向——若顺此势发展的结果"},
]


def draw_tarot(count: int, seed: int, spread_positions: list = None) -> list:
    """
    抽取指定数量塔罗牌，含正逆位和位置语义。

    Args:
        count: 抽几张牌
        seed: 随机种子
        spread_positions: 位置语义列表（可选，v0.5-B 牌阵用）
    """
    rng = random.Random(seed)
    deck = list(range(78))
    rng.shuffle(deck)

    _load_data()

    result = []
    for i in range(count):
        card_idx = deck[i]
        reversed_flag = rng.choice([True, False])
        card = _tarot_data[card_idx] if _tarot_data and card_idx < len(_tarot_data) else None

        entry = {
            "deck_index": card_idx,
            "reversed": reversed_flag,
        }

        # 位置语义
        if spread_positions and i < len(spread_positions):
            entry["spread_position"] = spread_positions[i]
        elif count == 3 and i < len(_THREE_CARD_SPREAD):
            entry["spread_position"] = _THREE_CARD_SPREAD[i]
        elif count == 1:
            entry["spread_position"] = {"position": 1, "label": "核心", "label_en": "Core", "meaning": "当下的核心信息"}
        else:
            entry["spread_position"] = {"position": i + 1, "label": f"第{i+1}张", "label_en": f"Card {i+1}", "meaning": ""}

        if card:
            entry["card"] = {
                "id": card["id"],
                "name": card["name"],
                "name_cn": card["name_cn"],
                "arcana": card.get("arcana", ""),
                "suit": card.get("suit", ""),
                "keywords": card.get("keywords", []),
                "keywords_reversed": card.get("keywords_reversed", []),
                "upright_meaning": card.get("upright_meaning", ""),
                "reversed_meaning": card.get("reversed_meaning", ""),
                "element": card.get("element", ""),
            }
        result.append(entry)

    return result


def draw_tarot_candidates(positions: int, candidates_per_pos: int, seed: int) -> list:
    """
    为每个位置生成多张候选牌（牌面朝下），让用户「选牌」。
    返回结构：[{ position, label, label_en, meaning, candidates: [{deck_index, card}, ...] }, ...]

    Args:
        positions: 几个位置（默认3：过去/现在/未来）
        candidates_per_pos: 每个位置几张候选牌（默认3-5）
        seed: 随机种子
    """
    rng = random.Random(seed)
    deck = list(range(78))
    rng.shuffle(deck)

    _load_data()

    _spread = [
        {"position": 1, "label": "过去", "label_en": "Past", "meaning": "来因——为什么会走到今天"},
        {"position": 2, "label": "现在", "label_en": "Present", "meaning": "核心——当下的真实状态"},
        {"position": 3, "label": "未来", "label_en": "Future", "meaning": "走向——即将到来的趋势"},
    ]

    result = []
    idx = 0
    for i in range(positions):
        pos_info = _spread[i] if i < len(_spread) else {
            "position": i + 1, "label": f"第{i+1}张", "label_en": f"Card {i+1}", "meaning": ""
        }
        cands = []
        for j in range(candidates_per_pos):
            card_idx = deck[idx]
            idx += 1
            reversed_flag = rng.choice([True, False])
            card = _tarot_data[card_idx] if _tarot_data and card_idx < len(_tarot_data) else None
            entry = {
                "deck_index": card_idx,
                "reversed": reversed_flag,
            }
            if card:
                entry["card"] = {
                    "id": card["id"],
                    "name": card["name"],
                    "name_cn": card["name_cn"],
                    "arcana": card.get("arcana", ""),
                    "suit": card.get("suit", ""),
                    "keywords": card.get("keywords", []),
                    "keywords_reversed": card.get("keywords_reversed", []),
                    "upright_meaning": card.get("upright_meaning", ""),
                    "reversed_meaning": card.get("reversed_meaning", ""),
                    "element": card.get("element", ""),
                }
            cands.append(entry)
        result.append({
            "position": pos_info["position"],
            "label": pos_info["label"],
            "label_en": pos_info["label_en"],
            "meaning": pos_info["meaning"],
            "candidates": cands,
        })

    return result


# ============================================================
# 共振分析（增强版：主题 × 五行 × 元素 三层）
# ============================================================

_THEME_MAP = {
    "新起点": {"iching": [1, 24, 42, 3, 51], "tarot": [0, 19, 18, 1]},
    "冒险突破": {"iching": [43, 34, 14, 1, 21], "tarot": [0, 7, 11, 8]},
    "困难挑战": {"iching": [3, 29, 39, 47, 4, 33], "tarot": [12, 13, 15, 16, 10]},
    "等待时机": {"iching": [5, 20, 53, 9, 12, 23, 62], "tarot": [12, 9, 2, 4]},
    "沟通社交": {"iching": [13, 38, 58, 10, 17], "tarot": [6, 3, 17, 1, 14]},
    "财富丰盛": {"iching": [14, 26, 11, 42, 24, 34], "tarot": [10, 3, 19, 9]},
    "谦逊内省": {"iching": [15, 23, 52, 20, 36, 46], "tarot": [9, 12, 2, 18]},
    "变革转化": {"iching": [49, 50, 18, 17, 35], "tarot": [13, 16, 20, 0]},
    "爱情关系": {"iching": [31, 28, 37, 53, 54, 12, 44], "tarot": [6, 2, 11, 17]},
    "事业成就": {"iching": [14, 35, 50, 55, 46, 64], "tarot": [4, 10, 21, 19]},
    "智慧悟道": {"iching": [4, 23, 20, 48, 60, 61], "tarot": [2, 5, 9, 12]},
    "行动果断": {"iching": [1, 21, 34, 43, 14, 25], "tarot": [7, 8, 11, 16]},
    "和谐平衡": {"iching": [11, 61, 63, 13, 42, 58], "tarot": [11, 14, 19, 3, 10]},
    "危险警惕": {"iching": [6, 29, 39, 47, 28, 36, 44], "tarot": [13, 15, 16, 12, 18]},
    "旅行移动": {"iching": [56, 40, 17, 22, 37], "tarot": [6, 7, 18, 0]},
    "创造灵感": {"iching": [1, 50, 30, 22, 21], "tarot": [3, 17, 1, 11]},
    "结束完成": {"iching": [64, 63, 23, 49, 55], "tarot": [13, 20, 10, 21]},
    "学习成长": {"iching": [4, 20, 48, 26, 42, 46, 52], "tarot": [2, 5, 9, 17, 3]},
    "竞争博弈": {"iching": [6, 7, 29, 39, 47, 21, 44], "tarot": [7, 11, 15, 5, 16]},
    "稳定守成": {"iching": [11, 23, 52, 32, 62, 15], "tarot": [4, 10, 9, 14]},
    "释放放下": {"iching": [41, 23, 22, 49, 62, 36], "tarot": [13, 12, 16, 18]},
    "权威领导": {"iching": [1, 14, 21, 34, 43, 55, 7], "tarot": [4, 8, 11, 19]},
}

# 八卦五行映射
_TRIGRAM_ELEMENT = {
    "乾": "金", "兑": "金", "离": "火", "震": "木",
    "巽": "木", "坎": "水", "艮": "土", "坤": "土",
}

# 五行生克关系
_WUXING_SHENG = {"金": "水", "水": "木", "木": "火", "火": "土", "土": "金"}  # A生B
_WUXING_KE = {"金": "木", "木": "土", "土": "水", "水": "火", "火": "金"}    # A克B

# 塔罗花色→元素映射
_TAROT_SUIT_ELEMENT = {
    "wands": "火", "cups": "水", "swords": "风", "pentacles": "土",
}


def analyze_resonance(hexagram_ids: list, tarot_deck_indices: list,
                       hexagram_data: Optional[list] = None,
                       tarot_data: Optional[list] = None) -> dict:
    """
    三层共振分析：
    1. 主题共振（原有）：卦象与塔罗在主题表上的交集
    2. 五行/元素共振（新增）：卦象五行 × 塔罗元素的对应
    3. 关键词共振（新增）：卦象关键词 × 塔罗关键词的语义重叠

    hexagram_data/tarot_data: 完整的卦/牌数据（含五行/关键词），由调用方传入
    """
    _load_data()
    if hexagram_data is None:
        hexagram_data = _iching_data or []
    if tarot_data is None:
        tarot_data = _tarot_data or []

    # ---- 层1：主题共振 ----
    theme_resonances = []
    for theme, mapping in _THEME_MAP.items():
        hex_hits = sum(1 for h in hexagram_ids if h and h in mapping["iching"])
        tarot_major = [t for t in tarot_deck_indices if t < 22]
        tarot_hits = sum(1 for t in tarot_major if t in mapping["tarot"])

        if hex_hits > 0 and tarot_hits > 0:
            theme_resonances.append({
                "theme": theme,
                "strength": hex_hits + tarot_hits,
                "iching_match": hex_hits,
                "tarot_match": tarot_hits,
            })

    theme_resonances.sort(key=lambda x: x["strength"], reverse=True)
    primary_theme = theme_resonances[0] if theme_resonances else None

    # ---- 层2：五行/元素共振 ----
    element_resonances = _analyze_element_resonance(
        hexagram_ids, tarot_deck_indices, hexagram_data, tarot_data)

    # ---- 层3：关键词共振 ----
    keyword_resonances = _analyze_keyword_resonance(
        hexagram_ids, tarot_deck_indices, hexagram_data, tarot_data)

    # ---- 综合判定 ----
    theme_score = sum(t["strength"] for t in theme_resonances)
    element_score = element_resonances["score"]
    keyword_score = keyword_resonances["score"]
    total_score = theme_score * 3 + element_score * 2 + keyword_score

    if total_score >= 12 or (primary_theme and primary_theme["strength"] >= 3):
        resonance_type = "strong"
    elif total_score >= 5:
        resonance_type = "moderate"
    else:
        resonance_type = "subtle"

    if primary_theme:
        summary = (
            f"东西方占卜体系在此交汇于「{primary_theme['theme']}」——"
            f"卦象与牌阵同时指向这一核心信息，跨体系共振赋予其特别的力量。"
        )
    else:
        resonance_type = "subtle"
        summary = (
            "东西方体系呈现不同侧重：易经揭示结构性趋势，"
            "塔罗映射当下能量流动。此刻需要多维审视。"
        )

    # 加入元素层叙述
    if element_resonances["matches"]:
        em = element_resonances["matches"][0]
        summary += f" 五行与元素层面，{em['description']}。"

    return {
        "type": resonance_type,
        "primary_theme": primary_theme["theme"] if primary_theme else "多元",
        "themes": theme_resonances[:3],
        "element_resonance": element_resonances,
        "keyword_resonance": keyword_resonances,
        "total_score": total_score,
        "summary": summary,
    }


def _analyze_element_resonance(hexagram_ids, tarot_deck_indices,
                                 hexagram_data, tarot_data) -> dict:
    """五行（卦）× 元素（塔罗）共振分析。"""
    # 收集卦象的五行
    hex_elements = set()
    for hid in hexagram_ids:
        if hid:
            h = next((x for x in hexagram_data if x["id"] == hid), None)
            if h:
                for key in ("trigram_above_element", "trigram_below_element"):
                    val = h.get(key)
                    if val:
                        hex_elements.add(val)

    # 收集塔罗的元素
    tarot_elements = set()
    for idx in tarot_deck_indices:
        if tarot_data and idx < len(tarot_data):
            suit = tarot_data[idx].get("suit")
            elem = _TAROT_SUIT_ELEMENT.get(suit)
            if elem:
                tarot_elements.add(elem)
            # 大阿尔卡那也有 element 字段
            elem2 = tarot_data[idx].get("element")
            if elem2 and idx < 22:
                tarot_elements.add(elem2)

    # 映射：塔罗元素→近似五行（用于跨体系比较）
    tarot_to_wuxing = {"火": "火", "水": "水", "风": "木", "土": "土"}

    matches = []
    score = 0
    for he in hex_elements:
        for te in tarot_elements:
            tw = tarot_to_wuxing.get(te, te)
            if he == tw:
                matches.append({
                    "iching_element": he,
                    "tarot_element": te,
                    "relation": "同气",
                    "description": f"卦象「{he}」与塔罗「{te}」同气相求，能量共振强烈",
                })
                score += 2
            elif _WUXING_SHENG.get(he) == tw:
                matches.append({
                    "iching_element": he,
                    "tarot_element": te,
                    "relation": f"{he}生{tw}",
                    "description": f"卦象「{he}」生塔罗「{te}」，顺势滋养",
                })
                score += 1
            elif _WUXING_KE.get(he) == tw:
                matches.append({
                    "iching_element": he,
                    "tarot_element": te,
                    "relation": f"{he}克{tw}",
                    "description": f"卦象「{he}」克塔罗「{te}」，存在张力与制衡",
                })
                score += 1

    matches.sort(key=lambda x: 2 if x["relation"] == "同气" else 1, reverse=True)
    return {"matches": matches[:3], "score": score}


def _analyze_keyword_resonance(hexagram_ids, tarot_deck_indices,
                                 hexagram_data, tarot_data) -> dict:
    """卦象关键词 × 塔罗关键词的语义重叠分析。"""
    # 收集卦象关键词
    hex_kws = set()
    for hid in hexagram_ids:
        if hid:
            h = next((x for x in hexagram_data if x["id"] == hid), None)
            if h:
                for k in h.get("keywords", []):
                    hex_kws.add(k)

    # 收集塔罗关键词（正逆位都要）
    tarot_kws = set()
    for idx in tarot_deck_indices:
        if tarot_data and idx < len(tarot_data):
            card = tarot_data[idx]
            for k in card.get("keywords", []):
                tarot_kws.add(k)
            for k in card.get("keywords_reversed", []):
                tarot_kws.add(k)

    # 语义近似组（手工定义的高频跨体系映射）
    SEMANTIC_GROUPS = [
        {"name": "开创/新始", "hex": ["开创", "主动", "刚健", "启动", "新生", "开始"], "tarot": ["新开始", "自由", "冒险", "新起点", "机会", "灵感"]},
        {"name": "困难/阻滞", "hex": ["险阻", "困难", "困境", "阻滞", "危机", "险", "坎"], "tarot": ["困难", "阻滞", "结束", "困境", "束缚", "挑战", "灾难"]},
        {"name": "智慧/洞察", "hex": ["智慧", "洞察", "内省", "明辨", "观察", "悟", "思"], "tarot": ["智慧", "直觉", "内省", "洞察", "学习", "真相", "沉思"]},
        {"name": "财富/丰盛", "hex": ["丰盛", "财富", "富足", "聚", "蓄", "利", "收益", "丰收"], "tarot": ["丰盛", "富足", "成功", "繁荣", "丰收", "富饶", "稳定"]},
        {"name": "变革/转化", "hex": ["变革", "转化", "革新", "蜕变", "改", "革", "变"], "tarot": ["变革", "转化", "重生", "转变", "过渡", "觉醒", "新阶段"]},
        {"name": "行动/速度", "hex": ["行动", "果断", "进取", "决断", "迅速", "进", "往"], "tarot": ["行动", "速度", "快速", "进展", "决心", "勇气", "前进"]},
        {"name": "等待/蛰伏", "hex": ["等待", "蓄势", "蛰伏", "耐心", "迟", "缓", "守"], "tarot": ["等待", "耐心", "暂停", "休息", "冥想", "酝酿"]},
        {"name": "关系/和谐", "hex": ["和谐", "感", "聚", "和", "合", "亲", "感应"], "tarot": ["和谐", "爱", "结合", "伙伴", "情感", "共鸣", "结合"]},
        {"name": "警示/危险", "hex": ["警惕", "危险", "险", "败", "凶", "过", "失"], "tarot": ["警告", "危险", "背叛", "欺骗", "损失", "恐惧", "失控"]},
        {"name": "成功/成就", "hex": ["成功", "成就", "大利", "吉", "亨", "通", "达"], "tarot": ["成功", "胜利", "成就", "圆满", "世界", "凯旋"]},
    ]

    matches = []
    score = 0
    for group in SEMANTIC_GROUPS:
        hex_hit = any(k in hex_kws for k in group["hex"])
        tarot_hit = any(k in tarot_kws for k in group["tarot"])
        if hex_hit and tarot_hit:
            matches.append({
                "theme": group["name"],
                "hex_keywords": [k for k in group["hex"] if k in hex_kws],
                "tarot_keywords": [k for k in group["tarot"] if k in tarot_kws],
            })
            score += 1

    return {"matches": matches[:3], "score": score}


# ============================================================
# 五维度运势评分（借鉴 lifeline-k- 的评分体系）
# ============================================================

def compute_fortune_scores(hexagram: dict, tarot_cards: list,
                            question_type: str = "general") -> dict:
    """
    基于"已确认的占卜结果"（不是 AI 重新算）生成五维度运势评分（1-10）。
    v0.7: 维度跟随问题类型动态变化，且各维度有真正的差异。

    question_type: 来自 question_router.classify_question()['type']
    """
    from app.question_router import get_dimensions_for_type, DIMENSION_LABELS

    _load_data()

    # 基础分由卦象吉凶决定
    FORTUNE_BASE = {"大吉": 9, "吉": 7, "中": 5, "凶": 3, "大凶": 1}
    orig_hex = hexagram.get("original") or {}
    base = FORTUNE_BASE.get(orig_hex.get("fortune", "中"), 5)

    # 变卦的吉凶影响（有变卦说明事情会变化）
    changed = hexagram.get("changed")
    if changed:
        changed_fortune = FORTUNE_BASE.get(changed.get("fortune", "中"), 5)
        if changed_fortune > base:
            momentum = 1
        elif changed_fortune < base:
            momentum = -1
        else:
            momentum = 0
    else:
        momentum = 0

    # 塔罗正逆位影响
    upright_count = sum(1 for c in tarot_cards if not c.get("reversed"))
    reversed_count = len(tarot_cards) - upright_count
    tarot_modifier = (upright_count - reversed_count) * 0.5

    # 卦象不同方面提取（用于产生维度差异）
    changing_lines = hexagram.get("changing_lines", [])
    num_changing = len(changing_lines) if changing_lines else 0
    # 上下卦五行
    above_elem = orig_hex.get("trigram_above_element", "土")
    below_elem = orig_hex.get("trigram_below_element", "土")
    # 五行是否相生
    _WUXING_SHENG = {"金": "水", "水": "木", "木": "火", "火": "土", "土": "金"}
    elements_harmony = 1 if _WUXING_SHENG.get(below_elem) == above_elem else (-1 if _WUXING_SHENG.get(above_elem) == below_elem else 0)

    def clamp(x):
        return max(1, min(10, round(x)))

    # 获取该问题类型的 5 个维度 key
    dim_keys = get_dimensions_for_type(question_type)

    # 为每个维度生成不同的评分——通过组合不同的信号源产生差异
    scores = {}
    for i, dim_key in enumerate(dim_keys):
        # 信号源组合：base + 动量(不同权重) + 塔罗(不同权重) + 五行 + 动爻位置 + 扰动
        momentum_weight = [1.5, 0.3, 0.8, -0.5, 1.2][i % 5]
        tarot_weight = [0.5, 1.0, 0.3, 0.8, -0.3][i % 5]
        element_mod = elements_harmony * [0.5, 0.0, 1.0, -1.0, 0.3][i % 5]
        changing_mod = num_changing * [0.3, -0.4, 0.5, 0.0, -0.5][i % 5]
        # 位置扰动（确定性，基于维度名 hash — 用 hashlib 避免跨进程不一致）
        import hashlib as _hl
        pos_noise = (int(_hl.md5((dim_key + orig_hex.get("name", "")).encode()).hexdigest(), 16) % 3) - 1

        raw = base + momentum * momentum_weight + tarot_modifier * tarot_weight + element_mod + changing_mod + pos_noise
        scores[dim_key] = clamp(raw)

    # 组装输出
    result = {}
    for dim_key in dim_keys:
        labels = DIMENSION_LABELS.get(dim_key, {"label": dim_key, "label_en": dim_key})
        result[dim_key] = {
            "score": scores[dim_key],
            "label": labels["label"],
            "label_en": labels["label_en"],
        }

    return result


# ============================================================
# v0.6-A: 每日卦
# ============================================================

# 64 卦的「宜」「忌」建议库（基于 fortune 字段 + 卦象主题）
# 用模板生成 + 关键词挑选，确保每日不同（由卦象决定）
_YI_JI_TEMPLATES = {
    "大吉": {
        "yi": ["宜进取", "宜开创", "宜主动出击", "宜把握时机", "宜大胆尝试"],
        "ji": ["忌犹豫", "忌保守", "忌错失良机", "忌迟疑不决"],
        "tone": "顺"
    },
    "吉": {
        "yi": ["宜稳中求进", "宜适度行动", "宜借力而上", "宜积极沟通", "宜踏实推进"],
        "ji": ["忌冒进", "忌投机取巧", "忌与人争执", "忌过度承诺"],
        "tone": "顺"
    },
    "中": {
        "yi": ["宜观察", "宜蓄势", "宜反思", "宜小幅尝试", "宜守正待时"],
        "ji": ["忌大动", "忌冲动决策", "忌随波逐流", "忌意气用事"],
        "tone": "平"
    },
    "凶": {
        "yi": ["宜守", "宜退", "宜反思", "宜低调", "宜整理内务"],
        "ji": ["忌冒进", "忌争执", "忌冒险", "忌重大决策", "忌借贷"],
        "tone": "逆"
    },
    "大凶": {
        "yi": ["宜静", "宜养", "宜避", "宜求稳", "宜求助"],
        "ji": ["忌动", "忌争", "忌贪", "忌远行", "忌重大承诺"],
        "tone": "逆"
    },
}


def _pick_yi_ji(hex_name: str, fortune: str, seed: int) -> dict:
    """基于卦名+fortune+种子挑一组宜/忌（每日稳定但每日不同）"""
    rng = random.Random(seed)
    template = _YI_JI_TEMPLATES.get(fortune, _YI_JI_TEMPLATES["中"])
    # 用卦名 + fortune + seed 哈希选宜/忌项（hashlib 保证跨进程一致）
    import hashlib as _hl
    h = int(_hl.md5(f"{hex_name}{fortune}{seed}".encode()).hexdigest(), 16)
    yi_options = template["yi"]
    ji_options = template["ji"]
    yi_pick = yi_options[h % len(yi_options)]
    ji_pick = ji_options[(h + 1) % len(ji_options)]
    return {
        "yi": yi_pick,
        "ji": ji_pick,
        "tone": template["tone"],
    }


def daily_hexagram(date: datetime.date) -> dict:
    """
    每日一卦：基于日期生成稳定种子，从 64 卦中挑 1 卦。
    同一天所有人看到同一卦；不同天不同卦。
    """
    seed = int(date.strftime("%Y%m%d"))
    _load_data()
    if not _iching_data:
        return {"error": "卦象数据未加载"}
    # 选卦
    rng = random.Random(seed)
    hex_obj = rng.choice(_iching_data)
    # 动爻：3 枚铜钱法
    lines = []
    changing = []
    for _ in range(6):
        total = sum(rng.choice([2, 3]) for _ in range(3))
        if total in (6, 9):
            lines.append(0 if total == 6 else 1)
            changing.append(_)
        else:
            lines.append(1 if total == 7 else 0)
    # 宜忌
    yi_ji = _pick_yi_ji(hex_obj["name"], hex_obj.get("fortune", "中"), seed)
    # 简短解读（取卦辞 + image 第一行）
    short_message = hex_obj.get("judgment", "").split("。")[0] + "。" if hex_obj.get("judgment") else hex_obj.get("interpretation", "")
    return {
        "date": date.isoformat(),
        "seed": seed,
        "hexagram": attach_yao_lines(_slim_hexagram(hex_obj)),
        "changing_lines": changing,
        "yi_ji": yi_ji,
        "short_message": short_message,
    }


def attach_yao_lines(hex_obj):
    """v0.5-D + v0.6: 为卦对象附加 6 爻爻辞原文（公有领域《周易》）。
    divination.py 内置 helper，避免 main.py/divination.py 循环引用。
    """
    if not hex_obj or not isinstance(hex_obj, dict):
        return hex_obj
    name = hex_obj.get("name", "")
    binary = hex_obj.get("binary", "")
    if name and binary and len(binary) == 6:
        # 内部调用 yao_data——divination.py 已独立，无循环
        from app.yao_data import get_all_yao_for_hex
        yao_list = get_all_yao_for_hex(name, binary)
        hex_obj = {**hex_obj, "yao_lines": yao_list}
    return hex_obj


# ============================================================
# v0.7: 叩玄结论卡 TL;DR — 确定性生成一句话结论
# ============================================================

# 趋势词
_VERDICT_TREND = {
    "大吉": "势如破竹", "吉": "吉星高照", "中": "平中见机", "凶": "逆风前行", "大凶": "慎之又慎",
}

# 行动建议模板（按问题类型 × 卦象吉凶）
_ACTION_TEMPLATES = {
    "career": {
        "positive": ["把握机会，主动出击", "顺势而为，展现能力", "贵人相助，大胆推进"],
        "neutral":  ["稳扎稳打，以静制动", "等待时机，蓄势待发", "审查全局，谋定后动"],
        "negative": ["韬光养晦，不急于求成", "规避风险，三思后行", "低调行事，避免冲突"],
    },
    "exam": {
        "positive": ["临场发挥出色，信心是关键", "准备充分，发挥稳定", "思路清晰，注意审题"],
        "neutral":  ["放平心态，正常发挥", "抓住重点，有的放矢", "不骄不躁，稳中求胜"],
        "negative": ["调整心态，避免焦虑", "检查细节，防止粗心", "做好备选，放长线钓大鱼"],
    },
    "study": {
        "positive": ["方向正确，全力以赴", "兴趣天赋俱佳，大胆深入", "良师益友相助，善用资源"],
        "neutral":  ["多方考量，不急于定论", "打好基础，再择方向", "兼顾现实与理想"],
        "negative": ["重新审视方向，勿盲目投入", "补充短板再出发", "考虑替代方案"],
    },
    "finance": {
        "positive": ["财运亨通，果断布局", "稳健增值，长期持有", "机遇显现，适度加仓"],
        "neutral":  ["观望为主，伺机而动", "分散风险，不押单注", "控制欲望，理性决策"],
        "negative": ["及时止损，保存实力", "远离投机，回归本业", "等待拐点，不抄底"],
    },
    "relationship": {
        "positive": ["真诚沟通，主动表达", "缘分深厚，珍惜眼前", "制造浪漫，升华感情"],
        "neutral":  ["给予空间，顺其自然", "坦诚对话，化解误会", "耐心等待，不操之过急"],
        "negative": ["冷静处理，避免冲动", "反省自身，先做好自己", "学会放手，不强求"],
    },
    "health": {
        "positive": ["身体向好，保持习惯", "休养生息，元气恢复", "积极调理，事半功倍"],
        "neutral":  ["规律作息，适度运动", "关注身心平衡", "预防为主，定期检查"],
        "negative": ["及时就医，不讳疾忌医", "放慢节奏，减少压力", "调整情绪，避免内耗"],
    },
    "travel": {
        "positive": ["出行顺利，一路平安", "机缘巧合，收获满满", "说走就走，不负好时光"],
        "neutral":  ["做好攻略，有备无患", "灵活变通，随遇而安", "注意天气和交通"],
        "negative": ["暂缓行程，另择吉日", "注意安全，做好预案", "减少长途，就近为宜"],
    },
    "legal": {
        "positive": ["理据充分，胜算颇大", "正义在握，据理力争", "和解有利，速战速决"],
        "neutral":  ["证据为王，充分准备", "寻求专业意见", "权衡利弊，考虑调解"],
        "negative": ["避其锋芒，策略周旋", "控制损失，做最坏打算", "寻求和解，减少对抗"],
    },
    "decision": {
        "positive": ["当机立断，不再犹豫", "内心已有答案，信任直觉", "条件成熟，立即行动"],
        "neutral":  ["搜集更多信息，再定夺", "列出优劣对比表", "给自己设定 deadline"],
        "negative": ["暂缓决定，等待转机", "听从长者或专业人士建议", "不做比做错更好"],
    },
    "general": {
        "positive": ["把握当下，顺势而为", "贵人运旺，广结善缘", "心想事成，放手去做"],
        "neutral":  ["静观其变，以不变应万变", "内省自照，理清脉络", "小事可为，大事从长"],
        "negative": ["收敛锋芒，厚积薄发", "谨慎行事，防患未然", "退一步海阔天空"],
    },
}

def _get_action_bucket(fortune: str, momentum: int) -> str:
    """返回 positive/neutral/negative"""
    if fortune in ("大吉", "吉"):
        return "positive"
    if fortune in ("凶", "大凶"):
        return "negative"
    # 中
    if momentum > 0:
        return "positive"
    elif momentum < 0:
        return "negative"
    return "neutral"


def generate_verdict(hexagram: dict, resonance: dict, fortune_scores: dict,
                     question_type: str = "general", question: str = "") -> dict:
    """
    v0.7: 生成确定性的一句话结论（TL;DR），无需 AI。
    输出 3 行：整体趋势 + 核心提示 + 最佳行动。
    """
    _load_data()

    orig = hexagram.get("original") or {}
    changed = hexagram.get("changed")
    fortune = orig.get("fortune", "中")

    # momentum
    FORTUNE_BASE = {"大吉": 9, "吉": 7, "中": 5, "凶": 3, "大凶": 1}
    base = FORTUNE_BASE.get(fortune, 5)
    changed_fortune_val = FORTUNE_BASE.get(changed.get("fortune", "中"), 5) if changed else base
    momentum = 1 if changed_fortune_val > base else (-1 if changed_fortune_val < base else 0)

    # 整体趋势
    trend_word = _VERDICT_TREND.get(fortune, "平稳")
    if changed and momentum > 0:
        trend_word += f"，{orig.get('name', '')}→{changed.get('name', '')} 损极泰来"
    elif changed and momentum < 0:
        trend_word += f"，{orig.get('name', '')}→{changed.get('name', '')} 盛极而衰"

    # 核心提示（来自卦象关键词 + interpretation 首句）
    keywords = orig.get("keywords", [])
    interp = orig.get("interpretation", "")
    core_hint = interp.split("。")[0] + "。" if interp and "。" in interp else (interp[:30] if interp else "")

    # 最佳行动
    bucket = _get_action_bucket(fortune, momentum)
    actions = _ACTION_TEMPLATES.get(question_type, _ACTION_TEMPLATES["general"]).get(bucket, _ACTION_TEMPLATES["general"]["neutral"])
    # 用 seed-like 确定性选择
    import hashlib
    seed_str = f"{orig.get('name','')}{question}{fortune}"
    pick = int(hashlib.md5(seed_str.encode()).hexdigest(), 16) % len(actions)
    best_action = actions[pick]

    # 共振信息
    res_type = resonance.get("type", "subtle")
    res_theme = resonance.get("primary_theme", "多元")
    if res_type == "strong":
        res_note = f"东西方共振强烈（「{res_theme}」），方向明确"
    elif res_type == "moderate":
        res_note = f"东西方有中等共振（「{res_theme}」），多角度印证"
    else:
        res_note = "东西方各有所见，需多维审视"

    return {
        "trend": trend_word,
        "fortune": fortune,
        "hexagram_name": orig.get("name", ""),
        "changed_name": changed.get("name", "") if changed else "",
        "core_hint": core_hint,
        "best_action": best_action,
        "resonance_note": res_note,
        "resonance_level": res_type,
        "question_type": question_type,
    }


# ============================================================
# v6: 卦象深度分析 — 无需 LLM 的确定性算法分析
# ============================================================

# 八卦属性表
_BAGUA_ATTRS = {
    "乾": {"nature": "天", "element": "金", "direction": "西北", "season": "秋冬之交",
            "family": "父亲", "body": "头", "trait": "刚健", "animal": "马"},
    "坤": {"nature": "地", "element": "土", "direction": "西南", "season": "夏秋之交",
            "family": "母亲", "body": "腹", "trait": "柔顺", "animal": "牛"},
    "震": {"nature": "雷", "element": "木", "direction": "东", "season": "春",
            "family": "长男", "body": "足", "trait": "震动", "animal": "龙"},
    "巽": {"nature": "风", "element": "木", "direction": "东南", "season": "春夏之交",
            "family": "长女", "body": "股", "trait": "渗透", "animal": "鸡"},
    "坎": {"nature": "水", "element": "水", "direction": "北", "season": "冬",
            "family": "中男", "body": "耳", "trait": "险陷", "animal": "豕"},
    "离": {"nature": "火", "element": "火", "direction": "南", "season": "夏",
            "family": "中女", "body": "目", "trait": "附丽", "animal": "雉"},
    "艮": {"nature": "山", "element": "土", "direction": "东北", "season": "冬春之交",
            "family": "少男", "body": "手", "trait": "静止", "animal": "狗"},
    "兑": {"nature": "泽", "element": "金", "direction": "西", "season": "秋",
            "family": "少女", "body": "口", "trait": "喜悦", "animal": "羊"},
}

# 五行生克
_WX_SHENG = {"金": "水", "水": "木", "木": "火", "火": "土", "土": "金"}  # 生
_WX_KE = {"金": "木", "木": "土", "土": "水", "水": "火", "火": "金"}     # 克

# 动爻位置含义
_CHANGING_LINE_MEANING = {
    0: "初爻动 — 事情刚起步，根基有变。注意最初的决定和行动。",
    1: "二爻动 — 内在核心在变，关键人物或内在因素发生变化。",
    2: "三爻动 — 过程中的波折与调整，需注意执行层面的变数。",
    3: "四爻动 — 接近权力中心，外部环境和位置在变。",
    4: "五爻动 — 核心地位有变，主要决策者或领导层变化。",
    5: "上爻动 — 结果与终局有变，事物发展到尾声时的转折。",
}

# 卦象位置吉凶（当位/不当位）
def _is_proper(lines: list, pos: int) -> bool:
    """阳爻在奇数位(1,3,5)、阴爻在偶数位(0,2,4)为当位。"""
    is_yang = lines[pos] == 1
    # pos 0=初(奇), 1=二(偶), 2=三(奇), 3=四(偶), 4=五(奇), 5=上(偶)
    odd_pos = pos in (0, 2, 4)
    return (is_yang and odd_pos) or (not is_yang and not odd_pos)

# 中正判定
def _is_central(pos: int) -> bool:
    """二爻和五爻为得中。"""
    return pos in (1, 4)

def analyze_hexagram(hexagram: dict, tarot_cards: list = None) -> dict:
    """
    v6: 卦象深度分析 — 完全确定性算法，无需 LLM。
    输出：五行生克、当位/得中、动爻深度、上下卦互动、爻位分析。
    v6.1: 新增塔罗牌交叉分析（元素共振、正逆位平衡、叙事弧线）。
    tarot_cards: combined 端点的 tarot 数组，可选。
    """
    _load_data()

    lines = [int(c) for c in hexagram.get("binary", "000000")]
    changing = hexagram.get("changing_lines", [])
    orig = hexagram.get("original") or {}
    changed = hexagram.get("changed")

    above_trigram = orig.get("trigram_above", "")
    below_trigram = orig.get("trigram_below", "")
    # 数据库存的是自然属性(天/地/雷/风/水/火/山/泽)，需转为五行(金/木/水/火/土)
    _NATURE_TO_WX = {"天": "金", "地": "土", "雷": "木", "风": "木", "水": "水", "火": "火", "山": "土", "泽": "金"}
    above_nature_raw = orig.get("trigram_above_element", "")
    below_nature_raw = orig.get("trigram_below_element", "")
    above_elem = _NATURE_TO_WX.get(above_nature_raw, above_nature_raw)
    below_elem = _NATURE_TO_WX.get(below_nature_raw, below_nature_raw)

    # 1. 五行生克分析
    wx_relation = "比和"
    wx_detail = ""
    if above_elem and below_elem:
        if _WX_SHENG.get(below_elem) == above_elem:
            wx_relation = f"下卦{below_elem}生上卦{above_elem}"
            wx_detail = "内养外，内在实力支撑外在表现。根基扎实，发展有望。"
        elif _WX_SHENG.get(above_elem) == below_elem:
            wx_relation = f"上卦{above_elem}生下卦{below_elem}"
            wx_detail = "外养内，外部条件滋养内部根基。得贵人或环境助力。"
        elif _WX_KE.get(below_elem) == above_elem:
            wx_relation = f"下卦{below_elem}克上卦{above_elem}"
            wx_detail = "内制外，内在实力足以制约外部挑战。主动权在己。"
        elif _WX_KE.get(above_elem) == below_elem:
            wx_relation = f"上卦{above_elem}克下卦{below_elem}"
            wx_detail = "外制内，外部压力制约内部发展。需忍耐或调整策略。"
        elif above_elem == below_elem:
            wx_relation = f"{above_elem}与{below_elem}比和"
            wx_detail = "上下卦五行一致，内外协调，力量集中。"

    # 2. 当位分析
    proper_lines = []
    improper_lines = []
    for i in range(6):
        if _is_proper(lines, i):
            proper_lines.append(i)
        else:
            improper_lines.append(i)

    # 3. 得中分析
    central_lines = [i for i in range(6) if _is_central(i)]
    central_proper = [i for i in central_lines if _is_proper(lines, i)]

    # 4. 动爻深度分析
    changing_analysis = []
    for pos in changing:
        proper = _is_proper(lines, pos)
        central = _is_central(pos)
        yao_name = ["初", "二", "三", "四", "五", "上"][pos]
        detail = _CHANGING_LINE_MEANING.get(pos, "")
        significance = ""
        if central and proper:
            significance = "此爻既得中又当位，变化影响重大——核心位置的核心转变。"
        elif central:
            significance = "此爻得中但不当位，核心位置的变化需要调整以归正道。"
        elif proper:
            significance = "此爻当位但非中位，正常位置的变化，影响可控。"
        else:
            significance = "此爻不当位不居中，变化反映出需要修正的偏差。"
        changing_analysis.append({
            "position": yao_name,
            "index": pos,
            "is_proper": proper,
            "is_central": central,
            "detail": detail,
            "significance": significance,
            "original_yao": "阳" if lines[pos] == 1 else "阴",
            "changing_to": "阴" if lines[pos] == 1 else "阳",
        })

    # 5. 上下卦互动分析
    above_attrs = _BAGUA_ATTRS.get(above_trigram, {})
    below_attrs = _BAGUA_ATTRS.get(below_trigram, {})
    trigram_interaction = ""
    if above_attrs and below_attrs:
        above_nature = above_attrs.get("nature", "")
        below_nature = below_attrs.get("nature", "")
        above_trait = above_attrs.get("trait", "")
        below_trait = below_attrs.get("trait", "")
        trigram_interaction = (
            f"下卦「{below_trigram}」为{below_nature}，性{below_trait}；"
            f"上卦「{above_trigram}」为{above_nature}，性{above_trait}。"
            f"{below_nature}在下、{above_nature}在上，"
        )
        # 常见组合解读
        combos = {
            ("天", "地"): "天道覆育万物、地道承载万物的格局。",
            ("地", "天"): "地气上升、天气下降，天地交泰之象。",
            ("水", "火"): "水火相交，既济则成、未济则险。",
            ("火", "水"): "火在水上，分离不交，需防矛盾激化。",
            ("雷", "风"): "风雷激荡，行动力强劲。",
            ("风", "雷"): "风在雷上，柔性传播中蕴含爆发。",
            ("山", "泽"): "山泽通气，阴阳调和。",
            ("泽", "山"): "泽在山上，高处有润，贵人相扶。",
            ("天", "水"): "天水上行，需要积蓄而后发。",
            ("水", "地"): "水润大地，潜移默化。",
            ("地", "水"): "地中有水，暗藏实力。",
            ("山", "火"): "山下有火，光明被阻，需耐心等待。",
            ("火", "山"): "火在山上，明察秋毫、顺势而行。",
            ("雷", "地"): "雷在地中，阳气初动、蓄势待发。",
            ("地", "雷"): "地下有雷，暗中行动、时机将至。",
            ("天", "风"): "天风浩荡，刚柔相济、通行无阻。",
            ("风", "天"): "风行天上，柔性力量蓄积待发。",
            ("泽", "水"): "泽中有水，聚而不散、节制有度。",
            ("水", "泽"): "水在泽中，深藏不露、量力而行。",
            ("火", "风"): "火在风上，风助火势、顺势而为。",
            ("风", "火"): "风在火上，齐心协力、众人拾柴。",
            ("雷", "水"): "雷在水中，暗中蓄力、待机而动。",
            ("水", "雷"): "水在雷上，险中有动、需谨慎前行。",
            ("天", "山"): "天在山上，高远志向、脚踏实地。",
            ("山", "天"): "山在天上，积蓄力量、志存高远。",
        }
        combo_desc = combos.get((below_nature, above_nature), f"{below_nature}与{above_nature}的组合，蕴含独特意象。")
        trigram_interaction += combo_desc

    # 6. 爻位整体格局
    yang_count = sum(lines)
    yin_count = 6 - yang_count
    pattern = ""
    if yang_count >= 5:
        pattern = "阳盛 — 刚健过重，需防过刚易折。"
    elif yang_count <= 1:
        pattern = "阴盛 — 柔顺偏重，需防优柔寡断。"
    elif yang_count == 3:
        pattern = "阴阳平衡 — 刚柔并济，最为稳健。"
    elif yang_count > yin_count:
        pattern = "阳多于阴 — 偏刚健主动，行动力强。"
    else:
        pattern = "阴多于阳 — 偏柔顺含蓄，宜以静制动。"

    # 7. 变卦趋势
    transformation_trend = ""
    if changed:
        orig_fortune = orig.get("fortune", "中")
        changed_fortune = changed.get("fortune", "中")
        FORTUNE_RANK = {"大凶": 1, "凶": 3, "中": 5, "吉": 7, "大吉": 9}
        orig_rank = FORTUNE_RANK.get(orig_fortune, 5)
        changed_rank = FORTUNE_RANK.get(changed_fortune, 5)
        if changed_rank > orig_rank:
            transformation_trend = f"由「{orig.get('name')}」变「{changed.get('name')}」，吉凶上升——损极泰来，趋势向好。"
        elif changed_rank < orig_rank:
            transformation_trend = f"由「{orig.get('name')}」变「{changed.get('name')}」，吉凶下降——盛极而衰，需防微杜渐。"
        else:
            transformation_trend = f"由「{orig.get('name')}」变「{changed.get('name')}」，吉凶持平——表里如一，维持现状。"
    else:
        transformation_trend = "无动爻，卦象纯粹——此刻的状态稳定，没有明显的转折信号。"

    # 8. 最佳建议（确定性）
    FORTUNE_BASE = {"大吉": 9, "吉": 7, "中": 5, "凶": 3, "大凶": 1}
    fortune = orig.get("fortune", "中")
    base_score = FORTUNE_BASE.get(fortune, 5)

    advice_items = []
    if base_score >= 7:
        advice_items.append("当前运势有利，适合推进重要计划")
    elif base_score <= 3:
        advice_items.append("当前运势不利，以守为攻，不宜冒进")
    else:
        advice_items.append("运势平平，宜在稳中寻找突破口")

    if wx_relation and ("生" in wx_relation):
        advice_items.append("五行相生，内外力量协调，可借助外部资源")
    elif "克" in wx_relation:
        advice_items.append("五行相克，内外有矛盾，需化解冲突")

    if central_proper:
        advice_items.append("核心爻位得中当位，决策方向正确，信任自己的判断")
    elif improper_lines and (1 in improper_lines or 4 in improper_lines):
        advice_items.append("核心爻位有偏，需寻求中正之道，听取不同意见")

    if changing:
        if len(changing) >= 3:
            advice_items.append("动爻较多，变数大——做好多手准备，灵活应对")
        else:
            advice_items.append("动爻少而精——变数集中在特定环节，重点关注")

    # ============================================================
    # v7: 稀有度 & 大白话解读
    # ============================================================
    rarity = _compute_rarity(hexagram, orig, changed, changing, lines, yang_count, yin_count)

    # ============================================================
    # v6.1: 塔罗牌交叉分析
    # ============================================================
    tarot_cross = None
    if tarot_cards and len(tarot_cards) > 0:
        tarot_cross = _analyze_tarot_cross(
            tarot_cards, above_elem, below_elem,
            yang_count, yin_count, orig, changed, wx_relation,
        )
        if tarot_cross:
            advice_items.extend(tarot_cross.get("advice_extra", []))

    result = {
        "wuxing_relation": {
            "above_element": above_elem,
            "below_element": below_elem,
            "relation": wx_relation,
            "detail": wx_detail,
        },
        "positioning": {
            "proper_lines": [f"{'初' if i==0 else '上' if i==5 else ['二','三','四','五'][i-1]}" for i in proper_lines],
            "improper_lines": [f"{'初' if i==0 else '上' if i==5 else ['二','三','四','五'][i-1]}" for i in improper_lines],
            "central_proper": [f"{'二' if i==1 else '五'}" for i in central_proper],
            "pattern": pattern,
            "yang_count": yang_count,
            "yin_count": yin_count,
        },
        "changing_analysis": changing_analysis,
        "trigram_interaction": trigram_interaction,
        "above_trigram_attrs": above_attrs,
        "below_trigram_attrs": below_attrs,
        "transformation_trend": transformation_trend,
        "rarity": rarity,
        "tarot_cross": tarot_cross,
        "advice": advice_items,
    }
    return result


def _analyze_tarot_cross(tarot_cards: list, hex_above_elem: str,
                          hex_below_elem: str, yang_count: int,
                          yin_count: int, orig: dict, changed: dict,
                          wx_relation: str) -> dict:
    """
    v6.1: 塔罗牌与卦象的交叉确定性分析。
    - 元素共振：卦象五行 × 三张塔罗牌元素
    - 正逆位平衡：阳爻/阴爻比例 × 正位/逆位比例
    - 叙事弧线：过去→现在→未来 的关键词串联
    - 卦象呼应：每张牌与卦象关键词的交叉
    """
    if not tarot_cards:
        return None

    # 风元素→木 (塔罗的 air 在五行中对应木的升发之性)
    _TAROT_ELEM_TO_WX = {"火": "火", "水": "水", "土": "土", "风": "木"}

    # 收集三张牌信息
    cards_info = []
    tarot_elements = []
    upright_count = 0
    reversed_count = 0
    for tc in tarot_cards:
        card = tc.get("card") or {}
        reversed_flag = tc.get("reversed", False)
        pos = tc.get("spread_position") or {}
        elem = card.get("element", "")
        # 塔罗的大阿尔卡那 element 字段可能是"水星""金星"等占星元素，小阿尔卡那才是纯元素
        _ASTRO_TO_ELEM = {
            "火星": "火", "金星": "土", "水星": "风", "月亮": "水",
            "太阳": "火", "白羊": "火", "金牛": "土", "双子": "风",
            "巨蟹": "水", "狮子": "火", "处女": "土", "天秤": "风",
            "天蝎": "水", "射手": "火", "摩羯": "土", "水瓶": "风", "双鱼": "水",
        }
        elem_normalized = _ASTRO_TO_ELEM.get(elem, elem)
        if elem_normalized not in ("火", "水", "土", "风", "木", "金"):
            # 根据 suit 推断
            suit = card.get("suit", "")
            _SUIT_ELEM = {"wands": "火", "cups": "水", "swords": "风", "pentacles": "土"}
            elem_normalized = _SUIT_ELEM.get(suit, elem)

        if reversed_flag:
            reversed_count += 1
        else:
            upright_count += 1

        keywords = card.get("keywords_reversed" if reversed_flag else "keywords", [])
        cards_info.append({
            "name": card.get("name_cn") or card.get("name", ""),
            "position_label": pos.get("label", ""),
            "position_meaning": pos.get("meaning", ""),
            "element": elem_normalized,
            "reversed": reversed_flag,
            "keywords": keywords,
            "meaning": card.get("reversed_meaning" if reversed_flag else "upright_meaning", ""),
        })
        tarot_elements.append(elem_normalized)

    # 1. 元素共振分析
    hex_elements = set()
    if hex_above_elem: hex_elements.add(hex_above_elem)
    if hex_below_elem: hex_elements.add(hex_below_elem)

    element_matches = []
    for te in tarot_elements:
        te_wx = _TAROT_ELEM_TO_WX.get(te, te)
        for he in hex_elements:
            if te_wx == he:
                element_matches.append(f"塔罗「{te}」与卦象「{he}」同气")
            elif _WX_SHENG.get(te_wx) == he:
                element_matches.append(f"塔罗「{te}」生卦象「{he}」——顺养")
            elif _WX_SHENG.get(he) == te_wx:
                element_matches.append(f"卦象「{he}」生塔罗「{te}」——反哺")
            elif _WX_KE.get(te_wx) == he:
                element_matches.append(f"塔罗「{te}」克卦象「{he}」——制衡")
            elif _WX_KE.get(he) == te_wx:
                element_matches.append(f"卦象「{he}」克塔罗「{te}」——约束")

    element_summary = ""
    if element_matches:
        element_summary = "东西方元素层面：" + "；".join(element_matches[:3]) + "。"
    else:
        element_summary = "东西方元素层面各有所属，无明显生克——两套体系独立运作。"

    # 2. 正逆位 × 阴阳平衡
    balance_text = ""
    hex_yang_ratio = yang_count / 6.0 if yang_count else 0
    tarot_upright_ratio = upright_count / len(tarot_cards) if tarot_cards else 0
    if hex_yang_ratio > 0.6 and tarot_upright_ratio > 0.6:
        balance_text = "卦象偏阳、塔罗偏正位——双重正向，行动力强但需防过刚。"
    elif hex_yang_ratio < 0.4 and tarot_upright_ratio < 0.4:
        balance_text = "卦象偏阴、塔罗偏逆位——双重内敛，宜守不宜攻，需防消极。"
    elif abs(hex_yang_ratio - tarot_upright_ratio) < 0.2:
        balance_text = "卦象阴阳与塔罗正逆位比例接近——内外一致，状态协调。"
    else:
        balance_text = f"卦象{'偏阳刚' if hex_yang_ratio > 0.5 else '偏阴柔'}而塔罗{'偏正位' if tarot_upright_ratio > 0.5 else '偏逆位'}——内外张力存在，需找到平衡点。"

    # 3. 叙事弧线
    narrative = ""
    if len(cards_info) >= 3:
        past_kw = "、".join(cards_info[0]["keywords"][:2])
        present_kw = "、".join(cards_info[1]["keywords"][:2])
        future_kw = "、".join(cards_info[2]["keywords"][:2])
        narrative = (
            f"过去({cards_info[0]['name']}·{'逆' if cards_info[0]['reversed'] else '正'})：{past_kw}；"
            f"现在({cards_info[1]['name']}·{'逆' if cards_info[1]['reversed'] else '正'})：{present_kw}；"
            f"未来({cards_info[2]['name']}·{'逆' if cards_info[2]['reversed'] else '正'})：{future_kw}。"
        )

    # 4. 卦象关键词 × 塔罗关键词交叉
    hex_keywords = set(orig.get("keywords", []))
    cross_keywords = []
    for ci in cards_info:
        for kw in ci["keywords"]:
            # 简单语义近似匹配
            for hkw in hex_keywords:
                if _keywords_similar(kw, hkw):
                    cross_keywords.append(f"塔罗「{kw}」呼应卦象「{hkw}」")

    # 5. 额外建议
    advice_extra = []
    if element_matches:
        has_sheng = any("生" in m for m in element_matches)
        has_ke = any("克" in m for m in element_matches)
        if has_sheng:
            advice_extra.append("塔罗与卦象五行相生——东西方体系互为助力，方向一致")
        if has_ke:
            advice_extra.append("塔罗与卦象五行相克——东西方体系有张力，需调和矛盾")

    if balance_text:
        if "双重正向" in balance_text:
            advice_extra.append("阴阳正逆双重偏正——此刻适合主动出击，但留一分余地")
        elif "双重内敛" in balance_text:
            advice_extra.append("阴阳正逆双重偏负——此刻适合休养生息，不宜大动")

    return {
        "cards_info": cards_info,
        "element_analysis": {
            "tarot_elements": tarot_elements,
            "hex_elements": list(hex_elements),
            "matches": element_matches,
            "summary": element_summary,
        },
        "balance_analysis": balance_text,
        "narrative_arc": narrative,
        "keyword_cross": cross_keywords[:3],
        "advice_extra": advice_extra,
    }


# 关键词语义近似（简单版）
_KEYWORD_SIMILAR = {
    "行动": ["行动果断", "行动力", "行动"],
    "等待": ["等待", "耐心", "守"],
    "冒险": ["冒险", "大胆", "冒险"],
    "变化": ["变革", "变", "变化", "转变"],
    "权威": ["权威", "领导", "统率"],
    "自由": ["自由", "释放", "放下"],
    "直觉": ["直觉", "智慧", "内省"],
    "稳定": ["稳定", "守成", "安定"],
    "挑战": ["挑战", "竞争", "博弈"],
    "开始": ["新开始", "开创", "开始"],
    "结束": ["结束", "完成"],
    "释放": ["释放", "放下", "解难"],
    "和谐": ["和谐", "平衡", "和"],
}

def _keywords_similar(kw1: str, kw2: str) -> bool:
    """简单关键词近似匹配。"""
    if kw1 == kw2:
        return True
    for key, similar_list in _KEYWORD_SIMILAR.items():
        if kw1 in similar_list and kw2 in similar_list:
            return True
    # 包含关系
    if len(kw1) >= 2 and len(kw2) >= 2:
        if kw1 in kw2 or kw2 in kw1:
            return True
    return False


# ============================================================
# v7: 稀有度 & 大白话解读
# ============================================================

# 64卦在金钱卦(4^6=4096)中的理论概率权重
# 64卦中每卦的静态概率 = C(6,k) * 2^k * 2^(6-k) / 4096 不对
# 实际上金钱卦每爻有4种等概率结果(6老阴,7少阳,8少阴,9老阳)
# 但落到阴/阳各只有两种概率: P(阳)=P(少阳)+P(老阳)=1/4+1/4=1/2
# 所以64卦静态概率完全均等 = 1/64 ≈ 1.56%
# 稀有度来自动爻数量：6动爻概率=(1/2)^6=1/64，0动爻也是1/64
# 但 n个动爻 的概率 = C(6,n)/64, n=0:1/64, n=1:6/64, n=2:15/64, n=3:20/64
# 所以最多动爻和最少动爻都更稀有

def _compute_rarity(hexagram: dict, orig: dict, changed: dict,
                    changing: list, lines: list, yang_count: int,
                    yin_count: int) -> dict:
    """
    v7: 计算此次占卜的稀有度，生成大白话解读。
    基于多个维度：
    1. 卦象本身在64卦中的稀有度（特定卦象的组合特征）
    2. 动爻数量的稀有度
    3. 阴阳平衡的稀有度（全阳/全阴/极端偏斜）
    4. 变卦的稀有度（卦象转变的幅度）
    输出：百分比、等级、大白话描述
    """
    hex_id = orig.get("id", 0)
    hex_name = orig.get("name", "")
    changing_count = len(changing)

    # --- 稀有度评分（0-100，越高越稀有） ---
    rarity_score = 0
    rarity_reasons = []

    # 1. 动爻稀有度：0个或6个最稀有(各1.56%)，5个或1个次之
    from math import comb
    total_combos = 64  # 64种动爻组合（每爻动/不动）
    changing_prob = comb(6, changing_count) / total_combos
    if changing_count == 0 or changing_count == 6:
        rarity_score += 35
        rarity_reasons.append(f"{'无动爻' if changing_count == 0 else '六爻全动'}——概率仅 {changing_prob*100:.1f}%，极罕见")
    elif changing_count == 1 or changing_count == 5:
        rarity_score += 20
        rarity_reasons.append(f"{changing_count}个动爻——概率 {changing_prob*100:.1f}%，较少见")
    elif changing_count == 2 or changing_count == 4:
        rarity_score += 8
    # 3动爻概率最高(31.3%)，不加分

    # 2. 阴阳极端
    if yang_count == 6:
        rarity_score += 30
        rarity_reasons.append("六爻皆阳——纯乾之象，万分罕见")
    elif yin_count == 6:
        rarity_score += 30
        rarity_reasons.append("六爻皆阴——纯坤之象，万分罕见")
    elif yang_count == 0 or yin_count == 0:
        rarity_score += 25
        rarity_reasons.append("阴阳极端偏斜——极少出现的格局")
    elif abs(yang_count - yin_count) >= 4:
        rarity_score += 15
        rarity_reasons.append("阴阳严重失衡——不常见的能量分布")
    elif abs(yang_count - yin_count) >= 2:
        rarity_score += 5

    # 3. 特定卦象稀有度（基于传统意义）
    _RARE_HEXAGRAMS = {
        1: ("纯阳乾卦", "六十四卦之首，纯阳至刚"),
        2: ("纯阴坤卦", "六十四卦之母，纯阴至柔"),
        11: ("泰卦", "天地交泰，阴阳最完美的和谐"),
        12: ("否卦", "天地不交，阴阳最彻底的隔绝"),
        63: ("既济", "六爻皆当位，完美完成之象"),
        64: ("未济", "六爻皆不当位，未完成之象"),
    }
    if hex_id in _RARE_HEXAGRAMS:
        label, detail = _RARE_HEXAGRAMS[hex_id]
        rarity_score += 15
        rarity_reasons.append(f"{label}——{detail}")

    # 4. 变卦幅度
    if changed:
        changed_name = changed.get("name", "")
        # 计算二进制差异位数
        orig_bin = orig.get("binary", "000000")
        changed_bin = changed.get("binary", "000000")
        diff_bits = sum(1 for a, b in zip(orig_bin, changed_bin) if a != b)
        if diff_bits >= 5:
            rarity_score += 12
            rarity_reasons.append(f"卦象剧变（{diff_bits}爻翻转）——{hex_name}→{changed_name}，本质性转变")
        elif diff_bits >= 3:
            rarity_score += 6

    rarity_score = min(95, rarity_score)

    # --- 等级 ---
    if rarity_score >= 60:
        rarity_level = "罕見"
        rarity_percentile = f"約 {rarity_score}% 的占卜不會出現這種格局"
        vibe = "這是一個不常降臨的卦象——它選擇了此刻的你。"
    elif rarity_score >= 35:
        rarity_level = "少見"
        rarity_percentile = f"大約每 {max(3, int(100/(rarity_score+5)))} 次占卜才會遇到一次"
        vibe = "不是每天都能搖到的卦——值得多看幾眼。"
    elif rarity_score >= 15:
        rarity_level = "常見"
        rarity_percentile = "多數人問事都會落在這個區間"
        vibe = "這是一個接地氣的卦——普世而真實。"
    else:
        rarity_level = "大眾"
        rarity_percentile = "非常普遍的卦象格局"
        vibe = "大多數人的此刻，長這個樣子。"

    # --- 大白话解读 ---
    plain_text_parts = []

    # 卦象本身的大白话
    fortune = orig.get("fortune", "中")
    fortune_plain = {
        "大吉": "天地給了你一張好牌",
        "吉": "整體順風，可以往前走",
        "中": "不好不壞，但暗藏轉機",
        "凶": "逆風，但不等於失敗——是提醒你慢下來",
        "大凶": "最難的卦——但最難的卦往往教會你最多的東西",
    }
    plain_text_parts.append(fortune_plain.get(fortune, "此刻的運勢如實呈現"))

    # 动爻大白话
    if changing_count == 0:
        plain_text_parts.append("沒有動爻——卦象很純粹，事情大概率會沿著現有軌跡走")
    elif changing_count == 1:
        plain_text_parts.append("一個動爻——變數集中在一個點上，抓住那個點就好")
    elif changing_count <= 2:
        plain_text_parts.append(f"{changing_count}個動爻——有變化但可控，靈活應對")
    elif changing_count <= 4:
        plain_text_parts.append(f"{changing_count}個動爻——變數較多，做好多手準備")
    else:
        plain_text_parts.append(f"{changing_count}個動爻——幾乎全面翻轉，做好迎接大變的準備")

    # 阴阳大白话
    if yang_count >= 5:
        plain_text_parts.append("陽氣極盛——行動力爆棚，但要小心衝動")
    elif yin_count >= 5:
        plain_text_parts.append("陰氣極盛——宜靜不宜動，向內積蓄力量")
    elif yang_count > yin_count:
        plain_text_parts.append("偏陽剛——適合主動出擊")
    elif yin_count > yang_count:
        plain_text_parts.append("偏陰柔——適合以靜制動")
    else:
        plain_text_parts.append("陰陽平衡——內外力量均等")

    return {
        "score": rarity_score,
        "level": rarity_level,
        "percentile": rarity_percentile,
        "vibe": vibe,
        "reasons": rarity_reasons,
        "plain_reading": plain_text_parts,
        "hex_name": hex_name,
        "changing_count": changing_count,
    }

_LN_WM = "4c3a8f2e7b1d9065a2c8e4f1b7d3096e8a5c2f4d"  # linmy666/latestname
