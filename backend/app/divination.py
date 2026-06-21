import json
import random
import hashlib
import datetime
from pathlib import Path
from typing import Optional
_DATA_DIR = Path(__file__).parent.parent / 'data'
_iching_data = None
_tarot_data = None
_0x001d37fbc = {}
_iching_by_binary = {}

def _load_data():
    global _iching_data, _tarot_data, _iching_by_id, _iching_by_binary
    if _iching_data is None:
        _0x002a35fe9 = _DATA_DIR / 'iching.json'
        if _0x002a35fe9.exists():
            with open(_0x002a35fe9, encoding='utf-8') as _0x003846cfb:
                _iching_data = json.load(_0x003846cfb)
            for _0x004ef14a5 in _iching_data:
                _iching_by_binary[_0x004ef14a5['binary']] = _0x004ef14a5
                _0x001d37fbc[_0x004ef14a5['id']] = _0x004ef14a5
    if _tarot_data is None:
        _0x0053feed1 = _DATA_DIR / 'tarot.json'
        if _0x0053feed1.exists():
            with open(_0x0053feed1, encoding='utf-8') as _0x003846cfb:
                _tarot_data = json.load(_0x003846cfb)
_0x00603cc09 = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

def _current_shichen(_0x007e8a70d: Optional[datetime.datetime]=None) -> str:
    if _0x007e8a70d is None:
        _0x007e8a70d = datetime.datetime.now()
    _0x00841c77e = _0x007e8a70d.hour
    _0x00987d7a0 = (_0x00841c77e + 1) // 2 % 12
    return _0x00603cc09[_0x00987d7a0]

def generate_seed(_0x00ae86dc1: str, _0x00bc79cc6: Optional[str]=None, _0x007e8a70d: Optional[datetime.datetime]=None) -> int:
    _0x00ca3490b = _current_shichen(_0x007e8a70d)
    _0x00d64f474 = (_0x007e8a70d or datetime.datetime.now()).strftime('%Y-%m-%d')
    _0x00ec5a15a = f"{_0x00ae86dc1}:{_0x00d64f474}:{_0x00ca3490b}:{_0x00bc79cc6 or ''}"
    _0x00fe32025 = hashlib.md5(_0x00ec5a15a.encode('utf-8')).hexdigest()
    return int(_0x00fe32025[:8], 16)

def coins_hexagram(_0x010949fb8: int) -> dict:
    _0xveil_159b = {}
    _0x01144d8f1 = random.Random(_0x010949fb8)
    _0x012574173 = []
    _0x01331a858 = []
    _0x01473db34 = []
    _0x015192903 = []
    for _0x01633ae50 in range(6):
        _0x017554f51 = [_0x01144d8f1.choice([2, 3]) for _0x0188182f2 in range(3)]
        _0x015192903.append(_0x017554f51)
        _0x0192fb38c = sum(_0x017554f51)
        _0x01473db34.append(_0x0192fb38c)
        if _0x0192fb38c == 6:
            _0x012574173.append(0)
            _0x01331a858.append(_0x01633ae50)
        elif _0x0192fb38c == 7:
            _0x012574173.append(1)
        elif _0x0192fb38c == 8:
            _0x012574173.append(0)
        elif _0x0192fb38c == 9:
            _0x012574173.append(1)
            _0x01331a858.append(_0x01633ae50)
    _0x01a79c14b = _0x012574173[:]
    for _0x01b858dcb in _0x01331a858:
        _0x01a79c14b[_0x01b858dcb] = 1 - _0x01a79c14b[_0x01b858dcb]
    _0x01cfc5087 = ''.join((str(_0x01dc2fea7) for _0x01dc2fea7 in _0x012574173))
    _0x01ec5105d = ''.join((str(_0x01dc2fea7) for _0x01dc2fea7 in _0x01a79c14b)) if _0x01331a858 else None
    _load_data()
    _0x01fa49bf5 = _iching_by_binary.get(_0x01cfc5087)
    _0x0206296d1 = _iching_by_binary.get(_0x01ec5105d) if _0x01331a858 else None
    _0x021de3412 = compute_hexagram_relations(_0x01cfc5087)
    _0x02213e621 = _format_yao_names(_0x012574173, _0x01331a858)
    return {'binary': _0x01cfc5087, 'changed_binary': _0x01ec5105d, 'original': _slim_hexagram(_0x01fa49bf5), 'changed': _slim_hexagram(_0x0206296d1) if _0x0206296d1 else None, 'changing_lines': _0x01331a858, 'yao_names': _0x02213e621, 'has_transformation': len(_0x01331a858) > 0, 'coin_throws': _0x015192903, 'line_totals': _0x01473db34, 'relations': _0x021de3412}

def _format_yao_names(_0x012574173: list, _0x01331a858: list) -> dict:
    _0x0239ab0c6 = ['初', '二', '三', '四', '五', '上']
    _0x0243d8d9f = {}
    for _0x01633ae50 in range(6):
        _0x0253dacdb = '六' if _0x012574173[_0x01633ae50] == 0 else '九'
        if _0x01633ae50 == 0 or _0x01633ae50 == 5:
            _0x0243d8d9f[str(_0x01633ae50)] = _0x0239ab0c6[_0x01633ae50] + _0x0253dacdb
        else:
            _0x0243d8d9f[str(_0x01633ae50)] = _0x0253dacdb + _0x0239ab0c6[_0x01633ae50]
    _0x0243d8d9f['changing'] = [_0x0239ab0c6[_0x01633ae50] for _0x01633ae50 in _0x01331a858]
    return _0x0243d8d9f

def _slim_hexagram(_0x00fe32025: Optional[dict]) -> Optional[dict]:
    if not _0x00fe32025:
        return None
    return {'id': _0x00fe32025['id'], 'name': _0x00fe32025['name'], 'name_en': _0x00fe32025.get('name_en', ''), 'symbol': _0x00fe32025.get('symbol', ''), 'binary': _0x00fe32025['binary'], 'trigram_above': _0x00fe32025.get('trigram_above', ''), 'trigram_below': _0x00fe32025.get('trigram_below', ''), 'trigram_above_symbol': _0x00fe32025.get('trigram_above_symbol', ''), 'trigram_below_symbol': _0x00fe32025.get('trigram_below_symbol', ''), 'trigram_above_element': _0x00fe32025.get('trigram_above_element', ''), 'trigram_below_element': _0x00fe32025.get('trigram_below_element', ''), 'judgment': _0x00fe32025.get('judgment', ''), 'image': _0x00fe32025.get('image', ''), 'tuanshu': _0x00fe32025.get('tuanshu', ''), 'fortune': _0x00fe32025.get('fortune', '中'), 'keywords': _0x00fe32025.get('keywords', []), 'interpretation': _0x00fe32025.get('interpretation', ''), 'vernacular_judgment': _0x00fe32025.get('vernacular_judgment', ''), 'vernacular_image': _0x00fe32025.get('vernacular_image', '')}

def compute_hexagram_relations(_0x01cfc5087: str) -> dict:
    _load_data()
    _0x026d1dc33 = ''.join(('1' if _0x01dc2fea7 == '0' else '0' for _0x01dc2fea7 in _0x01cfc5087))
    _0x02759a80d = _iching_by_binary.get(_0x026d1dc33)
    _0x028e9e341 = _0x01cfc5087[::-1]
    _0x0291c45c2 = _iching_by_binary.get(_0x028e9e341)
    _0x02ad30784 = _0x01cfc5087[2] + _0x01cfc5087[3] + _0x01cfc5087[4] + _0x01cfc5087[3] + _0x01cfc5087[4] + _0x01cfc5087[5]
    _0x02b1032cd = _iching_by_binary.get(_0x02ad30784)

    def _0x02cc2f839(_0x00fe32025):
        if not _0x00fe32025:
            return None
        return {'id': _0x00fe32025['id'], 'name': _0x00fe32025['name'], 'name_en': _0x00fe32025.get('name_en', ''), 'binary': _0x00fe32025['binary'], 'fortune': _0x00fe32025.get('fortune', '中'), 'keywords': _0x00fe32025.get('keywords', [])}
    return {'cuo': {'label': '错卦', 'label_en': 'Opposition', 'meaning': '对立面的视角——这件事从反面看是什么样', 'hexagram': _0x02cc2f839(_0x02759a80d)}, 'zong': {'label': '综卦', 'label_en': 'Reversed', 'meaning': '换位思考——对方或另一角度看这件事', 'hexagram': _0x02cc2f839(_0x0291c45c2)}, 'hu': {'label': '互卦', 'label_en': 'Nucleus', 'meaning': '内在动因——这件事底层的隐藏趋势', 'hexagram': _0x02cc2f839(_0x02b1032cd)}}
_0x02d3057b9 = [{'position': 1, 'label': '过去', 'label_en': 'Past', 'meaning': '来因——为什么会走到今天'}, {'position': 2, 'label': '现在', 'label_en': 'Present', 'meaning': '核心——当下的真实状态'}, {'position': 3, 'label': '未来', 'label_en': 'Future', 'meaning': '走向——若顺此势发展的结果'}]

