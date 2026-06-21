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
 * AuthContext - 全局认证状态管理
 * 通过 /api/auth/status 检测是否开启认证
 * JWT token 存 localStorage
 * 支持管理员检测与自动跳转
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { setQuotaRefresher } from '../i18n-shim'

interface AuthUser {
  id: number
  email: string | null
  name: string | null
  avatar_url: string | null
  oauth_provider: string | null
  is_admin?: boolean
  is_verified?: boolean
  quota?: {
    mbti: { used: number; limit: number }
    divination: { used: number; limit: number }
    ai: { used: number; limit: number }
    reset_at?: string
  } | null
}

interface UsageInfo {
  ai_remaining: number
  ai_limit: number
  divination_remaining?: number
  divination_limit?: number
  mbti_remaining?: number
  mbti_limit?: number
}

interface AuthContextType {
  authEnabled: boolean
  user: AuthUser | null
  loading: boolean
  usage: UsageInfo | null
  isAdmin: boolean
  isPro: boolean  // v2.2: Pro 状态（通过探测 personalized-analysis API）
  login: (token: string) => void
  logout: () => void
  fetchUsage: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  authEnabled: false,
  user: null,
  loading: true,
  usage: null,
  isAdmin: false,
  isPro: false,
  login: () => {},
  logout: () => {},
  fetchUsage: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authEnabled, setAuthEnabled] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [usage, setUsage] = useState<UsageInfo | null>(null)
  const [isPro, setIsPro] = useState(false)

  const isAdmin = !!(user?.is_admin)

  // 检测认证是否开启
  useEffect(() => {
    fetch('/api/auth/status')
      .then(r => r.json())
      .then(d => {
        setAuthEnabled(d.auth_enabled === true)
      })
      .catch(() => setAuthEnabled(false))
      .finally(() => setLoading(false))
  }, [])

  // 如果已登录，自动获取用户信息
  useEffect(() => {
    const token = localStorage.getItem('ln_token')
    if (!token || !authEnabled) return
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(d => {
        setUser(d)
        // v2.2: 探测 Pro 状态（通过个性化分析 API 的可达性）
        probeProStatus(token)
      })
      .catch(() => {
        localStorage.removeItem('ln_token')
        setUser(null)
      })
  }, [authEnabled])

  // v2.2: Pro 探测 — 尝试调用 personalized-analysis
  // Pro 用户 → 200，Standard → 404。完全被动，不暴露 tier 概念
  const probeProStatus = async (token: string) => {
    try {
      const r = await fetch('/api/auth/personalized-analysis', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setIsPro(r.ok)  // 200 → Pro, 404 → Standard
    } catch {
      setIsPro(false)
    }
  }

  // 获取使用情况
  useEffect(() => {
    if (user && authEnabled) {
      fetchUsage()
    }
  }, [user])

  // v2.3: 注册全局 quota refresher，子组件可以从任意位置调用 refreshQuota()
  useEffect(() => {
    const refresher = async () => {
      const token = localStorage.getItem('ln_token')
      if (!token) return
      try {
        const r = await fetch('/api/auth/usage', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (r.ok) {
          const d = await r.json()
          setUsage({
            ai_remaining: d.ai_remaining,
            ai_limit: d.ai_limit,
            divination_remaining: d.divination_remaining,
            divination_limit: d.divination_limit ?? 5,
            mbti_remaining: d.mbti_remaining,
            mbti_limit: d.mbti_limit ?? 1,
          })
        }
      } catch {}
    }
    setQuotaRefresher(refresher)
    return () => setQuotaRefresher(() => {})
  }, [])

  const fetchUsage = async () => {
    const token = localStorage.getItem('ln_token')
    if (!token) return
    try {
      const r = await fetch('/api/auth/usage', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (r.ok) {
        const d = await r.json()
        setUsage({
          ai_remaining: d.ai_remaining,
          ai_limit: d.ai_limit,
          divination_remaining: d.divination_remaining,
          divination_limit: d.divination_limit ?? 5,
          mbti_remaining: d.mbti_remaining,
          mbti_limit: d.mbti_limit ?? 1,
        })
      }
    } catch {}
  }

  const login = (token: string) => {
    localStorage.setItem('ln_token', token)
    // 触发用户信息获取
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        setUser(d)
        probeProStatus(token)  // 登录后立即探测
      })
      .catch(() => {})
  }

  const logout = () => {
    localStorage.removeItem('ln_token')
    setUser(null)
    setUsage(null)
    setIsPro(false)
  }

  return (
    <AuthContext.Provider value={{ authEnabled, user, loading, usage, isAdmin, isPro, login, logout, fetchUsage }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

// _LN_WM: 4c3a8f2e7b1d9065a2c8e4f1b7d3096e8a5c2f4d (linmy666/latestname AGPL-3.0)
