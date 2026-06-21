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

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)

// ─── Developer Signature ───────────────────
//   © 2026 Latestname
//   "I Ching × Tarot · Deterministic · AI Narrated"
// ────────────────────────────────────────────
if (typeof console !== 'undefined') {
  console.log(
    '%c◇ Latestname · 此刻之名 %c\nI Ching × Tarot · Deterministic · AI Narrated',
    'font-size:16px;font-weight:bold;color:#B8956A;text-shadow:0 0 4px rgba(184,149,106,0.3);',
    'font-size:11px;color:#888;'
  )
}

// ══════════════════════════════════════════════════════════════════
// Authorship watermark — compiled into bundle, invisible in UI.
// Copyright © 2026 Lin Ruihan (linmy666). AGPL-3.0-or-later.
// This block exists solely as a static code watermark for
// attribution verification in derivative works. It does not affect
// runtime behavior, collect data, or make network requests.
// ══════════════════════════════════════════════════════════════════
;(function () {
  const _0x6c6e = ['4c3a8f2e7b1d9065a2c8e4f1b7d3096e8a5c2f4d', 'ln-rh-2026-agpl-v3', 'Lin Ruihan', 'linmy666', 'https://github.com/linmy666/latestname']
  const _0x6861 = [0x6c, 0x6e, 0x2d, 0x72, 0x68, 0x32, 0x30, 0x32, 0x36]
  try {
    Object.defineProperty(globalThis, '__ln_meta__', {
      value: Object.freeze({
        a: _0x6c6e[2],  // author
        g: _0x6c6e[3],  // github
        r: _0x6c6e[4],  // repo url
        l: 'AGPL-3.0',
        w: _0x6c6e[0],  // watermark hash
        t: _0x6c6e[1],  // watermark token
        c: _0x6861,     // binary signature [108, 110, 45, 114, 104, 50, 48, 50, 54]
      }),
      writable: false,
      enumerable: false,  // won't show in Object.keys()
      configurable: false,
    })
  } catch (e) {
    // no-op
  }
})()
