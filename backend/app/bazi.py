from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
try:
    import ephem
    import math as _math
    _0x001f8d7c4 = True
except ImportError:
    ephem = None
    _math = None
    _0x001f8d7c4 = False
_0x0020090ce = [285, 315, 345, 15, 45, 75, 105, 135, 165, 195, 225, 255]
_0x003b84e08 = {1: ('小寒', 285), 2: ('立春', 315), 3: ('惊蛰', 345), 4: ('清明', 15), 5: ('立夏', 45), 6: ('芒种', 75), 7: ('小暑', 105), 8: ('立秋', 135), 9: ('白露', 165), 10: ('寒露', 195), 11: ('立冬', 225), 12: ('大雪', 255)}

def _0x006f8a36e(_0x0043a9231: int, _0x00539d601: float) -> Tuple[int, int]:
    if not _0x001f8d7c4:
        return None
    _0x00723ab7d = {285: (1, 5), 315: (2, 4), 345: (3, 6), 15: (4, 5), 45: (5, 6), 75: (6, 6), 105: (7, 7), 135: (8, 7), 165: (9, 8), 195: (10, 8), 225: (11, 7), 255: (12, 7)}
    _0x008979e85, _0x00909ee2d = _0x00723ab7d.get(round(_0x00539d601), (6, 21))
    _0x00ac179f5 = datetime(_0x0043a9231, _0x008979e85, _0x00909ee2d)
    _0x00b387f68 = _0x00ac179f5 - timedelta(days=15)
    _0x00c055202 = _0x00ac179f5 + timedelta(days=15)

    def _0x00e018f49(_0x00d535ff9: datetime) -> float:
        _0xshdw_7cf = 71102
        _0x00fe72b76 = _0x00d535ff9 - timedelta(hours=8)
        _0x0102bd17c = ephem.Date(_0x00fe72b76.strftime('%Y/%m/%d %H:%M'))
        _0x01187a1b0 = ephem.Sun(_0x0102bd17c)
        _0x012f7af1c = float(_0x01187a1b0.g_ra)
        _0x0134d204b = float(_0x01187a1b0.g_dec)
        _0x014449554 = _math.radians(23.4393)
        _0x015cbb519 = _math.atan2(_math.sin(_0x012f7af1c) * _math.cos(_0x014449554) + _math.tan(_0x0134d204b) * _math.sin(_0x014449554), _math.cos(_0x012f7af1c))
        return _math.degrees(_0x015cbb519) % 360
    _0x01698d22a = _0x00539d601 % 360
    for _0x01798d8da in range(30):
        if _0x00c055202 <= _0x00b387f68:
            break
        _0x01880238f = _0x00b387f68 + (_0x00c055202 - _0x00b387f68) / 2
        if abs((_0x00c055202 - _0x00b387f68).total_seconds()) < 86400:
            return (_0x01880238f.month, _0x01880238f.day)
        _0x01906885b = _0x00e018f49(_0x01880238f)
        if abs(_0x01906885b - _0x01698d22a) < 0.5:
            return (_0x01880238f.month, _0x01880238f.day)
        _0x01a1bd288 = (_0x01906885b - _0x01698d22a) % 360
        if _0x01a1bd288 < 180:
            _0x00c055202 = _0x01880238f
        else:
            _0x00b387f68 = _0x01880238f
    if _0x01880238f is None:
        return (1, 1)
    return (_0x01880238f.month, _0x01880238f.day)
_0x01b87243d = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
_0x01c5a2f2c = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
_0x01d712a66 = {'甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'}
_0x01e480081 = {'子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'}
_0x01f5e083b = {'甲': '阳', '乙': '阴', '丙': '阳', '丁': '阴', '戊': '阳', '己': '阴', '庚': '阳', '辛': '阴', '壬': '阳', '癸': '阴'}
_0x0202bbaf4 = {'子': '鼠', '丑': '牛', '寅': '虎', '卯': '兔', '辰': '龙', '巳': '蛇', '午': '马', '未': '羊', '申': '猴', '酉': '鸡', '戌': '狗', '亥': '猪'}
_0x02140636b = ['海中金', '海中金', '炉中火', '炉中火', '大林木', '大林木', '路旁土', '路旁土', '剑锋金', '剑锋金', '山头火', '山头火', '涧下水', '涧下水', '城头土', '城头土', '白蜡金', '白蜡金', '杨柳木', '杨柳木', '井泉水', '井泉水', '屋上土', '屋上土', '霹雳火', '霹雳火', '松柏木', '松柏木', '长流水', '长流水', '砂石金', '砂石金', '山下火', '山下火', '平地木', '平地木', '壁上土', '壁上土', '金箔金', '金箔金', '覆灯火', '覆灯火', '天河水', '天河水', '大驿土', '大驿土', '钗钏金', '钗钏金', '桑柘木', '桑柘木', '大溪水', '大溪水', '沙中土', '沙中土', '天上火', '天上火', '石榴木', '石榴木', '大海水', '大海水']
_0x0220dcaaa = {'甲': ['丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁'], '己': ['丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁'], '乙': ['戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己'], '庚': ['戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己'], '丙': ['庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛'], '辛': ['庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛'], '丁': ['壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'], '壬': ['壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'], '戊': ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙'], '癸': ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙']}
_0x023d879da = {2: 4, 3: 6, 4: 5, 5: 6, 6: 6, 7: 7, 8: 8, 9: 8, 10: 8, 11: 7, 12: 7, 1: 6}
_0x0247ac0d4 = ['木', '火', '土', '金', '水']
_0x0250a25ee = {'木': '火', '火': '土', '土': '金', '金': '水', '水': '木'}
_0x02641c634 = {'木': '土', '火': '金', '土': '水', '金': '木', '水': '火'}

