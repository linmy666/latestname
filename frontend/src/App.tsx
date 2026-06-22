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

import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Divine from './pages/Divine'
import History from './pages/History'
import About from './pages/About'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Admin from './pages/Admin'
import Feedback from './pages/Feedback'
import { AuthGateOverlay } from './components/AuthGate'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { IconSun, IconMoon, IconMobile, IconDesktop } from './components/Icons'
import { ProBadgeDot, ProNavGlow } from './components/ProBadge'
import { UserMenu } from './components/UserMenu'
import { i18n as i18nDict, type Lang } from './i18n'

// ============================================================
// i18n 词典 (见 ./i18n.ts)
// ============================================================
const i18n = i18nDict

// ============================================================
// 全局偏好 Context（主题 / 语言 / 动画 / 视图模式）
// ============================================================
import { createContext, useContext } from 'react'

export type ViewMode = 'auto' | 'desktop' | 'mobile'

interface Prefs {
  theme: 'dark' | 'light'
  lang: Lang
  animations: boolean
  viewMode: ViewMode
  isMobile: boolean
  setTheme: (t: 'dark' | 'light') => void
  setLang: (l: Lang) => void
  setAnimations: (a: boolean) => void
  setViewMode: (v: ViewMode) => void
  t: typeof i18nDict.zh
}

export const PrefsContext = createContext<Prefs>({
  theme: 'dark', lang: 'zh', animations: true,
  viewMode: 'auto', isMobile: false,
  setTheme: () => {}, setLang: () => {}, setAnimations: () => {}, setViewMode: () => {}, t: i18nDict.zh as any,
})

export const usePrefs = () => useContext(PrefsContext)

