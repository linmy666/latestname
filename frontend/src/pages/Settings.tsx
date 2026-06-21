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
import { usePrefs } from '../App'
import { ProBadgeFull, ProCardMark } from '../components/ProBadge'
import { useAuth } from '../contexts/AuthContext'
import { D, setLang as setShimLang } from '../i18n-shim'

export default function Settings() {
  const { theme, lang, animations, viewMode, setTheme, setLang, setAnimations, setViewMode, t } = usePrefs()
  const { user, isPro, isAdmin } = useAuth()
  const ts = t.settings
  setShimLang(lang)

  const [config, setConfig] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('onyx_llm_config') || '{}')
    return {
      base_url: saved.base_url || 'https://api.openai.com/v1',
      api_key: saved.api_key || '',
      model: saved.model || 'gpt-4o-mini',
    }
  })
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState('')
  const [saved, setSaved] = useState(false)

  // Auto-import config from URL hash or /llm_config.json
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash) {
      const params = new URLSearchParams(hash)
      const imported: any = {}
      if (params.get('base_url')) imported.base_url = params.get('base_url')
      if (params.get('api_key')) imported.api_key = params.get('api_key')
      if (params.get('model')) imported.model = params.get('model')
      if (Object.keys(imported).length > 0) {
        const newConfig = { ...config, ...imported }
        setConfig(newConfig)
        localStorage.setItem('onyx_llm_config', JSON.stringify(newConfig))
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        window.history.replaceState(null, '', window.location.pathname)
        return
      }
    }

    fetch('/llm_config.json')
      .then(r => { if (!r.ok) throw new Error('not found'); return r.json() })
      .then((imported: any) => {
        if (imported.api_key && imported.api_key.length > 20) {
          const newConfig = { ...config, ...imported }
          setConfig(newConfig)
          localStorage.setItem('onyx_llm_config', JSON.stringify(newConfig))
          setSaved(true)
          setTimeout(() => setSaved(false), 3000)
        }
      })
      .catch(() => {})
  }, [])

  function save() {
    localStorage.setItem('onyx_llm_config', JSON.stringify(config))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function testConnection() {
    setTesting(true)
    setTestResult('')
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000)
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: '测试连接',
          divination: {
            iching: { original: { name: '干', name_en: 'The Creative', fortune: '大吉', judgment: '元亨利贞', keywords: ['刚健'], trigram_above: '干', trigram_above_element: '天', trigram_below: '干', trigram_below_element: '天' }, changed: null, yao_names: {}, changing_lines: [], relations: {} },
            tarot: [], resonance: { primary_theme: '', type: '', summary: '' }, fortune_scores: {}
          },
          llm_config: config,
        }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      // Read multiple chunks to get past <think> blocks
      let fullText = ''
      for (let i = 0; i < 10; i++) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
        const lines = fullText.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const chunk = line.slice(6)
            try {
              const data = JSON.parse(chunk)
              if (data.error) { setTestResult(`❌ ${data.error}`); return }
              if (data.content && data.content.trim().length > 3) {
                setTestResult(D('✅ 连接成功！Endpoint 配置正确。', '✅ Connected! Endpoint is working.'))
                return
              }
            } catch {}
          }
        }
      }
      setTestResult(D('✅ 连接成功（已收到响应）', '✅ Connected (response received)'))
    } catch (e: any) {
      setTestResult(`❌ ${e.name === 'AbortError' ? D('连接超时（30s），请检查网络或Endpoint', 'Timeout (30s). Check network or endpoint') : e.message}`)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="container fade-in" style={{ maxWidth: '640px', padding: '2.5rem 0' }}>
      {/* v2.2: Pro 用户专属标识（登录后才显示）*/}
      <ProBadgeFull />

      {/* 账户信息块 — 合并自 Profile。仅登录后显示 */}
      {user && (
        <div style={{
          position: 'relative',
          marginBottom: '2rem',
          padding: '1.2rem 1.4rem',
          background: isPro
            ? 'linear-gradient(135deg, rgba(184,149,106,0.06), rgba(184,149,106,0.02))'
            : 'rgba(255,255,255,0.02)',
          border: '0.5px solid',
          borderColor: isPro ? 'rgba(184,149,106,0.25)' : 'var(--separator)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '1.1rem',
        }}>
          {isPro && <ProCardMark />}
          <div style={{
            width: 48, height: 48,
            borderRadius: '50%',
            background: isPro
              ? 'linear-gradient(135deg, rgba(184,149,106,0.2), rgba(184,149,106,0.05))'
              : 'rgba(255,255,255,0.05)',
            border: '0.5px solid',
            borderColor: isPro ? 'rgba(184,149,106,0.4)' : 'var(--separator)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            color: isPro ? 'var(--onyx-gold)' : 'var(--text-dim)',
            fontWeight: 500,
            fontFamily: 'var(--font-system)',
            flexShrink: 0,
          }}>
            {(user.name || user.email || '?')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '0.95rem',
              color: 'var(--text-main)',
              fontFamily: 'var(--font-system)',
              wordBreak: 'break-all',
            }}>
              {user.name || user.email?.split('@')[0]}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.15rem', wordBreak: 'break-all' }}>
              {user.email}
            </div>
          </div>
          {isPro && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.35em',
              padding: '0.3em 0.7em',
              background: 'linear-gradient(135deg, rgba(184,149,106,0.12), rgba(184,149,106,0.22))',
              border: '0.5px solid rgba(184,149,106,0.35)',
              borderRadius: '8px',
              color: 'var(--onyx-gold)',
              fontSize: '0.7rem',
              flexShrink: 0,
            }}>
              <span style={{
                display: 'inline-block',
                width: 5, height: 5,
                background: 'linear-gradient(135deg, #d4a86a, #8a6e4a)',
                transform: 'rotate(45deg)',
                boxShadow: '0 0 4px rgba(184,149,106,0.6)',
              }} />
              <span>{D('增强版', 'Enhanced')}</span>
            </div>
          )}
        </div>
      )}

      {/* ============ 外观设置 ============ */}
      <div className="label">{ts.appearance}</div>
      <h2 className="title-cn" style={{ marginTop: '0.4rem', marginBottom: '1rem', fontSize: '1.5rem' }}>
        {D('外观', 'Appearance')}
      </h2>

      {/* 主题切换 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '1rem 0' }}>
        <span className="body-text">{ts.theme}</span>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            className={theme === 'dark' ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setTheme('dark')}
            style={{ fontSize: '0.85rem', padding: '0.45rem 1.2rem', minHeight: 'auto' }}
          >{ts.dark}</button>
          <button
            className={theme === 'light' ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setTheme('light')}
            style={{ fontSize: '0.85rem', padding: '0.45rem 1.2rem', minHeight: 'auto' }}
          >{ts.light}</button>
        </div>
      </div>

      {/* 动画开关 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '1rem 0' }}>
        <span className="body-text">{ts.animations}</span>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            className={animations ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setAnimations(true)}
            style={{ fontSize: '0.85rem', padding: '0.45rem 1.2rem', minHeight: 'auto' }}
          >{ts.animOn}</button>
          <button
            className={!animations ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setAnimations(false)}
            style={{ fontSize: '0.85rem', padding: '0.45rem 1.2rem', minHeight: 'auto' }}
          >{ts.animOff}</button>
        </div>
      </div>

      {/* 语言切换 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '1rem 0' }}>
        <span className="body-text">{ts.language}</span>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            className={lang === 'zh' ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setLang('zh')}
            style={{ fontSize: '0.85rem', padding: '0.45rem 1.2rem', minHeight: 'auto' }}
          >{D('中文', 'Chinese')}</button>
          <button
            className={lang === 'en' ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setLang('en')}
            style={{ fontSize: '0.85rem', padding: '0.45rem 1.2rem', minHeight: 'auto' }}
          >English</button>
        </div>
      </div>

      {/* 视图模式 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '1rem' }}>
        <span className="body-text">{ts.viewMode}</span>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {(['auto', 'desktop', 'mobile'] as const).map(v => (
            <button
              key={v}
              className={viewMode === v ? 'btn-primary' : 'btn-ghost'}
              onClick={() => setViewMode(v)}
              style={{ fontSize: '0.85rem', padding: '0.45rem 1.2rem', minHeight: 'auto' }}
            >
              {v === 'auto' ? ts.viewAuto : v === 'desktop' ? ts.viewDesktop : ts.viewMobile}
            </button>
          ))}
        </div>
      </div>

      <div className="divider" />

      {/* ============ LLM 配置（仅管理员可见） ============ */}
      {/* 普通用户的 LLM 端点由管理员在控制面板统一配置，个人设置页不暴露。 */}
      {isAdmin && (
        <>
          <div className="label" style={{ marginTop: '1.5rem' }}>AI</div>
          <h2 className="title-cn" style={{ marginTop: '0.4rem', marginBottom: '0.5rem', fontSize: '1.5rem' }}>{ts.title}</h2>
          <p className="body-text" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>{ts.desc}</p>

          <div className="divider" />

          {/* 预设快捷 */}
          <div style={{ margin: '1.5rem 0' }}>
            <div className="label" style={{ fontSize: '0.75rem', marginBottom: '0.8rem' }}>{ts.presetsTitle}</div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { name: 'OpenAI', base_url: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
                { name: 'DeepSeek', base_url: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
                { name: 'MiniMax', base_url: 'https://api.minimaxi.com/v1', model: 'MiniMax-M3' },
                { name: D('智谱 GLM', 'Zhipu GLM'), base_url: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash' },
                { name: 'Ollama', base_url: 'http://localhost:11434/v1', model: 'qwen2.5:7b' },
              ].map(preset => (
                <button
                  key={preset.name}
                  onClick={() => setConfig({ ...config, base_url: preset.base_url, model: preset.model })}
                  className="btn-ghost"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* 表单 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="label" style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem' }}>{ts.baseUrl}</label>
            <input type="text" value={config.base_url}
              onChange={e => setConfig({ ...config, base_url: e.target.value })}
              placeholder="https://api.openai.com/v1" />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="label" style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem' }}>{ts.apiKey}</label>
            <input type="password" value={config.api_key}
              onChange={e => setConfig({ ...config, api_key: e.target.value })}
              placeholder="sk-..." />
            <p className="body-text" style={{ fontSize: '0.75rem', marginTop: '0.3rem', opacity: 0.5 }}>
              {D('Key 仅存储在浏览器 localStorage，不会发送到 Latestname 后端以外的任何地方。', 'Key is stored only in browser localStorage. It is never sent to anything beyond your configured LLM endpoint.')}
            </p>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label className="label" style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem' }}>{ts.model}</label>
            <input type="text" value={config.model}
              onChange={e => setConfig({ ...config, model: e.target.value })}
              placeholder="gpt-4o-mini" />
          </div>

          <div className="divider" />

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <button onClick={save} className="btn-primary">{ts.save}</button>
            <button onClick={testConnection} className="btn-ghost" disabled={testing || !config.api_key}>
              {testing ? D('测试中...', 'Testing…') : ts.test}
            </button>
          </div>

          {saved && (
            <div style={{ marginTop: '1rem', color: 'var(--accent-bright)', fontSize: '0.9rem' }}>
              {ts.saved}
            </div>
          )}
          {testResult && (
            <div style={{
              marginTop: '1rem', fontSize: '0.9rem',
              color: testResult.startsWith('✅') ? 'var(--accent-bright)' : 'var(--fortune-bad)',
            }}>{testResult}</div>
          )}

          {/* 隐私说明 */}
          <div className="divider" style={{ margin: '3rem 0' }} />
          <div style={{ fontSize: '0.85rem', opacity: 0.6 }}>
            <div className="label" style={{ fontSize: '0.7rem', marginBottom: '0.8rem' }}>{ts.privacyTitle}</div>
            <p className="body-text" style={{ fontSize: '0.85rem', lineHeight: 1.8 }}>
              {D(
                `• API Key 仅存在你的浏览器本地，Latestname 后端不持久化任何 key\n• 每次解读请求，后端将你的占卜结果 + key 转发给配置的 LLM 端点\n• 你的问题文本会发送给你配置的 LLM 服务，请注意隐私\n• 未配置 LLM 时，占卜功能不受影响，仅缺少 AI 解读\n• 推理模型（如 MiniMax-M3）的 <think> 推理过程会被自动过滤`,
                `• API Key is stored only in your browser; Latestname backend never persists it\n• Each interpretation request proxies your divination result + key to your LLM endpoint\n• Your question text is sent to your configured LLM service — mind your privacy\n• Without LLM config, divination still works; only AI interpretation is unavailable\n• Reasoning model <think> blocks (e.g. MiniMax-M3) are automatically filtered`
              ).split('\n').map((line, i) => (
                <span key={i}>{line}<br /></span>
              ))}
            </p>
          </div>
        </>
      )}

      {/* 普通用户友好提示：告诉他们 LLM 由管理员配置 */}
      {!isAdmin && (
        <div style={{
          marginTop: '2rem', padding: '1rem 1.2rem',
          background: 'rgba(255,255,255,0.02)',
          border: '0.5px solid var(--separator)',
          borderRadius: '8px',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.7,
        }}>
          <div className="label" style={{ fontSize: '0.7rem', marginBottom: '0.5rem', color: 'var(--text-dim)' }}>
            {D('AI 解读服务', 'AI Reading Service')}
          </div>
          <div>
            {D(
              'AI 深度解读服务由管理员按资源情况动态调控，登录后即可使用。每日配额会根据服务负载自动调整，如需解读功能调整请联系管理员。',
              'AI interpretation is dynamically managed by the admin based on resource availability. Daily quotas adjust automatically with service load. Contact the admin for adjustments.'
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// _LN_WM: 4c3a8f2e7b1d9065a2c8e4f1b7d3096e8a5c2f4d (linmy666/latestname AGPL-3.0)
