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
 * TarotCard v2 - 黑金珠宝质感塔罗牌
 * 
 * v0.2 重大升级：
 * - emoji 全部替换为自定义金色 SVG 线描图标
 * - 22张大阿尔卡那各有独特符号
 * - 小阿尔卡那用花色几何符号
 * - 正逆位用边框角标区分（非整体翻转，更优雅）
 * 
 * 设计语言：与 HexagramSVG 一致的金色线描，细线条，几何感
 */

// ============================================================
// 22张大阿尔卡那 SVG 图标（金色线描，64x64 viewBox）
// ============================================================

const MAJOR_ICONS: Record<number, JSX.Element> = {
  // 0 愚者 - 悬崖边的脚步
  0: <g stroke="currentColor" strokeWidth="1.5" fill="none">
    <circle cx="32" cy="20" r="6" />
    <path d="M26 28 L26 40 L22 52 M38 28 L38 40 L42 52 M26 34 L38 34" strokeLinecap="round" />
    <path d="M20 48 L32 56 L44 48" strokeLinecap="round" />
    <circle cx="44" cy="16" r="3" />
  </g>,
  // 1 魔术师 - 无限符号
  1: <g stroke="currentColor" strokeWidth="1.5" fill="none">
    <path d="M16 32 C16 24, 24 24, 28 32 C32 40, 40 40, 40 32 C40 24, 32 24, 28 32 C24 40, 16 40, 16 32 Z" />
    <path d="M32 10 L32 54 M22 16 L42 16" strokeLinecap="round" />
  </g>,
  // 2 女祭司 - 新月与柱
  2: <g stroke="currentColor" strokeWidth="1.5" fill="none">
    <path d="M26 10 L26 54 M38 10 L38 54" />
    <path d="M32 18 A10 10 0 1 0 32 38 A8 8 0 1 1 32 18 Z" />
    <circle cx="32" cy="14" r="2" fill="currentColor" />
  </g>,
  // 3 皇后 - 王冠与麦穗
  3: <g stroke="currentColor" strokeWidth="1.5" fill="none">
    <path d="M20 14 L26 8 L32 14 L38 8 L44 14 L44 20 L20 20 Z" />
    <circle cx="32" cy="12" r="2" fill="currentColor" />
    <path d="M32 24 L32 48 M24 34 L40 34 M28 44 L36 44" strokeLinecap="round" />
  </g>,
  // 4 皇帝 - 方座王座
  4: <g stroke="currentColor" strokeWidth="1.5" fill="none">
    <rect x="20" y="12" width="24" height="8" rx="1" />
    <path d="M24 20 L24 50 M40 20 L40 50 M20 50 L44 50" />
    <path d="M28 28 L36 28 M28 36 L36 36" strokeLinecap="round" />
  </g>,
  // 5 教皇 - 三重十字
  5: <g stroke="currentColor" strokeWidth="1.5" fill="none">
    <path d="M32 10 L32 54" strokeLinecap="round" />
    <path d="M22 20 L42 20 M24 28 L40 28" strokeLinecap="round" />
    <circle cx="32" cy="44" r="6" />
  </g>,
  // 6 恋人 - 双柱与天体
  6: <g stroke="currentColor" strokeWidth="1.5" fill="none">
    <circle cx="32" cy="14" r="5" />
    <path d="M20 28 L20 52 M44 28 L44 52" />
    <path d="M24 40 L40 40" strokeLinecap="round" />
    <circle cx="20" cy="24" r="2" fill="currentColor" />
    <circle cx="44" cy="24" r="2" fill="currentColor" />
  </g>,
  // 7 战车 - 方向与轮
  7: <g stroke="currentColor" strokeWidth="1.5" fill="none">
    <path d="M16 40 L16 48 L48 48 L48 40" />
    <path d="M24 24 L40 24 L44 40 L20 40 Z" />
    <circle cx="24" cy="52" r="5" /><circle cx="40" cy="52" r="5" />
    <path d="M32 12 L32 20 M28 16 L36 16" strokeLinecap="round" />
  </g>,
  // 8 力量 - 无限结
  8: <g stroke="currentColor" strokeWidth="1.5" fill="none">
    <path d="M20 24 L20 40 L32 48 L44 40 L44 24 L32 16 Z" />
    <path d="M32 28 L32 38 M27 33 L37 33" strokeLinecap="round" />
  </g>,
  // 9 隐士 - 提灯
  9: <g stroke="currentColor" strokeWidth="1.5" fill="none">
    <circle cx="32" cy="20" r="7" />
    <path d="M29 17 L35 23 M35 17 L29 23" />
    <path d="M32 27 L32 40 M26 40 L38 40 M28 40 L28 54 M36 40 L36 54" strokeLinecap="round" />
  </g>,
  // 10 命运之轮 - 轮辐
  10: <g stroke="currentColor" strokeWidth="1.5" fill="none">
    <circle cx="32" cy="32" r="16" />
    <circle cx="32" cy="32" r="4" />
    <path d="M32 16 L32 48 M16 32 L48 32 M20 20 L44 44 M44 20 L20 44" strokeLinecap="round" />
  </g>,
  // 11 正义 - 天平
  11: <g stroke="currentColor" strokeWidth="1.5" fill="none">
    <path d="M32 10 L32 50" strokeLinecap="round" />
    <path d="M18 22 L46 22" strokeLinecap="round" />
    <path d="M18 22 L14 34 L22 34 Z M46 22 L42 34 L50 34 Z" />
    <path d="M24 50 L40 50" strokeLinecap="round" />
  </g>,
  // 12 倒吊人 - 倒三角
  12: <g stroke="currentColor" strokeWidth="1.5" fill="none">
    <path d="M32 12 L20 40 L44 40 Z" />
    <circle cx="32" cy="28" r="3" />
    <path d="M28 48 L36 48" strokeLinecap="round" />
  </g>,
  // 13 死神 - 骷髅简化
  13: <g stroke="currentColor" strokeWidth="1.5" fill="none">
    <path d="M24 20 L24 36 C24 44, 40 44, 40 36 L40 20 Z" />
    <circle cx="28" cy="28" r="2" fill="currentColor" />
    <circle cx="36" cy="28" r="2" fill="currentColor" />
    <path d="M30 36 L34 36 M28 44 L28 50 M36 44 L36 50" strokeLinecap="round" />
  </g>,
  // 14 节制 - 双杯流动
  14: <g stroke="currentColor" strokeWidth="1.5" fill="none">
    <path d="M20 24 L20 34 L26 38 L26 30 Z" />
    <path d="M44 24 L44 34 L38 38 L38 30 Z" />
    <path d="M26 30 Q32 22, 38 30" strokeDasharray="2 2" />
    <path d="M32 14 L32 22 M28 46 L36 46 M26 52 L38 52" strokeLinecap="round" />
  </g>,
  // 15 恶魔 - 倒五星
  15: <g stroke="currentColor" strokeWidth="1.5" fill="none">
    <path d="M32 12 L40 28 L56 28 L44 38 L48 54 L32 44 L16 54 L20 38 L8 28 L24 28 Z" transform="scale(0.7) translate(14 10)" />
    <path d="M32 40 L32 52 M26 46 L38 46" strokeLinecap="round" />
  </g>,
  // 16 高塔 - 闪电击塔
  16: <g stroke="currentColor" strokeWidth="1.5" fill="none">
    <path d="M22 14 L22 54 L42 54 L42 14 Z" />
    <path d="M32 8 L28 18 L34 18 L30 28" strokeLinecap="round" />
    <path d="M26 30 L26 40 M38 30 L38 40" strokeLinecap="round" />
  </g>,
  // 17 星星 - 八角星
  17: <g stroke="currentColor" strokeWidth="1.5" fill="none">
    <path d="M32 8 L35 25 L52 28 L35 31 L32 48 L29 31 L12 28 L29 25 Z" transform="scale(0.75) translate(11 8)" />
    <path d="M24 48 Q28 42, 32 48 Q36 42, 40 48" strokeLinecap="round" />
  </g>,
  // 18 月亮 - 月牙与滴
  18: <g stroke="currentColor" strokeWidth="1.5" fill="none">
    <path d="M38 14 A12 12 0 1 0 38 38 A9 9 0 1 1 38 14 Z" />
    <path d="M24 44 L24 50 M32 46 L32 52 M40 44 L40 50" strokeLinecap="round" />
  </g>,
  // 19 太阳 - 放射线
  19: <g stroke="currentColor" strokeWidth="1.5" fill="none">
    <circle cx="32" cy="28" r="10" />
    <circle cx="28" cy="26" r="1.5" fill="currentColor" /><circle cx="36" cy="26" r="1.5" fill="currentColor" />
    <path d="M28 30 Q32 33, 36 30" strokeLinecap="round" />
    {[0,45,90,135,180,225,270,315].map(a => {
      const rad = a * Math.PI / 180
      return <path key={a} d={`M${32+Math.cos(rad)*14},${28+Math.sin(rad)*14} L${32+Math.cos(rad)*20},${28+Math.sin(rad)*20}`} strokeLinecap="round" />
    })}
  </g>,
  // 20 审判 - 号角
  20: <g stroke="currentColor" strokeWidth="1.5" fill="none">
    <path d="M16 24 L40 16 L40 32 L16 40 Z" />
    <path d="M40 16 Q48 18, 48 24 Q48 30, 40 32" />
    <path d="M14 22 L14 42 M30 42 L30 52 M34 42 L34 52" strokeLinecap="round" />
  </g>,
  // 21 世界 - 环形花冠
  21: <g stroke="currentColor" strokeWidth="1.5" fill="none">
    <ellipse cx="32" cy="32" rx="18" ry="20" />
    <ellipse cx="32" cy="32" rx="14" ry="16" />
    <path d="M32 16 L32 48" strokeDasharray="3 3" />
    <circle cx="32" cy="32" r="3" fill="currentColor" />
  </g>,
}

