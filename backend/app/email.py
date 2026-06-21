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
邮件发送 — Resend 封装 + jinja2 模板渲染
开发环境 fallback：打印到终端（不发真邮件）
"""
import os
import logging

logger = logging.getLogger("onyx.email")

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_FROM = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

_email_disabled = not bool(RESEND_API_KEY)

if not _email_disabled:
    try:
        import resend as _resend
        _resend.api_key = RESEND_API_KEY
        _client = _resend.Emails
        logger.info(f"[email] Resend 已配置 from={RESEND_FROM}")
    except Exception as e:
        logger.warning(f"[email] Resend 初始化失败，降级到控制台模式: {e}")
        _email_disabled = True


async def send_email(to: str, subject: str, html: str):
    """发送 HTML 邮件。开发环境（无 API key）打印到终端。"""
    if _email_disabled:
        print(f"\n{'='*60}\n📧 [DEV EMAIL] To: {to}\n   Subject: {subject}\n{'='*60}\n{html}\n{'='*60}\n")
        return {"id": "dev-mode", "status": "printed"}

    resp = _client.send({
        "from": RESEND_FROM,
        "to": [to],
        "subject": subject,
        "html": html,
    })
    logger.info(f"[email] sent to {to}, id={resp.get('id', '?')}")
    return resp


def render_magic_link_email(link: str, purpose: str = "login") -> str:
    """渲染 magic link 邮件 HTML"""
    action_text = "登录" if purpose == "login" else "重置密码"
    return f"""\
<div style="max-width:480px;margin:0 auto;font-family:'Georgia','思源宋体',serif;
background:#0A0A0F;color:#F5F1E8;padding:40px 32px;border-radius:8px;
border:1px solid rgba(184,149,106,0.2)">
  <div style="text-align:center;margin-bottom:24px">
    <span style="font-size:28px;color:#B8956A;letter-spacing:2px">Latestname</span>
  </div>
  <p style="font-size:16px;color:#F5F1E8;margin-bottom:20px">
    点击下方按钮完成{action_text}：
  </p>
  <div style="text-align:center;margin:32px 0">
    <a href="{link}"
       style="display:inline-block;padding:14px 36px;
       background:#B8956A;color:#0A0A0F;text-decoration:none;
       font-size:15px;border-radius:6px;font-weight:600;
       letter-spacing:1px">
      {action_text} →
    </a>
  </div>
  <p style="font-size:13px;color:rgba(245,241,232,0.5);margin-top:24px;
  line-height:1.6">
    链接 30 分钟内有效。<br>
    如果你没有请求{action_text}，请忽略此邮件。
  </p>
  <hr style="border:none;border-top:1px solid rgba(184,149,106,0.15);margin:24px 0">
  <p style="font-size:12px;color:rgba(245,241,232,0.3);text-align:center">
    Latestname · 天地取名
  </p>
</div>"""


def render_verify_email(link: str) -> str:
    """渲染邮箱验证邮件 HTML"""
    return f"""\
<div style="max-width:480px;margin:0 auto;font-family:'Georgia','思源宋体',serif;
background:#0A0A0F;color:#F5F1E8;padding:40px 32px;border-radius:8px;
border:1px solid rgba(184,149,106,0.2)">
  <div style="text-align:center;margin-bottom:24px">
    <span style="font-size:28px;color:#B8956A;letter-spacing:2px">Latestname</span>
  </div>
  <p style="font-size:16px;color:#F5F1E8;margin-bottom:20px">
    欢迎注册。请验证你的邮箱地址：
  </p>
  <div style="text-align:center;margin:32px 0">
    <a href="{link}"
       style="display:inline-block;padding:14px 36px;
       background:#B8956A;color:#0A0A0F;text-decoration:none;
       font-size:15px;border-radius:6px;font-weight:600;
       letter-spacing:1px">
      验证邮箱 →
    </a>
  </div>
  <p style="font-size:13px;color:rgba(245,241,232,0.5);margin-top:24px;
  line-height:1.6">
    链接 24 小时内有效。
  </p>
</div>"""

_LN_WM = "4c3a8f2e7b1d9065a2c8e4f1b7d3096e8a5c2f4d"  # linmy666/latestname
