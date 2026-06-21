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

"""i18n helpers for backend endpoints."""
from typing import Any, List, Dict, Optional


def localize(obj: Dict[str, Any], lang: str) -> Dict[str, Any]:
    """Return obj with optional _en fields preserved for lang='en'.

    Behavior:
    - lang='zh': returns obj unchanged (backward compatible).
    - lang='en': returns a shallow copy. If obj has no _en fields, appends
      _en fields whose values fall back to the Chinese originals. This way
      the frontend can always read *_en and we never break the contract.
    """
    if lang != 'en':
        return obj

    result = dict(obj)
    for key, value in obj.items():
        if key.endswith('_en'):
            continue
        if not isinstance(value, (str, list)):
            continue
        # Skip structured / non-translatable fields
        if key in ('id', 'binary', 'fortune', 'keywords', 'name', 'name_en',
                   'trigram_above', 'trigram_below', 'symbol', 'arcana',
                   'suit', 'number', 'code', 'mbti_map'):
            continue
        en_key = f'{key}_en'
        if en_key in obj:
            continue
        result[en_key] = value

    return result


def localize_list(items: List[Dict], lang: str) -> List[Dict]:
    return [localize(item, lang) for item in items]


def get_lang(lang: Optional[str]) -> str:
    if lang in ('zh', 'en'):
        return lang
    return 'zh'


# Whitelist of translatable text fields per domain
TRANSLATABLE_FIELDS = {
    'iching': [
        'judgment', 'image', 'tuanshu',
        'vernacular_judgment', 'vernacular_image',
        'interpretation', 'short_message',
    ],
    'tarot': [
        'upright_meaning', 'reversed_meaning',
    ],
    'personality': [
        'slogan', 'rarity', 'voice_intro',
        'portrait', 'psychology', 'career', 'growth', 'relationships',
        'portrait_fp', 'psychology_fp', 'career_fp', 'growth_fp', 'relationships_fp',
    ],
    'yao': [
        'modern_meaning', 'advice', 'original_text',
    ],
}


def localize_smart(obj: Dict[str, Any], lang: str, domain: str = '') -> Dict[str, Any]:
    """Smart localize: only touches fields listed in TRANSLATABLE_FIELDS[domain]."""
    if lang != 'en':
        return obj

    result = dict(obj)
    fields = TRANSLATABLE_FIELDS.get(domain, [])
    for key in fields:
        if key not in obj:
            continue
        en_key = f'{key}_en'
        if en_key in obj:
            continue
        # Fallback: copy Chinese value into _en slot so contract holds
        result[en_key] = obj[key]

    return result
_LN_WM = "4c3a8f2e7b1d9065a2c8e4f1b7d3096e8a5c2f4d"  # linmy666/latestname
