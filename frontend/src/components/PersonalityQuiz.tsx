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

import { useState, useEffect, useRef } from 'react';
import { usePrefs } from '../App';
import { D, setLang } from '../i18n-shim';

interface QuestionOption {
  text: string;
  pole: string;
}

interface Question {
  id: string;
  scenario: string;
  option_a: QuestionOption;
  option_b: QuestionOption;
  reverse?: boolean;
}

interface PersonalityQuizProps {
  onComplete: (answers: { question_id: string; choice: string }[]) => void;
  apiBase?: string;
}

export function PersonalityQuiz({ onComplete, apiBase = import.meta.env.VITE_API_BASE || '' }: PersonalityQuizProps) {
  const { lang } = usePrefs()
  setLang(lang)
  const [currentBatch, setCurrentBatch] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allAnswers, setAllAnswers] = useState<{ question_id: string; choice: string }[]>([]);
  const [phase, setPhase] = useState<'base' | 'followup' | 'loading' | 'done'>('loading');
  const [progress, setProgress] = useState({ answered: 0, estimated_total: 20 });
  const [dimStatus, setDimStatus] = useState<Record<string, any>>({});
  const [transitioning, setTransitioning] = useState(false);
  // 每题的选项顺序（随机打乱，防止用户惯性选第一个→总是 A 极）
  const [optionOrder, setOptionOrder] = useState<Record<string, boolean>>({});
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    fetchNextQuestions([]);
    return () => { isMounted.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchNextQuestions(answers: typeof allAnswers) {
    try {
      const resp = await fetch(`${apiBase}/api/personality/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, seed: 42 }),
      });
      const data = await resp.json();
      if (!isMounted.current) return;

      if (data.is_complete || !data.questions || data.questions.length === 0) {
        setPhase('done');
        onComplete(answers);
        return;
      }

      setCurrentBatch(data.questions);
      setCurrentIndex(0);
      setPhase(data.phase || 'base');
      setProgress(data.progress || { answered: answers.length, estimated_total: 20 });
      if (data.dim_status) setDimStatus(data.dim_status);
      // 为每道新题随机生成选项顺序（true=A在前，false=B在前）
      setOptionOrder(prev => {
        const next = { ...prev };
        for (const q of data.questions) {
          if (!(q.id in next)) {
            next[q.id] = Math.random() < 0.5;
          }
        }
        return next;
      });
    } catch (e: any) {
      console.error('Personality quiz fetch error:', e);
      // v2.3: 把错误暴露给用户，避免无限 loading
      if (isMounted.current) {
        setCurrentBatch([{
          id: '__error__',
          text_zh: `加载失败：${e?.message || '网络错误'}，请刷新页面重试`,
          text_en: `Load failed: ${e?.message || 'Network error'}, please refresh`,
          dim_key: 'decisive',
          pole_a: '重试',
          pole_b: 'Cancel',
        } as any]);
        setPhase('base');
      }
    }
  }

  function handleAnswer(qid: string, choice: string) {
    setTransitioning(true);
    const newAnswers = [...allAnswers, { question_id: qid, choice }];
    setAllAnswers(newAnswers);

    setTimeout(() => {
      if (currentIndex + 1 < currentBatch.length) {
        // Next question in current batch
        setCurrentIndex(currentIndex + 1);
        setTransitioning(false);
      } else {
        // Batch done, fetch next
        fetchNextQuestions(newAnswers);
        setTransitioning(false);
      }
    }, 400);
  }

  if (phase === 'done') {
    return (
      <div className="quiz-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '1.2rem', opacity: 0.6 }}>{D('卦格已定', 'Archetype determined')}</div>
      </div>
    );
  }

  const currentQ = currentBatch[currentIndex];
  if (!currentQ) {
    return (
      <div className="quiz-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '1.2rem', opacity: 0.6 }}>{D('正在计算卦格…', 'Calculating your hexagram pattern…')}</div>
      </div>
    );
  }

  const totalAnswered = allAnswers.length;
  const pct = Math.min(100, Math.round((totalAnswered / (progress.estimated_total || 28)) * 100));

  // 维度进度展示
  const dimNames: Record<string, string> = {
    decisive: D('决断', 'Decisive'), judgment: D('判断', 'Judgment'), social: D('处事', 'Social'), attribution: D('变通', 'Adaptive')
  };
  const dimColors: Record<string, string> = {
    动: 'var(--accent)', 静: 'var(--accent)',
    明: 'var(--accent)', 幽: 'var(--accent)',
    刚: 'var(--accent)', 柔: 'var(--accent)',
    通: 'var(--accent)', 止: 'var(--accent)',
  };

  return (
    <div className="quiz-container">
      {/* 进度条 */}
      <div className="quiz-progress-bar-wrap">
        <div className="quiz-progress-info">
          <span>{D('卦格之问', 'Archetype Q&A')} · {phase === 'followup' ? D('追问', 'Follow-up') : D('基础', 'Base')}</span>
          <span>{totalAnswered} / ~{progress.estimated_total}</span>
        </div>
        <div className="quiz-progress-bar">
          <div className="quiz-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        {/* 维度进度 */}
        <div className="quiz-dim-pills">
          {Object.entries(dimStatus).map(([dimKey, status]: [string, any]) => {
            const cn = dimNames[dimKey] || dimKey;
            const winner = status.winner_label || (status.winner === 'A' ? '?' : status.winner === 'B' ? '?' : '?');
            const isClear = status.is_clear;
            const poles = status.poles || { A: 0, B: 0 };
            const total = (poles.A || 0) + (poles.B || 0);
            const aPct = total > 0 ? Math.round(((poles.A || 0) / total) * 100) : 50;
            return (
              <div key={dimKey} className={`dim-pill ${isClear ? 'clear' : ''}`}>
                <span className="dim-pill-name">{cn}</span>
                <span className="dim-pill-bars">
                  <span className="dim-bar-a" style={{ width: `${aPct}%` }} />
                  <span className="dim-bar-b" style={{ width: `${100 - aPct}%` }} />
                </span>
                <span className="dim-pill-winner">{winner}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 题目卡片 */}
      <div
        className={`quiz-card ${transitioning ? 'quiz-card-exit' : 'quiz-card-enter'}`}
        key={currentQ.id}
      >
        <div className="quiz-question-id">{currentQ.id}</div>
        <div className="quiz-scenario">{currentQ.scenario}</div>

        <div className="quiz-options">
          {(() => {
            const aFirst = optionOrder[currentQ.id] !== false;
            const first = aFirst ? { letter: '甲', key: 'A', text: currentQ.option_a.text } : { letter: '甲', key: 'B', text: currentQ.option_b.text };
            const second = aFirst ? { letter: '乙', key: 'B', text: currentQ.option_b.text } : { letter: '乙', key: 'A', text: currentQ.option_a.text };
            return (
              <>
                <button
                  className="quiz-option"
                  onClick={() => handleAnswer(currentQ.id, first.key)}
                >
                  <span className="quiz-option-letter">{first.letter}</span>
                  <span className="quiz-option-text">{first.text}</span>
                </button>
                <button
                  className="quiz-option"
                  onClick={() => handleAnswer(currentQ.id, second.key)}
                >
                  <span className="quiz-option-letter">{second.letter}</span>
                  <span className="quiz-option-text">{second.text}</span>
                </button>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