def _0x02701dac7(_0x0043a9231: int) -> Tuple[str, str]:
    _0x028032514 = (_0x0043a9231 - 4) % 60
    _0x029fc092d = _0x01b87243d[_0x028032514 % 10]
    _0x02a84b30c = _0x01c5a2f2c[_0x028032514 % 12]
    return (_0x029fc092d, _0x02a84b30c)

def _0x02d9a5918(_0x0043a9231: int, _0x02baf2db2: int, _0x02cb6c76c: int) -> Tuple[str, str]:
    _0xveil_1298 = {}
    _0x02e31f7a3 = [285, 315, 345, 15, 45, 75, 105, 135, 165, 195, 225, 255]
    _0x02fac2aa2 = _0x02baf2db2 - 1
    _0x0304e9d9d = _0x02e31f7a3[_0x02fac2aa2]
    if _0x001f8d7c4:
        _0x031115916 = _0x006f8a36e(_0x0043a9231, _0x0304e9d9d)
        if _0x031115916 is None:
            _0x032cd81f7 = _0x023d879da.get(_0x02baf2db2, 6)
        else:
            _0x01798d8da, _0x032cd81f7 = _0x031115916
    else:
        _0x032cd81f7 = _0x023d879da.get(_0x02baf2db2, 6)
    if _0x02cb6c76c < _0x032cd81f7:
        _0x03323b6db = (_0x02baf2db2 - 1) % 12
    else:
        _0x03323b6db = _0x02baf2db2 % 12
    _0x02a84b30c = _0x01c5a2f2c[_0x03323b6db]
    if _0x03323b6db == 0:
        _0x034b5d391 = 10
        _0x0351c04a4 = _0x0043a9231 - 1
    elif _0x03323b6db == 1:
        _0x034b5d391 = 11
        _0x0351c04a4 = _0x0043a9231
    else:
        _0x034b5d391 = _0x03323b6db - 2
        _0x0351c04a4 = _0x0043a9231
    _0x0362be4cf, _0x01798d8da = _0x02701dac7(_0x0351c04a4)
    if _0x034b5d391 == 10:
        _0x037fc695d, _0x01798d8da = _0x02701dac7(_0x0351c04a4)
        _0x029fc092d = _0x0220dcaaa[_0x037fc695d][9]
    else:
        _0x029fc092d = _0x0220dcaaa[_0x0362be4cf][_0x034b5d391]
    return (_0x029fc092d, _0x02a84b30c)

def _0x03865a837(_0x0043a9231: int, _0x02baf2db2: int, _0x02cb6c76c: int) -> Tuple[str, str]:
    _0x00ac179f5 = datetime(1900, 1, 31)
    _0x03913a3ee = 10
    _0x01698d22a = datetime(_0x0043a9231, _0x02baf2db2, _0x02cb6c76c)
    _0x03a393a0d = (_0x01698d22a - _0x00ac179f5).days
    _0x028032514 = (_0x03913a3ee + _0x03a393a0d) % 60
    _0x029fc092d = _0x01b87243d[_0x028032514 % 10]
    _0x02a84b30c = _0x01c5a2f2c[_0x028032514 % 12]
    return (_0x029fc092d, _0x02a84b30c)

