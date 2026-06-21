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
 * ProInsightsBlock — Pro 用户专属个性化分析区块
 *
 * 仅 isPro 渲染。它调 /api/auth/personalized-analysis（Pro only，Standard 自动 404）。
 * 给 History 页 (卜辞) 顶部用 — 让 Pro 用户在"翻看卜辞"时看到自己的卦频、领域、心境曲线、下次提问推荐。
 *
 * 数据形状（来自 /api/auth/personalized-analysis）：
 *   - total_records
 *   - hex_frequency: [{ hex, count }]             top 10
 *   - domain_distribution: [{ domain, count }]
 *   - mood_curve: [{ at, mood }]                  时间序列
 *   - recommendation: string
 *   - top_hex / top_domain
 *
 * 设计：
 *   - 顶部有"专属区块"微光条（金色 2px line）
 *   - 全部以柔和金色为主，Standard 用户看不到这一区块（不暴露功能存在）
 */
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { D } from '../i18n-shim'

interface HexFreq { hex: string; count: number }
interface DomainDist { domain: string; count: number }
interface MoodPoint { at: string; mood: string }

interface Insights {
  total_records: number
  message?: string
  hex_frequency: HexFreq[]
  domain_distribution: DomainDist[]
  mood_curve: MoodPoint[]
  recommendation: string
  top_hex?: string
  top_domain?: string
  generated_at?: string
}