export default function App() {
  const location = useLocation()
  const authInfo = useAuth()
  const [theme, setThemeState] = useState<'dark' | 'light'>(() =>
    (localStorage.getItem('onyx_theme') as 'dark' | 'light') || 'dark')
  const [lang, setLangState] = useState<Lang>(() =>
    (localStorage.getItem('onyx_lang') as Lang) || 'zh')
  const [animations, setAnimationsState] = useState<boolean>(() =>
    localStorage.getItem('onyx_animations') !== 'off')
  const [viewMode, setViewModeState] = useState<ViewMode>(() =>
    (localStorage.getItem('onyx_view_mode') as ViewMode) || 'auto')
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false)

  // 视口宽度检测
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches)
      document.documentElement.setAttribute('data-viewport', e.matches ? 'mobile' : 'desktop')
    }
    handler(mq)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('onyx_theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('onyx_lang', lang)
  }, [lang])

  useEffect(() => {
    if (!animations) {
      document.documentElement.classList.add('no-animations')
    } else {
      document.documentElement.classList.remove('no-animations')
    }
    localStorage.setItem('onyx_animations', animations ? 'on' : 'off')
  }, [animations])

  useEffect(() => {
    localStorage.setItem('onyx_view_mode', viewMode)
  }, [viewMode])

  const setTheme = useCallback((t: 'dark' | 'light') => setThemeState(t), [])
  const setLang = useCallback((l: Lang) => setLangState(l), [])
  const setAnimations = useCallback((a: boolean) => setAnimationsState(a), [])
  const setViewMode = useCallback((v: ViewMode) => setViewModeState(v), [])

  // 实际生效的视图模式：auto 时跟随浏览器宽度
  const effectiveMobile = viewMode === 'mobile' || (viewMode === 'auto' && isMobile)

  const t = i18n[lang] as typeof i18nDict.zh
  const nav = t.nav

  const navItems = [
    { path: '/', label: nav.home },
    { path: '/divine', label: nav.divine },
    { path: '/history', label: nav.archive },
    { path: '/settings', label: nav.settings },
    { path: '/about', label: nav.about },
  ]

  return (
    <PrefsContext.Provider value={{ theme, lang, animations, viewMode, isMobile: effectiveMobile, setTheme, setLang, setAnimations, setViewMode, t }}>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* v1.0 Liquid Glass Navigation Bar */}
        <header className="glass-nav" style={{
          padding: '0.6rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          {/* v2.2: Pro 用户导航条底部金色微光（呼吸动画）*/}
          <ProNavGlow />
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5em' }}>
              <span style={{
                fontFamily: 'var(--font-system)',
                fontSize: '1.15rem', fontWeight: 700,
                color: 'var(--text-primary)', letterSpacing: '-0.02em',
              }}>Latestname</span>
              <span style={{
                fontFamily: 'var(--font-serif-cn)',
                fontSize: '0.8rem', color: 'var(--text-secondary)', letterSpacing: '0.1em',
              }}>{lang === 'zh' ? t.home.subtitle : t.home.subtitle}</span>
            </div>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            {!effectiveMobile && <NavSlider navItems={navItems} pathname={location.pathname} theme={theme} />}

            {/* View Mode Toggle (Desktop / Mobile) — only show on real mobile */}
            {isMobile && viewMode === 'auto' && (
              <button
                className="theme-toggle glass-chip"
                onClick={() => setViewMode('desktop')}
                title={t.topbar.viewDesktop}
                style={{ color: 'var(--text-secondary)', border: '0.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' }}
              >
                <IconDesktop size={14} />
              </button>
            )}
            {!isMobile && (
              <button
                className="theme-toggle glass-chip"
                onClick={() => setViewMode(viewMode === 'mobile' ? 'auto' : 'mobile')}
                title={t.topbar.viewMobile}
                style={{ color: 'var(--text-secondary)', border: '0.5px solid rgba(255,255,255,0.1)', background: viewMode === 'mobile' ? 'rgba(184,149,106,0.15)' : 'rgba(255,255,255,0.05)' }}
              >
                <IconMobile size={14} />
              </button>
            )}

            {/* Language Toggle */}
            <button
              className="theme-toggle glass-chip"
              onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
              title={lang === 'zh' ? 'Switch to English' : '切换到中文'}
              style={{ fontSize: '0.72rem', fontFamily: 'var(--font-system)', letterSpacing: 0, width: 'auto', padding: '0.3em 0.6em', height: 'auto', border: '0.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' }}
            >
              {lang === 'zh' ? 'EN' : '中'}
            </button>

            {/* Theme Toggle */}
            <button
              className="theme-toggle glass-chip"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? t.settings.light : t.settings.dark}
              style={{ color: 'var(--text-secondary)', border: '0.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' }}
            >
              {theme === 'dark' ? <IconSun size={14} /> : <IconMoon size={14} />}
            </button>

            {/* Auth Area */}
            {authInfo.authEnabled && (
              authInfo.user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  {authInfo.isAdmin && (
                    <Link
                      to="/admin"
                      className="glass-chip"
                      style={{
                        fontSize: '0.72rem', fontFamily: 'var(--font-system)',
                        padding: '0.3em 0.7em', textDecoration: 'none',
                        color: 'var(--accent-gold)', border: '0.5px solid rgba(184,149,106,0.3)',
                        background: 'rgba(184,149,106,0.08)', borderRadius: '8px',
                      }}
                    >
                      {t.nav.admin}
                    </Link>
                  )}
                  <UserMenu />
                </div>
              ) : (
                <Link
                  to="/login"
                  className="glass-chip"
                  style={{
                    fontSize: '0.72rem', fontFamily: 'var(--font-system)',
                    padding: '0.3em 0.7em', textDecoration: 'none',
                    color: 'var(--text-secondary)', border: '0.5px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)', borderRadius: '8px',
                  }}
                >
                  {t.nav.login}
                </Link>
              )
            )}
          </div>
        </header>

        {/* Animated Mesh Gradient Background — gives glass something to refract */}
        <div className="mesh-bg">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
          <div className="blob blob-4" />
          <div className="blob blob-5" />
        </div>

        {/* 粒子背景（仅暗色+动画开启时显示） */}
        {theme === 'dark' && animations && <ParticleBackground />}

        <main style={{ flex: 1, position: 'relative', zIndex: 1, paddingBottom: effectiveMobile ? '5rem' : 0 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/divine" element={<Divine />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/feedback" element={<Feedback />} />
          </Routes>
        </main>

        {/* 移动端底部 Tab 栏 — 仅 isMobile 时显示 */}
        {effectiveMobile && <MobileBottomTab navItems={navItems} pathname={location.pathname} t={t} theme={theme} />}

        <footer className="glass-thin" style={{
          textAlign: 'center', padding: '2rem',
          position: 'relative',
          color: 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: 500,
          fontFamily: 'var(--font-system)', letterSpacing: '-0.01em',
          borderTop: '0.5px solid rgba(255,255,255,0.06)',
        }}>
          <div>{t.footer.brand}</div>
          <div style={{ marginTop: '0.3rem', fontSize: '0.7rem', opacity: 0.6 }}>
            {t.footer.tagline}
          </div>
          <div style={{ marginTop: '0.6rem', display: 'flex', gap: '1rem', justifyContent: 'center', fontSize: '0.72rem' }}>
            <a href="https://github.com/linmy666/latestname" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-dim)', opacity: 0.6, textDecoration: 'none' }}>
              {t.footer.github}
            </a>
            <Link to="/feedback" style={{ color: 'var(--text-dim)', opacity: 0.6, textDecoration: 'none' }}>
              {t.footer.feedback}
            </Link>
            <Link to="/about" style={{ color: 'var(--text-dim)', opacity: 0.6, textDecoration: 'none' }}>
              {t.footer.about}
            </Link>
          </div>
          <div style={{ marginTop: '0.4rem', fontSize: '0.65rem', opacity: 0.2, letterSpacing: '0.3em' }}>
            ◇
          </div>
        </footer>

        {/* AuthGate — 全局未登录/额度用完友好提示浮层 */}
        <AuthGateOverlay />
      </div>
    </PrefsContext.Provider>
  )
}