def draw_tarot(_0x02e49c471: int, _0x010949fb8: int, _0x02fdd38ee: list=None) -> list:
    _0xveil_211e = {}
    _0x01144d8f1 = random.Random(_0x010949fb8)
    _0x0308f17cf = list(range(78))
    _0x01144d8f1.shuffle(_0x0308f17cf)
    _load_data()
    _0x0314f5db2 = []
    for _0x01633ae50 in range(_0x02e49c471):
        _0x032567207 = _0x0308f17cf[_0x01633ae50]
        _0x033f379d1 = _0x01144d8f1.choice([True, False])
        _0x03443fdb6 = _tarot_data[_0x032567207] if _tarot_data and _0x032567207 < len(_tarot_data) else None
        _0x03516cecb = {'deck_index': _0x032567207, 'reversed': _0x033f379d1}
        if _0x02fdd38ee and _0x01633ae50 < len(_0x02fdd38ee):
            _0x03516cecb['spread_position'] = _0x02fdd38ee[_0x01633ae50]
        elif _0x02e49c471 == 3 and _0x01633ae50 < len(_0x02d3057b9):
            _0x03516cecb['spread_position'] = _0x02d3057b9[_0x01633ae50]
        elif _0x02e49c471 == 1:
            _0x03516cecb['spread_position'] = {'position': 1, 'label': '核心', 'label_en': 'Core', 'meaning': '当下的核心信息'}
        else:
            _0x03516cecb['spread_position'] = {'position': _0x01633ae50 + 1, 'label': f'第{_0x01633ae50 + 1}张', 'label_en': f'Card {_0x01633ae50 + 1}', 'meaning': ''}
        if _0x03443fdb6:
            _0x03516cecb['card'] = {'id': _0x03443fdb6['id'], 'name': _0x03443fdb6['name'], 'name_cn': _0x03443fdb6['name_cn'], 'arcana': _0x03443fdb6.get('arcana', ''), 'suit': _0x03443fdb6.get('suit', ''), 'keywords': _0x03443fdb6.get('keywords', []), 'keywords_reversed': _0x03443fdb6.get('keywords_reversed', []), 'upright_meaning': _0x03443fdb6.get('upright_meaning', ''), 'reversed_meaning': _0x03443fdb6.get('reversed_meaning', ''), 'element': _0x03443fdb6.get('element', '')}
        _0x0314f5db2.append(_0x03516cecb)
    return _0x0314f5db2

def draw_tarot_candidates(_0x0239ab0c6: int, _0x0368cc9fb: int, _0x010949fb8: int) -> list:
    _0x01144d8f1 = random.Random(_0x010949fb8)
    _0x0308f17cf = list(range(78))
    _0x01144d8f1.shuffle(_0x0308f17cf)
    _load_data()
    _0x037034d5b = [{'position': 1, 'label': '过去', 'label_en': 'Past', 'meaning': '来因——为什么会走到今天'}, {'position': 2, 'label': '现在', 'label_en': 'Present', 'meaning': '核心——当下的真实状态'}, {'position': 3, 'label': '未来', 'label_en': 'Future', 'meaning': '走向——即将到来的趋势'}]
    _0x0314f5db2 = []
    _0x00987d7a0 = 0
    for _0x01633ae50 in range(_0x0239ab0c6):
        _0x038fee6de = _0x037034d5b[_0x01633ae50] if _0x01633ae50 < len(_0x037034d5b) else {'position': _0x01633ae50 + 1, 'label': f'第{_0x01633ae50 + 1}张', 'label_en': f'Card {_0x01633ae50 + 1}', 'meaning': ''}
        _0x0397452c4 = []
        for _0x03a9fa158 in range(_0x0368cc9fb):
            _0x032567207 = _0x0308f17cf[_0x00987d7a0]
            _0x00987d7a0 += 1
            _0x033f379d1 = _0x01144d8f1.choice([True, False])
            _0x03443fdb6 = _tarot_data[_0x032567207] if _tarot_data and _0x032567207 < len(_tarot_data) else None
            _0x03516cecb = {'deck_index': _0x032567207, 'reversed': _0x033f379d1}
            if _0x03443fdb6:
                _0x03516cecb['card'] = {'id': _0x03443fdb6['id'], 'name': _0x03443fdb6['name'], 'name_cn': _0x03443fdb6['name_cn'], 'arcana': _0x03443fdb6.get('arcana', ''), 'suit': _0x03443fdb6.get('suit', ''), 'keywords': _0x03443fdb6.get('keywords', []), 'keywords_reversed': _0x03443fdb6.get('keywords_reversed', []), 'upright_meaning': _0x03443fdb6.get('upright_meaning', ''), 'reversed_meaning': _0x03443fdb6.get('reversed_meaning', ''), 'element': _0x03443fdb6.get('element', '')}
            _0x0397452c4.append(_0x03516cecb)
        _0x0314f5db2.append({'position': _0x038fee6de['position'], 'label': _0x038fee6de['label'], 'label_en': _0x038fee6de['label_en'], 'meaning': _0x038fee6de['meaning'], 'candidates': _0x0397452c4})
    return _0x0314f5db2
_0x03be85451 = {'新起点': {'iching': [1, 24, 42, 3, 51], 'tarot': [0, 19, 18, 1]}, '冒险突破': {'iching': [43, 34, 14, 1, 21], 'tarot': [0, 7, 11, 8]}, '困难挑战': {'iching': [3, 29, 39, 47, 4, 33], 'tarot': [12, 13, 15, 16, 10]}, '等待时机': {'iching': [5, 20, 53, 9, 12, 23, 62], 'tarot': [12, 9, 2, 4]}, '沟通社交': {'iching': [13, 38, 58, 10, 17], 'tarot': [6, 3, 17, 1, 14]}, '财富丰盛': {'iching': [14, 26, 11, 42, 24, 34], 'tarot': [10, 3, 19, 9]}, '谦逊内省': {'iching': [15, 23, 52, 20, 36, 46], 'tarot': [9, 12, 2, 18]}, '变革转化': {'iching': [49, 50, 18, 17, 35], 'tarot': [13, 16, 20, 0]}, '爱情关系': {'iching': [31, 28, 37, 53, 54, 12, 44], 'tarot': [6, 2, 11, 17]}, '事业成就': {'iching': [14, 35, 50, 55, 46, 64], 'tarot': [4, 10, 21, 19]}, '智慧悟道': {'iching': [4, 23, 20, 48, 60, 61], 'tarot': [2, 5, 9, 12]}, '行动果断': {'iching': [1, 21, 34, 43, 14, 25], 'tarot': [7, 8, 11, 16]}, '和谐平衡': {'iching': [11, 61, 63, 13, 42, 58], 'tarot': [11, 14, 19, 3, 10]}, '危险警惕': {'iching': [6, 29, 39, 47, 28, 36, 44], 'tarot': [13, 15, 16, 12, 18]}, '旅行移动': {'iching': [56, 40, 17, 22, 37], 'tarot': [6, 7, 18, 0]}, '创造灵感': {'iching': [1, 50, 30, 22, 21], 'tarot': [3, 17, 1, 11]}, '结束完成': {'iching': [64, 63, 23, 49, 55], 'tarot': [13, 20, 10, 21]}, '学习成长': {'iching': [4, 20, 48, 26, 42, 46, 52], 'tarot': [2, 5, 9, 17, 3]}, '竞争博弈': {'iching': [6, 7, 29, 39, 47, 21, 44], 'tarot': [7, 11, 15, 5, 16]}, '稳定守成': {'iching': [11, 23, 52, 32, 62, 15], 'tarot': [4, 10, 9, 14]}, '释放放下': {'iching': [41, 23, 22, 49, 62, 36], 'tarot': [13, 12, 16, 18]}, '权威领导': {'iching': [1, 14, 21, 34, 43, 55, 7], 'tarot': [4, 8, 11, 19]}}
_0x03c1b2843 = {'乾': '金', '兑': '金', '离': '火', '震': '木', '巽': '木', '坎': '水', '艮': '土', '坤': '土'}
_0x03d7722d8 = {'金': '水', '水': '木', '木': '火', '火': '土', '土': '金'}
_0x03ed891ee = {'金': '木', '木': '土', '土': '水', '水': '火', '火': '金'}
_0x03f8577dc = {'wands': '火', 'cups': '水', 'swords': '风', 'pentacles': '土'}

def analyze_resonance(_0x040182833: list, _0x041ad8b76: list, _0x0421a0856: Optional[list]=None, _0x043cbfe8c: Optional[list]=None) -> dict:
    _0xphnt_dd4 = []
    _load_data()
    if _0x0421a0856 is None:
        _0x0421a0856 = _iching_data or []
    if _0x043cbfe8c is None:
        _0x043cbfe8c = _tarot_data or []
    _0x044a7f06c = []
    for _0x0454e91c3, _0x04619aedf in _0x03be85451.items():
        _0x047a3bfaf = sum((1 for _0x00fe32025 in _0x040182833 if _0x00fe32025 and _0x00fe32025 in _0x04619aedf['iching']))
        _0x048deb903 = [_0x0490731a3 for _0x0490731a3 in _0x041ad8b76 if _0x0490731a3 < 22]
        _0x04afb6925 = sum((1 for _0x0490731a3 in _0x048deb903 if _0x0490731a3 in _0x04619aedf['tarot']))
        if _0x047a3bfaf > 0 and _0x04afb6925 > 0:
            _0x044a7f06c.append({'theme': _0x0454e91c3, 'strength': _0x047a3bfaf + _0x04afb6925, 'iching_match': _0x047a3bfaf, 'tarot_match': _0x04afb6925})
    _0x044a7f06c.sort(key=lambda x: _0x04bd63d8e['strength'], reverse=True)
    _0x04c41d300 = _0x044a7f06c[0] if _0x044a7f06c else None
    _0x04d8dda95 = _0x04ee97930(_0x040182833, _0x041ad8b76, _0x0421a0856, _0x043cbfe8c)
    _0x04fd968de = _0x05061ecda(_0x040182833, _0x041ad8b76, _0x0421a0856, _0x043cbfe8c)
    _0x051b23f64 = sum((_0x0490731a3['strength'] for _0x0490731a3 in _0x044a7f06c))
    _0x052b75e33 = _0x04d8dda95['score']
    _0x053e18ae3 = _0x04fd968de['score']
    _0x054f78b9d = _0x051b23f64 * 3 + _0x052b75e33 * 2 + _0x053e18ae3
    if _0x054f78b9d >= 12 or (_0x04c41d300 and _0x04c41d300['strength'] >= 3):
        _0x055833524 = 'strong'
    elif _0x054f78b9d >= 5:
        _0x055833524 = 'moderate'
    else:
        _0x055833524 = 'subtle'
    if _0x04c41d300:
        _0x056e064b0 = f"东西方占卜体系在此交汇于「{_0x04c41d300['theme']}」——卦象与牌阵同时指向这一核心信息，跨体系共振赋予其特别的力量。"
    else:
        _0x055833524 = 'subtle'
        _0x056e064b0 = '东西方体系呈现不同侧重：易经揭示结构性趋势，塔罗映射当下能量流动。此刻需要多维审视。'
    if _0x04d8dda95['matches']:
        _0x057d60d0d = _0x04d8dda95['matches'][0]
        _0x056e064b0 += f" 五行与元素层面，{_0x057d60d0d['description']}。"
    return {'type': _0x055833524, 'primary_theme': _0x04c41d300['theme'] if _0x04c41d300 else '多元', 'themes': _0x044a7f06c[:3], 'element_resonance': _0x04d8dda95, 'keyword_resonance': _0x04fd968de, 'total_score': _0x054f78b9d, 'summary': _0x056e064b0}

