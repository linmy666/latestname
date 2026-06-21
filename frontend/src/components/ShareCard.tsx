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
 * Latestname - 分享卡组件（v0.6-B）
 * 把占卜结果渲染成 1080×1920 PNG，适配微信/朋友圈/小红书竖版尺寸
 *
 * 渲染策略：纯 Canvas 2D API（不依赖 html2canvas）
 * - 黑曜石暗金主题
 * - 标题 / 卦象 SVG 简化版 / 塔罗牌名 / 5 维运势条 / 一句话 AI 摘要
 *
 * 用法：
 *   <ShareCard result={combinedResult} onRendered={(dataUrl) => ...} />
 *   // 然后用 onRendered 返回的 dataURL 触发下载
 */
import { useEffect, useRef } from 'react'

const W = 1080
const H = 1920

// 主题色（暖米白宣纸质感 — 与卦格分享卡一致）
const C = {
  bg: '#F7F3EC',
  bg2: '#EEE6D8',
  white: '#2A2520',      // 主文字（深墨色）
  whiteDim: 'rgba(90, 80, 72, 0.7)',
  gold: '#9A7B3E',
  goldBright: '#B8945A',
  goldDim: 'rgba(154,123,62,0.3)',
  jade: '#4A7A3A',
  crimson: '#9B3D2E',
  line: 'rgba(154,123,62,0.12)',
}

// 运势 → 颜色
function scoreColor(s: number) {
  if (s >= 80) return C.jade
  if (s >= 60) return C.gold
  if (s >= 40) return C.whiteDim
  return C.crimson
}

// 文字换行（按 maxChars 折行）
function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 3) {
  const chars = text.split('')
  const lines: string[] = []
  let cur = ''
  for (const ch of chars) {
    const test = cur + ch
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur)
      cur = ch
      if (lines.length >= maxLines - 1) break
    } else {
      cur = test
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur)
  // 末行可能超长，截断+省略号
  if (lines.length === maxLines) {
    let last = lines[maxLines - 1]
    while (ctx.measureText(last + '…').width > maxWidth && last.length > 0) {
      last = last.slice(0, -1)
    }
    lines[maxLines - 1] = last + '…'
  }
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, y + i * lineHeight)
  }
  return lines.length * lineHeight
}