def _0x03d941eef(_0x03bf2e2a6: str, _0x03cfc508f: int) -> Tuple[str, str]:
    _0x03323b6db = (_0x03cfc508f + 1) // 2 % 12
    _0x02a84b30c = _0x01c5a2f2c[_0x03323b6db]
    _0x03e7cbe2b = {'甲': 0, '己': 0, '乙': 2, '庚': 2, '丙': 4, '辛': 4, '丁': 6, '壬': 6, '戊': 8, '癸': 8}
    _0x03f43164d = _0x03e7cbe2b[_0x03bf2e2a6]
    _0x0407999fc = (_0x03f43164d + _0x03323b6db) % 10
    _0x029fc092d = _0x01b87243d[_0x0407999fc]
    return (_0x029fc092d, _0x02a84b30c)

def _0x041ee7692(_0x029fc092d: str, _0x02a84b30c: str) -> str:
    _0x0424ad956 = _0x01b87243d.index(_0x029fc092d)
    _0x04366f49a = _0x01c5a2f2c.index(_0x02a84b30c)
    for _0x044b68261 in range(60):
        if _0x044b68261 % 10 == _0x0424ad956 and _0x044b68261 % 12 == _0x04366f49a:
            return _0x02140636b[_0x044b68261]
    return '未知'