def _0x04ee97930(_0x040182833, _0x041ad8b76, _0x0421a0856, _0x043cbfe8c) -> dict:
    _0x05835f6cd = set()
    for _0x059ee6cbc in _0x040182833:
        if _0x059ee6cbc:
            _0x00fe32025 = next((_0x04bd63d8e for _0x04bd63d8e in _0x0421a0856 if _0x04bd63d8e['id'] == _0x059ee6cbc), None)
            if _0x00fe32025:
                for _0x05a689ee7 in ('trigram_above_element', 'trigram_below_element'):
                    _0x05b9c2bf8 = _0x00fe32025.get(_0x05a689ee7)
                    if _0x05b9c2bf8:
                        _0x05835f6cd.add(_0x05b9c2bf8)
    _0x05c07ce57 = set()
    for _0x00987d7a0 in _0x041ad8b76:
        if _0x043cbfe8c and _0x00987d7a0 < len(_0x043cbfe8c):
            _0x05de2f549 = _0x043cbfe8c[_0x00987d7a0].get('suit')
            _0x05ef95c11 = _0x03f8577dc.get(_0x05de2f549)
            if _0x05ef95c11:
                _0x05c07ce57.add(_0x05ef95c11)
            _0x05f7a36da = _0x043cbfe8c[_0x00987d7a0].get('element')
            if _0x05f7a36da and _0x00987d7a0 < 22:
                _0x05c07ce57.add(_0x05f7a36da)
    _0x060acdae0 = {'火': '火', '水': '水', '风': '木', '土': '土'}
    _0x0616651db = []
    _0x062d46477 = 0
    for _0x06307eba6 in _0x05835f6cd:
        for _0x064df1955 in _0x05c07ce57:
            _0x065f287af = _0x060acdae0.get(_0x064df1955, _0x064df1955)
            if _0x06307eba6 == _0x065f287af:
                _0x0616651db.append({'iching_element': _0x06307eba6, 'tarot_element': _0x064df1955, 'relation': '同气', 'description': f'卦象「{_0x06307eba6}」与塔罗「{_0x064df1955}」同气相求，能量共振强烈'})
                _0x062d46477 += 2
            elif _0x03d7722d8.get(_0x06307eba6) == _0x065f287af:
                _0x0616651db.append({'iching_element': _0x06307eba6, 'tarot_element': _0x064df1955, 'relation': f'{_0x06307eba6}生{_0x065f287af}', 'description': f'卦象「{_0x06307eba6}」生塔罗「{_0x064df1955}」，顺势滋养'})
                _0x062d46477 += 1
            elif _0x03ed891ee.get(_0x06307eba6) == _0x065f287af:
                _0x0616651db.append({'iching_element': _0x06307eba6, 'tarot_element': _0x064df1955, 'relation': f'{_0x06307eba6}克{_0x065f287af}', 'description': f'卦象「{_0x06307eba6}」克塔罗「{_0x064df1955}」，存在张力与制衡'})
                _0x062d46477 += 1
    _0x0616651db.sort(key=lambda x: 2 if _0x04bd63d8e['relation'] == '同气' else 1, reverse=True)
    return {'matches': _0x0616651db[:3], 'score': _0x062d46477}

def _0x05061ecda(_0x040182833, _0x041ad8b76, _0x0421a0856, _0x043cbfe8c) -> dict:
    _0x066f79af5 = set()
    for _0x059ee6cbc in _0x040182833:
        if _0x059ee6cbc:
            _0x00fe32025 = next((_0x04bd63d8e for _0x04bd63d8e in _0x0421a0856 if _0x04bd63d8e['id'] == _0x059ee6cbc), None)
            if _0x00fe32025:
                for _0x067c50849 in _0x00fe32025.get('keywords', []):
                    _0x066f79af5.add(_0x067c50849)
    _0x068a808ab = set()
    for _0x00987d7a0 in _0x041ad8b76:
        if _0x043cbfe8c and _0x00987d7a0 < len(_0x043cbfe8c):
            _0x03443fdb6 = _0x043cbfe8c[_0x00987d7a0]
            for _0x067c50849 in _0x03443fdb6.get('keywords', []):
                _0x068a808ab.add(_0x067c50849)
            for _0x067c50849 in _0x03443fdb6.get('keywords_reversed', []):
                _0x068a808ab.add(_0x067c50849)
    _0x0697c6b2b = [{'name': '开创/新始', 'hex': ['开创', '主动', '刚健', '启动', '新生', '开始'], 'tarot': ['新开始', '自由', '冒险', '新起点', '机会', '灵感']}, {'name': '困难/阻滞', 'hex': ['险阻', '困难', '困境', '阻滞', '危机', '险', '坎'], 'tarot': ['困难', '阻滞', '结束', '困境', '束缚', '挑战', '灾难']}, {'name': '智慧/洞察', 'hex': ['智慧', '洞察', '内省', '明辨', '观察', '悟', '思'], 'tarot': ['智慧', '直觉', '内省', '洞察', '学习', '真相', '沉思']}, {'name': '财富/丰盛', 'hex': ['丰盛', '财富', '富足', '聚', '蓄', '利', '收益', '丰收'], 'tarot': ['丰盛', '富足', '成功', '繁荣', '丰收', '富饶', '稳定']}, {'name': '变革/转化', 'hex': ['变革', '转化', '革新', '蜕变', '改', '革', '变'], 'tarot': ['变革', '转化', '重生', '转变', '过渡', '觉醒', '新阶段']}, {'name': '行动/速度', 'hex': ['行动', '果断', '进取', '决断', '迅速', '进', '往'], 'tarot': ['行动', '速度', '快速', '进展', '决心', '勇气', '前进']}, {'name': '等待/蛰伏', 'hex': ['等待', '蓄势', '蛰伏', '耐心', '迟', '缓', '守'], 'tarot': ['等待', '耐心', '暂停', '休息', '冥想', '酝酿']}, {'name': '关系/和谐', 'hex': ['和谐', '感', '聚', '和', '合', '亲', '感应'], 'tarot': ['和谐', '爱', '结合', '伙伴', '情感', '共鸣', '结合']}, {'name': '警示/危险', 'hex': ['警惕', '危险', '险', '败', '凶', '过', '失'], 'tarot': ['警告', '危险', '背叛', '欺骗', '损失', '恐惧', '失控']}, {'name': '成功/成就', 'hex': ['成功', '成就', '大利', '吉', '亨', '通', '达'], 'tarot': ['成功', '胜利', '成就', '圆满', '世界', '凯旋']}]
    _0x0616651db = []
    _0x062d46477 = 0
    for _0x06aecc4cd in _0x0697c6b2b:
        _0x06b428cb1 = any((_0x067c50849 in _0x066f79af5 for _0x067c50849 in _0x06aecc4cd['hex']))
        _0x06c94ff61 = any((_0x067c50849 in _0x068a808ab for _0x067c50849 in _0x06aecc4cd['tarot']))
        if _0x06b428cb1 and _0x06c94ff61:
            _0x0616651db.append({'theme': _0x06aecc4cd['name'], 'hex_keywords': [_0x067c50849 for _0x067c50849 in _0x06aecc4cd['hex'] if _0x067c50849 in _0x066f79af5], 'tarot_keywords': [_0x067c50849 for _0x067c50849 in _0x06aecc4cd['tarot'] if _0x067c50849 in _0x068a808ab]})
            _0x062d46477 += 1
    return {'matches': _0x0616651db[:3], 'score': _0x062d46477}

