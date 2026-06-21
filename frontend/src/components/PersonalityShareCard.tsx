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
 * Latestname - 卦格分享卡（PersonalityShareCard）
 * Canvas 2D 绘制 1080×1620 竖版分享图
 * 风格：暖米白宣纸质感 + 暗金点缀 + 人物形象 + 多板块饱满排版
 */
import { useEffect, useRef } from 'react'

const W = 1080
const H = 1920

const C = {
  bg1: '#F7F3EC',
  bg2: '#EEE6D8',
  ink: '#2A2520',
  inkLight: '#5A5048',
  inkDim: '#8A8078',
  gold: '#9A7B3E',
  goldBright: '#B8945A',
  goldDim: 'rgba(154,123,62,0.3)',
  line: 'rgba(154,123,62,0.12)',
}

interface PersonalityShareData {
  name: string
  code_display: string
  slogan: string
  trigrams: string[]
  rarity?: string
  portrait?: string
  psychology?: string
  career?: string
  growth?: string
  affinity_hexagrams?: string[]
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 99,
) {
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

export function renderPersonalityShareCard(data: PersonalityShareData): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    if (!ctx) return reject(new Error('Canvas 2D context unavailable'))

    ctx.textBaseline = 'top'

    // ===== 背景：暖米白渐变（宣纸质感） =====
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H)
    bgGrad.addColorStop(0, '#F7F3EC')
    bgGrad.addColorStop(0.5, '#F2EDE3')
    bgGrad.addColorStop(1, '#EFE8DB')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)

    // 纹理：细微噪点感（用小矩形模拟）
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

    // 顶部+底部暗金细线
    const topGrad = ctx.createLinearGradient(0, 0, W, 0)
    topGrad.addColorStop(0, 'rgba(154,123,62,0)')
    topGrad.addColorStop(0.5, 'rgba(154,123,62,0.2)')
    topGrad.addColorStop(1, 'rgba(154,123,62,0)')
    ctx.fillStyle = topGrad
    ctx.fillRect(0, 0, W, 3)
    ctx.fillRect(0, H - 3, W, 3)

    // ===== 顶部品牌 =====
    let y = 60

    ctx.fillStyle = C.gold
    ctx.font = '600 30px "Cormorant Garamond", "Georgia", serif'
    ctx.textAlign = 'center'
    ctx.fillText('L A T E S T N A M E', W / 2, y)
    y += 42

    ctx.fillStyle = C.inkDim
    ctx.font = '400 18px "Songti SC", "STSong", serif'
    ctx.fillText('此  刻  之  名', W / 2, y)
    y += 35

    // 分隔线
    ctx.strokeStyle = C.goldDim
    ctx.lineWidth = 0.5
    ctx.beginPath()
    ctx.moveTo(W * 0.35, y)
    ctx.lineTo(W * 0.65, y)
    ctx.stroke()
    y += 30

    // ===== 人物形象图（圆形裁切） =====
    const portraitSize = 340
    const portraitX = (W - portraitSize) / 2
    if (data.portrait) {
      try {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        await new Promise<void>((res, rej) => {
          img.onload = () => res()
          img.onerror = () => rej(new Error('img load fail'))
          img.src = data.portrait!
          setTimeout(() => rej(new Error('timeout')), 5000)
        })

        ctx.save()
        // 圆形剪裁
        ctx.beginPath()
        ctx.arc(W / 2, y + portraitSize / 2, portraitSize / 2, 0, Math.PI * 2)
        ctx.clip()
        // 计算覆盖填充
        const imgRatio = img.width / img.height
        let dw = portraitSize
        let dh = portraitSize
        if (imgRatio > 1) { dw = portraitSize * imgRatio } else { dh = portraitSize / imgRatio }
        ctx.drawImage(img, (W - dw) / 2, y + (portraitSize - dh) / 2, dw, dh)
        ctx.restore()

        // 圆形边框
        ctx.strokeStyle = C.goldDim
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(W / 2, y + portraitSize / 2, portraitSize / 2, 0, Math.PI * 2)
        ctx.stroke()
      } catch {
        // 失败时画占位圆
        ctx.strokeStyle = C.goldDim
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(W / 2, y + portraitSize / 2, portraitSize / 2, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fillStyle = C.inkDim
        ctx.font = '400 60px "Songti SC", serif'
        ctx.textAlign = 'center'
        ctx.fillText(data.name.charAt(0), W / 2, y + portraitSize / 2 - 30)
      }
    }
    y += portraitSize + 30

    // ===== 标签：底色之名 =====
    ctx.fillStyle = C.gold
    ctx.font = '500 20px "Songti SC", "STSong", serif'
    ctx.textAlign = 'center'
    ctx.fillText('·  底  色  之  名  ·', W / 2, y)
    y += 38

    // 四卦 trigrams
    if (data.trigrams && data.trigrams.length > 0) {
      const chipText = data.trigrams.join('  ·  ')
      ctx.fillStyle = C.inkLight
      ctx.font = '400 24px "Songti SC", "STSong", serif'
      ctx.fillText(chipText, W / 2, y)
      y += 45
    }

    // ===== 卦格名（超大字） =====
    ctx.fillStyle = C.ink
    ctx.font = '800 82px "Songti SC", "STSong", serif'
    ctx.textAlign = 'center'
    ctx.fillText(data.name, W / 2, y)
    y += 100

    // code_display
    ctx.fillStyle = C.inkDim
    ctx.font = '400 28px "Songti SC", "STSong", serif'
    const codeFormatted = (data.code_display || '').split('·').join('  ·  ')
    ctx.fillText(codeFormatted, W / 2, y)
    y += 48

    // slogan
    ctx.fillStyle = C.inkLight
    ctx.font = 'italic 500 30px "Songti SC", "STSong", serif'
    ctx.fillText(`「${data.slogan}」`, W / 2, y)
    y += 60

    // 分隔线
    ctx.strokeStyle = C.line
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(W * 0.15, y)
    ctx.lineTo(W * 0.85, y)
    ctx.stroke()
    y += 30

    // ===== 双栏内容区（左：内在本色  右：事业天赋） =====
    const colWidth = W * 0.38
    const leftColX = W * 0.1
    const rightColX = W * 0.52
    const colTextSize = 22
    const colLineHeight = 34

    // 左栏：内在本色
    ctx.fillStyle = C.gold
    ctx.font = '500 18px "Songti SC", serif'
    ctx.textAlign = 'left'
    ctx.fillText('内 在 本 色', leftColX, y)
    y += 32

    ctx.fillStyle = C.inkLight
    ctx.font = `400 ${colTextSize}px "Songti SC", "STSong", serif`
    if (data.psychology) {
      const text = data.psychology.substring(0, 200)
      const h = wrapText(ctx, text, leftColX, y, colWidth, colLineHeight, 7)
      yLeftEnd = y + h
    }

    // 右栏：事业天赋
    const twoColY = y
    ctx.fillStyle = C.gold
    ctx.font = '500 18px "Songti SC", serif'
    ctx.textAlign = 'left'
    ctx.fillText('事 业 天 赋', rightColX, twoColY - 32)

    ctx.fillStyle = C.inkLight
    ctx.font = `400 ${colTextSize}px "Songti SC", "STSong", serif`
    if (data.career) {
      const text = data.career.substring(0, 200)
      const h = wrapText(ctx, text, rightColX, twoColY, colWidth, colLineHeight, 7)
      yRightEnd = twoColY + h
    }

    y = Math.max(yLeftEnd, yRightEnd || 0) + 35

    // 分隔线
    ctx.strokeStyle = C.line
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(W * 0.15, y)
    ctx.lineTo(W * 0.85, y)
    ctx.stroke()
    y += 25

    // ===== 成长之路 =====
    ctx.fillStyle = C.gold
    ctx.font = '500 18px "Songti SC", serif'
    ctx.textAlign = 'left'
    ctx.fillText('成 长 之 路', leftColX, y)
    y += 32

    ctx.fillStyle = C.inkLight
    ctx.font = '400 22px "Songti SC", "STSong", serif'
    if (data.growth) {
      const text = data.growth.substring(0, 250)
      const h = wrapText(ctx, text, leftColX, y, W * 0.8, colLineHeight, 5)
      y += h + 30
    }

    // 稀有度 + 亲和卦象
    const bottomInfoY = y
    if (data.rarity) {
      ctx.fillStyle = C.gold
      ctx.font = '500 20px "Songti SC", serif'
      ctx.textAlign = 'left'
      ctx.fillText(`◆ ${data.rarity}`, leftColX, bottomInfoY)
    }
    if (data.affinity_hexagrams && data.affinity_hexagrams.length > 0) {
      ctx.fillStyle = C.inkDim
      ctx.font = '400 18px "Songti SC", serif'
      ctx.textAlign = 'right'
      const hexText = '亲和卦 · ' + data.affinity_hexagrams.join(' / ')
      ctx.fillText(hexText, W * 0.9, bottomInfoY)
    }
    y = bottomInfoY + 50

    // ===== 行卦之约（箴言） =====
    // 装饰分隔
    ctx.strokeStyle = C.line
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(W * 0.2, y)
    ctx.lineTo(W * 0.8, y)
    ctx.stroke()
    y += 28

    ctx.fillStyle = C.gold
    ctx.font = '500 16px "Songti SC", serif'
    ctx.textAlign = 'center'
    ctx.fillText('行 卦 之 约', W / 2, y)
    y += 36

    // 三条小贴士
    const tips = [
      '先动手，再计较。成事者，皆从此出发。',
      '锋芒之器，慎用于亲近之人。',
      '待人如待己，宽严并济，方得长久。',
    ]
    tips.forEach((tip, idx) => {
      // 编号 ① ② ③
      ctx.fillStyle = C.gold
      ctx.font = '700 22px "Cormorant Garamond", serif'
      ctx.textAlign = 'left'
      const numerals = ['①', '②', '③']
      ctx.fillText(numerals[idx], W * 0.18, y)

      ctx.fillStyle = C.inkLight
      ctx.font = '400 20px "Songti SC", "STSong", serif'
      ctx.textAlign = 'left'
      ctx.fillText(tip, W * 0.26, y + 2)
      y += 38
    })

    // ===== 底部品牌（跟随内容流，不固定位置） =====
    y += 50

    // 底部分隔线
    ctx.strokeStyle = C.goldDim
    ctx.lineWidth = 0.5
    ctx.beginPath()
    ctx.moveTo(W * 0.3, y)
    ctx.lineTo(W * 0.7, y)
    ctx.stroke()
    y += 25

    // 品牌名 + 域名
    ctx.fillStyle = C.ink
    ctx.font = '700 24px "Cormorant Garamond", "Georgia", serif'
    ctx.textAlign = 'center'
    ctx.fillText('Latestname', W / 2, y)
    y += 32

    ctx.fillStyle = C.inkDim
    ctx.font = '400 16px "Songti SC", serif'
    ctx.fillText('测  卦  格  ·  知  天  性', W / 2, y)

    // 导出
    try {
      const dataUrl = canvas.toDataURL('image/png', 0.95)
      resolve(dataUrl)
    } catch (e) {
      reject(e)
    }
  })
}

let yLeftEnd = 0
let yRightEnd = 0

export function usePersonalityShareCard() {
  const ref = useRef(true)
  useEffect(() => {
    ref.current = true
    return () => { ref.current = false }
  }, [])
  return async (data: PersonalityShareData): Promise<string> => {
    return renderPersonalityShareCard(data)
  }
}

export function downloadShareImage(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
