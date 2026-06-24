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

import { usePrefs } from '../App'
import { ProBadgeFull, ProCardMark } from '../components/ProBadge'
import { useAuth } from '../contexts/AuthContext'
import { D, setLang as setShimLang } from '../i18n-shim'

/**
 * Settings — 仅保留外观/账户设置。
 *
 * v2.5: AI 解读服务的 LLM 配置已统一移到管理员后台（Admin → LLM 配置）。
 * 普通用户和管理员都不需要在这里配置任何 key；
 * 用户进入深度解读时，后端会直接调用管理员配置的全局 LLM。
 */

export default function Settings() {
  const { theme, lang, animations, viewMode, setTheme, setLang, setAnimations, setViewMode, t } = usePrefs()
  const { user, isPro } = useAuth()
  const ts = t.settings
  setShimLang(lang)

  return (
    <div className="container fade-in" style={{ maxWidth: '640px', paddingTop: '2.5rem', paddingBottom: '2.5rem' }}>
      {/* Pro 用户专属标识（登录后才显示）*/}
      <ProBadgeFull />

      {/* 账户信息块 — 登录后显示 */}
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

      {/* v2.5: LLM 配置已统一到管理员后台，Settings 页不再展示任何 key 或 API 配置 */}
    </div>
  )
}

// _LN_WM: 4c3a8f2e7b1d9065a2c8e4f1b7d3096e8a5c2f4d (linmy666/latestname AGPL-3.0)