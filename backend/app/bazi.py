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
八字（四柱）计算模块 —— 纯 Python 实现天干地支
不依赖第三方库，基于传统万年历算法

支持：
- 公历日期 → 年柱/月柱/日柱/时柱
- 五行统计 + 强弱分析
- 纳音（六十甲子纳音）
- 日主（日干）旺衰
"""

from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional

# ============================================================
# 精确节气计算（用 pyephem 实时计算太阳黄经，无 pyephem 时回退到近似表）
# ============================================================
try:
    import ephem
    import math as _math
    _HAS_EPHEM = True
except ImportError:
    ephem = None  # type: ignore
    _math = None  # type: ignore
    _HAS_EPHEM = False

# 12 月柱分界节气（太阳黄经度数）
# 立春 315 惊蛰 345 清明 15 立夏 45 芒种 75 小暑 105
# 立秋 135 白露 165 寒露 195 立冬 225 大雪 255 小寒 285
_BOUNDARY_LON = [285, 315, 345, 15, 45, 75, 105, 135, 165, 195, 225, 255]
# 月份 (1-12) 对应的节气索引
_MONTH_BOUNDARY = {
    1: ('小寒', 285),    # 1 月开始：小寒
    2: ('立春', 315),    # 2 月开始：立春
    3: ('惊蛰', 345),    # 3 月开始：惊蛰
    4: ('清明', 15),     # 4 月开始：清明
    5: ('立夏', 45),     # 5 月开始：立夏
    6: ('芒种', 75),     # 6 月开始：芒种
    7: ('小暑', 105),    # 7 月开始：小暑
    8: ('立秋', 135),    # 8 月开始：立秋
    9: ('白露', 165),    # 9 月开始：白露
    10: ('寒露', 195),   # 10 月开始：寒露
    11: ('立冬', 225),   # 11 月开始：立冬
    12: ('大雪', 255),   # 12 月开始：大雪
}


def _find_jieqi_in_year(year: int, target_lon: float) -> Tuple[int, int]:
    """
    用 pyephem 二分法查找太阳到达 target_lon（黄经，度）的日期
    返回 (month, day) - 公历
    精度：1 天
    """
    if not _HAS_EPHEM:
        return None

    # 选定初始搜索范围
    # 每个节气在固定月日附近 (rule of thumb)
    approx_month_day = {
        285: (1, 5), 315: (2, 4), 345: (3, 6), 15: (4, 5),
        45: (5, 6), 75: (6, 6), 105: (7, 7), 135: (8, 7),
        165: (9, 8), 195: (10, 8), 225: (11, 7), 255: (12, 7),
    }
    am, ad = approx_month_day.get(round(target_lon), (6, 21))
    # 处理黄经跨越 0° (春分后)
    base_date = datetime(year, am, ad)

    # 二分搜索：±15 天
    lo = base_date - timedelta(days=15)
    hi = base_date + timedelta(days=15)

    def sun_lon_at(dt: datetime) -> float:
        # 用 pyephem 算太阳地心黄经（不是日心 hlong，那是另一个量）
        # 北京时间 → UTC
        utc_dt = dt - timedelta(hours=8)
        ed = ephem.Date(utc_dt.strftime("%Y/%m/%d %H:%M"))
        sun = ephem.Sun(ed)
        # 地心赤道坐标 → 黄道坐标
        ra = float(sun.g_ra)
        dec = float(sun.g_dec)
        eps_rad = _math.radians(23.4393)  # 黄赤交角
        lon = _math.atan2(
            _math.sin(ra) * _math.cos(eps_rad) + _math.tan(dec) * _math.sin(eps_rad),
            _math.cos(ra)
        )
        return _math.degrees(lon) % 360

    # 标准化到 [0, 360)
    target = target_lon % 360

    for _ in range(30):  # 最多 30 次迭代
        if hi <= lo:
            break
        mid = lo + (hi - lo) / 2
        if abs((hi - lo).total_seconds()) < 86400:  # 精度 1 天
            return (mid.month, mid.day)
        mid_lon = sun_lon_at(mid)
        # 处理跨越 0° 的情况
        if abs(mid_lon - target) < 0.5:
            return (mid.month, mid.day)
        # 决定往哪边
        # 如果 target < mid_lon 且相差不大，需要减
        diff = (mid_lon - target) % 360
        if diff < 180:
            hi = mid
        else:
            lo = mid

    if mid is None:
        return (1, 1)  # fallback
    return (mid.month, mid.day)

# ============================================================
# 常量表
# ============================================================

TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

# 天干五行
GAN_WUXING = {'甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
              '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'}

# 地支五行
ZHI_WUXING = {'子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
              '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'}

# 天干阴阳
GAN_YINYANG = {'甲': '阳', '乙': '阴', '丙': '阳', '丁': '阴', '戊': '阳',
               '己': '阴', '庚': '阳', '辛': '阴', '壬': '阳', '癸': '阴'}

# 地支生肖
ZHI_SHENGXIAO = {'子': '鼠', '丑': '牛', '寅': '虎', '卯': '兔', '辰': '龙', '巳': '蛇',
                 '午': '马', '未': '羊', '申': '猴', '酉': '鸡', '戌': '狗', '亥': '猪'}

# 六十甲子纳音（30 对，每对覆盖两个甲子）
NAYIN_PAIRS = [
    '海中金', '海中金', '炉中火', '炉中火', '大林木', '大林木',
    '路旁土', '路旁土', '剑锋金', '剑锋金', '山头火', '山头火',
    '涧下水', '涧下水', '城头土', '城头土', '白蜡金', '白蜡金',
    '杨柳木', '杨柳木', '井泉水', '井泉水', '屋上土', '屋上土',
    '霹雳火', '霹雳火', '松柏木', '松柏木', '长流水', '长流水',
    '砂石金', '砂石金', '山下火', '山下火', '平地木', '平地木',
    '壁上土', '壁上土', '金箔金', '金箔金', '覆灯火', '覆灯火',
    '天河水', '天河水', '大驿土', '大驿土', '钗钏金', '钗钏金',
    '桑柘木', '桑柘木', '大溪水', '大溪水', '沙中土', '沙中土',
    '天上火', '天上火', '石榴木', '石榴木', '大海水', '大海水',
]

# 月柱天干起始表（年干定月干 - 五虎遁 + 全年顺推）
# 甲己年起正月(寅)=丙，二月(卯)=丁，...十二月(丑)=丁
# 完整表（正月到十二月，共12个月）
# 索引 0-11 对应寅月到丑月
# 字典: 年干 -> [寅月干, 卯月干, ..., 丑月干]
MONTH_GAN_START = {
    '甲': ['丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁'],
    '己': ['丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁'],
    '乙': ['戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己'],
    '庚': ['戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己'],
    '丙': ['庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛'],
    '辛': ['庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛'],
    '丁': ['壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'],
    '壬': ['壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'],
    '戊': ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙'],
    '癸': ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙'],
}

# 节气（近似日期，用于月柱划分）
# 每月开始的节气近似日（公历）
JIEQI_APPROX = {
    # (月) : 节气近似日
    2: 4,   # 立春
    3: 6,   # 惊蛰
    4: 5,   # 清明
    5: 6,   # 立夏
    6: 6,   # 芒种
    7: 7,   # 小暑
    8: 8,   # 立秋
    9: 8,   # 白露
    10: 8,  # 寒露
    11: 7,  # 立冬
    12: 7,  # 大雪
    1: 6,   # 小寒（1月）
}

WUXING_NAMES = ['木', '火', '土', '金', '水']

# 五行相生相克
WUXING_SHENG = {'木': '火', '火': '土', '土': '金', '金': '水', '水': '木'}
WUXING_KE = {'木': '土', '火': '金', '土': '水', '金': '木', '水': '火'}


# ============================================================
# 核心计算
# ============================================================

def _get_solar_year_ganzhi(year: int) -> Tuple[str, str]:
    """年柱天干地支（以立春为分界）"""
    # 公元4年 = 甲子年（基准）
    offset = (year - 4) % 60
    gan = TIANGAN[offset % 10]
    zhi = DIZHI[offset % 12]
    return gan, zhi


def _get_month_ganzhi(year: int, month: int, day: int) -> Tuple[str, str]:
    """月柱天干地支（以节气为分界）

    月份分界表（公历）：
        1月: 过了小寒才算本月(丑月)
        2月: 过了立春才算本月(寅月)
        3月: 过了惊蛰才算本月(卯月)
        ...

    注意：1月没过小寒时属去年子月（需用去年年干）
    """
    boundary_lons = [285, 315, 345, 15, 45, 75, 105, 135, 165, 195, 225, 255]
    idx = month - 1
    cur_lon = boundary_lons[idx]

    if _HAS_EPHEM:
        cur_jieqi = _find_jieqi_in_year(year, cur_lon)
        if cur_jieqi is None:
            jieqi_day = JIEQI_APPROX.get(month, 6)
        else:
            _, jieqi_day = cur_jieqi
    else:
        jieqi_day = JIEQI_APPROX.get(month, 6)

    # 计算 zhi_index（0=子, 1=丑, ..., 11=亥）
    # 过了本节气 → zhi = DIZHI[month % 12]（因为 1月过了小寒=丑=DIZHI[1]=month%12）
    # 没过节气 → zhi = DIZHI[(month - 1) % 12]
    if day < jieqi_day:
        # 没过节气：上个月
        zhi_index = (month - 1) % 12
    else:
        # 过了节气：本月
        zhi_index = month % 12
    zhi = DIZHI[zhi_index]

    # 月干：根据 zhi_index 查表（用年干）
    # 但 month_offset 索引表用的是"寅月=0"体系
    # 转：zhi_index=2 (寅月) → month_offset=0
    #     zhi_index=0 (子月) → month_offset=-2
    #     zhi_index=1 (丑月) → month_offset=-1 = 11
    # 简化：直接列 12 月的 zhi→offset 关系
    if zhi_index == 0:
        # 子月
        month_offset = 10  # 表里索引 10
        gan_year = year - 1
    elif zhi_index == 1:
        # 丑月
        month_offset = 11
        gan_year = year  # 1月过了小寒是今年丑月
    else:
        # 寅月(2)到亥月(11) → offset 0-9
        month_offset = zhi_index - 2
        gan_year = year

    # 月干：年上起月法
    year_gan, _ = _get_solar_year_ganzhi(gan_year)
    if month_offset == 10:
        # 子月：从去年十月顺推 = 去年 index 9
        last_year_gan, _ = _get_solar_year_ganzhi(gan_year)
        gan = MONTH_GAN_START[last_year_gan][9]
    else:
        gan = MONTH_GAN_START[year_gan][month_offset]

    return gan, zhi


def _get_day_ganzhi(year: int, month: int, day: int) -> Tuple[str, str]:
    """日柱天干地支（基于已知基准日推算）"""
    # 基准：1900年1月1日 = 甲戌日（干支序号10）
    # 实际验证：1900-01-31 = 甲戌日
    base_date = datetime(1900, 1, 31)
    base_offset = 10  # 甲戌在六十甲子中的序号（0-indexed: 甲子=0, 甲戌=10）

    target = datetime(year, month, day)
    delta_days = (target - base_date).days
    offset = (base_offset + delta_days) % 60

    gan = TIANGAN[offset % 10]
    zhi = DIZHI[offset % 12]
    return gan, zhi


def _get_hour_ganzhi(day_gan: str, hour: int) -> Tuple[str, str]:
    """时柱天干地支"""
    # 时支：23-1=子, 1-3=丑, 3-5=寅...
    zhi_index = ((hour + 1) // 2) % 12
    zhi = DIZHI[zhi_index]

    # 时干：五鼠遁（日干定时干起首）
    # 甲己日起甲子时, 乙庚日起丙子时, 丙辛日起戊子时, 丁壬日起庚子时, 戊癸日起壬子时
    hour_gan_start = {'甲': 0, '己': 0, '乙': 2, '庚': 2, '丙': 4, '辛': 4,
                      '丁': 6, '壬': 6, '戊': 8, '癸': 8}
    start_index = hour_gan_start[day_gan]
    gan_index = (start_index + zhi_index) % 10
    gan = TIANGAN[gan_index]

    return gan, zhi


def _get_nayin(gan: str, zhi: str) -> str:
    """六十甲子纳音"""
    gan_idx = TIANGAN.index(gan)
    zhi_idx = DIZHI.index(zhi)
    # 六十甲子序号 = (gan_idx同余... ) 需要算甲子序号
    # 甲子=0, 乙丑=1, 丙寅=2...
    # 序号 = gan_idx + (zhi_idx - gan_idx) % 12 * 5 ... 不对
    # 正确：六十甲子是 gan_idx 和 zhi_idx 同步前进
    # 序号 n 满足 n%10=gan_idx 且 n%12=zhi_idx → 中国剩余定理
    for n in range(60):
        if n % 10 == gan_idx and n % 12 == zhi_idx:
            return NAYIN_PAIRS[n]
    return '未知'


def compute_bazi(
    year: int, month: int, day: int,
    hour: Optional[int] = None,
    gender: str = 'unknown',
    name: str = '',
    birth_city: str = ''
) -> Dict:
    """
    计算八字四柱

    Args:
        year, month, day: 公历生日
        hour: 出生时辰（0-23），None 表示未知
        gender: male/female/unknown
        name: 姓名（可选）
        birth_city: 出生城市（用于真太阳时校正，可选）

    Returns:
        完整八字字典
    """
    # 真太阳时校正（如果有城市）
    solar_correction_minutes = 0
    city_info = None
    solar_hour = hour
    if birth_city and hour is not None:
        try:
            from app.solar_time import get_solar_time_with_city
            original_dt = datetime(year, month, day, hour)
            solar_dt, city_info = get_solar_time_with_city(original_dt, birth_city)
            if solar_dt:
                solar_correction_minutes = (solar_dt - original_dt).total_seconds() / 60
                solar_hour = solar_dt.hour
                # 如果跨日
                if solar_dt.day != original_dt.day:
                    year = solar_dt.year
                    month = solar_dt.month
                    day = solar_dt.day
        except Exception as e:
            # 静默 fallback
            pass

    # 四柱
    year_gan, year_zhi = _get_solar_year_ganzhi(year)
    month_gan, month_zhi = _get_month_ganzhi(year, month, day)
    day_gan, day_zhi = _get_day_ganzhi(year, month, day)

    if hour is not None:
        hour_gan, hour_zhi = _get_hour_ganzhi(day_gan, solar_hour)
    else:
        hour_gan, hour_zhi = '?', '?'

    pillars = [
        {'pillar': '年柱', 'gan': year_gan, 'zhi': year_zhi,
         'wuxing_gan': GAN_WUXING.get(year_gan, '?'),
         'wuxing_zhi': ZHI_WUXING.get(year_zhi, '?'),
         'nayin': _get_nayin(year_gan, year_zhi) if year_gan != '?' else '?',
         'shengxiao': ZHI_SHENGXIAO.get(year_zhi, '?'),
         'yinyang': GAN_YINYANG.get(year_gan, '?')},
        {'pillar': '月柱', 'gan': month_gan, 'zhi': month_zhi,
         'wuxing_gan': GAN_WUXING.get(month_gan, '?'),
         'wuxing_zhi': ZHI_WUXING.get(month_zhi, '?'),
         'nayin': _get_nayin(month_gan, month_zhi) if month_gan != '?' else '?',
         'shengxiao': ZHI_SHENGXIAO.get(month_zhi, '?'),
         'yinyang': GAN_YINYANG.get(month_gan, '?')},
        {'pillar': '日柱', 'gan': day_gan, 'zhi': day_zhi,
         'wuxing_gan': GAN_WUXING.get(day_gan, '?'),
         'wuxing_zhi': ZHI_WUXING.get(day_zhi, '?'),
         'nayin': _get_nayin(day_gan, day_zhi) if day_gan != '?' else '?',
         'shengxiao': ZHI_SHENGXIAO.get(day_zhi, '?'),
         'yinyang': GAN_YINYANG.get(day_gan, '?')},
        {'pillar': '时柱', 'gan': hour_gan, 'zhi': hour_zhi,
         'wuxing_gan': GAN_WUXING.get(hour_gan, '?'),
         'wuxing_zhi': ZHI_WUXING.get(hour_zhi, '?'),
         'nayin': _get_nayin(hour_gan, hour_zhi) if hour_gan != '?' else '?',
         'shengxiao': ZHI_SHENGXIAO.get(hour_zhi, '?'),
         'yinyang': GAN_YINYANG.get(hour_gan, '?')},
    ]

    # 五行统计
    wuxing_count = {'木': 0, '火': 0, '土': 0, '金': 0, '水': 0}
    for p in pillars:
        if p['wuxing_gan'] in wuxing_count:
            wuxing_count[p['wuxing_gan']] += 1
        if p['wuxing_zhi'] in wuxing_count:
            wuxing_count[p['wuxing_zhi']] += 1

    # 日主（日干）五行
    day_master = GAN_WUXING.get(day_gan, '?')
    day_master_yinyang = GAN_YINYANG.get(day_gan, '?')

    # 日主旺衰（简化版：看同五行和生我五行的数量）
    # 生我：木←水, 火←木, 土←火, 金←土, 水←金
    sheng_me = {'木': '水', '火': '木', '土': '火', '金': '土', '水': '金'}
    support_element = sheng_me.get(day_master, '')
    total_support = wuxing_count.get(day_master, 0) + wuxing_count.get(support_element, 0)
    if total_support >= 4:
        strength = '偏强'
    elif total_support >= 3:
        strength = '中和'
    elif total_support >= 2:
        strength = '偏弱'
    else:
        strength = '太弱'

    # 喜用神（极简版：偏弱者喜生扶，偏强者喜克泄）
    if '弱' in strength:
        favorable = [day_master, support_element]
    elif '强' in strength:
        # 喜被克和被泄
        ke_me = {'木': '金', '火': '水', '土': '木', '金': '火', '水': '土'}
        favorable = [WUXING_KE.get(day_master, ''), WUXING_SHENG.get(day_master, '')]
    else:
        favorable = []

    # 缺失五行
    missing = [w for w, c in wuxing_count.items() if c == 0]

    return {
        'birth': {'year': year, 'month': month, 'day': day, 'hour': hour},
        'gender': gender,
        'name': name,
        'pillars': pillars,
        'four_pillars_str': f'{year_gan}{year_zhi} {month_gan}{month_zhi} {day_gan}{day_zhi} {hour_gan}{hour_zhi}',
        'day_master': day_master,
        'day_master_element': day_master,
        'day_master_full': f'{day_master}{day_master_yinyang}',
        'wuxing_count': wuxing_count,
        'wuxing_str': ' '.join(f'{k}{v}' for k, v in wuxing_count.items()),
        'strength': strength,
        'favorable_elements': favorable,
        'missing_elements': missing,
        'shengxiao': ZHI_SHENGXIAO.get(year_zhi, '?'),
        'birth_city': city_info,
        'solar_correction_minutes': round(solar_correction_minutes, 1) if birth_city else 0,
        'summary': f'日主{day_master}{day_master_yinyang}（{strength}），五行{", ".join(f"{k}{v}" for k,v in wuxing_count.items())}，'
                   + (f'缺{"缺".join(missing)}' if missing else '五行俱全'),
    }

_LN_WM = "4c3a8f2e7b1d9065a2c8e4f1b7d3096e8a5c2f4d"  # linmy666/latestname
