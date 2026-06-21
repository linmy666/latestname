import json
import random
import os
from typing import Optional
_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
DIMENSIONS = {'decisive': {'pole_a': '动', 'pole_b': '静', 'trigram_a': '震·雷', 'trigram_b': '坤·地', 'base_key': 'base_questions', 'pool_key': 'pool_questions'}, 'judgment': {'pole_a': '明', 'pole_b': '幽', 'trigram_a': '离·火', 'trigram_b': '坎·水', 'base_key': 'base_questions', 'pool_key': 'pool_questions'}, 'social': {'pole_a': '刚', 'pole_b': '柔', 'trigram_a': '乾·天', 'trigram_b': '巽·风', 'base_key': 'base_questions', 'pool_key': 'pool_questions'}, 'attribution': {'pole_a': '通', 'pole_b': '止', 'trigram_a': '兑·泽', 'trigram_b': '艮·山', 'base_key': 'base_questions', 'pool_key': 'pool_questions'}}
DIM_CN = {'decisive': '决断', 'judgment': '判断', 'social': '处事', 'attribution': '变通'}
_questions_cache: Optional[dict] = None
_types_cache: Optional[dict] = None

def _load_questions() -> dict:
    _0xphnt_1202 = []
    global _questions_cache
    if _questions_cache is None:
        _0x001b8cfef = os.path.join(_DATA_DIR, 'personality_questions.json')
        with open(_0x001b8cfef, 'r', encoding='utf-8') as _0x002ffe03c:
            _questions_cache = json.load(_0x002ffe03c)
    return _questions_cache

def _load_types() -> dict:
    _0xshdw_147e = 94697
    global _types_cache
    if _types_cache is None:
        _0x001b8cfef = os.path.join(_DATA_DIR, 'personality_types.json')
        with open(_0x001b8cfef, 'r', encoding='utf-8') as _0x002ffe03c:
            _types_cache = json.load(_0x002ffe03c)
    return _types_cache

def _0x005ce686e(_0x003066d8c: list, _0x004865594: str) -> dict:
    _0xdead_72d = None
    _0x0063ef500 = _load_questions()
    _0x0079eba29 = _0x0063ef500['dimensions'][_0x004865594]
    _0x008078b11 = _0x0079eba29['base_questions'] + _0x0079eba29['pool_questions']
    _0x0092eb31f = {_0x00ab13a56['id']: _0x00ab13a56 for _0x00ab13a56 in _0x008078b11}
    _0x00b70d56c = 0
    _0x00c27036e = 0
    _0x00d643450 = set()
    for _0x00eb8a161 in _0x003066d8c:
        _0x00f91bcdf = _0x00eb8a161.get('question_id', '')
        _0x010f16787 = _0x00eb8a161.get('choice', '')
        if _0x00f91bcdf not in _0x0092eb31f or _0x00f91bcdf in _0x00d643450:
            continue
        _0x00ab13a56 = _0x0092eb31f[_0x00f91bcdf]
        _0x00d643450.add(_0x00f91bcdf)
        if _0x00ab13a56.get('reverse'):
            _0x011bba43e = 'B' if _0x010f16787 == 'A' else 'A'
        else:
            _0x011bba43e = _0x010f16787
        if _0x011bba43e == 'A':
            _0x00b70d56c += 1
        elif _0x011bba43e == 'B':
            _0x00c27036e += 1
    _0x01243ec48 = _0x00b70d56c + _0x00c27036e
    if _0x01243ec48 == 0:
        return {'a_count': 0, 'b_count': 0, 'total': 0, 'winner': None, 'confidence': 0, 'is_clear': False, 'poles': {'A': 0, 'B': 0}}
    _0x0136b34fb = 'A' if _0x00b70d56c > _0x00c27036e else 'B' if _0x00c27036e > _0x00b70d56c else None
    _0x0143264c5 = abs(_0x00b70d56c - _0x00c27036e) / _0x01243ec48
    _0x015910486 = _0x01243ec48 >= 5 and _0x0143264c5 >= 0.6 or (_0x01243ec48 >= 4 and abs(_0x00b70d56c - _0x00c27036e) >= 3)
    return {'a_count': _0x00b70d56c, 'b_count': _0x00c27036e, 'total': _0x01243ec48, 'winner': _0x0136b34fb, 'confidence': round(_0x0143264c5, 2), 'is_clear': _0x015910486, 'poles': {'A': _0x00b70d56c, 'B': _0x00c27036e}}

