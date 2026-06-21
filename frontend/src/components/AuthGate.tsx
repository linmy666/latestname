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
 * AuthGate — 未登录 / 额度用完的友好提示弹层
 * 用于 Divine 页面的起卦/卦名/深度解读失败时
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePrefs } from '../App'
import { D, setLang } from '../i18n-shim'

type GateState = {
  show: boolean
  type: 'login' | 'quota' | null
  message: string
}

let _listeners: ((s: GateState) => void)[] = []
let _state: GateState = { show: false, type: null, message: '' }

/** 全局触发（供 Divine 等外部调用） */
export function triggerAuthGate(type: 'login' | 'quota', message?: string) {
  const msg = message || (
    type === 'login'
      ? D('登录后即可解锁完整功能', 'Log in to unlock full features')
      : D("今日额度已用完，明天再来开启新的好运 ✨", "Today's readings are all used up. Come back tomorrow for fresh luck ✨")
  )
  _state = { show: true, type, message: msg }
  _listeners.forEach(fn => fn(_state))
}

/** 关闭弹层 */
export function closeAuthGate() {
  _state = { show: false, type: null, message: '' }
  _listeners.forEach(fn => fn(_state))
}

/**
 * AuthGateOverlay — 在页面底部渲染的浮层
 * 全局单例，import 一次即可
 */
export function AuthGateOverlay() {
  const { lang } = usePrefs()
  setLang(lang)
  const navigate = useNavigate()
  const [state, setState] = useState<GateState>(_state)

  useEffect(() => {
    _listeners.push(setState)
    return () => { _listeners = _listeners.filter(fn => fn !== setState) }
  }, [])

  const handleClose = useCallback(() => {
    closeAuthGate()
  }, [])

  if (!state.show || !state.type) return null

  const isLogin = state.type === 'login'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
      animation: 'fadeIn 0.3s ease',
    }} onClick={handleClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '380px', margin: '1rem', padding: '2.2rem 1.8rem',
          background: 'var(--card-bg, rgba(255,255,255,0.95))',
          border: '0.5px solid var(--separator, rgba(184,149,106,0.25))',
          borderRadius: '16px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* 图标 */}
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.8 }}>
          {isLogin ? '◈' : '☾'}
        </div>

        {/* 标题 */}
        <h3 style={{
          fontSize: '1.15rem', fontWeight: 400,
          color: isLogin ? 'var(--accent-gold)' : 'var(--text-main)',
          marginBottom: '0.8rem', letterSpacing: '0.05em',
        }}>
          {isLogin
            ? D('登录后继续', 'Log in to continue')
            : D('今日缘分已尽', 'Come back tomorrow')}
        </h3>

        {/* 描述 */}
        <p style={{
          fontSize: '0.88rem', lineHeight: 1.7,
          color: 'var(--text-dim)', marginBottom: '1.5rem',
        }}>
          {state.message}
        </p>

        {/* 按钮组 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {isLogin ? (
            <>
              <button
                onClick={() => { handleClose(); navigate('/login') }}
                style={{
                  padding: '0.7rem 1.5rem',
                  background: 'linear-gradient(135deg, rgba(184,149,106,0.2), rgba(184,149,106,0.3))',
                  border: '0.5px solid rgba(184,149,106,0.5)',
                  borderRadius: '10px',
                  color: 'var(--accent-gold)',
                  fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer',
                }}
              >
                {D('登 录 / 注 册', 'Log in / Sign up')}
              </button>
              <button
                onClick={handleClose}
                style={{
                  padding: '0.5rem 1.5rem',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-dim)',
                  fontSize: '0.8rem', cursor: 'pointer',
                }}
              >
                {D('再看看', 'Maybe later')}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { handleClose(); navigate('/history') }}
                style={{
                  padding: '0.7rem 1.5rem',
                  background: 'linear-gradient(135deg, rgba(184,149,106,0.2), rgba(184,149,106,0.3))',
                  border: '0.5px solid rgba(184,149,106,0.5)',
                  borderRadius: '10px',
                  color: 'var(--accent-gold)',
                  fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer',
                }}
              >
                {D('查看今日卜辞', 'View your readings')}
              </button>
              <button
                onClick={handleClose}
                style={{
                  padding: '0.5rem 1.5rem',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-dim)',
                  fontSize: '0.8rem', cursor: 'pointer',
                }}
              >
                {D('知道了', 'Got it')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// _LN_WM: 4c3a8f2e7b1d9065a2c8e4f1b7d3096e8a5c2f4d (linmy666/latestname AGPL-3.0)