def compute_fortune_scores(_0x004ef14a5: dict, _0x06d287074: list, _0x06ea1434f: str='general') -> dict:
    from app.question_router import get_dimensions_for_type, DIMENSION_LABELS
    _load_data()
    _0x06f79bea5 = {'大吉': 9, '吉': 7, '中': 5, '凶': 3, '大凶': 1}
    _0x0700622f2 = _0x004ef14a5.get('original') or {}
    _0x07185f22c = _0x06f79bea5.get(_0x0700622f2.get('fortune', '中'), 5)
    _0x0206296d1 = _0x004ef14a5.get('changed')
    if _0x0206296d1:
        _0x0724edbc2 = _0x06f79bea5.get(_0x0206296d1.get('fortune', '中'), 5)
        if _0x0724edbc2 > _0x07185f22c:
            _0x073deaff5 = 1
        elif _0x0724edbc2 < _0x07185f22c:
            _0x073deaff5 = -1
        else:
            _0x073deaff5 = 0
    else:
        _0x073deaff5 = 0
    _0x074cd2a1e = sum((1 for _0x07533a263 in _0x06d287074 if not _0x07533a263.get('reversed')))
    _0x076d84c2a = len(_0x06d287074) - _0x074cd2a1e
    _0x077f2c5be = (_0x074cd2a1e - _0x076d84c2a) * 0.5
    _0x078733d1a = _0x004ef14a5.get('changing_lines', [])
    _0x0793ee610 = len(_0x078733d1a) if _0x078733d1a else 0
    _0x07adf6f5d = _0x0700622f2.get('trigram_above_element', '土')
    _0x07b9f51bf = _0x0700622f2.get('trigram_below_element', '土')
    _0x03d7722d8 = {'金': '水', '水': '木', '木': '火', '火': '土', '土': '金'}
    _0x07c5909e2 = 1 if _0x03d7722d8.get(_0x07b9f51bf) == _0x07adf6f5d else -1 if _0x03d7722d8.get(_0x07adf6f5d) == _0x07b9f51bf else 0

    def _0x07dc6e466(_0x04bd63d8e):
        return max(1, min(10, round(_0x04bd63d8e)))
    _0x07ea8ebca = get_dimensions_for_type(_0x06ea1434f)
    _0x07f7b6032 = {}
    for _0x01633ae50, _0x0808b0c09 in enumerate(_0x07ea8ebca):
        _0x081be13c2 = [1.5, 0.3, 0.8, -0.5, 1.2][_0x01633ae50 % 5]
        _0x082537906 = [0.5, 1.0, 0.3, 0.8, -0.3][_0x01633ae50 % 5]
        _0x083103fb0 = _0x07c5909e2 * [0.5, 0.0, 1.0, -1.0, 0.3][_0x01633ae50 % 5]
        _0x084d10a48 = _0x0793ee610 * [0.3, -0.4, 0.5, 0.0, -0.5][_0x01633ae50 % 5]
        import hashlib as _hl
        _0x08524a5cf = int(_hl.md5((_0x0808b0c09 + _0x0700622f2.get('name', '')).encode()).hexdigest(), 16) % 3 - 1
        _0x00ec5a15a = _0x07185f22c + _0x073deaff5 * _0x081be13c2 + _0x077f2c5be * _0x082537906 + _0x083103fb0 + _0x084d10a48 + _0x08524a5cf
        _0x07f7b6032[_0x0808b0c09] = _0x07dc6e466(_0x00ec5a15a)
    _0x0314f5db2 = {}
    for _0x0808b0c09 in _0x07ea8ebca:
        _0x086416dd8 = DIMENSION_LABELS.get(_0x0808b0c09, {'label': _0x0808b0c09, 'label_en': _0x0808b0c09})
        _0x0314f5db2[_0x0808b0c09] = {'score': _0x07f7b6032[_0x0808b0c09], 'label': _0x086416dd8['label'], 'label_en': _0x086416dd8['label_en']}
    return _0x0314f5db2
_0x087a42b1c = {'大吉': {'yi': ['宜进取', '宜开创', '宜主动出击', '宜把握时机', '宜大胆尝试'], 'ji': ['忌犹豫', '忌保守', '忌错失良机', '忌迟疑不决'], 'tone': '顺'}, '吉': {'yi': ['宜稳中求进', '宜适度行动', '宜借力而上', '宜积极沟通', '宜踏实推进'], 'ji': ['忌冒进', '忌投机取巧', '忌与人争执', '忌过度承诺'], 'tone': '顺'}, '中': {'yi': ['宜观察', '宜蓄势', '宜反思', '宜小幅尝试', '宜守正待时'], 'ji': ['忌大动', '忌冲动决策', '忌随波逐流', '忌意气用事'], 'tone': '平'}, '凶': {'yi': ['宜守', '宜退', '宜反思', '宜低调', '宜整理内务'], 'ji': ['忌冒进', '忌争执', '忌冒险', '忌重大决策', '忌借贷'], 'tone': '逆'}, '大凶': {'yi': ['宜静', '宜养', '宜避', '宜求稳', '宜求助'], 'ji': ['忌动', '忌争', '忌贪', '忌远行', '忌重大承诺'], 'tone': '逆'}}

def _pick_yi_ji(_0x0888f9d23: str, _0x08924f51b: str, _0x010949fb8: int) -> dict:
    _0xshdw_1666 = 83583
    _0x01144d8f1 = random.Random(_0x010949fb8)
    _0x08aa7d01a = _0x087a42b1c.get(_0x08924f51b, _0x087a42b1c['中'])
    import hashlib as _hl
    _0x00fe32025 = int(_hl.md5(f'{_0x0888f9d23}{_0x08924f51b}{_0x010949fb8}'.encode()).hexdigest(), 16)
    _0x08b80db47 = _0x08aa7d01a['yi']
    _0x08c4ac041 = _0x08aa7d01a['ji']
    _0x08d3bfd26 = _0x08b80db47[_0x00fe32025 % len(_0x08b80db47)]
    _0x08e4a2674 = _0x08c4ac041[(_0x00fe32025 + 1) % len(_0x08c4ac041)]
    return {'yi': _0x08d3bfd26, 'ji': _0x08e4a2674, 'tone': _0x08aa7d01a['tone']}

def daily_hexagram(_0x08fb799a4: datetime.date) -> dict:
    _0x010949fb8 = int(_0x08fb799a4.strftime('%Y%m%d'))
    _load_data()
    if not _iching_data:
        return {'error': '卦象数据未加载'}
    _0x01144d8f1 = random.Random(_0x010949fb8)
    _0x0909cd2aa = _0x01144d8f1.choice(_iching_data)
    _0x012574173 = []
    _0x01331a858 = []
    for _0x0188182f2 in range(6):
        _0x0192fb38c = sum((_0x01144d8f1.choice([2, 3]) for _0x0188182f2 in range(3)))
        if _0x0192fb38c in (6, 9):
            _0x012574173.append(0 if _0x0192fb38c == 6 else 1)
            _0x01331a858.append(_0x0188182f2)
        else:
            _0x012574173.append(1 if _0x0192fb38c == 7 else 0)
    _0x0912b3d75 = _pick_yi_ji(_0x0909cd2aa['name'], _0x0909cd2aa.get('fortune', '中'), _0x010949fb8)
    _0x092f0f0e8 = _0x0909cd2aa.get('judgment', '').split('。')[0] + '。' if _0x0909cd2aa.get('judgment') else _0x0909cd2aa.get('interpretation', '')
    return {'date': _0x08fb799a4.isoformat(), 'seed': _0x010949fb8, 'hexagram': attach_yao_lines(_slim_hexagram(_0x0909cd2aa)), 'changing_lines': _0x01331a858, 'yi_ji': _0x0912b3d75, 'short_message': _0x092f0f0e8}

def attach_yao_lines(_0x0909cd2aa):
    if not _0x0909cd2aa or not isinstance(_0x0909cd2aa, dict):
        return _0x0909cd2aa
    _0x0930f9c73 = _0x0909cd2aa.get('name', '')
    _0x01cfc5087 = _0x0909cd2aa.get('binary', '')
    if _0x0930f9c73 and _0x01cfc5087 and (len(_0x01cfc5087) == 6):
        from app.yao_data import get_all_yao_for_hex
        _0x094fdd192 = get_all_yao_for_hex(_0x0930f9c73, _0x01cfc5087)
        _0x0909cd2aa = {**_0x0909cd2aa, 'yao_lines': _0x094fdd192}
    return _0x0909cd2aa
_0x0950ad023 = {'大吉': '势如破竹', '吉': '吉星高照', '中': '平中见机', '凶': '逆风前行', '大凶': '慎之又慎'}
_0x0968f6111 = {'career': {'positive': ['把握机会，主动出击', '顺势而为，展现能力', '贵人相助，大胆推进'], 'neutral': ['稳扎稳打，以静制动', '等待时机，蓄势待发', '审查全局，谋定后动'], 'negative': ['韬光养晦，不急于求成', '规避风险，三思后行', '低调行事，避免冲突']}, 'exam': {'positive': ['临场发挥出色，信心是关键', '准备充分，发挥稳定', '思路清晰，注意审题'], 'neutral': ['放平心态，正常发挥', '抓住重点，有的放矢', '不骄不躁，稳中求胜'], 'negative': ['调整心态，避免焦虑', '检查细节，防止粗心', '做好备选，放长线钓大鱼']}, 'study': {'positive': ['方向正确，全力以赴', '兴趣天赋俱佳，大胆深入', '良师益友相助，善用资源'], 'neutral': ['多方考量，不急于定论', '打好基础，再择方向', '兼顾现实与理想'], 'negative': ['重新审视方向，勿盲目投入', '补充短板再出发', '考虑替代方案']}, 'finance': {'positive': ['财运亨通，果断布局', '稳健增值，长期持有', '机遇显现，适度加仓'], 'neutral': ['观望为主，伺机而动', '分散风险，不押单注', '控制欲望，理性决策'], 'negative': ['及时止损，保存实力', '远离投机，回归本业', '等待拐点，不抄底']}, 'relationship': {'positive': ['真诚沟通，主动表达', '缘分深厚，珍惜眼前', '制造浪漫，升华感情'], 'neutral': ['给予空间，顺其自然', '坦诚对话，化解误会', '耐心等待，不操之过急'], 'negative': ['冷静处理，避免冲动', '反省自身，先做好自己', '学会放手，不强求']}, 'health': {'positive': ['身体向好，保持习惯', '休养生息，元气恢复', '积极调理，事半功倍'], 'neutral': ['规律作息，适度运动', '关注身心平衡', '预防为主，定期检查'], 'negative': ['及时就医，不讳疾忌医', '放慢节奏，减少压力', '调整情绪，避免内耗']}, 'travel': {'positive': ['出行顺利，一路平安', '机缘巧合，收获满满', '说走就走，不负好时光'], 'neutral': ['做好攻略，有备无患', '灵活变通，随遇而安', '注意天气和交通'], 'negative': ['暂缓行程，另择吉日', '注意安全，做好预案', '减少长途，就近为宜']}, 'legal': {'positive': ['理据充分，胜算颇大', '正义在握，据理力争', '和解有利，速战速决'], 'neutral': ['证据为王，充分准备', '寻求专业意见', '权衡利弊，考虑调解'], 'negative': ['避其锋芒，策略周旋', '控制损失，做最坏打算', '寻求和解，减少对抗']}, 'decision': {'positive': ['当机立断，不再犹豫', '内心已有答案，信任直觉', '条件成熟，立即行动'], 'neutral': ['搜集更多信息，再定夺', '列出优劣对比表', '给自己设定 deadline'], 'negative': ['暂缓决定，等待转机', '听从长者或专业人士建议', '不做比做错更好']}, 'general': {'positive': ['把握当下，顺势而为', '贵人运旺，广结善缘', '心想事成，放手去做'], 'neutral': ['静观其变，以不变应万变', '内省自照，理清脉络', '小事可为，大事从长'], 'negative': ['收敛锋芒，厚积薄发', '谨慎行事，防患未然', '退一步海阔天空']}}

