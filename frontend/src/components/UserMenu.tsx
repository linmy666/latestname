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
 * UserMenu — banner 用户名下拉菜单
 *
 * 触发：
 *   - hover（200ms delay 后展开做预览）
 *   - click（toggle）
 *   - 鼠标离开后 150ms 收起（hover 触发的）
 *
 * 内容：
 *   - 顶部：邮箱 + Pro 标记徽章（ProBadgeFull 风格，但小）
 *   - 配额条：3 条进度条（卦名 / 卦象 / 深度）
 *   - Pro 专属：个性化分析入口（金色按钮，仅 isPro 可见）
 *   - 链接：卜辞、设置、个人主页
 *   - 底部：退出按钮
 *
 * 位置：
 *   - 绝对定位在用户名下方，right-aligned
 *   - 默认 z-index 110（高于 nav 的 100）
 *
 * Pro 用户原则：
 *   - 没有 "Pro" 字样，只用金色 + ◆
 *   - 通过 isPro 探测，不暴露 tier 字段
 */
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ProBadgeDot, ProCardMark } from './ProBadge'
import { D, setLang } from '../i18n-shim'
import { usePrefs } from '../App'

export function UserMenu() {
  const { user, usage, authEnabled, isPro, logout } = useAuth()
  const navigate = useNavigate()
  const { lang } = usePrefs()
  setLang(lang)

  const [open, setOpen] = useState(false)
  const [hoverOpen, setHoverOpen] = useState(false)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  if (!authEnabled || !user) return null

  const displayName = user.name || user.email?.split('@')[0] || '?'

  // 合计 4 项配额；Standard 只有配额，Pro 多一个个性化分析
  const items = usage ? [
    { label: D('卦名测算', 'MBTI Quiz'), used: (usage.mbti_limit ?? 1) - (usage.mbti_remaining ?? 0), limit: usage.mbti_limit ?? 1 },
    { label: D('卦象测算', 'Divination'), used: (usage.divination_limit ?? 5) - (usage.divination_remaining ?? 0), limit: usage.divination_limit ?? 5 },
    { label: D('深度分析', 'AI Reading'), used: usage.ai_limit - usage.ai_remaining, limit: usage.ai_limit },
  ] : []

  // Hover 触发器：200ms delay
  const onEnterTrigger = () => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null }
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => {
      setHoverOpen(true)
    }, 200)
  }
  const onLeaveTrigger = () => {
    if (hoverTimer.current) { clearTimeout(hoverTimer.current); hoverTimer.current = null }
    // click 打开时不自动收起（见 open===true 分支）
    if (open) return
    closeTimer.current = setTimeout(() => {
      setHoverOpen(false)
    }, 150)
  }

  // 键盘 ESC 关闭
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setHoverOpen(false)
      }
    }
    if (open || hoverOpen) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, hoverOpen])

  // 点击外部关闭
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target as Node)) {
        setOpen(false)
        setHoverOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const visible = open || hoverOpen

  // 点击 username span → 跳转到 Profile；同时 click 锁定开启（用 !open xor）
  const onUsernameClick = () => {
    setOpen(!open)
    setHoverOpen(false)
    if (!open) navigate('/history')
  }

  const onLogout = () => {
    setOpen(false)
    setHoverOpen(false)
    logout()
    navigate('/')
  }

  return (
    <div
      ref={menuRef}
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={onEnterTrigger}
      onMouseLeave={onLeaveTrigger}
    >
      {/* Trigger — 用户名 + ProBadgeDot */}
      <button
        onClick={onUsernameClick}
        style={{
          background: visible ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
          border: '0.5px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          color: 'var(--text-dim)',
          fontSize: '0.72rem',
          padding: '0.3em 0.7em',
          maxWidth: '110px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35em',
          fontFamily: 'inherit',
          transition: 'background 180ms',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {displayName}
        </span>
        <ProBadgeDot size={6} />
      </button>

      {/* Dropdown */}
      {visible && (
        <div
          onMouseEnter={() => {
            if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null }
          }}
          onMouseLeave={() => {
            if (!open) {
              closeTimer.current = setTimeout(() => setHoverOpen(false), 150)
            }
          }}
          // 用 styles.css 的玻璃质变量（glass-thin），主题感知（dark：rgba(28,28,30,0.5) + blur），light 模式下自动变成亮底色完全可见
          className="glass-thin"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            minWidth: '240px',
            padding: '0.85rem',
            zIndex: 110,
            borderTop: '0.5px solid var(--border-color, rgba(255,255,255,0.12))',
            borderLeft: '0.5px solid var(--border-color, rgba(255,255,255,0.12))',
            borderRight: '0.5px solid var(--border-color, rgba(255,255,255,0.12))',
            borderBottom: '0.5px solid var(--border-color, rgba(255,255,255,0.12))',
            borderRadius: '10px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
            color: 'var(--text-main)',
            fontSize: '0.85rem',
          }}
        >
          {/* 顶部：邮箱 + Pro 光芒指示 */}
          <div style={{
            padding: '0.35rem 0.35rem 0.75rem 0.35rem',
            borderBottom: '0.5px solid var(--separator)',
            marginBottom: '0.75rem',
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '0.15rem', letterSpacing: '0.04em' }}>
              {D('登 录 账 号', 'Signed in as')}
            </div>
            <div style={{
              fontSize: '0.82rem',
              color: 'var(--text-main)',
              fontFamily: 'var(--font-system)',
              wordBreak: 'break-all',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4em',
            }}>
              <span style={{ flex: 1 }}>{user.email}</span>
              {/* Pro 用户独有的微小金色块指示 */}
              {isPro && (
                <span
                  title={D('专属用户', 'Premium Member')}
                  style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '6px',
                    background: 'linear-gradient(135deg, #d4a86a, #8a6e4a)',
                    transform: 'rotate(45deg)',
                    boxShadow: '0 0 4px rgba(184,149,106,0.6)',
                    flexShrink: 0,
                  }}
                />
              )}
            </div>
          </div>

          {/* 配额条 */}
          {items.length > 0 && (
            <div style={{ marginBottom: isPro ? '0.85rem' : '0.5rem' }}>
              <div style={{
                fontSize: '0.7rem',
                color: 'var(--text-dim)',
                marginBottom: '0.45rem',
                letterSpacing: '0.04em',
              }}>
                {D('今 日 配 额', "Today's Quota")}
              </div>
              {items.map((it, i) => {
                const pct = it.limit > 0 ? (it.used / it.limit) * 100 : 0
                const isExhausted = it.used >= it.limit
                return (
                  <div key={i} style={{ marginBottom: '0.45rem' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.72rem',
                      marginBottom: '0.2rem',
                    }}>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {it.label}
                        {/* ProCardMark 复用在配额条上，让 Pro 用户的"今日配额"区有微弱标识 */}
                        {i === 0 && isPro && (
                          <span style={{ marginLeft: '0.3em', color: 'rgba(184,149,106,0.6)', fontSize: '0.65rem' }}>✦</span>
                        )}
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-system)',
                        color: isExhausted ? '#c44545' : 'var(--text-secondary)',
                        fontWeight: 500,
                      }}>
                        {it.used}<span style={{ opacity: 0.5 }}>/{it.limit}</span>
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '3px',
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${Math.min(pct, 100)}%`,
                        height: '100%',
                        background: isExhausted
                          ? '#c44545'
                          : isPro
                            ? 'linear-gradient(90deg, #d4a86a, #b8956a)'
                            : 'var(--text-dim)',
                        transition: 'width 280ms',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* 导航链接区 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            borderTop: '0.5px solid var(--separator)',
            paddingTop: '0.45rem',
          }}>
            <MenuLink onClick={() => { setOpen(false); setHoverOpen(false); navigate('/history') }}>
              {D('卜辞', 'Archive')}
            </MenuLink>
            <MenuLink onClick={() => { setOpen(false); setHoverOpen(false); navigate('/settings') }}>
              {D('设置', 'Settings')}
            </MenuLink>
          </div>

          {/* 底部：退出按钮 */}
          <button
            onClick={onLogout}
            style={{
              width: '100%',
              marginTop: '0.5rem',
              padding: '0.45rem',
              background: 'transparent',
              border: '0.5px solid var(--separator)',
              borderRadius: '6px',
              color: 'var(--text-dim)',
              fontSize: '0.78rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {D('退出登录', 'Log out')}
          </button>
        </div>
      )}
    </div>
  )
}

// 内部小组件：菜单链接
function MenuLink({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left',
        padding: '0.42rem 0.5rem',
        background: 'transparent',
        border: 'none',
        color: 'var(--text-secondary)',
        fontSize: '0.82rem',
        cursor: 'pointer',
        fontFamily: 'inherit',
        borderRadius: '4px',
        transition: 'background 140ms, color 140ms',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
        e.currentTarget.style.color = 'var(--text-main)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = 'var(--text-secondary)'
      }}
    >
      {children}
    </button>
  )
}

// _LN_WM: 4c3a8f2e7b1d9065a2c8e4f1b7d3096e8a5c2f4d (linmy666/latestname AGPL-3.0)