// 小阿尔卡那花色符号
const SUIT_ICONS: Record<string, JSX.Element> = {
  // 圣杯（水）
  cups: <g stroke="currentColor" strokeWidth="1.5" fill="none">
    <path d="M20 16 L20 28 Q20 38, 32 38 Q44 38, 44 28 L44 16 Z" />
    <path d="M32 38 L32 50 M24 50 L40 50" strokeLinecap="round" />
  </g>,
  // 权杖（火）
  wands: <g stroke="currentColor" strokeWidth="1.5" fill="none">
    <path d="M32 8 L32 56" strokeLinecap="round" />
    <path d="M32 16 L24 10 M32 16 L40 10 M32 24 L22 18 M32 24 L42 18 M32 32 L20 26 M32 32 L44 26" strokeLinecap="round" />
  </g>,
  // 宝剑（风）
  swords: <g stroke="currentColor" strokeWidth="1.5" fill="none">
    <path d="M32 8 L28 40 L36 40 Z" />
    <path d="M24 40 L40 40 M30 44 L34 44 M31 48 L33 48" strokeLinecap="round" />
    <path d="M32 40 L32 52" strokeLinecap="round" />
  </g>,
  // 钱币（土）
  pentacles: <g stroke="currentColor" strokeWidth="1.5" fill="none">
    <circle cx="32" cy="30" r="14" />
    <path d="M32 20 L35 27 L42 27 L36 32 L38 39 L32 35 L26 39 L28 32 L22 27 L29 27 Z" />
  </g>,
}

