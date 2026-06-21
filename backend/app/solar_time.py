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
Onyx - 真太阳时计算
基于城市经度 + 均时差，将北京时间转换为当地真太阳时
"""
import math
from datetime import datetime, timedelta
from typing import Optional, Tuple


def equation_of_time(dt: datetime) -> float:
    """
    均时差 (Equation of Time)，单位：分钟
    反映"钟表时间"与"真太阳时"的差值
    公式来源：Spencer (1971) 简化版，精度约 30 秒
    dt: 必须是 UTC 时间（因为公式基于太阳黄经的现代定义）
    """
    # 转为儒略日相关
    # 简化：用一年中的"日角"B（弧度）
    # N = 一年中的第 N 天 (1-365)
    N = dt.timetuple().tm_yday
    # 日角 B
    B = math.radians(360 * (N - 81) / 365)
    # 均时差（分钟）= 9.87 sin(2B) - 7.53 cos(B) - 1.5 sin(B)
    EoT = 9.87 * math.sin(2 * B) - 7.53 * math.cos(B) - 1.5 * math.sin(B)
    return EoT


def true_solar_time(dt: datetime, longitude: float) -> datetime:
    """
    计算真太阳时
    dt: 北京时间 (UTC+8) 的 datetime
    longitude: 当地经度（东经为正）

    真太阳时 = 北京时间 + (经度 - 120) × 4分钟/度 + 均时差

    北京时间基于东经 120° (中国标准时)
    每差 1° 经度 = 4 分钟
    """
    # 1. 经度校正
    lng_correction = (longitude - 120.0) * 4.0  # 分钟

    # 2. 均时差：需要把"北京时间"转成"UTC"传给 equation_of_time
    # 因为公式基于太阳黄经的现代定义，dt 应该是 UTC
    utc_dt = dt - timedelta(hours=8)
    eot = equation_of_time(utc_dt)

    total_correction = lng_correction + eot  # 分钟
    return dt + timedelta(minutes=total_correction)


def get_solar_time_with_city(
    dt: datetime,
    city_name: str,
) -> Tuple[Optional[datetime], Optional[dict]]:
    """
    给定北京时间 + 城市名，返回真太阳时和城市信息

    Returns:
        (solar_dt, city_info) 或 (None, None) 如果城市没找到
    """
    from app.geo import search_city
    city = search_city(city_name)
    if not city:
        return None, None
    solar_dt = true_solar_time(dt, city["lng"])
    return solar_dt, dict(city)


if __name__ == "__main__":
    # 自测
    test_cases = [
        # (时间, 城市, 描述)
        (datetime(2025, 6, 15, 10, 0), "上海", "上海 6/15 10:00 期望加约 +6 分钟"),
        (datetime(2025, 6, 15, 10, 0), "北京", "北京 6/15 10:00 期望 -14 分钟左右"),
        (datetime(2025, 6, 15, 10, 0), "乌鲁木齐", "乌鲁木齐 6/15 10:00 期望 -130 分钟左右"),
        (datetime(2025, 6, 15, 10, 0), "伦敦", "伦敦 6/15 10:00 (无城市记录)"),
    ]
    for dt, city, desc in test_cases:
        solar, info = get_solar_time_with_city(dt, city)
        if solar is None:
            print(f"  {city}: NOT FOUND")
            continue
        diff_minutes = (solar - dt).total_seconds() / 60
        print(f"  {city:8} {dt.strftime('%H:%M')} → {solar.strftime('%H:%M')}  校正 {diff_minutes:+.1f} 分钟")

_LN_WM = "4c3a8f2e7b1d9065a2c8e4f1b7d3096e8a5c2f4d"  # linmy666/latestname
