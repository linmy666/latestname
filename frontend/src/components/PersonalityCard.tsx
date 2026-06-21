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

import { useState } from 'react'
import { usePrefs } from '../App'
import { D, setLang } from '../i18n-shim';

interface PersonalityData {
  code: string;
  code_display: string;
  name: string;
  slogan: string;
  trigrams: string[];
  affinity_hexagrams: number[];
  mbti_map?: string;
  rarity?: string;
  dim_scores: Record<string, any>;
  portrait: string;
  psychology: string;
  relationships: string;
  career: string;
  growth: string;
  voice_intro?: string;
  questions_for_you?: string[];
  dim_comments?: Record<string, string>;
  // 第一人称版本（卦格自述，优先使用）
  portrait_fp?: string;
  psychology_fp?: string;
  relationships_fp?: string;
  career_fp?: string;
  growth_fp?: string;
}

interface Props {
  personality: PersonalityData;
  onSelectQuestion?: (q: string) => void;
  compact?: boolean;  // 紧凑模式：只显示卦格头像+名字+slogan（用于问事页面顶部伴随）
}

export function PersonalityCard({ personality, onSelectQuestion, compact = false }: Props) {
  const { lang } = usePrefs()
  setLang(lang)
  const [showDetails, setShowDetails] = useState(false)

  if (!personality || !personality.code) return null;

  // 紧凑模式：只显示卦格作为「陪伴者」
  if (compact) {
    return (
      <div className="personality-companion">
        <img
          src={`http://127.0.0.1:8765/static/personalities/${personality.name}.png`}
          alt={personality.name}
          className="personality-companion-avatar"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="personality-companion-info">
          <div className="personality-companion-name">{personality.name}</div>
          <div className="personality-companion-slogan">「{personality.slogan}」</div>
        </div>
      </div>
    );
  }

  return (
    <div className="scroll-card personality-scroll">
      {/* 卦格角色形象图 */}
      <div className="scroll-portrait-wrap">
        <img
          src={`http://127.0.0.1:8765/static/personalities/${personality.name}.png`}
          alt={personality.name}
          className="scroll-portrait-img"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="scroll-portrait-overlay" />
      </div>

      {/* 卡片头 */}
      <div className="scroll-header">
        <div className="scroll-header-label">✦ {D('底色之名 · 卦格人格', 'Ground-Color Name · Archetype')} ✦</div>
        <div className="scroll-trigrams">
          {personality.trigrams?.map((t, i) => (
            <span key={i} className="scroll-trigram-chip">{t}</span>
          ))}
        </div>
        <h2 className="scroll-name name-reveal" key={personality.code}>
          {personality.name}
        </h2>
        <div className="scroll-code">{personality.code_display}</div>
        <div className="scroll-slogan">「{personality.slogan}」</div>
      </div>

      {/* === 推导链展示 — 告诉用户「卦格怎么被推导出」=== */}
      {personality.dim_scores && (
        <div className="scroll-derivation">
          <div className="scroll-derivation-label">✦ {D('你的底色如何被算出', 'How your ground-color was derived')} ✦</div>
          <div className="scroll-derivation-formula">
            <span className="scroll-formula-tag">
              <span className="scroll-formula-key">{D('决断', 'Decisive')}</span>
              <span className="scroll-formula-arrow">→</span>
              <span className="scroll-formula-val">
                {personality.dim_scores['决断']?.winner_label || '动'}·{personality.dim_scores['决断']?.trigram?.split('·')[1] || '震'}
              </span>
            </span>
            <span className="scroll-formula-plus">+</span>
            <span className="scroll-formula-tag">
              <span className="scroll-formula-key">{D('判断', 'Judgment')}</span>
              <span className="scroll-formula-arrow">→</span>
              <span className="scroll-formula-val">
                {personality.dim_scores['判断']?.winner_label || '明'}·{personality.dim_scores['判断']?.trigram?.split('·')[1] || '离'}
              </span>
            </span>
            <span className="scroll-formula-plus">+</span>
            <span className="scroll-formula-tag">
              <span className="scroll-formula-key">{D('处事', 'Social')}</span>
              <span className="scroll-formula-arrow">→</span>
              <span className="scroll-formula-val">
                {personality.dim_scores['处事']?.winner_label || '刚'}·{personality.dim_scores['处事']?.trigram?.split('·')[1] || '干'}
              </span>
            </span>
            <span className="scroll-formula-plus">+</span>
            <span className="scroll-formula-tag">
              <span className="scroll-formula-key">{D('变通', 'Adaptive')}</span>
              <span className="scroll-formula-arrow">→</span>
              <span className="scroll-formula-val">
                {personality.dim_scores['变通']?.winner_label || '通'}·{personality.dim_scores['变通']?.trigram?.split('·')[1] || '兑'}
              </span>
            </span>
            <span className="scroll-formula-eq">=</span>
            <span className="scroll-formula-result">
              {personality.code_display} · <strong>{personality.name}</strong>
            </span>
          </div>
          <div className="scroll-derivation-hint">
            二十八题 · 四维取证 · 唯一底色
          </div>
        </div>
      )}

      {/* === 卦格以「对话伙伴」身份开口 === */}
      {personality.voice_intro && (
        <div className="voice-intro-bubble">
          <div className="voice-intro-avatar">
            <img
              src={`http://127.0.0.1:8765/static/personalities/${personality.name}.png`}
              alt={personality.name}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
          <div className="voice-intro-content">
            <div className="voice-intro-label">{personality.name} · {D('开口', 'Speaks')}</div>
            <p className="voice-intro-text">{personality.voice_intro}</p>
          </div>
        </div>
      )}

      {/* === 卦格想问你的问题 === */}
      {personality.questions_for_you && personality.questions_for_you.length > 0 && (
        <div className="voice-questions">
          <div className="voice-questions-header">
            <span className="voice-questions-icon">❓</span>
            <span className="voice-questions-title">{personality.name} {D('想问你', 'wants to ask')}</span>
          </div>
          <div className="voice-questions-list">
            {personality.questions_for_you.map((q, i) => (
              <button
                key={i}
                className="voice-question-item"
                onClick={() => onSelectQuestion?.(q)}
              >
                <span className="voice-question-num">{i + 1}</span>
                <span className="voice-question-text">{q}</span>
                <span className="voice-question-arrow">→</span>
              </button>
            ))}
          </div>
          {onSelectQuestion && (
            <div className="voice-questions-hint">
              点击任意问题，{personality.name}会陪你一起问
            </div>
          )}
        </div>
      )}

      {/* 维度得分条 + 卦格吐槽 */}
      <div className="scroll-dims">
        {Object.entries(personality.dim_scores || {}).map(([dimName, score]: [string, any]) => {
          const total = (score.poles?.A || 0) + (score.poles?.B || 0);
          const aPct = total > 0 ? Math.round(((score.poles?.A || 0) / total) * 100) : 50;
          const comment = personality.dim_comments?.[dimName];
          return (
            <div key={dimName} className="scroll-dim-row">
              <div className="scroll-dim-row-top">
                <span className="sd-label">{dimName}</span>
                <span className="sd-bar-wrap">
                  <span className="sd-bar-a" style={{ width: `${aPct}%` }} />
                  <span className="sd-bar-b" style={{ width: `${100 - aPct}%` }} />
                </span>
                <span className="sd-winner">{score.winner_label} · {score.trigram}</span>
              </div>
              {comment && (
                <div className="sd-comment">
                  <span className="sd-comment-name">{personality.name}</span>
                  <span className="sd-comment-text">「{comment}」</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 五板块长卷轴 — 卦格以「第一人称」自述（优先用 _fp 字段，没有则降级到原文+字符串替换） */}
      <ScrollSection icon="◉" label="画像" text={personality.portrait} firstPerson={personality.portrait_fp ? null : "我"} overrideText={personality.portrait_fp} />
      <ScrollSection icon="◈" label="深层" text={personality.psychology} firstPerson={personality.psychology_fp ? null : "我"} overrideText={personality.psychology_fp} />
      <ScrollSection icon="♡" label="情感" text={personality.relationships} firstPerson={personality.relationships_fp ? null : "我"} overrideText={personality.relationships_fp} />
      <ScrollSection icon="◆" label="职场" text={personality.career} firstPerson={personality.career_fp ? null : "我"} overrideText={personality.career_fp} />
      <ScrollSection icon="↗" label="成长" text={personality.growth} last firstPerson={personality.growth_fp ? null : "我"} overrideText={personality.growth_fp} />
    </div>
  );
}

function ScrollSection({ icon, label, text, last, firstPerson, overrideText }: { icon: string; label: string; text: string; last?: boolean; firstPerson?: string | null; overrideText?: string }) {
  // overrideText 优先（卦格第一人称版本，从后端专门提供）
  let displayText = overrideText || text
  // 降级方案：把"此人是/此人/你是/你"换成"我"，把"他"换成"我"，让画像变成卦格自己的声音
  if (!overrideText && firstPerson === '我') {
    displayText = displayText
      // 长串模式先处理
      .replace(/此人是/g, '我是')
      .replace(/这个人是/g, '我是')
      .replace(/你是一个/g, '我是一个')
      .replace(/你是/g, '我是')
      .replace(/你(?=[，。！？、\s])/g, '我')
      .replace(/你的/g, '我的')
      .replace(/你(?=[，。！？、\s])/g, '我')
      // "他"系列 → "我"
      .replace(/他(?=[，。！？、\s])/g, '我')
      .replace(/他的/g, '我的')
      .replace(/他(?=[，。！？、\s])/g, '我')
      // 移除第三方观察者句式
      .replace(/我?认识的这个人/g, '我')
      .replace(/我?不知道的是/g, '')
      .replace(/旁人?看到的/g, '我看到的')
      .replace(/旁观者看到/g, '我看到')
  }
  return (
    <div className={`scroll-section ${last ? 'last' : ''}`}>
      <div className="scroll-section-header">
        <span className="scroll-section-icon">{icon}</span>
        <span className="scroll-section-label">{label}</span>
      </div>
      <p className="scroll-section-text">{displayText}</p>
    </div>
  )
}