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
 * Login - 登录/注册页面
 * 支持：邮箱密码、Google OAuth、GitHub OAuth
 */
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { usePrefs } from '../App'
import { D, setLang } from '../i18n-shim'

export default function Login() {
  const { authEnabled, login, loading: authLoading } = useAuth()
  const { lang, t } = usePrefs()
  const tl = t.login
  // 同步 module-scope lang
  setLang(lang)
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // Magic link state
  const [magicMode, setMagicMode] = useState(false)
  const [magicEmail, setMagicEmail] = useState('')
  const [magicSent, setMagicSent] = useState(false)
  const [magicSubmitting, setMagicSubmitting] = useState(false)
  const [infoMsg, setInfoMsg] = useState('')

  // 登录后跳转逻辑：管理员→/admin，普通用户→/
  const redirectAfterLogin = (token: string) => {
    // 解析 JWT payload 判断是否管理员
    try {
      const parts = token.split('.')
      if (parts.length !== 3) { nav('/'); return }
      // base64url → base64
      let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      // 补齐 padding
      while (b64.length % 4) b64 += '='
      const payload = JSON.parse(decodeURIComponent(escape(atob(b64))))
      if (payload.admin === true) {
        nav('/admin')
      } else {
        nav('/')
      }
    } catch {
      nav('/')
    }
  }

  // OAuth 回调处理：URL 中带 token
  useEffect(() => {
    const token = params.get('token')
    if (token) {
      login(token)
      redirectAfterLogin(token)
    }
    // Magic Link 回调
    const magicToken = params.get('magic_token')
    if (magicToken) {
      const purpose = params.get('purpose') || 'login'
      fetch('/api/auth/verify-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: magicToken }),
      })
        .then(r => r.json())
        .then(d => {
          if (d.token) {
            login(d.token)
            redirectAfterLogin(d.token)
          } else {
            setError(d.detail || D('链接无效', 'Invalid link'))
          }
        })
        .catch(() => setError(D('网络错误', 'Network error')))
    }
    // 邮箱验证回调
    const verifyToken = params.get('verify_token')
    if (verifyToken) {
      fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verifyToken }),
      })
        .then(r => r.json())
        .then(d => {
          setInfoMsg(D('邮箱验证成功！请登录。', 'Email verified! Please sign in.'))
        })
        .catch(() => {})
    }
  }, [params, login, nav])

  // 如果认证未开启，跳回首页（等 loading 完成后判断）
  useEffect(() => {
    if (!authEnabled && !authLoading) {
      nav('/')
    }
  }, [authEnabled, authLoading, nav])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body = mode === 'login'
        ? { email, password }
        : { email, password, name }
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await r.json()
      if (!r.ok) {
        setError(d.detail || D('操作失败', 'Operation failed'))
        return
      }
      if (d.token) {
        login(d.token)
        // 直接从登录响应判断是否管理员
        if (d.is_admin) {
          nav('/admin')
        } else {
          nav('/')
        }
      }
    } catch {
      setError(D('网络错误，请重试', 'Network error. Please retry.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleOAuth = (provider: 'google' | 'github') => {
    window.location.href = `/api/auth/oauth/${provider}`
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMagicSubmitting(true)
    try {
      const r = await fetch('/api/auth/request-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: magicEmail, purpose: 'login' }),
      })
      const d = await r.json()
      if (!r.ok) {
        setError(d.detail || D('发送失败', 'Failed to send'))
        return
      }
      setMagicSent(true)
    } catch {
      setError(D('网络错误', 'Network error'))
    } finally {
      setMagicSubmitting(false)
    }
  }

  if (authLoading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>{D('加载中…', 'Loading…')}</div>
  if (!authEnabled) return null

  return (
    <div className="container fade-in" style={{
      maxWidth: '420px',
      paddingTop: '3rem',
      paddingBottom: '3rem',
      padding: '3rem 1rem',
    }}>
      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div className="label">Latestname</div>
          <h2 className="title-cn" style={{ fontSize: '1.4rem', marginTop: '0.3rem' }}>
            {mode === 'login' ? D('欢迎回来', 'Welcome back') : D('注册账号', 'Create account')}
          </h2>
          <p className="subtitle" style={{ fontSize: '0.82rem', marginTop: '0.3rem' }}>
            {D('每天可使用 1 次 AI 深度解读', '1 AI deep-reading per day')}
          </p>
        </div>

        {/* OAuth 按钮 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <button
            onClick={() => handleOAuth('google')}
            className="glass-btn-ghost"
            style={{ width: '100%', minHeight: '42px', fontSize: '0.9rem' }}
          >
            🔵 {tl.google}
          </button>
          <button
            onClick={() => handleOAuth('github')}
            className="glass-btn-ghost"
            style={{ width: '100%', minHeight: '42px', fontSize: '0.9rem' }}
          >
            ⚫ {tl.github}
          </button>
        </div>

        {/* 分隔线 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.8rem',
          margin: '1rem 0',
          opacity: 0.4,
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--separator)' }} />
          <span className="label" style={{ fontSize: '0.7rem' }}>{tl.or}</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--separator)' }} />
        </div>

        {/* 邮箱表单 */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {mode === 'register' && (
            <input
              type="text"
              placeholder={D('昵称（可选）', 'Display name (optional)')}
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={30}
              style={{ width: '100%', minHeight: '38px' }}
            />
          )}
          <input
            type="email"
            placeholder={tl.emailPh}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: '100%', minHeight: '38px' }}
          />
          <input
            type="password"
            placeholder={tl.passwordPh}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            style={{ width: '100%', minHeight: '38px' }}
          />
          {error && (
            <div style={{ color: 'var(--fortune-bad)', fontSize: '0.85rem', textAlign: 'center' }}>
              {error}
            </div>
          )}
          {infoMsg && (
            <div style={{ color: 'var(--accent)', fontSize: '0.85rem', textAlign: 'center' }}>
              {infoMsg}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="glass-btn-primary"
            style={{ width: '100%', minHeight: '42px', fontSize: '0.95rem', marginTop: '0.5rem' }}
          >
            {submitting ? '...' : (mode === 'login' ? tl.loginBtn : tl.registerBtn)}
          </button>
        </form>

        {/* Magic Link 入口 */}
        {!magicMode ? (
          <div style={{ textAlign: 'center', marginTop: '0.8rem' }}>
            <button
              onClick={() => { setMagicMode(true); setError(''); setInfoMsg('') }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.82rem', color: 'var(--accent)', textDecoration: 'underline',
                padding: 0,
              }}
            >
              {D('用邮件链接登录', 'Sign in with email link')}
            </button>
          </div>
        ) : magicSent ? (
          <div className="glass-card" style={{
            padding: '1.2rem', marginTop: '1rem', textAlign: 'center',
            background: 'rgba(184,149,106,0.08)', border: '1px solid rgba(184,149,106,0.2)',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📧</div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {D('登录链接已发送到', 'Login link sent to')}<br />
              <strong style={{ color: 'var(--text-primary)' }}>{magicEmail}</strong>
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: '0.6rem' }}>
              {D('30 分钟内有效。请检查收件箱。', 'Valid for 30 minutes. Check your inbox.')}
            </p>
            <button
              onClick={() => { setMagicMode(false); setMagicSent(false); setMagicEmail('') }}
              className="glass-btn-ghost"
              style={{ marginTop: '0.8rem', fontSize: '0.8rem', minHeight: '32px' }}
            >
              ← {D('返回', 'Back')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} style={{
            display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem',
            padding: '1rem', background: 'rgba(184,149,106,0.06)',
            borderRadius: '8px', border: '1px solid rgba(184,149,106,0.15)',
          }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 500 }}>
              {D('邮件链接登录', 'Magic Link Login')}
            </label>
            <input
              type="email"
              placeholder={tl.emailPh}
              value={magicEmail}
              onChange={e => setMagicEmail(e.target.value)}
              required
              style={{ width: '100%', minHeight: '38px' }}
            />
            <button
              type="submit"
              disabled={magicSubmitting}
              className="glass-btn-ghost"
              style={{ width: '100%', minHeight: '38px', fontSize: '0.88rem' }}
            >
              {magicSubmitting ? '...' : D('发送登录链接', 'Send login link')}
            </button>
            <button
              type="button"
              onClick={() => { setMagicMode(false); setError('') }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.78rem', color: 'var(--text-tertiary)',
              }}
            >
              ← {D('返回密码登录', 'Back to password')}
            </button>
          </form>
        )}

        {/* 切换模式 */}
        <div style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '0.85rem' }}>
          {mode === 'login' ? (
            <span>{tl.noAccount} <Link to="/login" onClick={() => setMode('register')} style={{ color: 'var(--accent)' }}>{tl.registerBtn}</Link></span>
          ) : (
            <span>{tl.hasAccount} <Link to="/login" onClick={() => setMode('login')} style={{ color: 'var(--accent)' }}>{tl.loginBtn}</Link></span>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <Link to="/" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
          ← {D('返回首页', 'Back to home')}
        </Link>
      </div>
    </div>
  )
}

// _LN_WM: 4c3a8f2e7b1d9065a2c8e4f1b7d3096e8a5c2f4d (linmy666/latestname AGPL-3.0)