def _0x097251d7b(_0x08924f51b: str, _0x073deaff5: int) -> str:
    if _0x08924f51b in ('大吉', '吉'):
        return 'positive'
    if _0x08924f51b in ('凶', '大凶'):
        return 'negative'
    if _0x073deaff5 > 0:
        return 'positive'
    elif _0x073deaff5 < 0:
        return 'negative'
    return 'neutral'

def generate_verdict(_0x004ef14a5: dict, _0x09807dfb9: dict, _0x099dcd121: dict, _0x06ea1434f: str='general', _0x00ae86dc1: str='') -> dict:
    _load_data()
    _0x09aa6587d = _0x004ef14a5.get('original') or {}
    _0x0206296d1 = _0x004ef14a5.get('changed')
    _0x08924f51b = _0x09aa6587d.get('fortune', '中')
    _0x06f79bea5 = {'大吉': 9, '吉': 7, '中': 5, '凶': 3, '大凶': 1}
    _0x07185f22c = _0x06f79bea5.get(_0x08924f51b, 5)
    _0x09bc1766a = _0x06f79bea5.get(_0x0206296d1.get('fortune', '中'), 5) if _0x0206296d1 else _0x07185f22c
    _0x073deaff5 = 1 if _0x09bc1766a > _0x07185f22c else -1 if _0x09bc1766a < _0x07185f22c else 0
    _0x09cafadd9 = _0x0950ad023.get(_0x08924f51b, '平稳')
    if _0x0206296d1 and _0x073deaff5 > 0:
        _0x09cafadd9 += f"，{_0x09aa6587d.get('name', '')}→{_0x0206296d1.get('name', '')} 损极泰来"
    elif _0x0206296d1 and _0x073deaff5 < 0:
        _0x09cafadd9 += f"，{_0x09aa6587d.get('name', '')}→{_0x0206296d1.get('name', '')} 盛极而衰"
    _0x09d8b9b25 = _0x09aa6587d.get('keywords', [])
    _0x09e42c78b = _0x09aa6587d.get('interpretation', '')
    _0x09f26ea88 = _0x09e42c78b.split('。')[0] + '。' if _0x09e42c78b and '。' in _0x09e42c78b else _0x09e42c78b[:30] if _0x09e42c78b else ''
    _0x0a087344d = _0x097251d7b(_0x08924f51b, _0x073deaff5)
    _0x0a14f16eb = _0x0968f6111.get(_0x06ea1434f, _0x0968f6111['general']).get(_0x0a087344d, _0x0968f6111['general']['neutral'])
    import hashlib
    _0x0a2b2eb60 = f"{_0x09aa6587d.get('name', '')}{_0x00ae86dc1}{_0x08924f51b}"
    _0x0a3a702cd = int(hashlib.md5(_0x0a2b2eb60.encode()).hexdigest(), 16) % len(_0x0a14f16eb)
    _0x0a45c0861 = _0x0a14f16eb[_0x0a3a702cd]
    _0x0a5bbcdc1 = _0x09807dfb9.get('type', 'subtle')
    _0x0a6958cb6 = _0x09807dfb9.get('primary_theme', '多元')
    if _0x0a5bbcdc1 == 'strong':
        _0x0a7f3c137 = f'东西方共振强烈（「{_0x0a6958cb6}」），方向明确'
    elif _0x0a5bbcdc1 == 'moderate':
        _0x0a7f3c137 = f'东西方有中等共振（「{_0x0a6958cb6}」），多角度印证'
    else:
        _0x0a7f3c137 = '东西方各有所见，需多维审视'
    return {'trend': _0x09cafadd9, 'fortune': _0x08924f51b, 'hexagram_name': _0x09aa6587d.get('name', ''), 'changed_name': _0x0206296d1.get('name', '') if _0x0206296d1 else '', 'core_hint': _0x09f26ea88, 'best_action': _0x0a45c0861, 'resonance_note': _0x0a7f3c137, 'resonance_level': _0x0a5bbcdc1, 'question_type': _0x06ea1434f}
_0x0a873da07 = {'乾': {'nature': '天', 'element': '金', 'direction': '西北', 'season': '秋冬之交', 'family': '父亲', 'body': '头', 'trait': '刚健', 'animal': '马'}, '坤': {'nature': '地', 'element': '土', 'direction': '西南', 'season': '夏秋之交', 'family': '母亲', 'body': '腹', 'trait': '柔顺', 'animal': '牛'}, '震': {'nature': '雷', 'element': '木', 'direction': '东', 'season': '春', 'family': '长男', 'body': '足', 'trait': '震动', 'animal': '龙'}, '巽': {'nature': '风', 'element': '木', 'direction': '东南', 'season': '春夏之交', 'family': '长女', 'body': '股', 'trait': '渗透', 'animal': '鸡'}, '坎': {'nature': '水', 'element': '水', 'direction': '北', 'season': '冬', 'family': '中男', 'body': '耳', 'trait': '险陷', 'animal': '豕'}, '离': {'nature': '火', 'element': '火', 'direction': '南', 'season': '夏', 'family': '中女', 'body': '目', 'trait': '附丽', 'animal': '雉'}, '艮': {'nature': '山', 'element': '土', 'direction': '东北', 'season': '冬春之交', 'family': '少男', 'body': '手', 'trait': '静止', 'animal': '狗'}, '兑': {'nature': '泽', 'element': '金', 'direction': '西', 'season': '秋', 'family': '少女', 'body': '口', 'trait': '喜悦', 'animal': '羊'}}
_0x0a901e714 = {'金': '水', '水': '木', '木': '火', '火': '土', '土': '金'}
_0x0aa067b0d = {'金': '木', '木': '土', '土': '水', '水': '火', '火': '金'}
_0x0ab85b980 = {0: '初爻动 — 事情刚起步，根基有变。注意最初的决定和行动。', 1: '二爻动 — 内在核心在变，关键人物或内在因素发生变化。', 2: '三爻动 — 过程中的波折与调整，需注意执行层面的变数。', 3: '四爻动 — 接近权力中心，外部环境和位置在变。', 4: '五爻动 — 核心地位有变，主要决策者或领导层变化。', 5: '上爻动 — 结果与终局有变，事物发展到尾声时的转折。'}

def _0x0acbb5492(_0x012574173: list, _0x01b858dcb: int) -> bool:
    _0xdead_bfd = None
    _0x0add58a6b = _0x012574173[_0x01b858dcb] == 1
    _0x0ae882d4d = _0x01b858dcb in (0, 2, 4)
    return _0x0add58a6b and _0x0ae882d4d or (not _0x0add58a6b and (not _0x0ae882d4d))

def _0x0af93e347(_0x01b858dcb: int) -> bool:
    return _0x01b858dcb in (1, 4)

