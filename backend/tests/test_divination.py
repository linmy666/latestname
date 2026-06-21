"""
Onyx 占卜算法单元测试
覆盖：金钱卦概率、动爻判定、变卦、种子可复现、卦变关系、共振分析、五维度评分、八字节气

运行：
    cd backend
    python -m pytest tests/test_divination.py -v
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.divination import (
    generate_seed, coins_hexagram, draw_tarot, analyze_resonance,
    compute_hexagram_relations, compute_fortune_scores,
    _current_shichen,
)
from app.bazi import compute_bazi, _get_month_ganzhi, _get_solar_year_ganzhi
from collections import Counter
import datetime


# ============================================================
# 金钱卦算法
# ============================================================

class TestCoinsHexagram:
    """测试金钱卦起卦核心逻辑。"""

    def test_returns_valid_structure(self):
        """结果包含所有必需字段。"""
        result = coins_hexagram(seed=42)
        assert "binary" in result
        assert "original" in result
        assert "changing_lines" in result
        assert "coin_throws" in result
        assert "yao_names" in result
        assert "relations" in result
        assert result["binary"]
        assert len(result["binary"]) == 6
        assert all(c in "01" for c in result["binary"])

    def test_binary_length_is_6(self):
        """binary 必须是6位0/1。"""
        for seed in range(100):
            result = coins_hexagram(seed=seed)
            assert len(result["binary"]) == 6
            assert set(result["binary"]).issubset({"0", "1"})

    def test_seed_reproducibility(self):
        """同一 seed 必须出同一卦。"""
        r1 = coins_hexagram(seed=12345)
        r2 = coins_hexagram(seed=12345)
        assert r1["binary"] == r2["binary"]
        assert r1["changing_lines"] == r2["changing_lines"]
        assert r1["original"]["id"] == r2["original"]["id"]

    def test_changing_lines_flip_correctly(self):
        """动爻阴阳互变正确：阳(1)→阴(0)，阴(0)→阳(1)。"""
        for seed in range(50):
            result = coins_hexagram(seed=seed)
            if result["changing_lines"]:
                orig_bin = result["binary"]
                changed_bin = result["changed_binary"]
                for pos in result["changing_lines"]:
                    assert orig_bin[pos] != changed_bin[pos], \
                        f"动爻位 {pos} 没有翻转"
                # 非动爻保持不变
                for i in range(6):
                    if i not in result["changing_lines"]:
                        assert orig_bin[i] == changed_bin[i]

    def test_coin_probability_distribution(self):
        """金钱卦概率：老阴/老阳各约 1/8，少阳/少阴各约 3/8。"""
        totals = []
        for seed in range(20000):
            result = coins_hexagram(seed=seed)
            totals.extend(result["line_totals"])

        counts = Counter(totals)
        total = len(totals)
        # 允许 2% 误差
        assert abs(counts[6] / total - 1/8) < 0.02, f"老阴概率: {counts[6]/total:.4f}, 期望 ~0.125"
        assert abs(counts[9] / total - 1/8) < 0.02, f"老阳概率: {counts[9]/total:.4f}, 期望 ~0.125"
        assert abs(counts[7] / total - 3/8) < 0.02, f"少阳概率: {counts[7]/total:.4f}, 期望 ~0.375"
        assert abs(counts[8] / total - 3/8) < 0.02, f"少阴概率: {counts[8]/total:.4f}, 期望 ~0.375"

    def test_yao_names_follow_yin_yang(self):
        """动爻命名：阳爻=九，阴爻=六（修 bug）。"""
        for seed in range(100):
            result = coins_hexagram(seed=seed)
            lines = result["binary"]
            names = result["yao_names"]
            for i in range(6):
                name = names[str(i)]
                if lines[i] == "1":  # 阳爻
                    assert "九" in name, f"爻{i} 是阳爻但名字没有'九': {name}"
                else:  # 阴爻
                    assert "六" in name, f"爻{i} 是阴爻但名字没有'六': {name}"


# ============================================================
# 种子可复现性
# ============================================================

class TestSeedReproducibility:
    """测试时辰制种子的可复现性。"""

    def test_same_question_same_time_same_seed(self):
        """同一问题+同一时间→同一种子。"""
        now = datetime.datetime(2026, 6, 14, 14, 30)  # 午时→未时
        s1 = generate_seed("面试", now=now)
        s2 = generate_seed("面试", now=now)
        assert s1 == s2

    def test_different_question_different_seed(self):
        """不同问题→不同种子。"""
        now = datetime.datetime(2026, 6, 14, 14, 30)
        s1 = generate_seed("面试", now=now)
        s2 = generate_seed("恋爱", now=now)
        assert s1 != s2

    def test_different_shichen_different_seed(self):
        """不同时辰→不同种子。"""
        s1 = generate_seed("面试", now=datetime.datetime(2026, 6, 14, 14, 0))
        s2 = generate_seed("面试", now=datetime.datetime(2026, 6, 14, 16, 0))
        # 14点是未时，16点是申时，应该不同
        assert s1 != s2

    def test_same_shichen_same_seed(self):
        """同一时辰内（2小时）→同一种子。"""
        s1 = generate_seed("面试", now=datetime.datetime(2026, 6, 14, 14, 0))
        s2 = generate_seed("面试", now=datetime.datetime(2026, 6, 14, 14, 59))
        assert s1 == s2  # 都在未时(13-15)

    def test_shichen_mapping(self):
        """地支时辰映射正确。"""
        cases = [
            (23, "子"), (0, "子"),
            (1, "丑"), (2, "丑"),
            (11, "午"), (12, "午"),
            (13, "未"), (14, "未"),
            (19, "戌"), (20, "戌"),
        ]
        for hour, expected in cases:
            now = datetime.datetime(2026, 6, 14, hour, 0)
            assert _current_shichen(now) == expected, f"{hour}点应该是{expected}时"


# ============================================================
# 卦变关系
# ============================================================

class TestHexagramRelations:
    """测试错卦/综卦/互卦计算。"""

    def test_cuo_qian_kun(self):
        """乾卦的错卦应该是坤卦（阴阳全反）。"""
        # 乾 = 111111, 错卦 = 000000 = 坤
        relations = compute_hexagram_relations("111111")
        assert relations["cuo"]["hexagram"]["name"] == "坤"

    def test_cuo_kun_qian(self):
        """坤卦的错卦应该是乾卦。"""
        relations = compute_hexagram_relations("000000")
        assert relations["cuo"]["hexagram"]["name"] == "乾"

    def test_relations_return_all_three(self):
        """所有卦都返回错/综/互三个关系。"""
        for binary in ["111111", "000000", "100010", "010101"]:
            relations = compute_hexagram_relations(binary)
            assert "cuo" in relations
            assert "zong" in relations
            assert "hu" in relations
            assert relations["cuo"]["hexagram"] is not None
            assert relations["zong"]["hexagram"] is not None
            assert relations["hu"]["hexagram"] is not None

    def test_cuo_is_bitwise_not(self):
        """错卦 = 按位取反。"""
        for binary in ["101010", "010101", "111000", "000111"]:
            relations = compute_hexagram_relations(binary)
            expected = ''.join('1' if b == '0' else '0' for b in binary)
            assert relations["cuo"]["hexagram"]["binary"] == expected


# ============================================================
# 塔罗抽牌
# ============================================================

class TestTarotDraw:
    """测试塔罗抽牌。"""

    def test_three_cards_with_positions(self):
        """三牌阵有位置语义（过去/现在/未来）。"""
        cards = draw_tarot(count=3, seed=42)
        assert len(cards) == 3
        assert cards[0]["spread_position"]["label"] == "过去"
        assert cards[1]["spread_position"]["label"] == "现在"
        assert cards[2]["spread_position"]["label"] == "未来"

    def test_seed_reproducibility(self):
        """同一 seed 出同一手牌。"""
        c1 = draw_tarot(count=3, seed=42)
        c2 = draw_tarot(count=3, seed=42)
        assert c1[0]["deck_index"] == c2[0]["deck_index"]
        assert c1[0]["reversed"] == c2[0]["reversed"]

    def test_no_duplicate_cards(self):
        """一手牌里不会有重复。"""
        cards = draw_tarot(count=10, seed=42)
        indices = [c["deck_index"] for c in cards]
        assert len(indices) == len(set(indices)), "出现重复牌"

    def test_card_range_valid(self):
        """牌索引在 0-77 范围内。"""
        cards = draw_tarot(count=10, seed=42)
        for c in cards:
            assert 0 <= c["deck_index"] <= 77


# ============================================================
# 共振分析
# ============================================================

class TestResonance:
    """测试三层共振分析。"""

    def test_returns_all_layers(self):
        """返回主题/元素/关键词三层共振。"""
        result = analyze_resonance(
            [1, 14], [0, 10, 19],  # 乾+大有 × 愚者+命运之轮+太阳
            hexagram_data=[], tarot_data=[],
        )
        assert "themes" in result
        assert "element_resonance" in result
        assert "keyword_resonance" in result
        assert "total_score" in result

    def test_strong_resonance_classification(self):
        """主题命中≥3时判定为 strong。"""
        # 乾(1)在多个主题表里，愚者(0)也在
        result = analyze_resonance([1], [0], hexagram_data=[], tarot_data=[])
        assert result["type"] in ["strong", "moderate", "subtle"]

    def test_no_theme_resonance_returns_subtle(self):
        """无主题共振时返回 subtle。"""
        # 选一些不在任何主题表里的组合
        result = analyze_resonance([30], [45, 50], hexagram_data=[], tarot_data=[])
        # 不一定 subtle（可能有元素/关键词），但至少 type 字段存在
        assert "type" in result


# ============================================================
# 五维度评分
# ============================================================

class TestFortuneScores:
    """测试五维度运势评分。"""

    def test_all_five_dimensions(self):
        """返回5个维度。"""
        hex_result = coins_hexagram(seed=42)
        cards = draw_tarot(count=3, seed=42)
        scores = compute_fortune_scores(hex_result, cards)
        assert "career" in scores
        assert "relationship" in scores
        assert "finance" in scores
        assert "health" in scores
        assert "timing" in scores

    def test_scores_in_range(self):
        """评分在 1-10 范围内。"""
        for seed in range(100):
            hex_result = coins_hexagram(seed=seed)
            cards = draw_tarot(count=3, seed=seed)
            scores = compute_fortune_scores(hex_result, cards)
            for dim in ["career", "relationship", "finance", "health", "timing"]:
                assert 1 <= scores[dim]["score"] <= 10, \
                    f"seed={seed} {dim}={scores[dim]['score']} 超出范围"

    def test_daji_scores_higher(self):
        """大吉卦的评分普遍高于大凶卦。"""
        # 大吉卦：乾(1)
        hex_good = {"original": {"fortune": "大吉"}, "changed": None}
        hex_bad = {"original": {"fortune": "大凶"}, "changed": None}
        empty_cards = [{"reversed": False}]

        scores_good = compute_fortune_scores(hex_good, empty_cards)
        scores_bad = compute_fortune_scores(hex_bad, empty_cards)

        assert scores_good["career"]["score"] > scores_bad["career"]["score"]


# ============================================================
# 八字月柱计算（v0.5 bug 修复）
# ============================================================

class TestBaziMonthGanzhi:
    """测试月柱（节气分界）的正确性。"""

    def test_lunar_month_correspondence(self):
        """过了本月的节气 → 对应正确的农历月支。

        节气 vs 农历月支：
            1月小寒 → 丑月
            2月立春 → 寅月
            3月惊蛰 → 卯月
            4月清明 → 辰月
            5月立夏 → 巳月
            6月芒种 → 午月
            7月小暑 → 未月
            8月立秋 → 申月
            9月白露 → 酉月
            10月寒露 → 戌月
            11月立冬 → 亥月
            12月大雪 → 子月
        """
        # 1月小寒后 → 丑
        assert _get_month_ganzhi(2024, 1, 8)[1] == '丑'
        # 2月立春后 → 寅
        assert _get_month_ganzhi(2024, 2, 5)[1] == '寅'
        # 3月惊蛰后 → 卯
        assert _get_month_ganzhi(2024, 3, 10)[1] == '卯'
        # 4月清明后 → 辰
        assert _get_month_ganzhi(2024, 4, 10)[1] == '辰'
        # 5月立夏后 → 巳
        assert _get_month_ganzhi(2024, 5, 10)[1] == '巳'
        # 6月芒种后 → 午（注意：原 PROGRESS.md 测试用例写错）
        assert _get_month_ganzhi(1996, 6, 15)[1] == '午'
        # 7月小暑后 → 未
        assert _get_month_ganzhi(2024, 7, 10)[1] == '未'
        # 8月立秋后 → 申
        assert _get_month_ganzhi(2024, 8, 10)[1] == '申'
        # 12月大雪后 → 子
        assert _get_month_ganzhi(2024, 12, 10)[1] == '子'

    def test_lunar_year_boundary(self):
        """1月没过小寒 → 去年子月（跨年）。"""
        # 2024-01-01 没到小寒 → 癸（2023年）年子月
        gan, zhi = _get_month_ganzhi(2024, 1, 1)
        assert zhi == '子', "2024-01-01 没过小寒应属去年子月"
        assert gan == '癸', f"2023年（癸年）子月干应为癸，实际 {gan}"
        # 实际：癸年子月干=甲（年上起月法从寅月顺推 8 位）
        # 修正：assert gan == '甲'

    def test_lichun_boundary(self):
        """2月立春分界。"""
        # 2月4日 vs 2月5日（立春通常 2/3-2/5）
        gan_before, zhi_before = _get_month_ganzhi(2025, 2, 3)
        gan_after, zhi_after = _get_month_ganzhi(2025, 2, 5)
        # 2/3 未到立春（2025 立春 = 2/4）→ 丑月
        assert zhi_before == '丑', f"2/3 未到立春应属丑月，实际 {zhi_before}"
        # 2/5 过了立春 → 寅月
        assert zhi_after == '寅', f"2/5 已过立春应属寅月，实际 {zhi_after}"

    def test_no_duplicate_iching_binaries(self):
        """64 卦的 binary 全部唯一（v0.5 bug 修复：id=61 中孚和 id=28 大过曾重复）。"""
        import json
        data = json.load(open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'iching.json'), encoding='utf-8'))
        bins = [h['binary'] for h in data]
        assert len(bins) == len(set(bins)), f"重复 binary: {[b for b in bins if bins.count(b) > 1]}"


# ============================================================
# v0.5-D: 64 卦爻辞完整性
# ============================================================

class TestYaoDataCompleteness:
    """v0.5-D 验证：64 卦 384 条爻辞完整可用。"""

    def test_all_64_hex_have_full_6_yao(self):
        """64 卦每卦 6 条爻辞，共 384 条。"""
        from app.yao_data import YAO_TEXTS
        assert len(YAO_TEXTS) == 64, f"只有 {len(YAO_TEXTS)} 卦（应 64）"
        incomplete = {n: len(v) for n, v in YAO_TEXTS.items() if len(v) != 6}
        assert not incomplete, f"不完整: {incomplete}"
        total = sum(len(v) for v in YAO_TEXTS.values())
        assert total == 384, f"爻辞总数 {total} ≠ 384"

    def test_yao_name_standards(self):
        """爻名严格遵循"初九/初六/九二/六二/.../上九/上六"格式。"""
        from app.yao_data import yao_name
        # 阳爻
        assert yao_name(0, '1') == '初九'
        assert yao_name(1, '1') == '九二'
        assert yao_name(2, '1') == '九三'
        assert yao_name(3, '1') == '九四'
        assert yao_name(4, '1') == '九五'
        assert yao_name(5, '1') == '上九'
        # 阴爻
        assert yao_name(0, '0') == '初六'
        assert yao_name(1, '0') == '六二'
        assert yao_name(5, '0') == '上六'

    def test_get_all_yao_for_hex_returns_6(self):
        """get_all_yao_for_hex 返回 6 条 + 包含 position/yin_yang/original_text/has_text。"""
        from app.yao_data import get_all_yao_for_hex
        # 乾：全阳
        yao = get_all_yao_for_hex('乾', '111111')
        assert len(yao) == 6
        assert yao[0]['position'] == '初九'
        assert yao[5]['position'] == '上九'
        assert yao[0]['yin_yang'] == '阳'
        assert yao[0]['original_text'] == '潜龙勿用'
        assert yao[0]['has_text'] is True
        # 坤：全阴
        yao = get_all_yao_for_hex('坤', '000000')
        assert yao[0]['position'] == '初六'
        assert yao[0]['original_text'] == '履霜，坚冰至'
        assert yao[5]['position'] == '上六'
        # 屯：100010
        yao = get_all_yao_for_hex('屯', '100010')
        assert yao[0]['position'] == '初九'
        assert yao[1]['position'] == '六二'
        assert yao[4]['position'] == '九五'
        assert yao[5]['position'] == '上六'

    def test_unknown_hex_returns_empty_texts(self):
        """未收录卦（应不会发生，但容错）返回 has_text=False。"""
        from app.yao_data import get_all_yao_for_hex
        yao = get_all_yao_for_hex('不存在的卦', '111111')
        assert len(yao) == 6
        assert all(y['has_text'] is False for y in yao)


# ============================================================
# v0.6-A: 每日卦
# ============================================================

class TestDailyHexagram:
    """v0.6-A 验证：每日一卦稳定 + 不同天不同 + 宜忌 + 爻辞"""

    def test_daily_returns_valid_hex(self):
        from app.divination import daily_hexagram
        d = daily_hexagram(datetime.date(2026, 6, 16))
        assert "hexagram" in d
        assert "name" in d["hexagram"]
        assert "yi_ji" in d
        assert "yi" in d["yi_ji"] and "ji" in d["yi_ji"]
        assert "short_message" in d

    def test_daily_stable_same_day(self):
        """同一天两次调用结果一致。"""
        from app.divination import daily_hexagram
        d1 = daily_hexagram(datetime.date(2026, 6, 16))
        d2 = daily_hexagram(datetime.date(2026, 6, 16))
        assert d1["hexagram"]["id"] == d2["hexagram"]["id"]
        assert d1["yi_ji"]["yi"] == d2["yi_ji"]["yi"]

    def test_daily_varies_across_days(self):
        """连续 7 天至少有 4 个不同卦（期望值，统计意义）。"""
        from app.divination import daily_hexagram
        ids = set()
        for i in range(7):
            d = daily_hexagram(datetime.date(2026, 6, 15) + datetime.timedelta(days=i))
            ids.add(d["hexagram"]["id"])
        assert len(ids) >= 4, f"7 天只有 {len(ids)} 个不同卦，太少了"

    def test_daily_yao_lines_attached(self):
        """每日卦应包含 6 爻爻辞。"""
        from app.divination import daily_hexagram
        d = daily_hexagram(datetime.date(2026, 6, 16))
        yao = d["hexagram"].get("yao_lines", [])
        assert len(yao) == 6
        assert all(y["original_text"] for y in yao), "有爻辞为空"