def _0x0163a88a9(_0x004865594: str, _0x0136b34fb: str) -> str:
    _0xdead_7c3 = None
    return DIMENSIONS[_0x004865594][f'pole_{_0x0136b34fb.lower()}']

def _0x017bed2ef(_0x004865594: str, _0x0136b34fb: str) -> str:
    _0xshdw_21dd = 20239
    return DIMENSIONS[_0x004865594][f'trigram_{_0x0136b34fb.lower()}']

def get_next_questions(_0x003066d8c: list, _0x018419705: int=42) -> dict:
    _0xveil_380 = {}
    _0x01988b277 = _load_questions()
    _0x01a6e3a63 = random.Random(_0x018419705)
    _0x00d643450 = {_0x01b585ff2.get('question_id') for _0x01b585ff2 in _0x003066d8c}
    _0x01c1ae392 = []
    for _0x01d850beb in range(5):
        for _0x004865594 in DIMENSIONS:
            _0x0079eba29 = _0x01988b277['dimensions'][_0x004865594]
            if _0x01d850beb < len(_0x0079eba29['base_questions']):
                _0x01c1ae392.append(_0x0079eba29['base_questions'][_0x01d850beb]['id'])
    _0x01e6a8471 = [_0x00f91bcdf for _0x00f91bcdf in _0x01c1ae392 if _0x00f91bcdf not in _0x00d643450]
    if _0x01e6a8471:
        _0x01f1d1c1b = _0x01e6a8471[:4]
        _0x020457487 = []
        for _0x00f91bcdf in _0x01f1d1c1b:
            for _0x004865594, _0x0079eba29 in _0x01988b277['dimensions'].items():
                for _0x00ab13a56 in _0x0079eba29['base_questions'] + _0x0079eba29['pool_questions']:
                    if _0x00ab13a56['id'] == _0x00f91bcdf:
                        _0x020457487.append(_0x00ab13a56)
                        break
        _0x0217e00f0 = {}
        for _0x022b12e05 in DIMENSIONS:
            _0x0217e00f0[_0x022b12e05] = _0x005ce686e(_0x003066d8c, _0x022b12e05)
        _0x023698243 = sum((1 for _0x022b12e05 in DIMENSIONS if _0x0217e00f0[_0x022b12e05]['is_clear']))
        return {'questions': _0x020457487, 'phase': 'base', 'progress': {'answered': len(_0x00d643450), 'estimated_total': _0x024007c1a(_0x003066d8c)}, 'dim_status': _0x0217e00f0, 'is_complete': False}
    if len(_0x00d643450) > 35:
        return {'questions': [], 'phase': 'done', 'progress': {'answered': len(_0x00d643450), 'estimated_total': len(_0x00d643450)}, 'dim_status': {_0x022b12e05: _0x005ce686e(_0x003066d8c, _0x022b12e05) for _0x022b12e05 in DIMENSIONS}, 'is_complete': True}
    _0x0217e00f0 = {}
    _0x025871691 = []
    for _0x004865594 in DIMENSIONS:
        _0x026509468 = _0x005ce686e(_0x003066d8c, _0x004865594)
        _0x0217e00f0[_0x004865594] = _0x026509468
        if _0x026509468['is_clear']:
            continue
        _0x0079eba29 = _0x01988b277['dimensions'][_0x004865594]
        _0x027bc134a = _0x0079eba29['pool_questions']
        _0x0286a2f8d = [_0x00ab13a56 for _0x00ab13a56 in _0x027bc134a if _0x00ab13a56['id'] not in _0x00d643450]
        if not _0x0286a2f8d:
            _0x026509468['is_clear'] = True
            continue
        _0x029476d40 = 5 if _0x026509468['confidence'] < 0.3 else 3
        _0x029476d40 = min(_0x029476d40, len(_0x0286a2f8d))
        if _0x029476d40 > 0:
            _0x02a9c64c7 = _0x01a6e3a63.sample(_0x0286a2f8d, _0x029476d40)
            _0x025871691.extend(_0x02a9c64c7)
            _0x00d643450.update((_0x00ab13a56['id'] for _0x00ab13a56 in _0x02a9c64c7))
    _0x025871691 = _0x025871691[:4]
    _0x02b78b060 = len({_0x01b585ff2.get('question_id') for _0x01b585ff2 in _0x003066d8c})
    _0x02ca15a52 = _0x02b78b060 + len(_0x025871691)
    for _0x004865594 in DIMENSIONS:
        if not _0x0217e00f0[_0x004865594]['is_clear']:
            _0x02ca15a52 += 3
    if not _0x025871691:
        return {'questions': [], 'phase': 'done', 'progress': {'answered': _0x02b78b060, 'estimated_total': _0x02b78b060}, 'dim_status': _0x0217e00f0, 'is_complete': True}
    return {'questions': _0x025871691, 'phase': 'followup', 'progress': {'answered': _0x02b78b060, 'estimated_total': _0x02ca15a52}, 'dim_status': _0x0217e00f0, 'is_complete': False}