// 花色渐变色（保持微妙的暗色调，但图标统一金色）
const SUIT_GRADIENTS: Record<string, string> = {
  cups: 'linear-gradient(135deg, #162030 0%, #0d2030 50%, #0a0a0f 100%)',
  wands: 'linear-gradient(135deg, #2a1a12 0%, #20140d 50%, #0a0a0f 100%)',
  swords: 'linear-gradient(135deg, #1a2030 0%, #151a25 50%, #0a0a0f 100%)',
  pentacles: 'linear-gradient(135deg, #2a2818 0%, #201d0d 50%, #0a0a0f 100%)',
}

const MAJOR_GRADIENTS: Record<number, string> = {
  0: 'linear-gradient(135deg, #1a1a2e, #0a0a0f)', 1: 'linear-gradient(135deg, #2a2018, #0a0a0f)',
  2: 'linear-gradient(135deg, #182030, #0a0a0f)', 3: 'linear-gradient(135deg, #2a2010, #0a0a0f)',
  4: 'linear-gradient(135deg, #202020, #0a0a0f)', 5: 'linear-gradient(135deg, #282018, #0a0a0f)',
  6: 'linear-gradient(135deg, #2a1828, #0a0a0f)', 7: 'linear-gradient(135deg, #182028, #0a0a0f)',
  8: 'linear-gradient(135deg, #302818, #0a0a0f)', 9: 'linear-gradient(135deg, #202830, #0a0a0f)',
  10: 'linear-gradient(135deg, #282820, #0a0a0f)', 11: 'linear-gradient(135deg, #182830, #0a0a0f)',
  12: 'linear-gradient(135deg, #202028, #0a0a0f)', 13: 'linear-gradient(135deg, #1a1a1a, #0a0a0f)',
  14: 'linear-gradient(135deg, #182820, #0a0a0f)', 15: 'linear-gradient(135deg, #281818, #0a0a0f)',
  16: 'linear-gradient(135deg, #302010, #0a0a0f)', 17: 'linear-gradient(135deg, #182838, #0a0a0f)',
  18: 'linear-gradient(135deg, #1a2030, #0a0a0f)', 19: 'linear-gradient(135deg, #302818, #0a0a0f)',
  20: 'linear-gradient(135deg, #282038, #0a0a0f)', 21: 'linear-gradient(135deg, #202828, #0a0a0f)',
}