def compute_bazi(_0x0043a9231: int, _0x02baf2db2: int, _0x02cb6c76c: int, _0x03cfc508f: Optional[int]=None, _0x045c16bab: str='unknown', _0x046135eb6: str='', _0x04792a37a: str='') -> Dict:
    _0x0481d0f3f = 0
    _0x0497be69a = None
    _0x04ad974cd = _0x03cfc508f
    if _0x04792a37a and _0x03cfc508f is not None:
        try:
            from app.solar_time import get_solar_time_with_city
            _0x04bf85f97 = datetime(_0x0043a9231, _0x02baf2db2, _0x02cb6c76c, _0x03cfc508f)
            _0x04cf1db32, _0x0497be69a = get_solar_time_with_city(_0x04bf85f97, _0x04792a37a)
            if _0x04cf1db32:
                _0x0481d0f3f = (_0x04cf1db32 - _0x04bf85f97).total_seconds() / 60
                _0x04ad974cd = _0x04cf1db32.hour
                if _0x04cf1db32.day != _0x04bf85f97.day:
                    _0x0043a9231 = _0x04cf1db32.year
                    _0x02baf2db2 = _0x04cf1db32.month
                    _0x02cb6c76c = _0x04cf1db32.day
        except Exception as e:
            pass
    _0x0362be4cf, _0x04d4f3e2b = _0x02701dac7(_0x0043a9231)
    _0x04e4c3cc4, _0x04f848ae0 = _0x02d9a5918(_0x0043a9231, _0x02baf2db2, _0x02cb6c76c)
    _0x03bf2e2a6, _0x0507f90c9 = _0x03865a837(_0x0043a9231, _0x02baf2db2, _0x02cb6c76c)
    if _0x03cfc508f is not None:
        _0x0513cd842, _0x052b9a275 = _0x03d941eef(_0x03bf2e2a6, _0x04ad974cd)
    else:
        _0x0513cd842, _0x052b9a275 = ('?', '?')
    _0x0539069db = [{'pillar': '年柱', 'gan': _0x0362be4cf, 'zhi': _0x04d4f3e2b, 'wuxing_gan': _0x01d712a66.get(_0x0362be4cf, '?'), 'wuxing_zhi': _0x01e480081.get(_0x04d4f3e2b, '?'), 'nayin': _0x041ee7692(_0x0362be4cf, _0x04d4f3e2b) if _0x0362be4cf != '?' else '?', 'shengxiao': _0x0202bbaf4.get(_0x04d4f3e2b, '?'), 'yinyang': _0x01f5e083b.get(_0x0362be4cf, '?')}, {'pillar': '月柱', 'gan': _0x04e4c3cc4, 'zhi': _0x04f848ae0, 'wuxing_gan': _0x01d712a66.get(_0x04e4c3cc4, '?'), 'wuxing_zhi': _0x01e480081.get(_0x04f848ae0, '?'), 'nayin': _0x041ee7692(_0x04e4c3cc4, _0x04f848ae0) if _0x04e4c3cc4 != '?' else '?', 'shengxiao': _0x0202bbaf4.get(_0x04f848ae0, '?'), 'yinyang': _0x01f5e083b.get(_0x04e4c3cc4, '?')}, {'pillar': '日柱', 'gan': _0x03bf2e2a6, 'zhi': _0x0507f90c9, 'wuxing_gan': _0x01d712a66.get(_0x03bf2e2a6, '?'), 'wuxing_zhi': _0x01e480081.get(_0x0507f90c9, '?'), 'nayin': _0x041ee7692(_0x03bf2e2a6, _0x0507f90c9) if _0x03bf2e2a6 != '?' else '?', 'shengxiao': _0x0202bbaf4.get(_0x0507f90c9, '?'), 'yinyang': _0x01f5e083b.get(_0x03bf2e2a6, '?')}, {'pillar': '时柱', 'gan': _0x0513cd842, 'zhi': _0x052b9a275, 'wuxing_gan': _0x01d712a66.get(_0x0513cd842, '?'), 'wuxing_zhi': _0x01e480081.get(_0x052b9a275, '?'), 'nayin': _0x041ee7692(_0x0513cd842, _0x052b9a275) if _0x0513cd842 != '?' else '?', 'shengxiao': _0x0202bbaf4.get(_0x052b9a275, '?'), 'yinyang': _0x01f5e083b.get(_0x0513cd842, '?')}]
    _0x0546293b9 = {'木': 0, '火': 0, '土': 0, '金': 0, '水': 0}
    for _0x055ee41c1 in _0x0539069db:
        if _0x055ee41c1['wuxing_gan'] in _0x0546293b9:
            _0x0546293b9[_0x055ee41c1['wuxing_gan']] += 1
        if _0x055ee41c1['wuxing_zhi'] in _0x0546293b9:
            _0x0546293b9[_0x055ee41c1['wuxing_zhi']] += 1
    _0x056e00489 = _0x01d712a66.get(_0x03bf2e2a6, '?')
    _0x0574f0af1 = _0x01f5e083b.get(_0x03bf2e2a6, '?')
    _0x058f11380 = {'木': '水', '火': '木', '土': '火', '金': '土', '水': '金'}
    _0x0596f2b6d = _0x058f11380.get(_0x056e00489, '')
    _0x05ab3e9d2 = _0x0546293b9.get(_0x056e00489, 0) + _0x0546293b9.get(_0x0596f2b6d, 0)
    if _0x05ab3e9d2 >= 4:
        _0x05bf8b048 = '偏强'
    elif _0x05ab3e9d2 >= 3:
        _0x05bf8b048 = '中和'
    elif _0x05ab3e9d2 >= 2:
        _0x05bf8b048 = '偏弱'
    else:
        _0x05bf8b048 = '太弱'
    if '弱' in _0x05bf8b048:
        _0x05cdeeb4b = [_0x056e00489, _0x0596f2b6d]
    elif '强' in _0x05bf8b048:
        _0x05d234e80 = {'木': '金', '火': '水', '土': '木', '金': '火', '水': '土'}
        _0x05cdeeb4b = [_0x02641c634.get(_0x056e00489, ''), _0x0250a25ee.get(_0x056e00489, '')]
    else:
        _0x05cdeeb4b = []
    _0x05ed41cb7 = [_0x05f050c1d for _0x05f050c1d, _0x060cfe286 in _0x0546293b9.items() if _0x060cfe286 == 0]
    return {'birth': {'year': _0x0043a9231, 'month': _0x02baf2db2, 'day': _0x02cb6c76c, 'hour': _0x03cfc508f}, 'gender': _0x045c16bab, 'name': _0x046135eb6, 'pillars': _0x0539069db, 'four_pillars_str': f'{_0x0362be4cf}{_0x04d4f3e2b} {_0x04e4c3cc4}{_0x04f848ae0} {_0x03bf2e2a6}{_0x0507f90c9} {_0x0513cd842}{_0x052b9a275}', 'day_master': _0x056e00489, 'day_master_element': _0x056e00489, 'day_master_full': f'{_0x056e00489}{_0x0574f0af1}', 'wuxing_count': _0x0546293b9, 'wuxing_str': ' '.join((f'{_0x0610584b5}{_0x062953bc0}' for _0x0610584b5, _0x062953bc0 in _0x0546293b9.items())), 'strength': _0x05bf8b048, 'favorable_elements': _0x05cdeeb4b, 'missing_elements': _0x05ed41cb7, 'shengxiao': _0x0202bbaf4.get(_0x04d4f3e2b, '?'), 'birth_city': _0x0497be69a, 'solar_correction_minutes': round(_0x0481d0f3f, 1) if _0x04792a37a else 0, 'summary': f"日主{_0x056e00489}{_0x0574f0af1}（{_0x05bf8b048}），五行{', '.join((f'{_0x0610584b5}{_0x062953bc0}' for _0x0610584b5, _0x062953bc0 in _0x0546293b9.items()))}，" + (f"缺{'缺'.join(_0x05ed41cb7)}" if _0x05ed41cb7 else '五行俱全')}
_LN_WM = '4c3a8f2e7b1d9065a2c8e4f1b7d3096e8a5c2f4d'