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
Latestname 命名引擎 v2 — 「此刻之名」从卦象爻辞中生长

核心原则：名字不是从外部字典随机选的，而是从用户得到的卦象中提取的。
每个名字都有明确的周易出处（卦辞/爻辞/象传），可考证。

选择逻辑：
  卦象 → 该卦4个候选名 → 心境过滤（mood_fit匹配优先）→ 种子选定
  如果有变卦 → 变卦名作为"变名"（暗示转变方向）
"""

import json
import random
import os
from typing import Optional

_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
_HEX_NAMES: Optional[dict] = None


def _load_hex_names() -> dict:
    global _HEX_NAMES
    if _HEX_NAMES is None:
        path = os.path.join(_DATA_DIR, "hexagram_names.json")
        with open(path, "r", encoding="utf-8") as f:
            _HEX_NAMES = json.load(f)
    return _HEX_NAMES  # type: ignore[return-value]


def generate_latest_name(
    seed: int,
    question_type: str = "general",
    mood: str = "calm",
    fortune: str = "中",
    hexagram_id: Optional[int] = None,
    changed_hexagram_id: Optional[int] = None,
) -> dict:
    """
    从卦象爻辞中提取「此刻之名」。

    参数：
        seed: 确定性种子
        mood: 用户心境 (calm/anxious/lost/hopeful/decisive)
        fortune: 吉凶等级 (大吉/吉/中/凶/大凶)
        hexagram_id: 本卦ID (1-64)
        changed_hexagram_id: 变卦ID（如有动爻）

    返回:
        {
            "name": "潜龙",
            "source": "初九：潜龙勿用",
            "source_type": "爻辞",
            "meaning": "韬光养晦，待时而动",
            "hexagram_name": "乾",
            "changed_name": "..." (如有变卦),
            "changed_source": "...",
        }
    """
    data = _load_hex_names()
    rng = random.Random(seed)

    # --- 1. 从本卦名字池中选 ---
    hex_key = str(hexagram_id) if hexagram_id else "1"
    hex_data = data.get(hex_key, {})
    candidates = hex_data.get("names", [])
    hex_name = hex_data.get("hexagram_name", "")

    if not candidates:
        # 回退到乾卦
        candidates = data["1"]["names"]
        hex_name = "乾"

    # 心境匹配：优先选 mood_fit 包含当前心境的名字
    mood_matched = [c for c in candidates if mood in c.get("mood_fit", [])]
    pool = mood_matched if mood_matched else candidates

    # 种子选定
    chosen = pool[rng.randint(0, len(pool) - 1)]

    result = {
        "name": chosen["name"],
        "source": chosen["source"],
        "source_type": chosen["source_type"],
        "meaning": chosen["meaning"],
        "hexagram_name": hex_name,
    }

    # --- 2. 变卦名（如有） ---
    if changed_hexagram_id:
        changed_key = str(changed_hexagram_id)
        changed_data = data.get(changed_key, {})
        changed_candidates = changed_data.get("names", [])
        if changed_candidates:
            changed_mood = [c for c in changed_candidates if mood in c.get("mood_fit", [])]
            changed_pool = changed_mood if changed_mood else changed_candidates
            changed_chosen = changed_pool[rng.randint(0, len(changed_pool) - 1)]
            result["changed_name"] = changed_chosen["name"]
            result["changed_source"] = changed_chosen["source"]
            result["changed_meaning"] = changed_chosen["meaning"]
            result["changed_hexagram_name"] = changed_data.get("hexagram_name", "")

    return result


def questionnaire_to_extra(
    domain: str = "general",
    mood: str = "calm",
    urgency: str = "normal",
    openness: str = "open",
) -> str:
    """将问卷四问转化为种子 extra 字符串。"""
    return f"{domain}:{mood}:{urgency}:{openness}"


def build_name_prompt_section(latest_name: dict) -> str:
    """构建 AI 解读 prompt 中的「此刻之名」部分。"""
    name = latest_name.get("name", "")
    source = latest_name.get("source", "")
    meaning = latest_name.get("meaning", "")
    hex_name = latest_name.get("hexagram_name", "")
    changed = latest_name.get("changed_name")

    parts = [f"\n【此刻之名：{name}】"]
    parts.append(f"出处：{source}")
    parts.append(f"释义：{meaning}")
    parts.append(f"得自：{hex_name}卦")
    if changed:
        parts.append(f"变名：{changed}（← {latest_name.get('changed_source','')}）")
        parts.append(f"变名释义：{latest_name.get('changed_meaning','')}")
        parts.append(f"  本名→变名，暗示着从「{name}」到「{changed}」的转变。请在解读中点明这个转变方向。")
    parts.append("请在解读中自然融入「此刻之名」的周易出处与意象，让用户理解这个名字不是随机的，而是从卦象爻辞中生长出来的。")
    return "\n".join(parts)

_LN_WM = "4c3a8f2e7b1d9065a2c8e4f1b7d3096e8a5c2f4d"  # linmy666/latestname