export default function TarotCard({ card, reversed, size = 'medium' }: {
  card: any
  reversed: boolean
  size?: 'small' | 'medium' | 'large'
}) {
  const dims = {
    small: { w: 110, h: 165, iconBox: 48, nameSize: '0.85rem', numSize: '0.7rem' },
    medium: { w: 160, h: 240, iconBox: 72, nameSize: '1.05rem', numSize: '0.8rem' },
    large: { w: 220, h: 330, iconBox: 96, nameSize: '1.3rem', numSize: '0.95rem' },
  }[size]

  const suit = card.suit
  const arcana = card.arcana

  // 渐变色
  const bgGradient = arcana === 'major'
    ? (MAJOR_GRADIENTS[card.id] || 'linear-gradient(135deg, #1a1a25, #0a0a0f)')
    : (SUIT_GRADIENTS[suit] || SUIT_GRADIENTS.cups)

  // 图标
  const icon = arcana === 'major'
    ? (MAJOR_ICONS[card.id] || MAJOR_ICONS[0])
    : (SUIT_ICONS[suit] || SUIT_ICONS.cups)

  // 花色符号（小角标）
  const suitSymbol = suit === 'cups' ? '♋' : suit === 'wands' ? '♈' : suit === 'swords' ? '♎' : '♉'

  return (
    <div style={{ width: dims.w, position: 'relative' }}>
      {/* 卡片主体：不整体翻转，用角标标示逆位 */}
      <div style={{
        width: dims.w,
        height: dims.h,
        background: bgGradient,
        border: '1px solid var(--onyx-gold-dim)',
        borderRadius: '6px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.6), inset 0 0 40px rgba(184,149,106,0.06)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '0.8rem 0.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* 顶部装饰线 */}
        <div style={{
          position: 'absolute', top: '0.3rem', left: '50%', transform: 'translateX(-50%)',
          width: '70%', height: '1px',
          background: 'linear-gradient(90deg, transparent, var(--onyx-gold), transparent)',
          opacity: 0.6,
        }} />

        {/* 顶部编号/花色 */}
        <div style={{
          fontFamily: 'var(--font-serif-en)',
          fontSize: dims.numSize,
          color: 'var(--onyx-gold-dim)',
          letterSpacing: '0.2em',
          fontWeight: 400,
        }}>
          {arcana === 'major' ? `0${card.id}`.slice(-2) : suitSymbol}
        </div>

        {/* 中央 SVG 图标 */}
        <svg width={dims.iconBox} height={dims.iconBox} viewBox="0 0 64 64"
          style={{
            color: 'var(--onyx-gold)',
            filter: 'drop-shadow(0 0 8px rgba(184,149,106,0.3))',
            transform: reversed ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.6s ease',
          }}>
          {icon}
        </svg>

        {/* 牌名 */}
        <div style={{
          textAlign: 'center',
          fontFamily: 'var(--font-serif-cn)',
          fontSize: dims.nameSize,
          color: 'var(--onyx-white)',
          fontWeight: 500,
          letterSpacing: '0.15em',
        }}>
          {card.name_cn}
        </div>

        {/* 英文名 */}
        <div style={{
          fontFamily: 'var(--font-serif-en)',
          fontStyle: 'italic',
          fontSize: dims.numSize,
          color: 'var(--onyx-gold-dim)',
          letterSpacing: '0.1em',
        }}>
          {card.name}
        </div>

        {/* 底部装饰线 */}
        <div style={{
          position: 'absolute', bottom: '0.3rem', left: '50%', transform: 'translateX(-50%)',
          width: '70%', height: '1px',
          background: 'linear-gradient(90deg, transparent, var(--onyx-gold), transparent)',
          opacity: 0.6,
        }} />

        {/* 逆位角标：左上角小标记，不破坏整体美感 */}
        {reversed && (
          <div style={{
            position: 'absolute', top: 0, left: 0,
            width: '24px', height: '24px',
            background: 'linear-gradient(135deg, var(--onyx-crimson) 0%, transparent 70%)',
            borderRadius: '6px 0 6px 0',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start',
            padding: '3px 0 0 4px',
            fontSize: '0.6rem',
            color: 'var(--onyx-white)',
          }}>
            ↺
          </div>
        )}
      </div>

      {/* 逆位文字标签 */}
      {reversed && (
        <div style={{
          textAlign: 'center',
          marginTop: '0.4rem',
          fontSize: '0.7rem',
          color: 'var(--onyx-crimson)',
          letterSpacing: '0.2em',
          opacity: 0.8,
        }}>
          逆 位
        </div>
      )}
    </div>
  )
}
