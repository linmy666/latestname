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
 * Feedback - 用户反馈
 */
import { useState } from 'react'
import { usePrefs } from '../App'
import { D, setLang } from '../i18n-shim'

const CATEGORIES = [
  { key: 'suggestion', zh: '功能建议', en: 'Suggestion' },
  { key: 'bug',        zh: 'Bug 反馈', en: 'Bug Report' },
  { key: 'praise',     zh: '好评鼓励', en: 'Praise' },
  { key: 'other',      zh: '其他',     en: 'Other' },
]

export default function Feedback() {
  const { lang } = usePrefs()
  setLang(lang)
  const [category, setCategory] = useState('suggestion')
  const [content, setContent] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (content.trim().length < 5) {
      setError(D('至少写 5 个字吧', 'Please write at least 5 characters'))
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const token = localStorage.getItem('ln_token') || ''
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const r = await fetch('/api/auth/feedback', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          category,
          content: content.trim(),
          email: email.trim() || undefined,
        }),
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({ detail: '提交失败' }))
        throw new Error(err.detail || '提交失败')
      }
      setDone(true)
    } catch (e: any) {
      setError(e.message || D('网络错误', 'Network error'))
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="container fade-in" style={{ maxWidth: '520px', padding: '3rem 1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}></div>
        <h2 className="title-cn" style={{ marginBottom: '0.8rem' }}>
          {D('已收到，感谢你的反馈', 'Thank you for your feedback')}
        </h2>
        <p className="body-text" style={{ opacity: 0.7, marginBottom: '2rem' }}>
          {D('每一条建议我都会认真看。', 'Every suggestion is read carefully.')}
        </p>
        <button
          className="glass-btn-primary"
          onClick={() => { setDone(false); setContent(''); setCategory('suggestion') }}
          style={{ textDecoration: 'none', display: 'inline-flex' }}
        >
          {D('再写一条', 'Write another')}
        </button>
      </div>
    )
  }

  return (
    <div className="container fade-in" style={{ maxWidth: '560px', padding: '3rem 1rem' }}>
      <div className="label">{D('Feedback', 'Feedback')}</div>
      <h2 className="title-cn" style={{ marginTop: '0.5rem', marginBottom: '0.6rem' }}>
        {D('反 馈 意 见', 'Send Feedback')}
      </h2>
      <p className="subtitle" style={{ marginBottom: '2.5rem', opacity: 0.7 }}>
        {D('告诉我哪里不好，或者你希望它变成什么样', 'Tell me what sucks, or what you wish it could be')}
      </p>

      {/* 分类 */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div className="label" style={{ fontSize: '0.75rem', marginBottom: '0.8rem' }}>
          {D('类型', 'Category')}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className="btn-ghost"
              style={{
                fontSize: '0.82rem',
                padding: '0.45rem 1rem',
                background: category === c.key ? 'rgba(184,149,106,0.15)' : 'transparent',
                border: category === c.key ? '0.5px solid rgba(184,149,106,0.4)' : '0.5px solid var(--separator)',
                color: category === c.key ? 'var(--accent-gold)' : 'var(--text-dim)',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              {D(c.zh, c.en)}
            </button>
          ))}
        </div>
      </div>

      {/* 内容 */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div className="label" style={{ fontSize: '0.75rem', marginBottom: '0.8rem' }}>
          {D('内容', 'Content')}
        </div>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={6}
          placeholder={D('想说啥就说啥……', 'Say whatever you want...')}
          style={{
            width: '100%',
            padding: '1rem',
            background: 'rgba(255,255,255,0.02)',
            border: '0.5px solid var(--separator)',
            borderRadius: '8px',
            color: 'var(--text-main)',
            fontSize: '0.92rem',
            lineHeight: 1.7,
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(184,149,106,0.4)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--separator)' }}
        />
        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.4rem', textAlign: 'right' }}>
          {content.length} / 2000
        </div>
      </div>

      {/* 联系邮箱（可选） */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div className="label" style={{ fontSize: '0.75rem', marginBottom: '0.8rem' }}>
          {D('联系邮箱（选填）', 'Contact email (optional)')}
        </div>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={D('想被回复就留一个', 'Leave one if you want a reply')}
          style={{
            width: '100%',
            padding: '0.7rem 1rem',
            background: 'rgba(255,255,255,0.02)',
            border: '0.5px solid var(--separator)',
            borderRadius: '8px',
            color: 'var(--text-main)',
            fontSize: '0.9rem',
            outline: 'none',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
          }}
        />
      </div>

      {error && (
        <div style={{
          marginBottom: '1rem', padding: '0.7rem 1rem',
          background: 'rgba(255,100,100,0.08)', border: '0.5px solid rgba(255,100,100,0.2)',
          borderRadius: '8px', fontSize: '0.85rem', color: '#e88',
        }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || content.trim().length < 5}
        className="glass-btn-primary"
        style={{
          textDecoration: 'none', display: 'inline-flex',
          opacity: (submitting || content.trim().length < 5) ? 0.5 : 1,
          cursor: (submitting || content.trim().length < 5) ? 'not-allowed' : 'pointer',
        }}
      >
        {submitting ? D('提交中…', 'Submitting...') : D('提 交', 'Submit')}
      </button>
    </div>
  )
}

// _LN_WM: 4c3a8f2e7b1d9065a2c8e4f1b7d3096e8a5c2f4d (linmy666/latestname AGPL-3.0)