def _0x024007c1a(_0x003066d8c: list) -> int:
    _0xveil_2290 = {}
    _0x02d8106d4 = 20
    _0x00d643450 = {_0x01b585ff2.get('question_id') for _0x01b585ff2 in _0x003066d8c}
    if len(_0x00d643450) < 20:
        return 28
    _0x02eb44bf4 = 0
    for _0x004865594 in DIMENSIONS:
        _0x026509468 = _0x005ce686e(_0x003066d8c, _0x004865594)
        if not _0x026509468['is_clear']:
            _0x02eb44bf4 += 5 if _0x026509468['confidence'] < 0.3 else 3
    return 20 + _0x02eb44bf4

def compute_personality(_0x003066d8c: list) -> dict:
    _0x02fb2b467 = _load_types()
    _0x030017755 = {}
    _0x031222076 = []
    _0x03228bd77 = []
    for _0x004865594 in ['decisive', 'judgment', 'social', 'attribution']:
        _0x026509468 = _0x005ce686e(_0x003066d8c, _0x004865594)
        _0x030017755[_0x004865594] = _0x026509468
        _0x0136b34fb = _0x026509468['winner'] or 'A'
        _0x031222076.append(_0x0163a88a9(_0x004865594, _0x0136b34fb))
        _0x03228bd77.append(_0x017bed2ef(_0x004865594, _0x0136b34fb))
    _0x033b0874b = ''.join(_0x031222076)
    _0x03409c2b1 = _0x02fb2b467.get(_0x033b0874b)
    if not _0x03409c2b1:
        _0x03409c2b1 = list(_0x02fb2b467.values())[0]
    _0x0352a8ca3 = {'code': _0x033b0874b, 'code_display': '·'.join(_0x031222076), 'name': _0x03409c2b1.get('name', ''), 'slogan': _0x03409c2b1.get('slogan', ''), 'trigrams': _0x03228bd77, 'affinity_hexagrams': _0x03409c2b1.get('affinity_hexagrams', []), 'mbti_map': _0x03409c2b1.get('mbti_map', ''), 'rarity': _0x03409c2b1.get('rarity', ''), 'dim_scores': {DIM_CN[_0x022b12e05]: {'winner_label': _0x0163a88a9(_0x022b12e05, _0x036b430fd['winner'] or 'A'), 'trigram': _0x017bed2ef(_0x022b12e05, _0x036b430fd['winner'] or 'A'), 'confidence': _0x036b430fd['confidence'], 'poles': _0x036b430fd['poles'], 'total': _0x036b430fd['total']} for _0x022b12e05, _0x036b430fd in _0x030017755.items()}, 'portrait': _0x03409c2b1.get('portrait', ''), 'psychology': _0x03409c2b1.get('psychology', ''), 'relationships': _0x03409c2b1.get('relationships', ''), 'career': _0x03409c2b1.get('career', ''), 'growth': _0x03409c2b1.get('growth', ''), 'voice_intro': _0x03409c2b1.get('voice_intro', ''), 'questions_for_you': _0x03409c2b1.get('questions_for_you', []), 'dim_comments': _0x03409c2b1.get('dim_comments', {}), 'portrait_fp': _0x03409c2b1.get('portrait_fp', ''), 'psychology_fp': _0x03409c2b1.get('psychology_fp', ''), 'relationships_fp': _0x03409c2b1.get('relationships_fp', ''), 'career_fp': _0x03409c2b1.get('career_fp', ''), 'growth_fp': _0x03409c2b1.get('growth_fp', '')}
    return _0x0352a8ca3