// ============================================================
// NavSlider — 滑动式导航激活态指示器（iOS Segmented Control 风格）
// ============================================================
interface NavItem { path: string; label: string }

function NavSlider({ navItems, pathname, theme }: { navItems: NavItem[]; pathname: string; theme: string }) {
  const navRef = useRef<HTMLElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const [indicator, setIndicator] = useState({ left: 0, width: 0, opacity: 0 })

  useLayoutEffect(() => {
    const idx = navItems.findIndex(item => item.path === pathname)
    if (idx === -1) {
      setIndicator(prev => ({ ...prev, opacity: 0 }))
      return
    }
    const el = itemRefs.current[idx]
    const nav = navRef.current
    if (!el || !nav) return
    const elRect = el.getBoundingClientRect()
    const navRect = nav.getBoundingClientRect()
    setIndicator({
      left: elRect.left - navRect.left,
      width: elRect.width,
      opacity: 1,
    })
  }, [pathname, navItems])

  return (
    <nav ref={navRef} style={{ display: 'flex', gap: '0.15rem', position: 'relative' }}>
      {/* Sliding indicator */}
      <div
        style={{
          position: 'absolute',
          left: indicator.left,
          width: indicator.width,
          top: '50%',
          height: 'calc(100% - 0.2rem)',
          transform: 'translateY(-50%)',
          borderRadius: 'var(--radius-pill)',
          background: theme === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          transition: 'left 0.4s cubic-bezier(0.32, 0.72, 0, 1), width 0.4s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.2s',
          opacity: indicator.opacity,
          zIndex: 0,
          boxShadow: theme === 'dark'
            ? '0 1px 4px rgba(255,255,255,0.1)'
            : '0 1px 4px rgba(0,0,0,0.15)',
        }}
      />
      {navItems.map((item, i) => {
        const active = pathname === item.path
        return (
          <Link
            key={item.path}
            ref={el => { itemRefs.current[i] = el }}
            to={item.path}
            style={{
              textDecoration: 'none',
              fontFamily: 'var(--font-system)',
              fontSize: '0.78rem',
              fontWeight: active ? 600 : 400,
              letterSpacing: '-0.01em',
              color: active
                ? (theme === 'dark' ? 'var(--bg)' : '#FFF')
                : 'var(--text-secondary)',
              padding: '0.35rem 0.7rem',
              borderRadius: 'var(--radius-pill)',
              position: 'relative',
              zIndex: 1,
              transition: 'color 0.3s',
            }}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

// ============================================================
// 粒子背景组件
// ============================================================
function ParticleBackground() {
  const particles = Array.from({ length: 20 }, (_, i) => {
    const size = 2 + Math.random() * 4
    const left = Math.random() * 100
    const delay = Math.random() * 8
    const duration = 6 + Math.random() * 8
    const drift = (Math.random() - 0.5) * 200
    return (
      <div
        key={i}
        className="particle"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          left: `${left}%`,
          bottom: '-10px',
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
          ['--drift' as any]: `${drift}px`,
        }}
      />
    )
  })

  return <div className="particles-bg">{particles}</div>
}

// ============================================================
// MobileBottomTab — 移动端底部 Tab 栏（仅 effectiveMobile 时显示）
// ============================================================
function MobileBottomTab({ navItems, pathname, t, theme }: { navItems: NavItem[]; pathname: string; t: any; theme: 'dark' | 'light' }) {
  // v2.3: 显示全部 5 项导航（包括「关于」），用户需要看到入口
  const visible = navItems.slice(0, 5)
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      display: 'flex', justifyContent: 'space-around',
      padding: '0.5rem 0.25rem calc(0.5rem + env(safe-area-inset-bottom))',
      // 背景颜色跟随主题：夜间深色，日间浅色玻璃
      background: theme === 'dark'
        ? 'rgba(20, 20, 30, 0.82)'
        : 'rgba(255, 255, 255, 0.82)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderTop: theme === 'dark'
        ? '0.5px solid rgba(255,255,255,0.1)'
        : '0.5px solid rgba(0,0,0,0.08)',
      zIndex: 90,
      boxShadow: theme === 'dark'
        ? '0 -8px 24px rgba(0,0,0,0.3)'
        : '0 -4px 16px rgba(0,0,0,0.08)',
    }}>
      {visible.map(item => {
        const active = pathname === item.path
        // 日间模式用更深的灰色，夜间模式用更亮的灰色
        // 都通过 opacity 控制对比度（保持色相一致）
        const inactiveColor = theme === 'dark'
          ? 'rgba(235, 235, 245, 0.62)'   // 夜间：浅灰 62%
          : 'rgba(28, 28, 30, 0.55)'      // 日间：深灰 55%（明显可见）
        return (
          <Link
            key={item.path}
            to={item.path}
            style={{
              flex: 1, textDecoration: 'none', textAlign: 'center',
              padding: '0.4rem 0.2rem',
              color: active ? 'var(--accent)' : inactiveColor,
              fontSize: '0.72rem', fontWeight: active ? 600 : 500,
              fontFamily: 'var(--font-system)',
              transition: 'color 0.2s',
            }}
          >
            <div style={{
              fontSize: '1.15rem', marginBottom: '0.15rem',
              filter: active ? 'drop-shadow(0 0 4px rgba(184,149,106,0.5))' : 'none',
              opacity: active ? 1 : 0.75,
            }}>
              {mobileNavIcon(item.path)}
            </div>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

function mobileNavIcon(path: string) {
  if (path === '/') return '⌂'
  if (path === '/divine') return '✦'
  if (path === '/history') return '◰'
  if (path === '/settings') return '⚙'
  return '·'
}

// _LN_WM: 4c3a8f2e7b1d9065a2c8e4f1b7d3096e8a5c2f4d (linmy666/latestname AGPL-3.0)
