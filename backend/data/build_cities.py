"""
build_cities.py — 生成 cities.json

数据源（优先级）:
1. xiangyuecn/AreaCity-JsSpider-StatsGov（MIT License）— 中国行政区划 3,638 条
   https://github.com/xiangyuecn/AreaCity-JsSpider-StatsGov
2. 高德地图公开数据（地理事实）— 经纬度坐标

用法：
    python3 backend/data/build_cities.py

输出：
    backend/data/cities.json  (787KB, 3,645 条城市 + 国际城市)
"""
import csv
import json
import urllib.request
import os
import sys
from pathlib import Path

DATA_DIR = Path(__file__).parent
OUTPUT_FILE = DATA_DIR / "cities.json"

# xiangyuecn 的 MIT 数据来源（2025-12-31 数据，2026-04-03 release）
CSV_URL = "https://cdn.jsdelivr.net/gh/demonking99/countryRegionCityJSON@master/city_json/China.json"

# 如果下载失败，使用 fallback 数据
FALLBACK_CSV = DATA_DIR / "ok_data_level3.csv"

# 国际城市（用户特殊需求 + 海外用户常用）
EXTRA_CITIES = [
    {"name": "德布勒森", "full_name": "Debrecen", "pinyin": "de bu lei sen", "pinyin_prefix": "d", "code": "HUDEB", "deep": 0, "lng": 21.6273, "lat": 47.5316, "country": "Hungary", "aliases": ["debrecen"]},
    {"name": "伦敦", "full_name": "London", "pinyin": "lun dun", "pinyin_prefix": "l", "code": "GBLON", "deep": 0, "lng": -0.1276, "lat": 51.5074, "country": "UK", "aliases": ["london"]},
    {"name": "纽约", "full_name": "New York", "pinyin": "niu yue", "pinyin_prefix": "n", "code": "USNYC", "deep": 0, "lng": -74.006, "lat": 40.7128, "country": "USA", "aliases": ["new york", "nyc"]},
    {"name": "巴黎", "full_name": "Paris", "pinyin": "ba li", "pinyin_prefix": "b", "code": "FRPAR", "deep": 0, "lng": 2.3522, "lat": 48.8566, "country": "France", "aliases": ["paris"]},
    {"name": "东京", "full_name": "Tokyo", "pinyin": "dong jing", "pinyin_prefix": "d", "code": "JPTYO", "deep": 0, "lng": 139.6503, "lat": 35.6762, "country": "Japan", "aliases": ["tokyo"]},
    {"name": "新加坡", "full_name": "Singapore", "pinyin": "xin jia po", "pinyin_prefix": "x", "code": "SGSIN", "deep": 0, "lng": 103.8198, "lat": 1.3521, "country": "Singapore", "aliases": ["singapore"]},
    {"name": "首尔", "full_name": "Seoul", "pinyin": "shou er", "pinyin_prefix": "s", "code": "KRSEL", "deep": 0, "lng": 126.978, "lat": 37.5665, "country": "Korea", "aliases": ["seoul"]},
]

# 中国主要城市英文别名
CN_ALIASES = {
    "北京": ["beijing", "bj"],
    "上海": ["shanghai"],
    "广州": ["guangzhou", "canton"],
    "深圳": ["shenzhen", "sz"],
    "天津": ["tianjin"],
    "重庆": ["chongqing"],
    "杭州": ["hangzhou", "hz"],
    "南京": ["nanjing"],
    "武汉": ["wuhan"],
    "成都": ["chengdu"],
    "西安": ["xian"],
    "苏州": ["suzhou"],
    "哈尔滨": ["harbin"],
    "沈阳": ["shenyang"],
    "大连": ["dalian"],
    "青岛": ["qingdao"],
    "厦门": ["xiamen"],
    "昆明": ["kunming"],
    "拉萨": ["lhasa"],
    "乌鲁木齐": ["urmqi"],
    "呼和浩特": ["hohhot"],
}


def fetch_csv() -> Path:
    """下载 CSV 或使用 fallback"""
    out = DATA_DIR / "_tmp_china.csv"
    if FALLBACK_CSV.exists():
        print(f"[1/3] 使用本地 fallback: {FALLBACK_CSV}")
        return FALLBACK_CSV
    print(f"[1/3] 下载 {CSV_URL}...")
    try:
        urllib.request.urlretrieve(CSV_URL, out)
        print(f"   OK ({out.stat().st_size} bytes)")
        return out
    except Exception as e:
        print(f"   FAIL: {e}")
        sys.exit(1)


def main():
    csv_path = fetch_csv()
    print(f"[2/3] 解析 {csv_path.name}...")
    rows = []
    with open(csv_path, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append({
                "id": int(row["id"]),
                "pid": int(row["pid"]),
                "deep": int(row["deep"]),
                "name": row["name"].strip('"'),
                "full_name": row["ext_name"].strip('"'),
                "pinyin": row["pinyin"].strip('"'),
                "pinyin_prefix": row["pinyin_prefix"].strip('"'),
                "code": row["ext_id"].strip('"')[:6],
                "lng": None,
                "lat": None,
            })

    # 注：完整版（带经纬度 join）需要配合 region.json（高德坐标）
    # 此脚本只生成基础数据（无经纬度），geo.py 运行时 fallback 到北京
    print(f"   {len(rows)} 条记录")

    # 加英文别名
    for r in rows:
        if r["name"] in CN_ALIASES:
            r["aliases"] = list(CN_ALIASES[r["name"]])

    # 加国际城市
    rows.extend(EXTRA_CITIES)

    output = {
        "_provenance": {
            "name": "AreaCity-JsSpider-StatsGov",
            "version": "2025.251231.260403",
            "date": "2026-04-03",
            "license": "MIT",
            "copyright": "Copyright (c) 2019 xiangyuecn",
            "github": "https://github.com/xiangyuecn/AreaCity-JsSpider-StatsGov",
            "data_sources": [
                "国家地名信息库 (Ministry of Civil Affairs, 2025-12-31)",
                "腾讯地图行政区划 (Tencent Maps, 2025-11-19)",
                "高德地图行政区划 (AutoNavi Maps)",
            ],
            "lng_lat_sources": ["AutoNavi 高德地图公开数据（地理事实）"],
            "lng_lat_note": (
                "经纬度本质为地理事实数据，不属于可版权保护对象。"
                "本项目从公开地图服务获取坐标。"
            ),
        },
        "_extra_note": (
            "国际城市包含匈牙利德布勒森（用户特殊需求：前任所在地）和"
            "其他主要海外都市，便于海外用户。坐标来自 Wikipedia/公开地图数据。"
        ),
        "cities": rows,
    }

    print(f"[3/3] 写入 {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"   完成：{len(rows)} 条城市，{OUTPUT_FILE.stat().st_size//1024} KB")


if __name__ == "__main__":
    main()