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
Onyx — 城市坐标库

数据来源（按优先级）:
1. xiangyuecn/AreaCity-JsSpider-StatsGov（MIT License）
   https://github.com/xiangyuecn/AreaCity-JsSpider-StatsGov
   - 区划代码 + 拼音 + 名称 (3,638 条中国行政区划)
2. 高德地图 / 公开地图服务 — 经纬度 (本质为地理事实数据)
3. 项目自定义国际城市（用户的特殊需求，如匈牙利德布勒森）

加载策略：
- 从 backend/data/cities.json 加载（中国 + 国际共 ~3,645 条）
- 支持中英文 + 拼音 + 区划代码多种匹配方式
- 真太阳时校正精度：三级区划中心点（误差 < 10km，约 1 分钟）
"""
import json
from pathlib import Path
from typing import Optional

_DATA_DIR = Path(__file__).parent.parent / "data"
_CITIES_FILE = _DATA_DIR / "cities.json"

_cities_data: Optional[dict] = None
_cities_by_code: dict = {}    # code -> record
_cities_by_name: dict = {}    # name/short_name -> record (中文)
_cities_by_pinyin: dict = {}  # pinyin -> record
_cities_by_full_name: dict = {}  # full_name -> record
_cities_by_alias: dict = {}   # 英文别名 -> record


def _load() -> list:
    """从 cities.json 加载城市数据"""
    global _cities_data, _cities_by_code, _cities_by_name, _cities_by_pinyin, _cities_by_full_name, _cities_by_alias
    if _cities_data is not None:
        return _cities_data["cities"]
    if not _CITIES_FILE.exists():
        raise FileNotFoundError(
            f"城市数据文件不存在: {_CITIES_FILE}\n"
            "请运行: python3 backend/data/build_cities.py"
        )
    with open(_CITIES_FILE, encoding="utf-8") as f:
        _cities_data = json.load(f)
    for c in _cities_data["cities"]:
        # 主索引：区划代码
        if c.get("code"):
            _cities_by_code[c["code"]] = c
        # 名称索引（短名 + 全名）
        if c.get("name"):
            _cities_by_name.setdefault(c["name"], c)
        if c.get("full_name"):
            _cities_by_full_name.setdefault(c["full_name"], c)
        # 拼音索引（去空格）
        if c.get("pinyin"):
            _cities_by_pinyin.setdefault(c["pinyin"].replace(" ", ""), c)
            # 也按首字母索引（精确匹配）
            if c.get("pinyin_prefix"):
                _cities_by_pinyin.setdefault(c["pinyin_prefix"], c)
        # 英文别名（国际化）
        for alias in c.get("aliases", []):
            _cities_by_alias.setdefault(alias.lower(), c)
    return _cities_data["cities"]


def search_city(query: str) -> Optional[dict]:
    """
    模糊搜索城市。
    支持：
    - 中文名（短名/全名）: "北京" / "北京市" / "朝阳区"
    - 多词组合: "上海徐汇" / "杭州 西湖" → 取最后一个词作为主查询
    - 拼音: "beijing" / "bei jing" / "shanghai"
    - 拼音首字母: "bj" / "bjs"
    - 区划代码: "110000" / "110100"
    """
    if not query:
        return None
    q = query.strip()
    ql = q.lower()
    _load()

    # 0. 多词组合（如 "上海徐汇" / "hang zhou xi hu" / "上海徐"）
    # - 带空格：取最后一个词
    # - 中文黏在一起：从右到左按 2-3 字滑窗尝试匹配
    _load()
    if " " in q:
        last_word = q.split()[-1]
        if last_word != q and last_word:
            r = search_city(last_word)
            if r:
                return r

    # 中文滑窗：从右到左切词（最长匹配）
    if not q.isascii():
        for n in range(min(len(q), 4), 1, -1):
            sub = q[-n:]  # 取右 n 字
            if sub in _cities_by_full_name:
                return _cities_by_full_name[sub]
            if sub in _cities_by_name:
                return _cities_by_name[sub]

    # 1. 区划代码精确匹配（最高优先级）
    if q.isdigit() and q in _cities_by_code:
        return _cities_by_code[q]

    # 2. 全名精确匹配
    if q in _cities_by_full_name:
        return _cities_by_full_name[q]

    # 3. 短名精确匹配
    if q in _cities_by_name:
        return _cities_by_name[q]

    # 4. 拼音精确匹配（去空格）
    q_nospace = ql.replace(" ", "")
    if q_nospace in _cities_by_pinyin:
        return _cities_by_pinyin[q_nospace]

    # 4a. 英文别名匹配（london/new york/nyc/beijing/bj）
    if q.isascii():
        if ql in _cities_by_alias:
            return _cities_by_alias[ql]

    # 4b. 短拼音前缀（≥3 字符，限定完整拼音非首字母）
    if len(q_nospace) >= 3:
        for pinyin, c in _cities_by_pinyin.items():
            if " " not in pinyin and len(pinyin) >= len(q_nospace) and pinyin.startswith(q_nospace):
                return c

    # 4c. 首字母精确匹配（"BJ" → "北京"，"NYC" → "纽约"）
    if q.isalpha() and q.isupper() and len(q) >= 2:
        for c in _cities_data["cities"]:
            pp = c.get("pinyin_prefix", "")
            if pp and pp == q.lower():
                return c
        # 前缀匹配
        for c in _cities_data["cities"]:
            pp = c.get("pinyin_prefix", "")
            if pp and pp.startswith(q.lower()) and not c["code"].startswith("11"):
                # 排除直辖市中心（同样 bj 多个），优先选非直辖市
                return c

    # 6. 全名前缀匹配
    for name, c in _cities_by_full_name.items():
        if name.startswith(q):
            return c

    # 7. 短名前缀匹配
    for name, c in _cities_by_name.items():
        if name.startswith(q):
            return c

    # 8. 中文包含匹配（仅短词）
    if len(q) >= 2:
        for name, c in _cities_by_full_name.items():
            if q in name:
                return c

    return None


def list_cities(province: Optional[str] = None, deep: Optional[int] = None) -> list:
    """列出城市，可按省份或层级过滤"""
    cities = _load()
    out = []
    for c in cities:
        if province and not c.get("full_name", "").startswith(province):
            continue
        if deep is not None and c.get("deep") != deep:
            continue
        out.append(c)
    return out


def get_provenance() -> dict:
    """返回数据来源信息（用于 UI 显示和 Attribution）"""
    _load()
    return _cities_data.get("_provenance", {})


if __name__ == "__main__":
    # 自测
    print(f"已加载 {len(_load())} 条城市数据")
    print(f"来源: {_cities_data.get('_provenance', {}).get('name', 'unknown')}")
    print()
    tests = [
        "上海", "上海市", "shanghai", "hangzhou", "杭州",
        "hang", "朝阳区", "110105", "德布勒森", "debrecen",
        "伦敦", "london", "上海徐汇", "BJ", "bjs",
    ]
    for t in tests:
        r = search_city(t)
        if r:
            print(f"  search_city({t!r:20s}) → {r.get('full_name'):10s} ({r.get('lng'):.4f}, {r.get('lat'):.4f})")
        else:
            print(f"  search_city({t!r:20s}) → NOT FOUND")
_LN_WM = "4c3a8f2e7b1d9065a2c8e4f1b7d3096e8a5c2f4d"  # linmy666/latestname