// 绘制卦象（简化版：6 横线，阳实阴虚）
function drawHexagram(ctx: CanvasRenderingContext2D, binary: string, cx: number, cy: number, width: number) {
  const lineH = 14
  const gap = 12
  const totalH = 6 * lineH + 5 * gap
  const startY = cy - totalH / 2
  for (let i = 0; i < 6; i++) {
    const y = startY + i * (lineH + gap)
    const isYang = binary[i] === '1'
    if (isYang) {
      // 实线
      ctx.fillStyle = C.gold
      ctx.fillRect(cx - width / 2, y, width, lineH)
    } else {
      // 虚线（中间断开）
      ctx.fillStyle = C.gold
      const segW = (width - 16) / 2
      ctx.fillRect(cx - width / 2, y, segW, lineH)
      ctx.fillRect(cx + 16 / 2, y, segW, lineH)
    }
  }
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export interface ShareCardData {
  question: string
  hexagram: { name: string; name_en: string; binary: string; fortune: string; judgment: string }
  tarot?: { card: { name: string; name_en: string }; reversed: boolean; spread_position?: { label: string } }[]
  fortune_scores?: { career: { score: number; label: string }; relationship: { score: number; label: string }; finance: { score: number; label: string }; health: { score: number; label: string }; timing: { score: number; label: string } }
  ai_summary?: string
  date?: string
  name?: string
}

export function renderShareCard(canvas: HTMLCanvasElement, data: ShareCardData): Promise<string> {
  return new Promise((resolve, reject) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return reject(new Error('Canvas 2D context unavailable'))
    canvas.width = W
    canvas.height = H

    // 字体（系统栈，中文用 PingFang/STHeiti）
    ctx.font = '300 26px "Cormorant Garamond", "Songti SC", "STHeiti", serif'
    ctx.textBaseline = 'top'
    ctx.textAlign = 'left'

    // 背景 — 暖米白宣纸渐变
    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, '#F7F3EC')
    bg.addColorStop(0.5, '#F2EDE3')
    bg.addColorStop(1, '#EFE8DB')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // 纹理：细微噪点感
    ctx.save()
    ctx.globalAlpha = 0.02
    for (let i = 0; i < 200; i++) {
      const rx = Math.random() * W
      const ry = Math.random() * H
      const rs = Math.random() * 2 + 0.5
      ctx.fillStyle = C.gold
      ctx.fillRect(rx, ry, rs, rs)
    }
    ctx.restore()

    // 暗金径向光晕
    const orbGrad = ctx.createRadialGradient(W / 2, 420, 50, W / 2, 420, 500)
    orbGrad.addColorStop(0, 'rgba(154,123,62,0.06)')
    orbGrad.addColorStop(1, 'rgba(154,123,62,0)')
    ctx.fillStyle = orbGrad
    ctx.fillRect(0, 200, W, 600)

    // 顶部暗金渐变带
    const topGrad = ctx.createLinearGradient(0, 0, W, 0)
    topGrad.addColorStop(0, 'rgba(154,123,62,0)')
    topGrad.addColorStop(0.5, 'rgba(154,123,62,0.2)')
    topGrad.addColorStop(1, 'rgba(154,123,62,0)')
    ctx.fillStyle = topGrad
    ctx.fillRect(0, 0, W, 3)

    // 顶部 LOGO
    ctx.fillStyle = C.gold
    ctx.font = '500 24px "Cormorant Garamond", serif'
    ctx.textAlign = 'center'
    ctx.fillText('Latestname', W / 2, 100)
    ctx.fillStyle = C.whiteDim
    ctx.font = '300 18px "Songti SC", "STHeiti", serif'
    ctx.fillText('此 刻 之 名', W / 2, 140)

    // 分隔线
    ctx.strokeStyle = C.goldDim
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(W * 0.2, 200)
    ctx.lineTo(W * 0.8, 200)
    ctx.stroke()

    // 日期
    ctx.fillStyle = C.whiteDim
    ctx.font = '300 20px "Cormorant Garamond", serif'
    ctx.textAlign = 'center'
    const dateStr = data.date || new Date().toISOString().split('T')[0]
    ctx.fillText(dateStr, W / 2, 230)

    // 问题
    if (data.question) {
      ctx.fillStyle = C.white
      ctx.font = '500 36px "Songti SC", "STHeiti", serif'
      ctx.textAlign = 'center'
      wrapText(ctx, data.question, W / 2, 280, W * 0.8, 50, 2)
    }

    // 卦象
    const hexY = 460
    ctx.fillStyle = C.goldDim
    ctx.font = '300 16px "Cormorant Garamond", serif'
    ctx.textAlign = 'center'
    ctx.fillText('·  HEXAGRAM  ·', W / 2, hexY - 60)
    drawHexagram(ctx, data.hexagram.binary, W / 2, hexY, 240)

    // 卦名
    ctx.fillStyle = C.gold
    ctx.font = '500 60px "Songti SC", "STHeiti", serif'
    ctx.textAlign = 'center'
    ctx.fillText(data.hexagram.name, W / 2, hexY + 130)
    ctx.fillStyle = C.whiteDim
    ctx.font = '300 24px "Cormorant Garamond", serif'
    ctx.fillText(data.hexagram.name_en, W / 2, hexY + 210)

    // 吉凶 tag
    const f = data.hexagram.fortune || '中'
    const fColor = f === '大吉' ? C.jade : f === '大凶' ? C.crimson : C.gold
    ctx.fillStyle = fColor
    ctx.font = '500 24px "Songti SC", "STHeiti", serif'
    ctx.textAlign = 'center'
    drawRoundedRect(ctx, W / 2 - 50, hexY + 260, 100, 50, 6)
    ctx.strokeStyle = fColor
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.fillText(f, W / 2, hexY + 270)

    // 卦辞
    ctx.fillStyle = C.goldDim
    ctx.font = '300 16px "Cormorant Garamond", serif'
    ctx.textAlign = 'center'
    ctx.fillText('·  JUDGMENT  ·', W / 2, hexY + 360)
    ctx.fillStyle = C.white
    ctx.font = '400 26px "Songti SC", "STHeiti", serif'
    ctx.textAlign = 'center'
    wrapText(ctx, data.hexagram.judgment || '', W / 2, hexY + 400, W * 0.78, 40, 3)

    // 塔罗卡
    if (data.tarot && data.tarot.length > 0) {
      ctx.fillStyle = C.goldDim
      ctx.font = '300 16px "Cormorant Garamond", serif'
      ctx.textAlign = 'center'
      ctx.fillText('·  TAROT  ·', W / 2, hexY + 580)
      const cardY = hexY + 620
      const cardW = 200
      const cardH = 280
      const totalW = data.tarot.length * cardW + (data.tarot.length - 1) * 24
      let xStart = (W - totalW) / 2
      for (const c of data.tarot) {
        const cx = xStart + cardW / 2
        // 卡背（暖白底 + 暗金边框）
        drawRoundedRect(ctx, xStart, cardY, cardW, cardH, 8)
        ctx.fillStyle = 'rgba(255, 252, 245, 0.8)'
        ctx.fill()
        ctx.strokeStyle = C.gold
        ctx.lineWidth = 2
        ctx.stroke()
        // 内框
        ctx.strokeStyle = C.goldDim
        ctx.lineWidth = 1
        drawRoundedRect(ctx, xStart + 12, cardY + 12, cardW - 24, cardH - 24, 4)
        ctx.stroke()
        // 卡名
        ctx.fillStyle = C.gold
        ctx.font = '500 24px "Songti SC", "STHeiti", serif'
        ctx.textAlign = 'center'
        wrapText(ctx, c.card.name, cx, cardY + 60, cardW - 40, 30, 3)
        // 位置
        if (c.spread_position?.label) {
          ctx.fillStyle = C.whiteDim
          ctx.font = '300 16px "Songti SC", "STHeiti", serif'
          ctx.fillText(c.spread_position.label, cx, cardY + 200)
        }
        // 正逆位
        ctx.fillStyle = c.reversed ? C.crimson : C.jade
        ctx.font = '500 18px "Songti SC", "STHeiti", serif'
        ctx.fillText(c.reversed ? '逆 位' : '正 位', cx, cardY + 230)
        xStart += cardW + 24
      }
    }

    // 5 维运势
    if (data.fortune_scores) {
      const fy = H - 480
      ctx.fillStyle = C.goldDim
      ctx.font = '300 16px "Cormorant Garamond", serif'
      ctx.textAlign = 'center'
      ctx.fillText('·  FORTUNE  ·', W / 2, fy)
      const dims = [
        data.fortune_scores.career,
        data.fortune_scores.relationship,
        data.fortune_scores.finance,
        data.fortune_scores.health,
        data.fortune_scores.timing,
      ]
      const barW = W * 0.7
      const startX = (W - barW) / 2
      let by = fy + 40
      for (const d of dims) {
        ctx.fillStyle = C.white
        ctx.font = '400 22px "Songti SC", "STHeiti", serif'
        ctx.textAlign = 'left'
        ctx.fillText(d.label, startX, by)
        ctx.textAlign = 'right'
        ctx.fillText(String(d.score), startX + barW, by)
        // 条
        ctx.fillStyle = C.line
        ctx.fillRect(startX, by + 32, barW, 6)
        ctx.fillStyle = scoreColor(d.score)
        ctx.fillRect(startX, by + 32, barW * (d.score / 100), 6)
        by += 60
      }
    }

    // AI 摘要（如有）
    if (data.ai_summary) {
      const ay = H - 230
      ctx.fillStyle = C.goldDim
      ctx.font = '300 16px "Cormorant Garamond", serif'
      ctx.textAlign = 'center'
      ctx.fillText('·  AI INSIGHT  ·', W / 2, ay)
      ctx.fillStyle = C.white
      ctx.font = '400 24px "Songti SC", "STHeiti", serif'
      ctx.textAlign = 'center'
      wrapText(ctx, data.ai_summary, W / 2, ay + 36, W * 0.78, 36, 4)
    }

    // 底部
    ctx.fillStyle = C.goldDim
    ctx.font = '300 18px "Cormorant Garamond", serif'
    ctx.textAlign = 'center'
    ctx.fillText('Latestname · 此刻之名', W / 2, H - 80)
    ctx.fillStyle = 'rgba(90, 80, 72, 0.4)'
    ctx.font = '300 16px "Cormorant Garamond", serif'
    ctx.fillText(`Generated ${new Date().toISOString().split('T')[0]}`, W / 2, H - 50)

    // 底部暗金渐变带
    const botGrad = ctx.createLinearGradient(0, H - 3, W, H)
    botGrad.addColorStop(0, 'rgba(154,123,62,0)')
    botGrad.addColorStop(0.5, 'rgba(154,123,62,0.2)')
    botGrad.addColorStop(1, 'rgba(154,123,62,0)')
    ctx.fillStyle = botGrad
    ctx.fillRect(0, H - 3, W, 3)

    // 导出
    try {
      const dataUrl = canvas.toDataURL('image/png', 0.95)
      resolve(dataUrl)
    } catch (e) {
      reject(e)
    }
  })
}

// 便捷 hook：暴露给 Divine.tsx
export function useShareCardRenderer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!canvasRef.current) {
      const c = document.createElement('canvas')
      c.style.display = 'none'
      document.body.appendChild(c)
      canvasRef.current = c
    }
    return () => {
      if (canvasRef.current) {
        canvasRef.current.remove()
        canvasRef.current = null
      }
    }
  }, [])

  return async (data: ShareCardData): Promise<string> => {
    if (!canvasRef.current) throw new Error('Canvas 未就绪')
    return renderShareCard(canvasRef.current, data)
  }
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