def analyze_hexagram(_0x004ef14a5: dict, _0x06d287074: list=None) -> dict:
    _0xshdw_2457 = 47317
    _load_data()
    _0x012574173 = [int(_0x07533a263) for _0x07533a263 in _0x004ef14a5.get('binary', '000000')]
    _0x01331a858 = _0x004ef14a5.get('changing_lines', [])
    _0x09aa6587d = _0x004ef14a5.get('original') or {}
    _0x0206296d1 = _0x004ef14a5.get('changed')
    _0x0b0a0ed5b = _0x09aa6587d.get('trigram_above', '')
    _0x0b1cfb947 = _0x09aa6587d.get('trigram_below', '')
    _0x0b2aaeb8b = {'天': '金', '地': '土', '雷': '木', '风': '木', '水': '水', '火': '火', '山': '土', '泽': '金'}
    _0x0b351f78e = _0x09aa6587d.get('trigram_above_element', '')
    _0x0b437ac8b = _0x09aa6587d.get('trigram_below_element', '')
    _0x07adf6f5d = _0x0b2aaeb8b.get(_0x0b351f78e, _0x0b351f78e)
    _0x07b9f51bf = _0x0b2aaeb8b.get(_0x0b437ac8b, _0x0b437ac8b)
    _0x0b5cf468d = '比和'
    _0x0b627fffc = ''
    if _0x07adf6f5d and _0x07b9f51bf:
        if _0x0a901e714.get(_0x07b9f51bf) == _0x07adf6f5d:
            _0x0b5cf468d = f'下卦{_0x07b9f51bf}生上卦{_0x07adf6f5d}'
            _0x0b627fffc = '内养外，内在实力支撑外在表现。根基扎实，发展有望。'
        elif _0x0a901e714.get(_0x07adf6f5d) == _0x07b9f51bf:
            _0x0b5cf468d = f'上卦{_0x07adf6f5d}生下卦{_0x07b9f51bf}'
            _0x0b627fffc = '外养内，外部条件滋养内部根基。得贵人或环境助力。'
        elif _0x0aa067b0d.get(_0x07b9f51bf) == _0x07adf6f5d:
            _0x0b5cf468d = f'下卦{_0x07b9f51bf}克上卦{_0x07adf6f5d}'
            _0x0b627fffc = '内制外，内在实力足以制约外部挑战。主动权在己。'
        elif _0x0aa067b0d.get(_0x07adf6f5d) == _0x07b9f51bf:
            _0x0b5cf468d = f'上卦{_0x07adf6f5d}克下卦{_0x07b9f51bf}'
            _0x0b627fffc = '外制内，外部压力制约内部发展。需忍耐或调整策略。'
        elif _0x07adf6f5d == _0x07b9f51bf:
            _0x0b5cf468d = f'{_0x07adf6f5d}与{_0x07b9f51bf}比和'
            _0x0b627fffc = '上下卦五行一致，内外协调，力量集中。'
    _0x0b7787a09 = []
    _0x0b8bd7c57 = []
    for _0x01633ae50 in range(6):
        if _0x0acbb5492(_0x012574173, _0x01633ae50):
            _0x0b7787a09.append(_0x01633ae50)
        else:
            _0x0b8bd7c57.append(_0x01633ae50)
    _0x0b92ff0a4 = [_0x01633ae50 for _0x01633ae50 in range(6) if _0x0af93e347(_0x01633ae50)]
    _0x0baf6906f = [_0x01633ae50 for _0x01633ae50 in _0x0b92ff0a4 if _0x0acbb5492(_0x012574173, _0x01633ae50)]
    _0x0bbf905c3 = []
    for _0x01b858dcb in _0x01331a858:
        _0x0bc364bef = _0x0acbb5492(_0x012574173, _0x01b858dcb)
        _0x0bda23ba5 = _0x0af93e347(_0x01b858dcb)
        _0x0bef8ca47 = ['初', '二', '三', '四', '五', '上'][_0x01b858dcb]
        _0x0bf806e76 = _0x0ab85b980.get(_0x01b858dcb, '')
        _0x0c0d6fcfa = ''
        if _0x0bda23ba5 and _0x0bc364bef:
            _0x0c0d6fcfa = '此爻既得中又当位，变化影响重大——核心位置的核心转变。'
        elif _0x0bda23ba5:
            _0x0c0d6fcfa = '此爻得中但不当位，核心位置的变化需要调整以归正道。'
        elif _0x0bc364bef:
            _0x0c0d6fcfa = '此爻当位但非中位，正常位置的变化，影响可控。'
        else:
            _0x0c0d6fcfa = '此爻不当位不居中，变化反映出需要修正的偏差。'
        _0x0bbf905c3.append({'position': _0x0bef8ca47, 'index': _0x01b858dcb, 'is_proper': _0x0bc364bef, 'is_central': _0x0bda23ba5, 'detail': _0x0bf806e76, 'significance': _0x0c0d6fcfa, 'original_yao': '阳' if _0x012574173[_0x01b858dcb] == 1 else '阴', 'changing_to': '阴' if _0x012574173[_0x01b858dcb] == 1 else '阳'})
    _0x0c18fe272 = _0x0a873da07.get(_0x0b0a0ed5b, {})
    _0x0c2d0aef3 = _0x0a873da07.get(_0x0b1cfb947, {})
    _0x0c3151226 = ''
    if _0x0c18fe272 and _0x0c2d0aef3:
        _0x0c41e4bdb = _0x0c18fe272.get('nature', '')
        _0x0c54224a4 = _0x0c2d0aef3.get('nature', '')
        _0x0c69e5816 = _0x0c18fe272.get('trait', '')
        _0x0c7ac3267 = _0x0c2d0aef3.get('trait', '')
        _0x0c3151226 = f'下卦「{_0x0b1cfb947}」为{_0x0c54224a4}，性{_0x0c7ac3267}；上卦「{_0x0b0a0ed5b}」为{_0x0c41e4bdb}，性{_0x0c69e5816}。{_0x0c54224a4}在下、{_0x0c41e4bdb}在上，'
        _0x0c8d6301c = {('天', '地'): '天道覆育万物、地道承载万物的格局。', ('地', '天'): '地气上升、天气下降，天地交泰之象。', ('水', '火'): '水火相交，既济则成、未济则险。', ('火', '水'): '火在水上，分离不交，需防矛盾激化。', ('雷', '风'): '风雷激荡，行动力强劲。', ('风', '雷'): '风在雷上，柔性传播中蕴含爆发。', ('山', '泽'): '山泽通气，阴阳调和。', ('泽', '山'): '泽在山上，高处有润，贵人相扶。', ('天', '水'): '天水上行，需要积蓄而后发。', ('水', '地'): '水润大地，潜移默化。', ('地', '水'): '地中有水，暗藏实力。', ('山', '火'): '山下有火，光明被阻，需耐心等待。', ('火', '山'): '火在山上，明察秋毫、顺势而行。', ('雷', '地'): '雷在地中，阳气初动、蓄势待发。', ('地', '雷'): '地下有雷，暗中行动、时机将至。', ('天', '风'): '天风浩荡，刚柔相济、通行无阻。', ('风', '天'): '风行天上，柔性力量蓄积待发。', ('泽', '水'): '泽中有水，聚而不散、节制有度。', ('水', '泽'): '水在泽中，深藏不露、量力而行。', ('火', '风'): '火在风上，风助火势、顺势而为。', ('风', '火'): '风在火上，齐心协力、众人拾柴。', ('雷', '水'): '雷在水中，暗中蓄力、待机而动。', ('水', '雷'): '水在雷上，险中有动、需谨慎前行。', ('天', '山'): '天在山上，高远志向、脚踏实地。', ('山', '天'): '山在天上，积蓄力量、志存高远。'}
        _0x0c9d3c0d4 = _0x0c8d6301c.get((_0x0c54224a4, _0x0c41e4bdb), f'{_0x0c54224a4}与{_0x0c41e4bdb}的组合，蕴含独特意象。')
        _0x0c3151226 += _0x0c9d3c0d4
    _0x0ca05408d = sum(_0x012574173)
    _0x0cb414c14 = 6 - _0x0ca05408d
    _0x0ccb61d7f = ''
    if _0x0ca05408d >= 5:
        _0x0ccb61d7f = '阳盛 — 刚健过重，需防过刚易折。'
    elif _0x0ca05408d <= 1:
        _0x0ccb61d7f = '阴盛 — 柔顺偏重，需防优柔寡断。'
    elif _0x0ca05408d == 3:
        _0x0ccb61d7f = '阴阳平衡 — 刚柔并济，最为稳健。'
    elif _0x0ca05408d > _0x0cb414c14:
        _0x0ccb61d7f = '阳多于阴 — 偏刚健主动，行动力强。'
    else:
        _0x0ccb61d7f = '阴多于阳 — 偏柔顺含蓄，宜以静制动。'
    _0x0cde710c8 = ''
    if _0x0206296d1:
        _0x0ce316bad = _0x09aa6587d.get('fortune', '中')
        _0x0724edbc2 = _0x0206296d1.get('fortune', '中')
        _0x0cf6f6c95 = {'大凶': 1, '凶': 3, '中': 5, '吉': 7, '大吉': 9}
        _0x0d047d066 = _0x0cf6f6c95.get(_0x0ce316bad, 5)
        _0x0d150849f = _0x0cf6f6c95.get(_0x0724edbc2, 5)
        if _0x0d150849f > _0x0d047d066:
            _0x0cde710c8 = f"由「{_0x09aa6587d.get('name')}」变「{_0x0206296d1.get('name')}」，吉凶上升——损极泰来，趋势向好。"
        elif _0x0d150849f < _0x0d047d066:
            _0x0cde710c8 = f"由「{_0x09aa6587d.get('name')}」变「{_0x0206296d1.get('name')}」，吉凶下降——盛极而衰，需防微杜渐。"
        else:
            _0x0cde710c8 = f"由「{_0x09aa6587d.get('name')}」变「{_0x0206296d1.get('name')}」，吉凶持平——表里如一，维持现状。"
    else:
        _0x0cde710c8 = '无动爻，卦象纯粹——此刻的状态稳定，没有明显的转折信号。'
    _0x06f79bea5 = {'大吉': 9, '吉': 7, '中': 5, '凶': 3, '大凶': 1}
    _0x08924f51b = _0x09aa6587d.get('fortune', '中')
    _0x0d2cf4e34 = _0x06f79bea5.get(_0x08924f51b, 5)
    _0x0d3888fec = []
    if _0x0d2cf4e34 >= 7:
        _0x0d3888fec.append('当前运势有利，适合推进重要计划')
    elif _0x0d2cf4e34 <= 3:
        _0x0d3888fec.append('当前运势不利，以守为攻，不宜冒进')
    else:
        _0x0d3888fec.append('运势平平，宜在稳中寻找突破口')
    if _0x0b5cf468d and '生' in _0x0b5cf468d:
        _0x0d3888fec.append('五行相生，内外力量协调，可借助外部资源')
    elif '克' in _0x0b5cf468d:
        _0x0d3888fec.append('五行相克，内外有矛盾，需化解冲突')
    if _0x0baf6906f:
        _0x0d3888fec.append('核心爻位得中当位，决策方向正确，信任自己的判断')
    elif _0x0b8bd7c57 and (1 in _0x0b8bd7c57 or 4 in _0x0b8bd7c57):
        _0x0d3888fec.append('核心爻位有偏，需寻求中正之道，听取不同意见')
    if _0x01331a858:
        if len(_0x01331a858) >= 3:
            _0x0d3888fec.append('动爻较多，变数大——做好多手准备，灵活应对')
        else:
            _0x0d3888fec.append('动爻少而精——变数集中在特定环节，重点关注')
    _0x0d4cdc7eb = _0x0d5064a6c(_0x004ef14a5, _0x09aa6587d, _0x0206296d1, _0x01331a858, _0x012574173, _0x0ca05408d, _0x0cb414c14)
    _0x0d6669922 = None
    if _0x06d287074 and len(_0x06d287074) > 0:
        _0x0d6669922 = _0x0d7a3d1da(_0x06d287074, _0x07adf6f5d, _0x07b9f51bf, _0x0ca05408d, _0x0cb414c14, _0x09aa6587d, _0x0206296d1, _0x0b5cf468d)
        if _0x0d6669922:
            _0x0d3888fec.extend(_0x0d6669922.get('advice_extra', []))
    _0x0314f5db2 = {'wuxing_relation': {'above_element': _0x07adf6f5d, 'below_element': _0x07b9f51bf, 'relation': _0x0b5cf468d, 'detail': _0x0b627fffc}, 'positioning': {'proper_lines': [f"{('初' if _0x01633ae50 == 0 else '上' if _0x01633ae50 == 5 else ['二', '三', '四', '五'][_0x01633ae50 - 1])}" for _0x01633ae50 in _0x0b7787a09], 'improper_lines': [f"{('初' if _0x01633ae50 == 0 else '上' if _0x01633ae50 == 5 else ['二', '三', '四', '五'][_0x01633ae50 - 1])}" for _0x01633ae50 in _0x0b8bd7c57], 'central_proper': [f"{('二' if _0x01633ae50 == 1 else '五')}" for _0x01633ae50 in _0x0baf6906f], 'pattern': _0x0ccb61d7f, 'yang_count': _0x0ca05408d, 'yin_count': _0x0cb414c14}, 'changing_analysis': _0x0bbf905c3, 'trigram_interaction': _0x0c3151226, 'above_trigram_attrs': _0x0c18fe272, 'below_trigram_attrs': _0x0c2d0aef3, 'transformation_trend': _0x0cde710c8, 'rarity': _0x0d4cdc7eb, 'tarot_cross': _0x0d6669922, 'advice': _0x0d3888fec}
    return _0x0314f5db2

