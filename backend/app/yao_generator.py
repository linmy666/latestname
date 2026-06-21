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
Onyx - 384 爻辞批量生成器
策略：基于传统《周易》原文（公有领域）+ 卦象主题关键词（自己写），
      用模板规则生成现代化解读。

v0.5-D 备注：
- 全部 384 条（64 卦 × 6 爻）的"original_text" 字段是公有领域《周易》原文
- "modern_meaning" + "advice" 是基于卦象关键词的模板生成（自创）
- 不依赖 LLM，确保可复现

输出格式:
{
    "position": "初九",  // 爻名
    "original_text": "潜龙勿用",  // 原文
    "modern_meaning": "时机未到，宜低调蓄力",  // 现代解读
    "advice": "不要急于行动"  // 行动建议
}
"""
import json
from pathlib import Path

DATA_PATH = Path(__file__).parent.parent / "data" / "iching.json"


def hexagram_theme_keywords(hex_data: dict) -> list:
    """从卦象数据中提取主题关键词（已有 keywords 字段）"""
    return hex_data.get("keywords", [])


# 6 个爻位的"通用模板"（按爻位从下到上递进）
YAO_TEMPLATES = [
    # 0: 初爻 - 起始 / 准备期
    {
        "modern_prefix": ["起步阶段", "初始之时", "事之初始", "新阶段开端"],
        "advice_theme": ["积蓄力量", "打好基础", "谨慎起步", "不急不躁", "做好准备工作"],
    },
    # 1: 二爻 - 显现 / 初步发展
    {
        "modern_prefix": ["渐显之时", "开始显露", "初步发展", "小有所成"],
        "advice_theme": ["继续推进", "保持谦逊", "借势而上", "稳扎稳打", "适度展示自己"],
    },
    # 2: 三爻 - 关键转折 / 风险
    {
        "modern_prefix": ["关键转折", "风险与机遇并存", "进退两难", "考验时刻"],
        "advice_theme": ["谨慎决策", "避免冒进", "寻求帮助", "稳住阵脚", "三思而行"],
    },
    # 3: 四爻 - 上升 / 接近高位
    {
        "modern_prefix": ["接近高位", "上行的关键期", "蓄势待发", "跃跃欲试"],
        "advice_theme": ["把握时机", "大胆尝试", "准备突破", "适时而动", "建立同盟"],
    },
    # 4: 五爻 - 鼎盛 / 核心
    {
        "modern_prefix": ["鼎盛时期", "核心位置", "收获之时", "居于要位"],
        "advice_theme": ["全力施展", "承担责任", "保持清醒", "惠及他人", "把握核心"],
    },
    # 5: 上爻 - 衰退 / 终结
    {
        "modern_prefix": ["盛极而衰", "终结之时", "高位风险", "末尾阶段"],
        "advice_theme": ["适可而止", "未雨绸缪", "急流勇退", "功成身退", "避免过犹不及"],
    },
]


def generate_modern_interpretation(yao_idx: int, hex_name: str, fortune: str,
                                    keywords: list, original_text: str) -> dict:
    """为单爻生成 modern_meaning + advice（基于卦象关键词 + 爻位）"""
    template = YAO_TEMPLATES[yao_idx]
    prefix = template["modern_prefix"]
    advice_theme = template["advice_theme"]

    # 根据 fortune 调整
    if fortune in ["大吉", "吉"]:
        tone = "顺"
    elif fortune in ["凶", "大凶"]:
        tone = "逆"
    else:
        tone = "中"

    # 选一个 prefix 和 advice（基于原文字数+卦象关键词）
    pi = yao_idx % len(prefix)
    ai = (yao_idx + len(original_text)) % len(advice_theme)
    kw = ", ".join(keywords[:3]) if keywords else "未知"

    modern = f"{prefix[pi]}，{tone}势之象，卦意在「{kw}」。结合爻辞「{original_text}」，提示此时应顺势而行。"

    advice = advice_theme[ai]
    if fortune in ["凶", "大凶"]:
        advice += "，不宜强行"

    return {
        "modern_meaning": modern,
        "advice": advice,
    }


def build_yao_for_hex(hex_data: dict) -> list:
    """为一个卦生成 6 条爻辞解读（从 iching.json 已有的数据扩展）"""
    name = hex_data["name"]
    fortune = hex_data["fortune"]
    keywords = hex_data.get("keywords", [])

    # 这里简化：原 iching.json 已有 judgment / image，但没有爻辞
    # 我们生成 yao_interpretations 数组（6 个）
    # original_text 我们从公有领域《周易》爻辞中抽样（用经典短语作为占位）
    # 真实爻辞需要从完整《周易》原文填充 - v0.5-D 的 P0 任务是补全
    # 当前先为每爻生成结构 + 占位 modern_meaning
    yao_names = ["初九", "九二", "九三", "九四", "九五", "上九"]
    # 注意：实际爻名根据阴阳决定（九/六），这里用占位
    # 真名应该在 get_yao_name(hex_data, yao_idx) 中根据爻的阴阳决定
    # 简化：阳爻用九，阴爻用六
    lines = hex_data.get("binary", "111111")  # 6 个 0/1
    yao_full_names = []
    positions = ["初", "二", "三", "四", "五", "上"]
    for i, bit in enumerate(lines):
        yin_yang = "六" if bit == "0" else "九"
        yao_full_names.append(positions[i] + yin_yang)

    yao_list = []
    for i in range(6):
        # original_text 占位 - 实际数据从公有领域《周易》爻辞填充
        original_text = f"（待补充：{name}卦{yao_full_names[i]}爻辞）"
        interp = generate_modern_interpretation(i, name, fortune, keywords, original_text)
        interp["position"] = yao_full_names[i]
        interp["original_text"] = original_text
        yao_list.append(interp)
    return yao_list


def main():
    """给所有 64 卦添加 yao_interpretations 字段"""
    with open(DATA_PATH, encoding="utf-8") as f:
        data = json.load(f)

    for h in data:
        if "yao_interpretations" not in h:
            h["yao_interpretations"] = build_yao_for_hex(h)

    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"✅ Updated {len(data)} hexagrams with yao_interpretations")
    print(f"   Total entries: {sum(len(h['yao_interpretations']) for h in data)}")


if __name__ == "__main__":
    main()

_LN_WM = "4c3a8f2e7b1d9065a2c8e4f1b7d3096e8a5c2f4d"  # linmy666/latestname
