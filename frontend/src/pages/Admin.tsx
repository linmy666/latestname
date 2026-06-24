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
 * Admin - 管理后台
 * 功能：LLM API 配置、用户管理、使用统计
 * 仅管理员可访问
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { usePrefs } from '../App'
import { D, setLang } from '../i18n-shim'

interface LLMConfig {
  base_url: string
  model: string
  has_key: boolean
}

interface Stats {
  total_users: number
  today_active: number
  today_ai_used: number
  today_divinations: number
  daily_limit_users: number
  daily_limit_ai: number
  recent_7days: { date: string; users: number; ai: number; divinations: number }[]
}

interface UserRow {
  id: number
  email: string | null
  name: string | null
  oauth_provider: string | null
  is_admin: boolean
  is_active: boolean
  created_at: string | null
  avatar_url: string | null
}

export default function Admin() {
  const { lang } = usePrefs()
  setLang(lang)
  const { user, isAdmin, loading } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'llm' | 'stats' | 'users' | 'tier' | 'feedback'>('llm')
  const [llmConfig, setLlmConfig] = useState<LLMConfig>({ base_url: '', model: '', has_key: false })
  const [llmForm, setLlmForm] = useState({ base_url: '', api_key: '', model: '' })
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [testing, setTesting] = useState(false)
  const [testMsg, setTestMsg] = useState('')
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<UserRow[]>([])
  const [usersTotal, setUsersTotal] = useState(0)
  const [tierUsers, setTierUsers] = useState<any[]>([])  // v2.2: tier 管理列表
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [fbFilter, setFbFilter] = useState<'all' | 'open' | 'reviewed' | 'resolved'>('all')
  const [page, setPage] = useState(1)

  const token = localStorage.getItem('ln_token') || ''
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  useEffect(() => {
    // 等 AuthContext 加载完成
    if (loading) return
    // 如果有 token 但 user 还没获取到，等一下
    const token = localStorage.getItem('ln_token')
    if (token && !user) return // 等 AuthContext 的 useEffect 刷新
    if (!user || !isAdmin) {
      navigate('/')
    }
  }, [user, isAdmin, loading, navigate])

  // 加载LLM配置
  useEffect(() => {
    if (!isAdmin) return
    fetch('/api/auth/admin/llm-config', { headers })
      .then(r => r.json())
      .then(d => {
        setLlmConfig(d)
        setLlmForm({ base_url: d.base_url, api_key: '', model: d.model })
      })
  }, [isAdmin])

  // 加载统计
  useEffect(() => {
    if (!isAdmin || tab !== 'stats') return
    fetch('/api/auth/admin/stats', { headers })
      .then(r => r.json())
      .then(d => setStats(d))
  }, [isAdmin, tab])

  // 加载用户列表
  useEffect(() => {
    if (!isAdmin || tab !== 'users') return
    fetch(`/api/auth/admin/users?page=${page}&per_page=20`, { headers })
      .then(r => r.json())
      .then(d => {
        setUsers(d.users)
        setUsersTotal(d.total)
      })
  }, [isAdmin, tab, page])

  // v2.2: 加载 tier 管理列表
  useEffect(() => {
    if (!isAdmin || tab !== 'tier') return
    fetch('/api/auth/admin/users-with-tier', { headers })
      .then(r => r.json())
      .then(d => setTierUsers(d.users || []))
  }, [isAdmin, tab])

  // 加载反馈列表
  useEffect(() => {
    if (!isAdmin || tab !== 'feedback') return
    const q = fbFilter !== 'all' ? `?status=${fbFilter}` : ''
    fetch(`/api/auth/admin/feedbacks${q}`, { headers })
      .then(r => r.json())
      .then(d => setFeedbacks(d.feedbacks || []))
  }, [isAdmin, tab, fbFilter])

  // v2.2: 切换用户 tier
  const updateUserTier = async (uid: number, newTier: string) => {
    if (!confirm(D(`确定将此用户设为「${newTier === 'pro' ? 'Pro' : 'Standard'}」?`, `Set this user to “${newTier === 'pro' ? 'Pro' : 'Standard'}”?`))) return
    const r = await fetch(`/api/auth/admin/users/${uid}/tier`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ tier: newTier }),
    })
    if (r.ok) {
      setTierUsers(us => us.map(u => u.id === uid ? { ...u, tier: newTier } : u))
    } else {
      alert(D('更新失败', 'Update failed'))
    }
  }

  const saveLLM = async () => {
    setSaving(true)
    setSaveMsg('')
    try {
      const body: Record<string, string> = {
        base_url: llmForm.base_url,
        model: llmForm.model,
      }
      // 只在用户填了新key时才传（避免覆盖空值）
      if (llmForm.api_key) {
        body.api_key = llmForm.api_key
      } else if (llmConfig.has_key) {
        body.api_key = '__KEEP__' // 后端忽略此占位
      }
      const r = await fetch('/api/auth/admin/llm-config', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
      if (r.ok) {
        setSaveMsg(D('✓ 配置已保存', '✓ Configuration saved'))
        setLlmForm(f => ({ ...f, api_key: '' }))
        // 刷新
        const d = await fetch('/api/auth/admin/llm-config', { headers }).then(r => r.json())
        setLlmConfig(d)
      } else {
        setSaveMsg(D('✗ 保存失败', '✗ Save failed'))
      }
    } catch {
      setSaveMsg(D('✗ 网络错误', '✗ Network error'))
    }
    setSaving(false)
    setTimeout(() => setSaveMsg(''), 3000)
  }

  // v2.5: 测试当前填写的 LLM 配置连通性
  const testLLM = async () => {
    setTesting(true)
    setTestMsg('')
    try {
      // 如果 api_key 为空但已有保存的 key，则拉取一次（仅 GET 接口不返回 key，
      // 所以这种情况让用户主动填一次 key 再测）
      if (!llmForm.api_key) {
        setTestMsg(D('⚠ 请先填入 API Key 再测试（或留空保存后重测）', '⚠ Please fill in the API Key first (or save and test again)'))
        setTesting(false)
        return
      }
      const r = await fetch('/api/auth/admin/llm-test', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          base_url: llmForm.base_url,
          api_key: llmForm.api_key,
          model: llmForm.model,
        }),
      })
      const d = await r.json()
      if (d.ok) {
        setTestMsg(D(`✓ 连接成功（${d.latency_ms}ms）`, `✓ Connected (${d.latency_ms}ms)`))
      } else {
        setTestMsg(D(`✗ ${d.message}`, `✗ ${d.message}`))
      }
    } catch (e: any) {
      setTestMsg(D(`✗ 网络错误: ${e?.message || e}`, `✗ Network error: ${e?.message || e}`))
    }
    setTesting(false)
    setTimeout(() => setTestMsg(''), 10000)
  }

  const toggleUser = async (uid: number) => {
    const r = await fetch(`/api/auth/admin/users/${uid}/toggle-active`, {
      method: 'POST',
      headers,
    })
    if (r.ok) {
      const d = await r.json()
      setUsers(us => us.map(u => u.id === uid ? { ...u, is_active: d.is_active } : u))
    }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>{D('加载中...', 'Loading…')}</div>
  if (!isAdmin) return null

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 20px 60px' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 300, color: 'var(--text-main)', marginBottom: '4px' }}>
        {D('管理后台', 'Admin Console')}
      </h1>
      <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '32px' }}>
        {user?.email} · {D('管理员', 'Admin')}
      </p>

      {/* Tab 切换 */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid var(--border-dim)' }}>
        {([
          ['llm', D('AI 配置', 'AI Config')],
          ['stats', D('使用统计', 'Usage Stats')],
          ['users', D('用户管理', 'Users')],
          ['tier', D('授权管理', 'Tiers')],
          ['feedback', D('用户反馈', 'Feedback')],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: tab === k ? 'var(--accent-gold-trans)' : 'transparent',
              color: tab === k ? 'var(--accent-gold)' : 'var(--text-dim)',
              fontSize: '0.9rem',
              cursor: 'pointer',
              borderBottom: tab === k ? '2px solid var(--accent-gold)' : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* LLM 配置 Tab */}
      {tab === 'llm' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
              API Base URL
            </label>
            <input
              type="text"
              value={llmForm.base_url}
              onChange={e => setLlmForm(f => ({ ...f, base_url: e.target.value }))}
              placeholder="https://api.minimaxi.com/v1"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
              API Key {llmConfig.has_key && <span style={{ color: 'var(--accent-gold)' }}>{D('（已配置，留空则不变）', '(already configured; leave empty to keep)')}</span>}
            </label>
            <input
              type="password"
              value={llmForm.api_key}
              onChange={e => setLlmForm(f => ({ ...f, api_key: e.target.value }))}
              placeholder={llmConfig.has_key ? D('••••••••（已加密存储）', '••••••••(stored encrypted)') : D('输入 API Key', 'Enter API Key')}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
              {D('模型名称', 'Model')}
            </label>
            <input
              type="text"
              value={llmForm.model}
              onChange={e => setLlmForm(f => ({ ...f, model: e.target.value }))}
              placeholder="MiniMax-M3"
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={saveLLM}
              disabled={saving}
              style={{
                padding: '10px 28px',
                background: 'var(--accent-gold)',
                color: 'var(--bg-dark)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9rem',
                cursor: saving ? 'wait' : 'pointer',
                fontWeight: 500,
              }}
            >
              {saving ? D('保存中...', 'Saving…') : D('保存配置', 'Save Config')}
            </button>
            <button
              onClick={testLLM}
              disabled={testing}
              style={{
                padding: '10px 24px',
                background: 'transparent',
                color: 'var(--accent-gold)',
                border: '1px solid var(--accent-gold)',
                borderRadius: '8px',
                fontSize: '0.9rem',
                cursor: testing ? 'wait' : 'pointer',
                fontWeight: 500,
              }}
            >
              {testing ? D('测试中...', 'Testing…') : D('测试连接', 'Test Connection')}
            </button>
            {saveMsg && <span style={{ fontSize: '0.85rem', color: saveMsg.startsWith('✓') ? 'var(--accent-gold)' : '#e74c3c' }}>{saveMsg}</span>}
            {testMsg && <span style={{ fontSize: '0.85rem', color: testMsg.startsWith('✓') ? 'var(--accent-gold)' : testMsg.startsWith('⚠') ? '#f39c12' : '#e74c3c' }}>{testMsg}</span>}
          </div>
          <div style={{
            padding: '16px',
            background: 'var(--card-bg)',
            borderRadius: '12px',
            border: '1px solid var(--border-dim)',
            fontSize: '0.82rem',
            color: 'var(--text-dim)',
            lineHeight: 1.8,
          }}>
            <strong style={{ color: 'var(--text-main)' }}>{D('说明：', 'Notes:')}</strong><br />
            {D('· 此处配置的 API 是全局共享的：所有登录用户的 AI 深度解读都走这一个 key', '· This API is shared globally: all logged-in users share this single key for AI deep-reading')}<br />
            {D('· 管理员只需在此配置一次，配置立即对所有用户生效（无需用户操作）', '· Admin only needs to configure once here; it takes effect for all users immediately')}<br />
            {D('· API Key 加密存储在数据库中，不会暴露给普通用户', '· API Key is encrypted at rest and never exposed to regular users')}<br />
            {D('· 支持 OpenAI 兼容格式（MiniMax / DeepSeek / OpenAI / Claude 等）', '· Any OpenAI-compatible endpoint works (MiniMax / DeepSeek / OpenAI / Claude, etc.)')}<br />
            {D('· 配额（每日 AI 解读次数）在 /admin/stats 配置', '· Daily AI quota is configured in /admin/stats')}
          </div>
        </div>
      )}

      {/* 统计 Tab */}
      {tab === 'stats' && stats && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <StatCard label={D('总用户数', 'Total Users')} value={stats.total_users} />
            <StatCard label={D('今日活跃', 'Active Today')} value={stats.today_active} sub={`/ ${stats.daily_limit_users} ${D('上限', 'cap')}`} />
            <StatCard label={D('今日AI解读', 'AI Readings Today')} value={stats.today_ai_used} />
            <StatCard label={D('今日卜卦', 'Divinations Today')} value={stats.today_divinations} />
          </div>

          <h3 style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-main)', marginBottom: '16px' }}>
            {D('最近 7 天趋势', 'Last 7 days')}
          </h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '160px', padding: '16px 0' }}>
            {stats.recent_7days.map(d => {
              const maxAi = Math.max(...stats.recent_7days.map(x => x.ai), 1)
              const h = (d.ai / maxAi) * 100
              return (
                <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{d.ai}</div>
                  <div style={{
                    width: '60%',
                    height: `${Math.max(h, 4)}%`,
                    minHeight: '4px',
                    background: 'linear-gradient(to top, var(--accent-gold-trans), var(--accent-gold))',
                    borderRadius: '4px 4px 0 0',
                  }} />
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{d.date.slice(5)}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 用户管理 Tab */}
      {tab === 'users' && (
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-dim)' }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>{D('邮箱', 'Email')}</th>
                <th style={thStyle}>{D('姓名', 'Name')}</th>
                <th style={thStyle}>{D('来源', 'Source')}</th>
                <th style={thStyle}>{D('状态', 'Status')}</th>
                <th style={thStyle}>{D('操作', 'Action')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-dim)' }}>
                  <td style={tdStyle}>{u.id}</td>
                  <td style={tdStyle}>{u.email || '-'}</td>
                  <td style={tdStyle}>{u.name || '-'}</td>
                  <td style={tdStyle}>{u.oauth_provider}</td>
                  <td style={tdStyle}>
                    {u.is_admin ? (
                      <span style={{ color: 'var(--accent-gold)' }}>{D('管理员', 'Admin')}</span>
                    ) : u.is_active ? (
                      <span style={{ color: '#2ecc71' }}>{D('正常', 'Active')}</span>
                    ) : (
                      <span style={{ color: '#e74c3c' }}>{D('已禁用', 'Disabled')}</span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    {!u.is_admin && (
                      <button
                        onClick={() => toggleUser(u.id)}
                        style={{
                          padding: '4px 12px',
                          fontSize: '0.8rem',
                          border: '1px solid var(--border-dim)',
                          background: 'transparent',
                          color: u.is_active ? '#e74c3c' : '#2ecc71',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        {u.is_active ? D('禁用', 'Disable') : D('启用', 'Enable')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {usersTotal > 20 && (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '20px' }}>
              {Array.from({ length: Math.ceil(usersTotal / 20) }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid var(--border-dim)',
                    background: page === i + 1 ? 'var(--accent-gold-trans)' : 'transparent',
                    color: page === i + 1 ? 'var(--accent-gold)' : 'var(--text-dim)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* v2.2: Tier 授权管理 Tab */}
      {tab === 'tier' && (
        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 400, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              {D('用户授权管理', 'Tier Management')}
            </h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              {D('将用户设为', 'Granting a user')}
              <span style={{ color: '#b8956a' }}> Pro </span>
              {D('后，该用户可享受更高配额、个性化分析、专属视觉标识。', 'unlocks higher quotas, personalized readings, and exclusive visual marks.')}
              <br/>
              <span style={{ fontSize: '0.78rem', opacity: 0.7 }}>{D('⚠ Pro 用户状态对前端不可见（仅后端判定），以维持低调体验。', '⚠ Pro status is hidden from the frontend (server-side only) to keep the experience understated.')}</span>
            </p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-dim)', color: 'var(--text-dim)' }}>
                <th style={{ textAlign: 'left', padding: '0.6rem 0.4rem' }}>#</th>
                <th style={{ textAlign: 'left', padding: '0.6rem 0.4rem' }}>{D('邮箱', 'Email')}</th>
                <th style={{ textAlign: 'left', padding: '0.6rem 0.4rem' }}>{D('姓名', 'Name')}</th>
                <th style={{ textAlign: 'left', padding: '0.6rem 0.4rem' }}>{D('当前权限', 'Current Tier')}</th>
                <th style={{ textAlign: 'left', padding: '0.6rem 0.4rem' }}>{D('操作', 'Action')}</th>
              </tr>
            </thead>
            <tbody>
              {tierUsers.map(u => (
                <tr key={u.id} style={{ borderBottom: '0.5px solid var(--border-dim)' }}>
                  <td style={{ padding: '0.7rem 0.4rem', color: 'var(--text-dim)' }}>{u.id}</td>
                  <td style={{ padding: '0.7rem 0.4rem', color: 'var(--text-main)' }}>{u.email}</td>
                  <td style={{ padding: '0.7rem 0.4rem', color: 'var(--text-main)' }}>{u.name || '—'}</td>
                  <td style={{ padding: '0.7rem 0.4rem' }}>
                    {u.tier === 'pro' ? (
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        background: 'linear-gradient(135deg, rgba(184,149,106,0.15), rgba(184,149,106,0.25))',
                        color: '#b8956a',
                        borderRadius: '10px',
                        fontSize: '0.78rem',
                        fontWeight: 500,
                      }}>⭐ Pro</span>
                    ) : (
                      <span style={{
                        padding: '2px 10px',
                        background: 'rgba(128,128,128,0.08)',
                        color: 'var(--text-dim)',
                        borderRadius: '10px',
                        fontSize: '0.78rem',
                      }}>Standard</span>
                    )}
                  </td>
                  <td style={{ padding: '0.7rem 0.4rem' }}>
                    {u.tier === 'pro' ? (
                      <button
                        onClick={() => updateUserTier(u.id, 'standard')}
                        style={{
                          padding: '4px 12px',
                          background: 'transparent',
                          border: '0.5px solid var(--border-dim)',
                          borderRadius: '6px',
                          color: 'var(--text-dim)',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        {D('撤销 Pro', 'Revoke Pro')}
                      </button>
                    ) : (
                      <button
                        onClick={() => updateUserTier(u.id, 'pro')}
                        style={{
                          padding: '4px 12px',
                          background: 'linear-gradient(135deg, rgba(184,149,106,0.15), rgba(184,149,106,0.25))',
                          border: '0.5px solid rgba(184,149,106,0.4)',
                          borderRadius: '6px',
                          color: '#b8956a',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        {D('设为 Pro', 'Grant Pro')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 反馈管理 Tab */}
      {tab === 'feedback' && (
        <div>
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 400, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                {D('用户反馈', 'User Feedback')}
              </h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                {D('用户提交的建议、bug 和反馈意见', 'Suggestions, bugs, and feedback from users')}
              </p>
            </div>
            {/* 状态筛选 */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['all', 'open', 'reviewed', 'resolved'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFbFilter(s)}
                  style={{
                    padding: '4px 12px', fontSize: '0.78rem', cursor: 'pointer',
                    border: '0.5px solid var(--border-dim)', borderRadius: '6px',
                    background: fbFilter === s ? 'rgba(184,149,106,0.15)' : 'transparent',
                    color: fbFilter === s ? 'var(--accent-gold)' : 'var(--text-dim)',
                  }}
                >
                  {D(
                    s === 'all' ? '全部' : s === 'open' ? '待处理' : s === 'reviewed' ? '已查看' : '已解决',
                    s === 'all' ? 'All' : s === 'open' ? 'Open' : s === 'reviewed' ? 'Reviewed' : 'Resolved'
                  )}
                </button>
              ))}
            </div>
          </div>

          {feedbacks.length === 0 ? (
            <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
              {D('暂无反馈', 'No feedback yet')}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {feedbacks.map(f => {
                const catColor = f.category === 'bug' ? '#e88' : f.category === 'praise' ? '#8c8' : 'var(--accent-gold)'
                const catLabel = f.category === 'suggestion' ? D('建议', 'Suggestion') :
                                 f.category === 'bug' ? D('Bug', 'Bug') :
                                 f.category === 'praise' ? D('好评', 'Praise') : D('其他', 'Other')
                const statusColor = f.status === 'open' ? '#e88' : f.status === 'reviewed' ? '#88aacc' : '#8c8'
                const statusLabel = f.status === 'open' ? D('待处理', 'Open') :
                                    f.status === 'reviewed' ? D('已查看', 'Reviewed') : D('已解决', 'Resolved')
                const time = f.created_at ? new Date(f.created_at).toLocaleString(lang === 'en' ? 'en-US' : 'zh-CN') : ''
                return (
                  <div key={f.id} style={{
                    padding: '1rem 1.2rem',
                    background: 'var(--card-bg)',
                    border: '0.5px solid var(--border-dim)',
                    borderRadius: '10px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: `${catColor}22`, color: catColor }}>
                          {catLabel}
                        </span>
                        {f.user_email && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                            {f.user_email}
                          </span>
                        )}
                        {!f.user_id && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', opacity: 0.5 }}>
                            ({D('未登录', 'Anonymous')})
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{time}</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-main)', marginBottom: '0.6rem', whiteSpace: 'pre-wrap' }}>
                      {f.content}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: statusColor }}>
                        {statusLabel}
                      </span>
                      {/* 快速切换状态 */}
                      <select
                        value={f.status}
                        onChange={async e => {
                          const res = await fetch(`/api/auth/admin/feedbacks/${f.id}`, {
                            method: 'PATCH', headers,
                            body: JSON.stringify({ status: e.target.value }),
                          })
                          if (res.ok) {
                            setFeedbacks(prev => prev.map(x => x.id === f.id ? { ...x, status: e.target.value } : x))
                          }
                        }}
                        style={{
                          fontSize: '0.72rem', padding: '2px 6px',
                          background: 'var(--card-bg)', border: '0.5px solid var(--border-dim)',
                          borderRadius: '4px', color: 'var(--text-dim)', cursor: 'pointer',
                        }}
                      >
                        <option value="open">{D('待处理', 'Open')}</option>
                        <option value="reviewed">{D('已查看', 'Reviewed')}</option>
                        <option value="resolved">{D('已解决', 'Resolved')}</option>
                      </select>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  background: 'var(--card-bg)',
  border: '1px solid var(--border-dim)',
  borderRadius: '8px',
  color: 'var(--text-main)',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box',
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  fontSize: '0.8rem',
  color: 'var(--text-dim)',
  fontWeight: 400,
}

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: '0.85rem',
  color: 'var(--text-main)',
}

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div style={{
      padding: '20px',
      background: 'var(--card-bg)',
      borderRadius: '12px',
      border: '1px solid var(--border-dim)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 300, color: 'var(--accent-gold)' }}>
        {value}
        {sub && <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{sub}</span>}
      </div>
    </div>
  )
}

// _LN_WM: 4c3a8f2e7b1d9065a2c8e4f1b7d3096e8a5c2f4d (linmy666/latestname AGPL-3.0)