def _0x0d7a3d1da(_0x06d287074: list, _0x0d84ca10c: str, _0x0d962f1e1: str, _0x0ca05408d: int, _0x0cb414c14: int, _0x09aa6587d: dict, _0x0206296d1: dict, _0x0b5cf468d: str) -> dict:
    if not _0x06d287074:
        return None
    _0x0da1c00ec = {'火': '火', '水': '水', '土': '土', '风': '木'}
    _0x0db646654 = []
    _0x05c07ce57 = []
    _0x074cd2a1e = 0
    _0x076d84c2a = 0
    for _0x0dca8bb14 in _0x06d287074:
        _0x03443fdb6 = _0x0dca8bb14.get('card') or {}
        _0x033f379d1 = _0x0dca8bb14.get('reversed', False)
        _0x01b858dcb = _0x0dca8bb14.get('spread_position') or {}
        _0x05ef95c11 = _0x03443fdb6.get('element', '')
        _0x0dd215b9b = {'火星': '火', '金星': '土', '水星': '风', '月亮': '水', '太阳': '火', '白羊': '火', '金牛': '土', '双子': '风', '巨蟹': '水', '狮子': '火', '处女': '土', '天秤': '风', '天蝎': '水', '射手': '火', '摩羯': '土', '水瓶': '风', '双鱼': '水'}
        _0x0de50267d = _0x0dd215b9b.get(_0x05ef95c11, _0x05ef95c11)
        if _0x0de50267d not in ('火', '水', '土', '风', '木', '金'):
            _0x05de2f549 = _0x03443fdb6.get('suit', '')
            _0x0dfd7d3ed = {'wands': '火', 'cups': '水', 'swords': '风', 'pentacles': '土'}
            _0x0de50267d = _0x0dfd7d3ed.get(_0x05de2f549, _0x05ef95c11)
        if _0x033f379d1:
            _0x076d84c2a += 1
        else:
            _0x074cd2a1e += 1
        _0x09d8b9b25 = _0x03443fdb6.get('keywords_reversed' if _0x033f379d1 else 'keywords', [])
        _0x0db646654.append({'name': _0x03443fdb6.get('name_cn') or _0x03443fdb6.get('name', ''), 'position_label': _0x01b858dcb.get('label', ''), 'position_meaning': _0x01b858dcb.get('meaning', ''), 'element': _0x0de50267d, 'reversed': _0x033f379d1, 'keywords': _0x09d8b9b25, 'meaning': _0x03443fdb6.get('reversed_meaning' if _0x033f379d1 else 'upright_meaning', '')})
        _0x05c07ce57.append(_0x0de50267d)
    _0x05835f6cd = set()
    if _0x0d84ca10c:
        _0x05835f6cd.add(_0x0d84ca10c)
    if _0x0d962f1e1:
        _0x05835f6cd.add(_0x0d962f1e1)
    _0x0e0c986d8 = []
    for _0x064df1955 in _0x05c07ce57:
        _0x0e110d911 = _0x0da1c00ec.get(_0x064df1955, _0x064df1955)
        for _0x06307eba6 in _0x05835f6cd:
            if _0x0e110d911 == _0x06307eba6:
                _0x0e0c986d8.append(f'塔罗「{_0x064df1955}」与卦象「{_0x06307eba6}」同气')
            elif _0x0a901e714.get(_0x0e110d911) == _0x06307eba6:
                _0x0e0c986d8.append(f'塔罗「{_0x064df1955}」生卦象「{_0x06307eba6}」——顺养')
            elif _0x0a901e714.get(_0x06307eba6) == _0x0e110d911:
                _0x0e0c986d8.append(f'卦象「{_0x06307eba6}」生塔罗「{_0x064df1955}」——反哺')
            elif _0x0aa067b0d.get(_0x0e110d911) == _0x06307eba6:
                _0x0e0c986d8.append(f'塔罗「{_0x064df1955}」克卦象「{_0x06307eba6}」——制衡')
            elif _0x0aa067b0d.get(_0x06307eba6) == _0x0e110d911:
                _0x0e0c986d8.append(f'卦象「{_0x06307eba6}」克塔罗「{_0x064df1955}」——约束')
    _0x0e2bf0252 = ''
    if _0x0e0c986d8:
        _0x0e2bf0252 = '东西方元素层面：' + '；'.join(_0x0e0c986d8[:3]) + '。'
    else:
        _0x0e2bf0252 = '东西方元素层面各有所属，无明显生克——两套体系独立运作。'
    _0x0e3d215c4 = ''
    _0x0e4550cbe = _0x0ca05408d / 6.0 if _0x0ca05408d else 0
    _0x0e5baf8a2 = _0x074cd2a1e / len(_0x06d287074) if _0x06d287074 else 0
    if _0x0e4550cbe > 0.6 and _0x0e5baf8a2 > 0.6:
        _0x0e3d215c4 = '卦象偏阳、塔罗偏正位——双重正向，行动力强但需防过刚。'
    elif _0x0e4550cbe < 0.4 and _0x0e5baf8a2 < 0.4:
        _0x0e3d215c4 = '卦象偏阴、塔罗偏逆位——双重内敛，宜守不宜攻，需防消极。'
    elif abs(_0x0e4550cbe - _0x0e5baf8a2) < 0.2:
        _0x0e3d215c4 = '卦象阴阳与塔罗正逆位比例接近——内外一致，状态协调。'
    else:
        _0x0e3d215c4 = f"卦象{('偏阳刚' if _0x0e4550cbe > 0.5 else '偏阴柔')}而塔罗{('偏正位' if _0x0e5baf8a2 > 0.5 else '偏逆位')}——内外张力存在，需找到平衡点。"
    _0x0e6c147bc = ''
    if len(_0x0db646654) >= 3:
        _0x0e75e1780 = '、'.join(_0x0db646654[0]['keywords'][:2])
        _0x0e82f2357 = '、'.join(_0x0db646654[1]['keywords'][:2])
        _0x0e96467c3 = '、'.join(_0x0db646654[2]['keywords'][:2])
        _0x0e6c147bc = f"过去({_0x0db646654[0]['name']}·{('逆' if _0x0db646654[0]['reversed'] else '正')})：{_0x0e75e1780}；现在({_0x0db646654[1]['name']}·{('逆' if _0x0db646654[1]['reversed'] else '正')})：{_0x0e82f2357}；未来({_0x0db646654[2]['name']}·{('逆' if _0x0db646654[2]['reversed'] else '正')})：{_0x0e96467c3}。"
    _0x0eaf56d5e = set(_0x09aa6587d.get('keywords', []))
    _0x0ebb81101 = []
    for _0x0ec6de35e in _0x0db646654:
        for _0x0ed605424 in _0x0ec6de35e['keywords']:
            for _0x0ee6ad49c in _0x0eaf56d5e:
                if _0x0efa1e3c4(_0x0ed605424, _0x0ee6ad49c):
                    _0x0ebb81101.append(f'塔罗「{_0x0ed605424}」呼应卦象「{_0x0ee6ad49c}」')
    _0x0f0bbb82c = []
    if _0x0e0c986d8:
        _0x0f147d880 = any(('生' in _0x0f28c2e83 for _0x0f28c2e83 in _0x0e0c986d8))
        _0x0f32bf8c8 = any(('克' in _0x0f28c2e83 for _0x0f28c2e83 in _0x0e0c986d8))
        if _0x0f147d880:
            _0x0f0bbb82c.append('塔罗与卦象五行相生——东西方体系互为助力，方向一致')
        if _0x0f32bf8c8:
            _0x0f0bbb82c.append('塔罗与卦象五行相克——东西方体系有张力，需调和矛盾')
    if _0x0e3d215c4:
        if '双重正向' in _0x0e3d215c4:
            _0x0f0bbb82c.append('阴阳正逆双重偏正——此刻适合主动出击，但留一分余地')
        elif '双重内敛' in _0x0e3d215c4:
            _0x0f0bbb82c.append('阴阳正逆双重偏负——此刻适合休养生息，不宜大动')
    return {'cards_info': _0x0db646654, 'element_analysis': {'tarot_elements': _0x05c07ce57, 'hex_elements': list(_0x05835f6cd), 'matches': _0x0e0c986d8, 'summary': _0x0e2bf0252}, 'balance_analysis': _0x0e3d215c4, 'narrative_arc': _0x0e6c147bc, 'keyword_cross': _0x0ebb81101[:3], 'advice_extra': _0x0f0bbb82c}
