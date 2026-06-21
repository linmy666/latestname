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

import { useState, useEffect } from 'react';
import { usePrefs } from '../App';
import { D, setLang } from '../i18n-shim';

interface PersonalitySelectorProps {
  onSelect: (code: string, data: any) => void;
  onBack: () => void;
}

export function PersonalitySelector({ onSelect, onBack }: PersonalitySelectorProps) {
  const { lang } = usePrefs()
  setLang(lang)
  const [types, setTypes] = useState<Record<string, any>>({});
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);

  useEffect(() => {
    fetch('/api/personality/types')
      .then(r => r.json())
      .then(data => setTypes(data))
      .catch(e => console.error('Personality types fetch error:', e));
  }, []);

  function handleSelect(code: string) {
    setSelectedCode(code);
    // Fetch full detail
    fetch('/api/personality/result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Generate fake answers that produce this code
        answers: _codeToAnswers(code),
      }),
    })
      .then(r => r.json())
      .then(data => setDetail(data))
      .catch(e => console.error('Personality detail error:', e));
  }

  // Map code chars back to dimension answers
  function _codeToAnswers(code: string): { question_id: string; choice: string }[] {
    const poleMap: Record<string, string> = { 动: 'A', 静: 'B', 明: 'A', 幽: 'B', 刚: 'A', 柔: 'B', 通: 'A', 止: 'B' };
    const dimChars: [string, string, string, string] = ['D', 'J', 'S', 'A'];
    const dimQuestions = (dim: string, n: number) => Array.from({ length: n }, (_, i) => `${dim}${i + 1}`);
    const answers: { question_id: string; choice: string }[] = [];
    for (let d = 0; d < 4; d++) {
      const poleChar = code[d];
      const choice = poleMap[poleChar] || 'A';
      const qids = dimQuestions(dimChars[d], 5);
      qids.forEach(qid => answers.push({ question_id: qid, choice }));
    }
    return answers;
  }

  const codes = Object.keys(types).sort();

  return (
    <div className="selector-container">
      <div className="selector-header">
        <div className="selector-label">{D('十六卦格 · 认领你的本命', 'Sixteen Archetypes · Claim Your Own')}</div>
        <p className="selector-hint">{D('如果你已知道自己的性格倾向，从下方选择最接近的一格', 'If you already know your tendency, pick the closest archetype below')}</p>
      </div>

      <div className="selector-grid">
        {codes.map(code => {
          const t = types[code];
          const isSelected = selectedCode === code;
          return (
            <button
              key={code}
              className={`selector-cell ${isSelected ? 'selected' : ''}`}
              onClick={() => handleSelect(code)}
            >
              <div className="selector-cell-portrait">
                <img
                  src={`http://127.0.0.1:8765/static/personalities/${t.name}.png`}
                  alt={t.name}
                  className="selector-cell-img"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <div className="selector-cell-name">{t.name}</div>
              <div className="selector-cell-code">{code.split('').join('·')}</div>
              <div className="selector-cell-slogan">{t.slogan}</div>
            </button>
          );
        })}
      </div>

      {detail && (
        <div className="selector-detail scroll-card">
          <div className="selector-detail-portrait">
            <img
              src={`http://127.0.0.1:8765/static/personalities/${detail.name}.png`}
              alt={detail.name}
              className="selector-detail-img"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="selector-detail-overlay" />
          </div>
          <div className="selector-detail-header">
            <div className="selector-detail-trigrams">
              {detail.trigrams?.map((t: string, i: number) => (
                <span key={i} className="scroll-trigram-chip">{t}</span>
              ))}
            </div>
            <h2 className="selector-detail-name name-reveal" key={detail.code}>
              {detail.name}
            </h2>
            <div className="selector-detail-code">{detail.code_display}</div>
            <div className="selector-detail-slogan">「{detail.slogan}」</div>
          </div>

          <ScrollSection icon="◉" label={D('画像', 'Portrait')} text={detail.portrait} />
          <ScrollSection icon="◈" label={D('深层', 'Depth')} text={detail.psychology} />
          <ScrollSection icon="♡" label={D('情感', 'Relationships')} text={detail.relationships} />
          <ScrollSection icon="◆" label={D('职场', 'Career')} text={detail.career} />
          <ScrollSection icon="↗" label={D('成长', 'Growth')} last text={detail.growth} />

          <div className="selector-confirm-wrap">
            <button
              className="btn-primary selector-confirm-btn"
              onClick={() => onSelect(detail.code, detail)}
            >
              ⟡ {D('认领此格', 'Claim this archetype')}
            </button>
          </div>
        </div>
      )}

      <button className="step0-back-btn" onClick={onBack}>← {D('返回', 'Back')}</button>
    </div>
  );
}

function ScrollSection({ icon, label, text, last }: { icon: string; label: string; text: string; last?: boolean }) {
  return (
    <div className={`scroll-section ${last ? 'last' : ''}`}>
      <div className="scroll-section-header">
        <span className="scroll-section-icon">{icon}</span>
        <span className="scroll-section-label">{label}</span>
      </div>
      <p className="scroll-section-text">{text}</p>
    </div>
  );
}
