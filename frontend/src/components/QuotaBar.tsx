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
 * QuotaBar — 当日用量条
 * 显示三种配额：卦名测算 / 卦象测算 / 深度分析
 * 用于顶部 nav 或首页
 */
import { useAuth } from '../contexts/AuthContext'
import { usePrefs } from '../App'
import { D } from '../i18n-shim'

export function QuotaBar({ compact = false }: { compact?: boolean }) {
  const { user, usage, authEnabled } = useAuth()
  const { lang } = usePrefs()

  if (!authEnabled || !user || !usage) return null

  const items = [
    {
      label: D('卦名测算', 'MBTI'),
      used: (usage.mbti_limit ?? 1) - (usage.mbti_remaining ?? 0),
      limit: usage.mbti_limit ?? 1,
    },
    {
      label: D('卦象测算', 'Divination'),
      used: (usage.divination_limit ?? 5) - (usage.divination_remaining ?? 0),
      limit: usage.divination_limit ?? 5,
    },
    {
      label: D('深度分析', 'AI Reading'),
      used: usage.ai_limit - usage.ai_remaining,
      limit: usage.ai_limit,
    },
  ]

  if (compact) {
    // 单行紧凑模式：只显示数值
    return (
      <div style={{
        display: 'flex',
        gap: '0.8rem',
        fontSize: '0.7rem',
        color: 'var(--onyx-gold)',
        opacity: 0.75,
        fontFamily: 'var(--font-serif-cn)',
      }}>
        {items.map((it, i) => (
          <span key={i}>
            {it.label} <strong style={{ color: it.used >= it.limit ? '#c44545' : 'inherit' }}>{it.used}/{it.limit}</strong>
          </span>
        ))}
      </div>
    )
  }

  // 详细模式：进度条
  return (
    <div style={{
      padding: '0.75rem 1rem',
      background: 'var(--surface)',
      border: '1px solid var(--separator)',
      borderRadius: '8px',
      fontSize: '0.78rem',
      color: 'var(--text-secondary)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.5rem',
        fontFamily: 'var(--font-serif-cn)',
        color: 'var(--onyx-gold)',
      }}>
        <span>{D('今 日 配 额', 'Today\'s Quota')}</span>
        <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{D('每日0点重置', 'Resets at 00:00')}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        {items.map((it, i) => {
          const pct = it.limit > 0 ? Math.min(100, (it.used / it.limit) * 100) : 0
          const exhausted = it.used >= it.limit
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ minWidth: '70px', color: 'var(--text-primary)' }}>{it.label}</span>
              <div style={{
                flex: 1,
                height: '4px',
                background: 'var(--separator)',
                borderRadius: '2px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: exhausted ? '#c44545' : 'var(--onyx-gold)',
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <span style={{
                minWidth: '36px',
                textAlign: 'right',
                color: exhausted ? '#c44545' : 'var(--text-secondary)',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {it.used}/{it.limit}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
// _LN_WM: 4c3a8f2e7b1d9065a2c8e4f1b7d3096e8a5c2f4d (linmy666/latestname AGPL-3.0)