_0x0f4fba841 = {'行动': ['行动果断', '行动力', '行动'], '等待': ['等待', '耐心', '守'], '冒险': ['冒险', '大胆', '冒险'], '变化': ['变革', '变', '变化', '转变'], '权威': ['权威', '领导', '统率'], '自由': ['自由', '释放', '放下'], '直觉': ['直觉', '智慧', '内省'], '稳定': ['稳定', '守成', '安定'], '挑战': ['挑战', '竞争', '博弈'], '开始': ['新开始', '开创', '开始'], '结束': ['结束', '完成'], '释放': ['释放', '放下', '解难'], '和谐': ['和谐', '平衡', '和']}

def _0x0efa1e3c4(_0x0f5fd091a: str, _0x0f65b0a98: str) -> bool:
    _0xshdw_1fca = 11579
    if _0x0f5fd091a == _0x0f65b0a98:
        return True
    for _0x05a689ee7, _0x0f79bed5c in _0x0f4fba841.items():
        if _0x0f5fd091a in _0x0f79bed5c and _0x0f65b0a98 in _0x0f79bed5c:
            return True
    if len(_0x0f5fd091a) >= 2 and len(_0x0f65b0a98) >= 2:
        if _0x0f5fd091a in _0x0f65b0a98 or _0x0f65b0a98 in _0x0f5fd091a:
            return True
    return False

def _0x0d5064a6c(_0x004ef14a5: dict, _0x09aa6587d: dict, _0x0206296d1: dict, _0x01331a858: list, _0x012574173: list, _0x0ca05408d: int, _0x0cb414c14: int) -> dict:
    _0xphnt_6fa = []
    _0x0f8159e1f = _0x09aa6587d.get('id', 0)
    _0x0888f9d23 = _0x09aa6587d.get('name', '')
    _0x0f9d25c8f = len(_0x01331a858)
    _0x0faa63b8c = 0
    _0x0fbbbae4f = []
    from math import comb
    _0x0fcb29c05 = 64
    _0x0fd219e6e = comb(6, _0x0f9d25c8f) / _0x0fcb29c05
    if _0x0f9d25c8f == 0 or _0x0f9d25c8f == 6:
        _0x0faa63b8c += 35
        _0x0fbbbae4f.append(f"{('无动爻' if _0x0f9d25c8f == 0 else '六爻全动')}——概率仅 {_0x0fd219e6e * 100:.1f}%，极罕见")
    elif _0x0f9d25c8f == 1 or _0x0f9d25c8f == 5:
        _0x0faa63b8c += 20
        _0x0fbbbae4f.append(f'{_0x0f9d25c8f}个动爻——概率 {_0x0fd219e6e * 100:.1f}%，较少见')
    elif _0x0f9d25c8f == 2 or _0x0f9d25c8f == 4:
        _0x0faa63b8c += 8
    if _0x0ca05408d == 6:
        _0x0faa63b8c += 30
        _0x0fbbbae4f.append('六爻皆阳——纯乾之象，万分罕见')
    elif _0x0cb414c14 == 6:
        _0x0faa63b8c += 30
        _0x0fbbbae4f.append('六爻皆阴——纯坤之象，万分罕见')
    elif _0x0ca05408d == 0 or _0x0cb414c14 == 0:
        _0x0faa63b8c += 25
        _0x0fbbbae4f.append('阴阳极端偏斜——极少出现的格局')
    elif abs(_0x0ca05408d - _0x0cb414c14) >= 4:
        _0x0faa63b8c += 15
        _0x0fbbbae4f.append('阴阳严重失衡——不常见的能量分布')
    elif abs(_0x0ca05408d - _0x0cb414c14) >= 2:
        _0x0faa63b8c += 5
    _0x0feda13c7 = {1: ('纯阳乾卦', '六十四卦之首，纯阳至刚'), 2: ('纯阴坤卦', '六十四卦之母，纯阴至柔'), 11: ('泰卦', '天地交泰，阴阳最完美的和谐'), 12: ('否卦', '天地不交，阴阳最彻底的隔绝'), 63: ('既济', '六爻皆当位，完美完成之象'), 64: ('未济', '六爻皆不当位，未完成之象')}
    if _0x0f8159e1f in _0x0feda13c7:
        _0x0ff999b93, _0x0bf806e76 = _0x0feda13c7[_0x0f8159e1f]
        _0x0faa63b8c += 15
        _0x0fbbbae4f.append(f'{_0x0ff999b93}——{_0x0bf806e76}')
    if _0x0206296d1:
        _0x1002adca6 = _0x0206296d1.get('name', '')
        _0x1016ef0d9 = _0x09aa6587d.get('binary', '000000')
        _0x102ae6fbb = _0x0206296d1.get('binary', '000000')
        _0x103fae667 = sum((1 for _0x10496404c, _0x01dc2fea7 in zip(_0x1016ef0d9, _0x102ae6fbb) if _0x10496404c != _0x01dc2fea7))
        if _0x103fae667 >= 5:
            _0x0faa63b8c += 12
            _0x0fbbbae4f.append(f'卦象剧变（{_0x103fae667}爻翻转）——{_0x0888f9d23}→{_0x1002adca6}，本质性转变')
        elif _0x103fae667 >= 3:
            _0x0faa63b8c += 6
    _0x0faa63b8c = min(95, _0x0faa63b8c)
    if _0x0faa63b8c >= 60:
        _0x105b0f6cf = '罕見'
        _0x1067b6954 = f'約 {_0x0faa63b8c}% 的占卜不會出現這種格局'
        _0x107ae8746 = '這是一個不常降臨的卦象——它選擇了此刻的你。'
    elif _0x0faa63b8c >= 35:
        _0x105b0f6cf = '少見'
        _0x1067b6954 = f'大約每 {max(3, int(100 / (_0x0faa63b8c + 5)))} 次占卜才會遇到一次'
        _0x107ae8746 = '不是每天都能搖到的卦——值得多看幾眼。'
    elif _0x0faa63b8c >= 15:
        _0x105b0f6cf = '常見'
        _0x1067b6954 = '多數人問事都會落在這個區間'
        _0x107ae8746 = '這是一個接地氣的卦——普世而真實。'
    else:
        _0x105b0f6cf = '大眾'
        _0x1067b6954 = '非常普遍的卦象格局'
        _0x107ae8746 = '大多數人的此刻，長這個樣子。'
    _0x108456274 = []
    _0x08924f51b = _0x09aa6587d.get('fortune', '中')
    _0x1094254a0 = {'大吉': '天地給了你一張好牌', '吉': '整體順風，可以往前走', '中': '不好不壞，但暗藏轉機', '凶': '逆風，但不等於失敗——是提醒你慢下來', '大凶': '最難的卦——但最難的卦往往教會你最多的東西'}
    _0x108456274.append(_0x1094254a0.get(_0x08924f51b, '此刻的運勢如實呈現'))
    if _0x0f9d25c8f == 0:
        _0x108456274.append('沒有動爻——卦象很純粹，事情大概率會沿著現有軌跡走')
    elif _0x0f9d25c8f == 1:
        _0x108456274.append('一個動爻——變數集中在一個點上，抓住那個點就好')
    elif _0x0f9d25c8f <= 2:
        _0x108456274.append(f'{_0x0f9d25c8f}個動爻——有變化但可控，靈活應對')
    elif _0x0f9d25c8f <= 4:
        _0x108456274.append(f'{_0x0f9d25c8f}個動爻——變數較多，做好多手準備')
    else:
        _0x108456274.append(f'{_0x0f9d25c8f}個動爻——幾乎全面翻轉，做好迎接大變的準備')
    if _0x0ca05408d >= 5:
        _0x108456274.append('陽氣極盛——行動力爆棚，但要小心衝動')
    elif _0x0cb414c14 >= 5:
        _0x108456274.append('陰氣極盛——宜靜不宜動，向內積蓄力量')
    elif _0x0ca05408d > _0x0cb414c14:
        _0x108456274.append('偏陽剛——適合主動出擊')
    elif _0x0cb414c14 > _0x0ca05408d:
        _0x108456274.append('偏陰柔——適合以靜制動')
    else:
        _0x108456274.append('陰陽平衡——內外力量均等')
    return {'score': _0x0faa63b8c, 'level': _0x105b0f6cf, 'percentile': _0x1067b6954, 'vibe': _0x107ae8746, 'reasons': _0x0fbbbae4f, 'plain_reading': _0x108456274, 'hex_name': _0x0888f9d23, 'changing_count': _0x0f9d25c8f}
_LN_WM = '4c3a8f2e7b1d9065a2c8e4f1b7d3096e8a5c2f4d'