export function ProInsightsBlock() {
  const { isPro } = useAuth()
  const [data, setData] = useState<Insights | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isPro) return
    setLoading(true)
    setError(null)
    const token = localStorage.getItem('ln_token')
    if (!token) {
      setError(D('登录状态异常', 'Auth state abnormal'))
      setLoading(false)
      return
    }
    fetch('/api/auth/personalized-analysis?limit=20', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async r => {
        if (r.status === 404) return null  // Standard 拿到 404 → 不显示
        if (!r.ok) throw new Error(`server ${r.status}`)
        return r.json()
      })
      .then((d: Insights | null) => {
        setData(d)
        setLoading(false)
      })
      .catch((e: Error) => {
        setError(e.message)
        setLoading(false)
      })
  }, [isPro])

  // 不是 Pro：什么都不渲染（关键 — 不暴露给 Standard/未登录）
  if (!isPro) return null

  return (
    <div style={{
      position: 'relative',
      marginBottom: '1.5rem',
      padding: '1.4rem 1.5rem 1.5rem 1.5rem',
      background: 'linear-gradient(135deg, rgba(184,149,106,0.05) 0%, rgba(184,149,106,0.02) 50%, rgba(184,149,106,0.04) 100%)',
      border: '0.5px solid rgba(184,149,106,0.22)',
      borderRadius: '12px',
    }}>
      {/* 顶部专属微光条 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '20%',
        right: '20%',
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(212,168,106,0.55), transparent)',
        boxShadow: '0 0 8px rgba(184,149,106,0.3)',
      }} />

      {/* 右上角 ✦ */}
      <span style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        color: 'rgba(184,149,106,0.5)',
        fontSize: '0.9rem',
        pointerEvents: 'none',
      }}>✦</span>

      {/* 标题区 */}
      <div style={{ marginBottom: '1.1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4em', marginBottom: '0.2rem' }}>
          <span style={{
            display: 'inline-block',
            width: 6, height: 6,
            background: 'linear-gradient(135deg, #d4a86a, #8a6e4a)',
            transform: 'rotate(45deg)',
            boxShadow: '0 0 4px rgba(184,149,106,0.6)',
          }} />
          <span style={{
            fontSize: '0.72rem',
            color: 'var(--onyx-gold)',
            letterSpacing: '0.1em',
          }}>{D('个 性 共 振', 'Personal Resonance')}</span>
        </div>
        <h3 style={{
          fontSize: '1.05rem',
          fontWeight: 400,
          color: 'var(--text-main)',
          margin: 0,
          fontFamily: 'var(--font-serif-cn)',
        }}>{D('你最近的心象志', 'Your Recent Inner Landscape')}</h3>
        {!loading && data && (
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
            {D(`基于 ${data.total_records} 条占卜 · 最近最强卦「${data.top_hex || '未知'}」`, `Based on ${data.total_records} readings · strongest hexagram lately "${data.top_hex || 'unknown'}"`)}
          </div>
        )}
      </div>

      {loading && (
        <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', padding: '0.6rem 0' }}>{D('正在起卦…', 'Casting…')}</div>
      )}

      {error && (
        <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', padding: '0.6rem 0' }}>
          {error === 'undefined' ? D('暂无可分析的数据', 'No data to analyze yet') : error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* 无数据占位 */}
          {data.total_records === 0 && data.message && (
            <div style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              padding: '0.5rem 0',
            }}>{data.message}</div>
          )}

          {/* 卦频柱状 */}
          {data.hex_frequency.length > 0 && (
            <SubsectionLabel>{D('卦象频率', 'Hexagram Frequency')}</SubsectionLabel>
          )}
          {data.hex_frequency.slice(0, 8).map((h, i) => {
            const max = data.hex_frequency[0].count || 1
            const pct = (h.count / max) * 100
            return (
              <div key={`hex-${i}`} style={{
                display: 'flex', alignItems: 'center', gap: '0.55rem',
                marginBottom: '0.32rem',
              }}>
                <div style={{
                  width: '52px',
                  fontSize: '0.78rem',
                  color: i === 0 ? 'var(--onyx-gold)' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-serif-cn)',
                  textAlign: 'right',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>{h.hex}</div>
                <div style={{
                  flex: 1, height: '6px',
                  background: 'rgba(184,149,106,0.06)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: i === 0
                      ? 'linear-gradient(90deg, #d4a86a, #b8956a)'
                      : 'rgba(184,149,106,0.35)',
                    transition: 'width 320ms',
                  }} />
                </div>
                <div style={{
                  width: '24px',
                  fontSize: '0.72rem',
                  color: 'var(--text-dim)',
                  fontFamily: 'var(--font-system)',
                  textAlign: 'right',
                }}>{h.count}</div>
              </div>
            )
          })}

          {/* 领域分布 */}
          {data.domain_distribution.filter(d => d.count > 0).length > 0 && (
            <>
              <div style={{ marginTop: '1rem' }} />
              <SubsectionLabel>{D('关注领域', 'Domains of Focus')}</SubsectionLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {data.domain_distribution
                  .filter(d => d.count > 0)
                  .map((d, i) => (
                    <span key={`dom-${i}`} style={{
                      padding: '0.32em 0.78em',
                      background: 'rgba(184,149,106,0.08)',
                      border: '0.5px solid rgba(184,149,106,0.22)',
                      borderRadius: '12px',
                      fontSize: '0.76rem',
                      color: 'var(--onyx-gold)',
                      fontFamily: 'var(--font-serif-cn)',
                    }}>
                      {d.domain} · <strong>{d.count}</strong>
                    </span>
                  ))}
              </div>
            </>
          )}

          {/* 心境曲线 */}
          {data.mood_curve.length > 0 && (
            <>
              <div style={{ marginTop: '1rem' }} />
              <SubsectionLabel>{D('心境曲线', 'Mood Curve')}</SubsectionLabel>
              <div style={{
                display: 'flex',
                gap: '0.6rem',
                alignItems: 'flex-end',
                height: '68px',  // 固定高度，让内部 bar 用 px
                overflowX: 'auto',
                paddingBottom: '0.3rem',
              }}>
                {data.mood_curve.slice().reverse().map((m, i) => {
                  // mood → 0-1 比例 → 8px ~ 56px
                  // 英文键（后端 survey_mood 是 calm/anxious/lost/hopeful/decisive）+ 中文键（兼容老数据）
                  const moodMap: Record<string, number> = {
                    // 英文
                    calm: 0.3, anxious: 0.75, lost: 0.5, hopeful: 0.85, decisive: 0.9,
                    // 中文（兼容老数据或本地历史）
                    静: 0.3, 喜: 0.85, 忧: 0.5, 安: 0.4, 怒: 0.95, 疑: 0.55,
                  }
                  const ratio = moodMap[m.mood] ?? 0.5
                  const barH = 8 + ratio * 48  // 8~56 px
                  const dateLabel = new Date(m.at).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
                  return (
                    <div key={`mood-${i}`} style={{
                      flex: '0 0 auto',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      cursor: 'help',
                      height: '100%',
                      justifyContent: 'flex-end',
                    }} title={dateLabel}>
                      <div style={{
                        width: '10px',
                        height: `${barH}px`,
                        background: 'linear-gradient(180deg, #d4a86a, rgba(184,149,106,0.25))',
                        borderRadius: '3px',
                        boxShadow: i === 0 ? '0 0 6px rgba(184,149,106,0.5)' : 'none',
                      }} />
                      <div style={{
                        fontSize: '0.62rem',
                        color: 'var(--text-dim)',
                        fontFamily: 'var(--font-serif-cn)',
                      }}>{m.mood}</div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* 下次提问推荐 */}
          <div style={{
            marginTop: '1.1rem',
            padding: '0.85rem 1rem',
            background: 'linear-gradient(135deg, rgba(184,149,106,0.08), rgba(184,149,106,0.02))',
            border: '0.5px solid rgba(184,149,106,0.22)',
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-serif-cn)',
            lineHeight: 1.75,
            position: 'relative',
          }}>
            <div style={{
              fontSize: '0.68rem',
              color: 'var(--onyx-gold)',
              marginBottom: '0.45rem',
              letterSpacing: '0.06em',
              display: 'flex', alignItems: 'center', gap: '0.3em',
            }}>
              <span style={{
                display: 'inline-block',
                width: 5, height: 5,
                background: 'linear-gradient(135deg, #d4a86a, #8a6e4a)',
                transform: 'rotate(45deg)',
                boxShadow: '0 0 4px rgba(184,149,106,0.5)',
              }} />
              {D('下 次 提 问', 'Next Question')}
            </div>
            <div style={{ fontStyle: 'italic' }}>{data.recommendation}</div>
          </div>
        </>
      )}
    </div>
  )
}

function SubsectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '0.68rem',
      color: 'var(--text-dim)',
      marginBottom: '0.5rem',
      letterSpacing: '0.05em',
    }}>{children}</div>
  )
}

// _LN_WM: 4c3a8f2e7b1d9065a2c8e4f1b7d3096e8a5c2f4d (linmy666/latestname AGPL-3.0)
