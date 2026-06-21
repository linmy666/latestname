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

import { useState, useEffect } from 'react'
import { D } from '../i18n-shim'

interface FortuneDay {
  date: string
  offset: number
  score: number
  hexagram_name: string
  hexagram_symbol: string
  fortune: string
  is_today: boolean
  is_future: boolean
}

interface Fortune30Data {
  days: FortuneDay[]
  avg_score: number
  highest: FortuneDay
  lowest: FortuneDay
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8765'

const fortuneColor = (score: number) => {
  if (score >= 8) return 'var(--fortune-good)'
  if (score >= 6) return 'var(--accent)'
  if (score >= 4) return 'var(--text-secondary)'
  return 'var(--fortune-bad)'
}

const fortuneLabel = (score: number) => {
  if (score >= 8) return D('大吉', 'Auspic.')
  if (score >= 6) return D('吉', 'Good')
  if (score >= 4) return D('中', 'Neutral')
  if (score >= 2) return D('凶', 'Bad')
  return D('大凶', 'Inauspic.')
}

export default function FortuneChart() {
  const [data, setData] = useState<Fortune30Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [hovered, setHovered] = useState<number | null>(null)

  useEffect(() => {
    fetch(`${API_BASE}/api/fortune/30day`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ opacity: 0.4, fontSize: '0.9rem' }}>{D('运势曲线加载中…', 'Loading fortune curve…')}</div>
      </div>
    )
  }

  if (!data) return null

  const days = data.days
  const W = 800
  const H = 200
  const padX = 40
  const padY = 30
  const stepX = (W - padX * 2) / (days.length - 1)

  // Build SVG path
  const points = days.map((d, i) => ({
    x: padX + i * stepX,
    y: padY + (1 - (d.score - 1) / 9) * (H - padY * 2),
  }))

  const pathD = points.map((p, i) =>
    i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
  ).join(' ')

  // Area under curve
  const areaD = `${pathD} L ${points[points.length-1].x} ${H - padY} L ${points[0].x} ${H - padY} Z`

  const todayIdx = days.findIndex(d => d.is_today)

  return (
    <div className="glass-card" style={{ padding: '1.8rem', marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.3rem' }}>
        <div className="label">{D('30 日 运 势', '30-Day Fortune Curve')}</div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{D('近7日 · 今日 · 未来22日', 'Past 7 · Today · Next 22')}</span>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
        <span style={{ color: 'var(--text-secondary)' }}>
          {D('均值', 'Avg')} <strong style={{ color: 'var(--text-primary)' }}>{data.avg_score}</strong>
        </span>
        <span style={{ color: 'var(--text-secondary)' }}>
          {D('最高', 'High')} <strong style={{ color: fortuneColor(data.highest.score) }}>{data.highest.score}</strong>
          <span style={{ color: 'var(--text-tertiary)', marginLeft: '0.3rem' }}>{data.highest.hexagram_name}</span>
        </span>
        <span style={{ color: 'var(--text-secondary)' }}>
          {D('最低', 'Low')} <strong style={{ color: fortuneColor(data.lowest.score) }}>{data.lowest.score}</strong>
          <span style={{ color: 'var(--text-tertiary)', marginLeft: '0.3rem' }}>{data.lowest.hexagram_name}</span>
        </span>
      </div>

      {/* SVG Chart */}
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
        <defs>
          <linearGradient id="fortune-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines */}
        {[2, 5, 8].map(level => {
          const y = padY + (1 - (level - 1) / 9) * (H - padY * 2)
          return (
            <g key={level}>
              <line x1={padX} y1={y} x2={W - padX} y2={y} stroke="var(--separator)" strokeWidth="0.5" strokeDasharray="4 4" />
              <text x={padX - 8} y={y + 3} textAnchor="end" fontSize="9" fill="var(--text-tertiary)">{level}</text>
            </g>
          )
        })}

        {/* Today vertical line */}
        {todayIdx >= 0 && (
          <line
            x1={points[todayIdx].x} y1={padY}
            x2={points[todayIdx].x} y2={H - padY}
            stroke="var(--accent)" strokeWidth="1" strokeDasharray="3 3" opacity="0.5"
          />
        )}

        {/* Area */}
        <path d={areaD} fill="url(#fortune-area)" />

        {/* Curve */}
        <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Points */}
        {points.map((p, i) => {
          const d = days[i]
          const isHovered = hovered === i
          return (
            <g key={i}>
              <circle
                cx={p.x} cy={p.y}
                r={d.is_today ? 5 : isHovered ? 4 : 2.5}
                fill={d.is_today ? 'var(--accent)' : fortuneColor(d.score)}
                stroke={d.is_today ? 'var(--text-primary)' : 'none'}
                strokeWidth={d.is_today ? 1.5 : 0}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
              {d.is_today && (
                <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="9" fill="var(--accent)" fontWeight="600">
                  {D('今日', 'Today')}
                </text>
              )}
            </g>
          )
        })}

        {/* Tooltip */}
        {hovered !== null && (
          <g>
            {(() => {
              const d = days[hovered]
              const p = points[hovered]
              const tx = Math.max(padX + 30, Math.min(W - padX - 30, p.x))
              const dateStr = `${d.date.slice(5)}`
              return (
                <>
                  <rect x={tx - 35} y={p.y - 38} width="70" height="30" rx="4" fill="var(--bg)" stroke="var(--separator)" opacity="0.95" />
                  <text x={tx} y={p.y - 26} textAnchor="middle" fontSize="8.5" fill="var(--text-secondary)">{dateStr}</text>
                  <text x={tx} y={p.y - 14} textAnchor="middle" fontSize="9.5" fill={fortuneColor(d.score)} fontWeight="600">
                    {d.score} · {d.hexagram_name}
                  </text>
                </>
              )
            })()}
          </g>
        )}
      </svg>

      {/* Hovered day detail */}
      {hovered !== null && (
        <div style={{
          marginTop: '0.5rem', padding: '0.6rem 1rem',
          background: 'var(--surface)', borderRadius: '6px',
          border: '1px solid var(--separator)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              {days[hovered].date} {days[hovered].is_today && D('（今天）', '(today)')}
            </span>
            <span style={{ marginLeft: '0.8rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {days[hovered].hexagram_name} · {fortuneLabel(days[hovered].score)}
            </span>
          </div>
          <span style={{
            fontSize: '1.1rem', fontWeight: 700,
            color: fortuneColor(days[hovered].score),
          }}>
            {days[hovered].score}/10
          </span>
        </div>
      )}
    </div>
  )
}
