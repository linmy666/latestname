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
 * History - 卜辞档案（你测过的所有名字和问过的事）
 *
 * Latestname · 此刻之名
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import HexagramSVG from '../components/HexagramSVG'
import { usePrefs } from '../App'
import { D, setLang } from '../i18n-shim'
import { ProInsightsBlock } from '../components/ProInsightsBlock'

interface HistoryEntry {
  question: string
  mode: 'combined' | 'iching' | 'tarot'
  iching?: any
  cards?: any[]
  tarot?: any[]
  resonance?: any
  at: number
  personality?: { name: string; code_display: string; slogan: string }
  latest_name?: { name: string; source?: string; source_type?: string; meaning?: string; hexagram_name?: string; changed_name?: string; changed_source?: string; changed_meaning?: string }
  _cloudId?: number
  _vip?: boolean  // v2.2: Pro 隐性标记（金色微光边框）
}

// 五行色映射
const FORTUNE_COLOR: Record<string, string> = {
  '大吉': '#C9A961',
  '吉': '#B8956A',
  '平': '#7A6244',
  '凶': '#9B6B5C',
  '大凶': '#7C4A3E',
}

export default function History() {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const { t, lang } = usePrefs()
  const th = t.history
  // 同步 module-scope lang
  setLang(lang)

  useEffect(() => {
    // 尝试从云端加载（需登录），否则回退 localStorage
    const token = localStorage.getItem('ln_token')
    if (token) {
      fetch('/api/auth/history?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => {
        if (!r.ok) throw new Error('auth failed')
        return r.json()
      }).then(data => {
        if (data.records && data.records.length > 0) {
          const cloudHistory: HistoryEntry[] = data.records.map((r: any) => ({
            question: r.question || '',
            mode: r.mode || 'combined',
            iching: r.result?.iching,
            tarot: r.result?.tarot,
            cards: r.result?.cards,
            resonance: r.result?.resonance,
            at: new Date(r.at).getTime(),
            personality: r.result?.personality ? {
              name: r.result.personality.name,
              code_display: r.result.personality.code_display,
              slogan: r.result.personality.slogan,
            } : undefined,
            latest_name: r.result?.latest_name,
            _cloudId: r.id,
            _vip: r._vip,  // v2.2: Pro 隐性标记（金色微光）
          } as HistoryEntry))
          setHistory(cloudHistory)
        } else {
          // 云端无记录，尝试本地
          const localList = JSON.parse(localStorage.getItem('onyx_history') || '[]')
          setHistory(localList)
        }
      }).catch(() => {
        // token 过期，回退 localStorage
        const localList = JSON.parse(localStorage.getItem('onyx_history') || '[]')
        setHistory(localList)
      })
    } else {
      // 未登录，纯本地
      const localList = JSON.parse(localStorage.getItem('onyx_history') || '[]')
      setHistory(localList)
    }
  }, [])

  function clearAll() {
    // 本地清除
    localStorage.removeItem('onyx_history')
    setHistory([])
    setSelected(null)
    setShowConfirm(false)
    // 云端记录不批量删除（安全考虑，用户可逐条删除）
  }

  if (history.length === 0) {
    return (
      <div className="container fade-in" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <div className="label" style={{ marginBottom: '1rem' }}>LATESTNAME · {th.title}</div>
        <h2 className="title-cn" style={{ marginBottom: '0.5rem' }}>{D('还 没 有 记 录', 'No Readings Yet')}</h2>
        <p className="body-text" style={{ marginTop: '1.5rem', opacity: 0.7 }}>
          {D('开始第一次占卜，结果会自动保存在这里。', 'Start your first reading — it will be saved here.')}
        </p>
        <Link
          to="/divine"
          className="glass-btn-primary"
          style={{ marginTop: '2rem', textDecoration: 'none', display: 'inline-flex' }}
        >
          {D('开始第一次叩玄', 'Cast Your First')}
        </Link>
      </div>
    )
  }

  return (
    <div className="container fade-in" style={{ paddingTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <div className="label">LATESTNAME · {th.title}</div>
          <h2 className="title-cn" style={{ marginTop: '0.3rem' }}>{D('我 的 此 刻 之 名', 'My Now-Names')}</h2>
          <p className="body-text" style={{ marginTop: '0.5rem', fontSize: '0.88rem', opacity: 0.6 }}>
            {th.count(history.length)}
          </p>
        </div>
        <button onClick={() => setShowConfirm(true)} className="btn-ghost" style={{ fontSize: '0.85rem' }}>
          {D('清 空', 'Clear All')}
        </button>
      </div>

      <div className="divider" />

      {/* Pro 用户专属：卜辞页顶部个性化分析（仅 isPro==true 渲染） */}
      <ProInsightsBlock />

      {/* 列表 */}
      <div>
        {history.map((entry, i) => {
          const date = new Date(entry.at)
          const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`

          const hexName = entry.iching?.original?.name || ''
          const hexBinary = entry.iching?.original?.binary || ''
          const hexFortune = entry.iching?.original?.fortune || ''
          const stripeColor = FORTUNE_COLOR[hexFortune] || 'var(--accent)'

          // 卦格名（如果在 personality 字段）
          const personality = entry.personality
          const personalityName = personality?.name || entry.latest_name?.name

          return (
            <div
              key={i}
              onClick={() => setSelected(selected === i ? null : i)}
              className="card card-hover"
              style={{
                cursor: 'pointer',
                background: selected === i
                  ? 'rgba(128,128,128,0.06)'
                  : undefined,
                padding: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                // v2.2: Pro 用户的卡片金色微光边框（隐性）
                border: entry._vip
                  ? '1px solid rgba(184,149,106,0.35)'
                  : undefined,
                boxShadow: entry._vip
                  ? '0 0 12px rgba(184,149,106,0.12), inset 0 0 20px rgba(184,149,106,0.04)'
                  : undefined,
                position: 'relative',
              }}
            >
              {/* v2.2: Pro 卡片右上角 ✦ 标记 */}
              {entry._vip && (
                <span style={{
                  position: 'absolute',
                  top: '0.6rem',
                  right: '0.8rem',
                  color: 'rgba(184,149,106,0.55)',
                  fontSize: '0.9rem',
                  pointerEvents: 'none',
                }}>✦</span>
              )}
              {/* 卦象缩略图 */}
              {hexBinary ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexShrink: 0 }}>
                  <div style={{ width: 3, height: 48, borderRadius: 2, background: stripeColor, flexShrink: 0 }} />
                  <div style={{ textAlign: 'center' }}>
                    <HexagramSVG binary={hexBinary} size={40} />
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-primary)', marginTop: '0.2rem', fontFamily: 'var(--font-serif-cn)', fontWeight: 600 }}>
                      {hexName}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ width: 3, height: 48, borderRadius: 2, background: 'var(--accent)', flexShrink: 0 }} />
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="label" style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                    {entry.mode === 'combined' ? D('融 合', 'Combined') : entry.mode === 'iching' ? D('易 经', 'I Ching') : D('塔 罗', 'Tarot')}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', opacity: 0.7 }}>{dateStr}</span>
                  {hexFortune && (
                    <span style={{ fontSize: '0.75rem', color: stripeColor, fontFamily: 'var(--font-serif-cn)', fontWeight: 600 }}>
                      {hexFortune}
                    </span>
                  )}
                </div>
                <p style={{
                  fontFamily: 'var(--font-serif-cn)',
                  fontSize: '1.05rem',
                  color: 'var(--text-primary)',
                  letterSpacing: '0.05em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  「{entry.question}」
                </p>
                {/* 卦格名标签 */}
                {personalityName && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    marginTop: '0.4rem',
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-serif-cn)',
                    color: 'var(--accent)',
                    padding: '0.15rem 0.7rem',
                    borderRadius: '12px',
                    background: 'rgba(184,149,106,0.1)',
                    border: '0.5px solid rgba(184,149,106,0.25)',
                  }}>
                    <span style={{ opacity: 0.6 }}>{D('以', 'through')}</span>
                    <span style={{ fontWeight: 700 }}>{personalityName}</span>
                    <span style={{ opacity: 0.6 }}>{D('之眼问', "'s eyes")}</span>
                  </div>
                )}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: 300, flexShrink: 0, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'rgba(128,128,128,0.08)' }}>
                {selected === i ? '−' : '+'}
              </div>
            </div>
          )
        })}
      </div>

      {/* 确认弹窗 */}
      {showConfirm && (
        <div className="confirm-overlay" onClick={() => setShowConfirm(false)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="title-cn" style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>{D('确 认 清 空', 'Confirm Clear')}</div>
            <p className="body-text" style={{ marginBottom: '2rem', fontSize: '0.95rem', lineHeight: 1.8 }}>
              {D(`将永久删除全部 ${history.length} 条卜辞记录，\n包括你测过的所有名字。此操作不可恢复。`,
                 `This will permanently delete all ${history.length} reading(s),\nincluding every name you've been given. This cannot be undone.`)}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => setShowConfirm(false)} className="btn-ghost" style={{ fontSize: '0.9rem' }}>
                {D('取 消', 'Cancel')}
              </button>
              <button onClick={clearAll} className="btn-primary" style={{ fontSize: '0.9rem', background: 'var(--fortune-bad)', borderColor: 'var(--fortune-bad)' }}>
                {D('确 认 清 空', 'Confirm Clear')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
// _LN_WM: 4c3a8f2e7b1d9065a2c8e4f1b7d3096e8a5c2f4d (linmy666/latestname AGPL-3.0)
