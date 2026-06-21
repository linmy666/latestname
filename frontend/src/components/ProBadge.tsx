/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  Latestname — 此刻之名                                      ║
 * ║  东西方占卜融合平台 (易经 × 塔罗 × 卦格人格)                   ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  Copyright © 2026 Lin Ruihan (linmy666)                      ║
 * ║  SPDX-License-Identifier: AGPL-3.0-or-later                  ║
 * ║  https://github.com/linmy666/latestname                      ║
 * ║                                                              ║
 * ║  Free software under AGPL-3.0. See LICENSE for details.      ║
 * ╚══════════════════════════════════════════════════════════════╝
 * Authorship: Lin Ruihan | GitHub: linmy666 | Project: Latestname
 */

/**
 * ProBadge — Pro 用户专属视觉标识
 *
 * 设计原则：
 * - Pro 用户登录后才能感知到（isPro=true）
 * - 未登录 / Standard 用户完全看不到
 * - 不出现"Pro"字眼——只是一个低调的金色微光
 * - 多个尺寸/样式可选，根据场景使用
 */
import { useAuth } from '../contexts/AuthContext'
import { D } from '../i18n-shim'

// 1. 钻石小图标 — 放在用户名旁边（最常见）
export function ProBadgeDot({ size = 8 }: { size?: number }) {
  const { isPro } = useAuth()
  if (!isPro) return null
  return (
    <span
      title={D('承蒙厚爱', 'A token of appreciation')}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        background: 'linear-gradient(135deg, #d4a86a 0%, #b8956a 50%, #8a6e4a 100%)',
        transform: 'rotate(45deg)',
        marginLeft: '0.4rem',
        boxShadow: '0 0 6px rgba(184,149,106,0.5)',
        flexShrink: 0,
        verticalAlign: 'middle',
      }}
    />
  )
}

// 2. 大徽章 — 在设置页底部 / 关于页用
export function ProBadgeFull() {
  const { isPro } = useAuth()
  if (!isPro) return null
  return (
    <div
      style={{
        marginTop: '1.5rem',
        padding: '0.9rem 1.2rem',
        background: 'linear-gradient(135deg, rgba(184,149,106,0.06) 0%, rgba(184,149,106,0.12) 100%)',
        border: '0.5px solid rgba(184,149,106,0.25)',
        borderRadius: '8px',
        fontSize: '0.78rem',
        color: 'var(--onyx-gold)',
        fontFamily: 'var(--font-serif-cn)',
        textAlign: 'center',
        letterSpacing: '0.05em',
      }}
    >
      <span style={{
        display: 'inline-block',
        width: 6,
        height: 6,
        background: 'linear-gradient(135deg, #d4a86a, #8a6e4a)',
        transform: 'rotate(45deg)',
        marginRight: '0.5rem',
        boxShadow: '0 0 4px rgba(184,149,106,0.6)',
        verticalAlign: 'middle',
      }} />
      {D('为某位用心的探索者增强', 'Enhanced for the curious explorer')}
    </div>
  )
}

// 3. nav 背景微光 — 在登录后给导航条加金色呼吸感
export function ProNavGlow() {
  const { isPro } = useAuth()
  if (!isPro) return null
  return (
    <style>{`
      @keyframes proShimmer {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 0.6; }
      }
      .pro-nav-indicator {
        position: absolute;
        bottom: -1px;
        left: 50%;
        transform: translateX(-50%);
        width: 24px;
        height: 2px;
        background: linear-gradient(90deg, transparent, #b8956a 50%, transparent);
        animation: proShimmer 4s ease-in-out infinite;
        pointer-events: none;
      }
    `}</style>
  )
}

// 4. History 卡片右上角 ✦ 符号 — 与金色微光边框配合
export function ProCardMark() {
  const { isPro } = useAuth()
  if (!isPro) return null
  return (
    <span
      style={{
        position: 'absolute',
        top: '0.8rem',
        right: '0.8rem',
        color: 'rgba(184,149,106,0.5)',
        fontSize: '0.9rem',
        pointerEvents: 'none',
      }}
    >
      ✦
    </span>
  )
}
// _LN_WM: 4c3a8f2e7b1d9065a2c8e4f1b7d3096e8a5c2f4d (linmy666/latestname AGPL-3.0)
