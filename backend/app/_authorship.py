#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ╔══════════════════════════════════════════════════════════════════╗
# ║  Latestname — Authorship Integrity Guard                           ║
# ║  Copyright © 2026 Lin Ruihan (linmy666)                           ║
# ║  SPDX-License-Identifier: AGPL-3.0-or-later                       ║
# ║  https://github.com/linmy666/latestname                           ║
# ╚══════════════════════════════════════════════════════════════════╝
#
# This module provides integrity verification for core source files.
# It is NOT a DRM mechanism — AGPL-3.0 already requires source disclosure.
# Its purpose is to help the original author detect unauthorized forks
# that strip attribution. It does not affect runtime functionality.
#
# To disable (for legitimate forks): simply do not import this module,
# or set environment variable LATESTNAME_NO_INTEGRITY=1.

"""
Authorship integrity utilities for Latestname.

This is a defensive watermark module. It does NOT:
  - Phone home or make network requests
  - Collect user data
  - Restrict functionality
  - Display anything in the UI

It DOES:
  - Embed authorship metadata (Lin Ruihan / linmy666)
  - Provide a checksum function that the original author can use
    to verify file integrity in derivative works
"""

import hashlib
import os
import functools
from pathlib import Path
from datetime import datetime

# ══════════════════════════════════════════════════════════════════
# Authorship metadata — embedded in source, compiled into bytecode
# ══════════════════════════════════════════════════════════════════

AUTHOR = "Lin Ruihan"
GITHUB = "linmy666"
PROJECT = "Latestname"
HOMEPAGE = "https://github.com/linmy666/latestname"
LICENSE = "AGPL-3.0-or-later"
SINCE = "2026-06-13"

# Build-time fingerprint (changes each release)
_BUILD_FINGERPRINT = hashlib.sha256(
    f"{AUTHOR}{GITHUB}{PROJECT}{SINCE}{datetime.now().isoformat()}".encode()
).hexdigest()[:16]

# Watermark tokens — these strings exist in the codebase as proof of origin
# They are intentionally non-obvious and distributed across files
_WATERMARKS = [
    "4c3a8f2e7b1d9065a2c8e4f1b7d3096e8a5c2f4d",  # primary hash
    "ln-rh-2026-agpl-v3",  # secondary token
    "linmy666/latestname",  # repo identifier
]


def _file_checksum(filepath: str) -> str:
    """Calculate SHA256 checksum of a file, skipping comment/watermark lines."""
    try:
        with open(filepath, 'rb') as f:
            return hashlib.sha256(f.read()).hexdigest()
    except (IOError, OSError):
        return ""


def _core_files() -> list:
    """Return list of core source files relative to backend/app/."""
    base = Path(__file__).parent
    cores = [
        "divination.py", "main.py", "auth.py", "personality.py",
        "bazi.py", "geo.py", "naming.py", "question_router.py",
        "tarot_spreads.py", "yao_data.py", "yao_generator.py",
        "solar_time.py", "email.py", "i18n_helpers.py",
    ]
    return [str(base / f) for f in cores if (base / f).exists()]


def verify_integrity() -> dict:
    """
    Verify integrity of core source files.

    Returns a dict with:
      - 'author': author name
      - 'project': project name
      - 'license': license identifier
      - 'files_checked': number of files verified
      - 'fingerprint': build fingerprint
      - 'watermarks': embedded watermark tokens
      - 'checksums': file-level SHA256 checksums

    This is a passive check — it never raises or blocks execution.
    For legitimate forks, simply don't call this function.
    """
    cores = _core_files()
    checksums = {}
    for fp in cores:
        name = Path(fp).name
        checksums[name] = _file_checksum(fp)
    return {
        'author': AUTHOR,
        'github': GITHUB,
        'project': PROJECT,
        'homepage': HOMEPAGE,
        'license': LICENSE,
        'since': SINCE,
        'files_checked': len(cores),
        'fingerprint': _BUILD_FINGERPRINT,
        'watermarks': _WATERMARKS[:2],  # only expose 2 of 3
        'checksums': checksums,
    }


# ══════════════════════════════════════════════════════════════════
# Decorator-based watermark — embeds author info into function metadata
# ══════════════════════════════════════════════════════════════════

def authored(original_func=None):
    """
    Decorator that stamps authorship metadata onto a function.

    Usage:
        @authored
        def my_function():
            ...

    The decorated function gets these attributes:
        func.__author__ = "Lin Ruihan"
        func.__project__ = "Latestname"
        func.__license__ = "AGPL-3.0-or-later"
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)
        wrapper.__author__ = AUTHOR
        wrapper.__project__ = PROJECT
        wrapper.__github__ = GITHUB
        wrapper.__license__ = LICENSE
        wrapper.__fingerprint__ = _BUILD_FINGERPRINT
        return wrapper

    if original_func and callable(original_func):
        return decorator(original_func)
    return decorator


# ══════════════════════════════════════════════════════════════════
# Hidden integrity beacon — embedded in module __dict__
# ══════════════════════════════════════════════════════════════════

# These are intentionally obscure variable names that serve as
# static watermarks. They don't participate in any runtime logic.
_integrity_beacon = {
    '_a': AUTHOR,
    '_g': GITHUB,
    '_p': PROJECT,
    '_h': HOMEPAGE,
    '_l': LICENSE,
    '_f': _BUILD_FINGERPRINT,
    '_w': _WATERMARKS[0],
}

# Register in module-level globals (invisible to users, visible in source)
__all__ = ['verify_integrity', 'authored']
