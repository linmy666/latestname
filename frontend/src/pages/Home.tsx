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
 * Home - Latestname · 此刻之名
 *
 * v8: 保留呼吸球+呼吸卡片，重新设计布局提升审美
 */
import { Link } from 'react-router-dom'
import { useEffect, useState, Fragment } from 'react'
import HexagramSVG from '../components/HexagramSVG'
import { usePrefs } from '../App'

interface DailyData {
  date: string
  seed: number
  hexagram: {
    id: number
    name: string
    name_en: string
    binary: string
    fortune: string
    judgment: string
    keywords: string[]
  }
  yi_ji: { yi: string; ji: string; tone: string }
  short_message: string
}

export default function Home() {
  const [daily, setDaily] = useState<DailyData | null>(null)
  const [personalityTypes, setPersonalityTypes] = useState<Array<{ code: string; name: string; code_display?: string; rarity?: string }>>([])
  const { t, lang, isMobile } = usePrefs()
  useEffect(() => {
    fetch(`/api/daily?lang=${lang}`)
      .then(r => r.json())
      .then(d => setDaily(d))
      .catch(() => setDaily(null))
  }, [])

  // 加载 16 卦格（用于 Hero 轮播展示）
  useEffect(() => {
    fetch('/api/personality/types')
      .then(r => r.json())
      .then(d => {
        const list = Object.entries(d).map(([code, info]: [string, any]) => ({
          code,
          name: info.name || code,
          slogan: info.slogan || '',
          rarity: info.rarity || '',
        }))
        setPersonalityTypes(list)
      })
      .catch(() => setPersonalityTypes([]))
  }, [])

  return (
    <div className="container fade-in" style={{ paddingTop: '2rem', paddingBottom: '4rem', position: 'relative', zIndex: 1 }}>

      {/* ===== HERO ===== */}
      <div style={{ textAlign: 'center', marginBottom: isMobile ? '2rem' : '3.5rem', paddingTop: isMobile ? '0.5rem' : '1rem' }}>
        {/* 呼吸球 */}
        <div className="hero-orb" style={{ width: isMobile ? 140 : 200, height: isMobile ? 140 : 200 }}>
          <HexagramSVG binary="111111" size={isMobile ? 60 : 80} animated />
        </div>

        <h1 className="title-display" style={{
          marginBottom: '0.3rem',
          fontSize: isMobile ? 'clamp(1.6rem, 6vw, 2rem)' : 'clamp(2rem, 5vw, 2.8rem)',
          letterSpacing: '0.02em',
        }}>
          Latestname
        </h1>
        <div style={{
          fontFamily: 'var(--font-serif-cn)',
          fontSize: isMobile ? 'clamp(0.95rem, 3vw, 1.1rem)' : 'clamp(1.1rem, 3vw, 1.4rem)',
          color: 'var(--text-secondary)',
          letterSpacing: '0.4em',
          marginBottom: '1.5rem',
          fontWeight: 300,
        }}>
          {t.home.subtitle}
        </div>

        {/* 三行结构 — 第 1 行 "你的底色之名"+ 第 2 行卦格轮播 + 第 3 行产品副标语 */}
        <PersonalityRotator types={personalityTypes} />

        <p className="body-text" style={{
          maxWidth: '420px',
          margin: '1rem auto 1.5rem',
          fontSize: isMobile ? '0.86rem' : '0.92rem',
          lineHeight: 1.85,
          color: 'var(--text-dim)',
          whiteSpace: 'pre-line',
        }}>
          {t.home.tagline}
        </p>

        <Link
          to="/divine"
          state={{ action: 'quiz' }}
          className="glass-btn-primary"
          style={{ textDecoration: 'none', display: 'inline-flex' }}
        >
          {t.home.enter}
        </Link>
        <div style={{
          fontSize: '0.78rem',
          color: 'var(--text-tertiary)',
          marginTop: '0.8rem',
          letterSpacing: '0.08em',
        }}>
          {t.home.enterSub}
        </div>
      </div>

      {/* ===== 今日之卦 — 玻璃卡 ===== */}
      {daily && (
        <div>
          <div className="glass-card" style={{
            padding: '1.8rem',
            marginBottom: '3rem',
            maxWidth: '640px',
            margin: '0 auto 3rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div className="label">{t.home.dailyTitle}</div>
                <div className="subtitle" style={{ marginTop: '0.2rem', fontSize: '0.75rem' }}>
                  {t.home.dailySub(daily.date)}
                </div>
              </div>
              <Link
                to="/divine"
                className="glass-btn-ghost"
                style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem', textDecoration: 'none', minHeight: 'auto' }}
              >
                {t.home.dailyAskBtn}
              </Link>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '1.5rem',
              alignItems: 'center',
            }}>
              <HexagramSVG binary={daily.hexagram.binary} size={120} />

              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6em', flexWrap: 'wrap' }}>
                  <h3 style={{
                    fontFamily: 'var(--font-serif-cn)',
                    fontSize: '1.6rem',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                  }}>{daily.hexagram.name}</h3>
                  <span className="subtitle">{daily.hexagram.name_en}</span>
                  <span className="glass-chip" style={{ color: 'var(--accent)' }}>
                    {daily.hexagram.fortune}
                  </span>
                </div>

                <p style={{
                  fontFamily: 'var(--font-serif-cn)',
                  color: 'var(--accent)',
                  marginTop: '0.4rem',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                }}>{daily.short_message}</p>

                <div style={{ marginTop: '0.6rem' }}>
                  {daily.hexagram.keywords.map((k: string) => (
                    <span key={k} className="glass-chip" style={{ marginRight: '0.3rem' }}>#{k}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* 今日宜忌 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginTop: '1.2rem',
            }}>
              <div style={{
                padding: '0.8rem 1rem',
                background: 'rgba(201, 169, 97, 0.08)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
              }}>
                <div className="label" style={{ color: 'var(--accent)' }}>{t.home.dailyYi}</div>
                <div style={{
                  fontFamily: 'var(--font-serif-cn)',
                  fontSize: '1.1rem',
                  color: 'var(--text-primary)',
                  marginTop: '0.3rem',
                }}>{daily.yi_ji.yi}</div>
              </div>
              <div style={{
                padding: '0.8rem 1rem',
                background: 'rgba(155, 107, 92, 0.06)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
              }}>
                <div className="label" style={{ color: 'var(--fortune-bad)' }}>{t.home.dailyJi}</div>
                <div style={{
                  fontFamily: 'var(--font-serif-cn)',
                  fontSize: '1.1rem',
                  color: 'var(--text-primary)',
                  marginTop: '0.3rem',
                }}>{daily.yi_ji.ji}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== 玩法流程图 ===== */}
      <div>
        <div style={{ maxWidth: '640px', margin: '0 auto 3rem', textAlign: 'center' }}>
          <div className="label" style={{ marginBottom: '2rem' }}>{t.home.howtoTitle}</div>

          {/* 流程步骤 */}
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', position: 'relative' }}>
            {t.home.steps.map((s, i) => (
              <Fragment key={s.num}>
              <div className={`glass-card stagger-${i + 1}`} style={{
                padding: isMobile ? '1rem' : '1.3rem 1.5rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1.2rem',
                position: 'relative',
                zIndex: 2,
              }}>
                {/* 步骤号 */}
                <div style={{
                  flexShrink: 0,
                  width: isMobile ? 40 : 48,
                  height: isMobile ? 40 : 48,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(184,149,106,0.18), rgba(184,149,106,0.06))',
                  border: '1.5px solid var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: '0.1rem',
                  boxShadow: '0 2px 12px rgba(184,149,106,0.2)',
                }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 700, lineHeight: 1 }}>{s.icon}</span>
                  <span style={{ fontSize: '0.55rem', color: 'var(--text-tertiary)', letterSpacing: '0.1em', lineHeight: 1 }}>{s.num}</span>
                </div>
                {/* 内容 */}
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontFamily: 'var(--font-serif-cn)',
                    fontSize: '1.05rem',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    marginBottom: '0.3rem',
                  }}>{s.title}</h3>
                  <p className="body-text" style={{
                    fontSize: '0.85rem',
                    lineHeight: 1.7,
                    margin: 0,
                    color: 'var(--text-secondary)',
                  }}>{s.desc}</p>
                </div>
              </div>
              {/* 步骤间连接线 */}
              {i < t.home.steps.length - 1 && (
                <div style={{
                  width: '2px',
                  height: '24px',
                  marginLeft: isMobile ? '32px' : '39px',
                  background: 'linear-gradient(to bottom, rgba(184,149,106,0.4), rgba(184,149,106,0.15))',
                  flexShrink: 0,
                  zIndex: 1,
                }} />
              )}
              </Fragment>
            ))}
          </div>

          {/* CTA — 给老用户/不想测卦的快速通道 */}
          <Link
            to="/divine"
            state={{ action: 'skip' }}
            className="glass-btn-ghost"
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              marginTop: '2rem',
              fontSize: '0.9rem',
              letterSpacing: '0.05em',
            }}
          >
            {t.home.skipQuiz}
          </Link>
        </div>
      </div>

      {/* ===== 快捷场景 — 2×3 紧凑卡片 ===== */}
      <div>
        <div style={{ margin: '2.5rem auto', maxWidth: '520px' }}>
          <div className="label" style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
            {t.home.scenesTitle}
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: '0.8rem',
          }}>
            {t.home.scenes.map((s, i) => (
              <Link
                key={s.cn}
                to="/divine"
                state={{ prefill: s.q }}
                className={`glass-card stagger-${i + 1}`}
                style={{
                  textDecoration: 'none',
                  textAlign: 'center',
                  padding: '1.2rem 0.4rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.4rem',
                  minHeight: '90px',
                  justifyContent: 'center',
                }}
              >
                <div style={{ color: 'var(--text-secondary)', display: 'flex', justifyContent: 'center', fontSize: '1.4rem' }}>{s.icon}</div>
                <div style={{
                  fontFamily: 'var(--font-system)',
                  fontSize: '0.82rem',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                }}>{s.cn}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ===== 三个特性 — 居中窄列 ===== */}
      <div>
        <div style={{
          maxWidth: '640px',
          margin: '3rem auto',
        }}>
          {t.home.features.map((f, i) => (
            <div key={f.en} className={`glass-card stagger-${i + 1}`} style={{
              padding: '1.3rem 1.5rem',
              marginBottom: '0.8rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1.2rem',
            }}>
              <div style={{ flexShrink: 0, minWidth: '100px' }}>
                <div className="label" style={{ fontSize: '0.7rem' }}>{f.en}</div>
                <h3 style={{
                  fontFamily: 'var(--font-serif-cn)',
                  fontSize: '1.15rem',
                  color: 'var(--text-primary)',
                  marginTop: '0.3rem',
                  fontWeight: 600,
                }}>{f.cn}</h3>
              </div>
              <p className="body-text" style={{
                fontSize: '0.88rem',
                lineHeight: 1.7,
                margin: 0,
                flex: 1,
              }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// PersonalityRotator — Hero 区 16 卦格名循环切换
// 第一行：卦格名称（每 2.5 秒切下一个，fade+slide 入场）
// 第二行：卦格的 code_display（四字短语）— 营造"检阅底色"感
// ============================================================================
function PersonalityRotator({ types }: { types: Array<{ code: string; name: string; slogan?: string }> }) {
  const { isMobile } = usePrefs()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (types.length === 0) return
    const id = setInterval(() => {
      setIndex(i => (i + 1) % types.length)
    }, 3200)
    return () => clearInterval(id)
  }, [types.length])

  const current = types[index]

  if (!current) {
    // 数据还没回来时的占位
    return (
      <div style={{ minHeight: isMobile ? '88px' : '112px', margin: '0 auto 0.8rem', textAlign: 'center' }}>
        <div style={{
          fontSize: isMobile ? '1.8rem' : '2.4rem',
          fontFamily: 'var(--font-serif-cn)',
          color: 'var(--text-dim)',
          fontWeight: 400,
        }}>
          ─────
        </div>
      </div>
    )
  }

  return (
    <div style={{
      margin: '0.5rem auto 0.8rem',
      textAlign: 'center',
      minHeight: isMobile ? '110px' : '134px',
      position: 'relative',
    }}>
      {/* 卦格名（轮播主体） */}
      <div style={{
        position: 'relative',
        display: 'inline-block',
        minWidth: isMobile ? '220px' : '300px',
        minHeight: isMobile ? '44px' : '60px',
      }}>
        <div
          key={current.code}
          className="rotator-fade"
          style={{
            fontSize: isMobile ? '2rem' : '2.6rem',
            fontFamily: 'var(--font-serif-cn)',
            color: 'var(--accent-gold)',
            fontWeight: 500,
            letterSpacing: '0.06em',
            textShadow: '0 0 12px rgba(184, 149, 106, 0.35), 0 0 4px rgba(212, 168, 106, 0.4)',
            lineHeight: 1.2,
          }}
        >
          {current.name}
        </div>
      </div>

      {/* 第三行 — slogan（产品功能描述） */}
      {current.slogan && (
        <div
          key={`sl-${current.code}`}
          className="rotator-fade-delayed"
          style={{
            fontSize: isMobile ? '0.78rem' : '0.85rem',
            color: 'var(--text-dim)',
            fontFamily: 'var(--font-serif-cn)',
            letterSpacing: '0.1em',
            marginTop: '0.4rem',
            opacity: 0.85,
            maxWidth: '440px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {current.slogan}
        </div>
      )}
    </div>
  )
}

// _LN_WM: 4c3a8f2e7b1d9065a2c8e4f1b7d3096e8a5c2f4d (linmy666/latestname AGPL-3.0)
