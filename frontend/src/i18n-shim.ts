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
 * i18n-shim — 全局 D(zh, en) helper
 *
 * 在 Divine.tsx 内定义（D/setLang 都在那里），其它文件
 * 通过 import 这个 shim 来共享同一份 module-scope lang state。
 *
 * 用法：
 *   import '../i18n-shim'
 *   const { lang } = usePrefs()
 *   setLang(lang)         // 在组件 render 顶部调用
 *   D('中文', 'English')  // 在任何地方调用
 */

// 这个文件 re-export Divine.tsx 中定义的 D 和 setLang。
// 因为 module 加载顺序：所有页面 import 'i18n-shim' 时，
// 如果 Divine 已经被加载，D/setLang 已经挂到全局。
// 但更安全的做法是把 D/setLang 定义在这里，让 Divine 也 import 这里。

let currentLang: 'zh' | 'en' = 'zh'

export function setLang(l: 'zh' | 'en') {
  currentLang = l
}

// v2.3: module-scope quota refresher
// AuthContext.fetchUsage 调用需要 useAuth() hook，但子组件里不一定能拿到
// 改为通过 module-scope state 跟踪，任意位置调用 refreshQuota() 都能刷新
let _refreshQuotaCallback: (() => void) | null = null

export function setQuotaRefresher(cb: () => void) {
  _refreshQuotaCallback = cb
}

export function refreshQuota() {
  if (_refreshQuotaCallback) {
    _refreshQuotaCallback()
  }
}

export function D(zh: string, en: string): string {
  return currentLang === 'zh' ? zh : en
}

export function getLang(): 'zh' | 'en' {
  return currentLang
}