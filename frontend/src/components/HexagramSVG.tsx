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
 * HexagramSVG - 卦象SVG组件
 * 入参: binary 字符串（6位，0=阴爻 1=阳爻，从下到上）
 * 例: "111111" = 乾卦 = 6条实线
 *     "000000" = 坤卦 = 6条中间断开的线
 *     "100010" = 屯卦（坎上震下，从下到上读）
 */
export default function HexagramSVG({ binary, size = 200, changingLines, animated = false }: {
  binary: string
  size?: number
  changingLines?: number[]
  animated?: boolean
}) {
  if (!binary || binary.length !== 6) return null

  const lineWidth = size * 0.7
  const lineHeight = size * 0.04
  const gap = size * 0.06
  const totalHeight = 6 * lineHeight + 5 * gap
  const startX = (size - lineWidth) / 2
  const startY = (size - totalHeight) / 2

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={animated ? 'hex-svg-animated' : undefined}
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="hex-line-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.8" />
          <stop offset="50%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      {binary.split('').map((bit, idx) => {
        const y = startY + (5 - idx) * (lineHeight + gap)
        const isYang = bit === '1'
        const isChanging = changingLines?.includes(idx)
        // Use CSS-aware colors: falls back to CSS var, with hardcoded for SVG compat
        const lineStyle: React.CSSProperties = {
          fill: 'currentColor',
          transition: 'all 0.4s ease',
        }

        if (isYang) {
          return (
            <g key={idx} className={animated ? `hex-line-group hex-line-${idx}` : undefined}>
              <rect
                x={startX} y={y}
                width={lineWidth} height={lineHeight}
                style={lineStyle}
                rx={lineHeight / 2}
              />
              {isChanging && (
                <circle cx={startX - 8} cy={y + lineHeight/2} r={3} fill="var(--accent)" className={animated ? 'hex-dot-pulse' : undefined} />
              )}
            </g>
          )
        } else {
          const segWidth = (lineWidth - size * 0.08) / 2
          return (
            <g key={idx} className={animated ? `hex-line-group hex-line-${idx}` : undefined}>
              <rect
                x={startX} y={y}
                width={segWidth} height={lineHeight}
                style={lineStyle}
                rx={lineHeight / 2}
              />
              <rect
                x={startX + segWidth + size * 0.08} y={y}
                width={segWidth} height={lineHeight}
                style={lineStyle}
                rx={lineHeight / 2}
              />
              {isChanging && (
                <circle cx={startX - 8} cy={y + lineHeight/2} r={3} fill="var(--accent)" className={animated ? 'hex-dot-pulse' : undefined} />
              )}
            </g>
          )
        }
      })}
    </svg>
  )
}