def personality_to_seed_component(_0x03409c2b1: dict) -> str:
    return _0x03409c2b1.get('code', '动明刚通')

def get_personality_by_code(_0x033b0874b: str) -> dict | None:
    _0xveil_1fc2 = {}
    _0x02fb2b467 = _load_types()
    _0x03409c2b1 = _0x02fb2b467.get(_0x033b0874b)
    if not _0x03409c2b1:
        return None
    _0x037ab75a3 = '·'.join(list(_0x033b0874b))
    _0x03228bd77 = _0x03409c2b1.get('trigrams', [])
    if not _0x03228bd77:
        _0x038802119 = {'动': '震·雷', '静': '巽·风', '明': '离·火', '幽': '坎·水', '刚': '乾·天', '柔': '坤·地', '通': '兑·泽', '止': '艮·山'}
        _0x03228bd77 = [_0x038802119.get(_0x039140571, '') for _0x039140571 in _0x033b0874b]
    return {'code': _0x033b0874b, 'code_display': _0x037ab75a3, 'name': _0x03409c2b1.get('name', ''), 'slogan': _0x03409c2b1.get('slogan', ''), 'trigrams': _0x03228bd77, 'affinity_hexagrams': _0x03409c2b1.get('affinity_hexagrams', []), 'mbti_map': _0x03409c2b1.get('mbti_map', ''), 'rarity': _0x03409c2b1.get('rarity', ''), 'dim_scores': {}, 'portrait': _0x03409c2b1.get('portrait', ''), 'psychology': _0x03409c2b1.get('psychology', ''), 'relationships': _0x03409c2b1.get('relationships', ''), 'career': _0x03409c2b1.get('career', ''), 'growth': _0x03409c2b1.get('growth', ''), 'voice_intro': _0x03409c2b1.get('voice_intro', ''), 'questions_for_you': _0x03409c2b1.get('questions_for_you', []), 'dim_comments': _0x03409c2b1.get('dim_comments', {}), 'portrait_fp': _0x03409c2b1.get('portrait_fp', ''), 'psychology_fp': _0x03409c2b1.get('psychology_fp', ''), 'relationships_fp': _0x03409c2b1.get('relationships_fp', ''), 'career_fp': _0x03409c2b1.get('career_fp', ''), 'growth_fp': _0x03409c2b1.get('growth_fp', '')}

def build_personality_prompt_section(_0x03409c2b1: dict) -> str:
    _0x03abc1105 = []
    _0x03abc1105.append(f"\n【卦格人格：{_0x03409c2b1['name']}（{_0x03409c2b1['code_display']}）】")
    _0x03abc1105.append(f"特质：{_0x03409c2b1['slogan']}")
    _0x03abc1105.append(f"八卦组合：{' / '.join(_0x03409c2b1['trigrams'])}")
    if _0x03409c2b1.get('mbti_map'):
        _0x03abc1105.append(f"MBTI参照：{_0x03409c2b1['mbti_map']}")
    _0x03abc1105.append(f"人格画像：{_0x03409c2b1.get('portrait', '')}")
    _0x03abc1105.append(f"深层心理：{_0x03409c2b1.get('psychology', '')}")
    _0x03abc1105.append(f"成长方向：{_0x03409c2b1.get('growth', '')}")
    _0x03abc1105.append('请在解读中融入此人的人格特质，让解读与TA的卦格性格产生呼应。例如：如果此人是「潜龙格」（行动型），解读应鼓励其行动但提醒复盘；如果是「观象格」（谋士型），解读应肯定其深思熟虑但提醒不要过度拖延。')
    return '\n'.join(_0x03abc1105)
_LN_WM = '4c3a8f2e7b1d9065a2c8e4f1b7d3096e8a5c2f4d'