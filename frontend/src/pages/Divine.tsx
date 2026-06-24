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

import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import HexagramSVG from '../components/HexagramSVG'
// TarotCard import removed — v5 uses inline img in TarotPanel
import { useShareCardRenderer, downloadDataUrl } from '../components/ShareCard'
import FollowupPanel from '../components/FollowupPanel'
import { PersonalityQuiz } from '../components/PersonalityQuiz'
import { PersonalityCard } from '../components/PersonalityCard'
import { PersonalitySelector } from '../components/PersonalitySelector'
import { refreshQuota } from '../i18n-shim'
import { triggerAuthGate } from '../components/AuthGate'
// ============================================================
// Divine — Latestname · 此刻之名
// v2: 全量 i18n + 移动端适配
// ============================================================
import { usePrefs } from '../App'
import { D, setLang } from '../i18n-shim'

/** CleanText: 清洗AI输出中的残留Markdown标记，渲染纯文本段落 */
function CleanText({ text }: { text: string }) {
  const cleaned = text
    // 去除 **加粗** 和 __加粗__
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    // 去除 *斜体* 和 _斜体_
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '$1')
    .replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '$1')
    // 去除 `代码` 标记
    .replace(/`(.+?)`/g, '$1')
    // 去除 # 标题标记
    .replace(/^#{1,6}\s+/gm, '')
    // 去除 > 引用标记
    .replace(/^>\s+/gm, '')
    // 去除 - 或 * 无序列表标记
    .replace(/^[\s]*[-*]\s+/gm, '')
    // 去除 [text](url) 链接
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    // 去除 --- 分隔线
    .replace(/^---+$/gm, '')

  return (
    <div>
      {cleaned.split(/\n\n+/).map((para, i) => (
        <p key={i} style={{
          margin: '0.6em 0',
          lineHeight: 1.8,
          fontSize: '0.95rem',
        }}>{para.trim()}</p>
      ))}
    </div>
  )
}

type Mode = 'combined' | 'iching' | 'tarot'
type Phase = 'input' | 'ritual_open' | 'casting_loading' | 'cast_coins' | 'cast_reveal' | 'tarot_shuffle' | 'tarot_pick' | 'tarot_reveal' | 'result'

// v4.0: 塔罗牌面图片路径映射（Rider-Waite Smith CC0）
const TAROT_IMAGE_MAP: Record<number, string> = {
  0:'maj00.jpg',1:'maj01.jpg',2:'maj02.jpg',3:'maj03.jpg',4:'maj04.jpg',5:'maj05.jpg',
  6:'maj06.jpg',7:'maj07.jpg',8:'maj08.jpg',9:'maj09.jpg',10:'maj10.jpg',11:'maj11.jpg',
  12:'maj12.jpg',13:'maj13.jpg',14:'maj14.jpg',15:'maj15.jpg',16:'maj16.jpg',17:'maj17.jpg',
  18:'maj18.jpg',19:'maj19.jpg',20:'maj20.jpg',21:'maj21.jpg',
  22:'cups01.jpg',23:'cups02.jpg',24:'cups03.jpg',25:'cups04.jpg',26:'cups05.jpg',
  27:'cups06.jpg',28:'cups07.jpg',29:'cups08.jpg',30:'cups09.jpg',31:'cups10.jpg',
  32:'cups11.jpg',33:'cups12.jpg',34:'cups13.jpg',35:'cups14.jpg',
  36:'wands01.jpg',37:'wands02.jpg',38:'wands03.jpg',39:'wands04.jpg',40:'wands05.jpg',
  41:'wands06.jpg',42:'wands07.jpg',43:'wands08.jpg',44:'wands09.jpg',45:'wands10.jpg',
  46:'wands11.jpg',47:'wands12.jpg',48:'wands13.jpg',49:'wands14.jpg',
  50:'swords01.jpg',51:'swords02.jpg',52:'swords03.jpg',53:'swords04.jpg',54:'swords05.jpg',
  55:'swords06.jpg',56:'swords07.jpg',57:'swords08.jpg',58:'swords09.jpg',59:'swords10.jpg',
  60:'swords11.jpg',61:'swords12.jpg',62:'swords13.jpg',63:'swords14.jpg',
  64:'pents01.jpg',65:'pents02.jpg',66:'pents03.jpg',67:'pents04.jpg',68:'pents05.jpg',
  69:'pents06.jpg',70:'pents07.jpg',71:'pents08.jpg',72:'pents09.jpg',73:'pents10.jpg',
  74:'pents11.jpg',75:'pents12.jpg',76:'pents13.jpg',77:'pents14.jpg',
}
function getTarotImage(cardId: number): string {
  return `/tarot/${TAROT_IMAGE_MAP[cardId] || 'maj00.jpg'}`
}

// v0.2: 呼吸缩短到 8 秒（2 周期），可跳过
const BREATH_PHASES = [
  { label: '吸', dur: 2000, scale: 1.4 },
  { label: '屏', dur: 2000, scale: 1.4 },
  { label: '呼', dur: 2000, scale: 1.0 },
  { label: '息', dur: 2000, scale: 1.0 },
]

export default function Divine() {
  const [mode, setMode] = useState<Mode>('combined')
  const [phase, setPhase] = useState<Phase>('input')
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState<any>(null)
  const location = useLocation()
  const { t, lang, isMobile } = usePrefs()
  const td = t.divine
  // 同步 module-scope lang（供子组件 D() 使用）
  setLang(lang)
  // v2.3: 起卦完成后刷新前端配额显示 — refreshQuota 来自 i18n-shim（module-scope）

  // v0.7: 从首页场景模板预填问题
  useEffect(() => {
    const st = location.state as { prefill?: string } | null
    if (st?.prefill) {
      setQuestion(st.prefill)
    }
  }, [location.state])

  const [breathIdx, setBreathIdx] = useState(0)
  const [error, setError] = useState('')
  const skipRef = useRef(false)
  const [interpretation, setInterpretation] = useState('')
  const [interpreting, setInterpreting] = useState(false)
  const [interpretError, setInterpretError] = useState('')

  // 仪式化流程 state
  const [coinStep, setCoinStep] = useState(0)  // 当前抛到第几爻 (0-5)
  const [coinThrowing, setCoinThrowing] = useState(false)  // 铜钱旋转中
  const [revealedCoins, setRevealedCoins] = useState<boolean[]>([false, false, false, false, false, false])
  const [tarotPickIdx, setTarotPickIdx] = useState<number[]>([])  // 用户选中的牌 idx
  const [tarotCardsShuffled, setTarotCardsShuffled] = useState(false)  // 牌是否已洗

  // v5: 分阶段选牌 — 过去N选一 → 现在N选一 → 未来N选一
  const [tarotPickStage, setTarotPickStage] = useState(0)  // 0=过去 1=现在 2=未来 3=完成
  const [tarotPicks, setTarotPicks] = useState<number[]>([])  // 每个stage选的候选idx [0-3, 0-3, 0-3]
  const [tarotDeck, setTarotDeck] = useState<any[]>([])  // 从后端拿的候选牌堆

  // v0.4: 八字输入
  const [showBazi, setShowBazi] = useState(false)
  const [birthYear, setBirthYear] = useState('')
  const [birthMonth, setBirthMonth] = useState('')
  const [birthDay, setBirthDay] = useState('')
  const [birthHour, setBirthHour] = useState('')
  const [gender, setGender] = useState('unknown')
  const [name, setName] = useState('')
  // v0.5-A: 出生城市（真太阳时校正）
  const [birthCity, setBirthCity] = useState('')
  const [cityOptions, setCityOptions] = useState<{name: string, lng: number, lat: number, province: string}[]>([])
  const [showCitySuggest, setShowCitySuggest] = useState(false)
  // v6: 性取向
  const [orientation, setOrientation] = useState('')

  // v0.6-B: 分享卡
  const [sharing, setSharing] = useState(false)
  const renderShare = useShareCardRenderer()

  // Latestname v1.1: 问卷四问（名前登记）
  const [surveyDomain, setSurveyDomain] = useState('general')
  const [surveyMood, setSurveyMood] = useState('calm')
  const [surveyUrgency, setSurveyUrgency] = useState('normal')
  const [surveyOpenness, setSurveyOpenness] = useState('open')
  const [showSurvey, setShowSurvey] = useState(false)

  // v2.0: 卦格人格问卷
  const [showPersonalityQuiz, setShowPersonalityQuiz] = useState(false)
  const [personalityAnswers, setPersonalityAnswers] = useState<{question_id: string; choice: string}[]>([])
  const [personalityResult, setPersonalityResult] = useState<any>(null)
  const [personalityCode, setPersonalityCode] = useState<string>('')  // v2.1: 手动认领的卦格代码

  // v0.7: 八字信息 localStorage 持久化
  useEffect(() => {
    const saved = localStorage.getItem('onyx_bazi')
    if (saved) {
      try {
        const d = JSON.parse(saved)
        if (d.birthYear) setBirthYear(d.birthYear)
        if (d.birthMonth) setBirthMonth(d.birthMonth)
        if (d.birthDay) setBirthDay(d.birthDay)
        if (d.birthHour) setBirthHour(d.birthHour)
        if (d.gender) setGender(d.gender)
        if (d.name) setName(d.name)
        if (d.birthCity) setBirthCity(d.birthCity)
      } catch {}
    }
  }, [])

  // v0.7: 八字信息变更时自动保存
  useEffect(() => {
    if (birthYear && birthMonth && birthDay) {
      localStorage.setItem('onyx_bazi', JSON.stringify({
        birthYear, birthMonth, birthDay, birthHour, gender, name, birthCity,
      }))
    }
  }, [birthYear, birthMonth, birthDay, birthHour, gender, name, birthCity])

  async function startDivine() {
    // v4.1: 不再要求先输入问题 — 直接进入仪式
    setError('')
    setPhase('ritual_open')
  }

  // 用户在仪式开场点击「心中默念好了」→ 后端取数据 → 进入抛铜钱
  async function beginRitual() {
    setPhase('casting_loading')
    try {
      const endpoint = mode === 'combined' ? '/api/divine/combined'
                     : mode === 'iching' ? '/api/divine/iching'
                     : '/api/divine/tarot'
      // 如果用户没输入问题，用一个中性占位（后端 seed 仍可基于时间生成）
      const effectiveQuestion = question.trim() || D('今日天机', "Today's reading")
      // v2.2: 自动携带 token（让后端配额系统识别用户）
      const token = localStorage.getItem('ln_token')
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetchWithRetry(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          question: effectiveQuestion,
          tarot_count: mode === 'iching' ? 0 : 3,
          lang,  // i18n: pass current language to backend
          survey_domain: surveyDomain,
          survey_mood: surveyMood,
          survey_urgency: surveyUrgency,
          survey_openness: surveyOpenness,
          ...(personalityAnswers.length > 0 ? { personality_answers: personalityAnswers } : {}),
          ...(personalityCode ? { personality_code: personalityCode } : {}),
          ...(birthYear && birthMonth && birthDay ? {
            birth_year: parseInt(birthYear),
            birth_month: parseInt(birthMonth),
            birth_day: parseInt(birthDay),
            birth_hour: birthHour ? parseInt(birthHour) : undefined,
            gender,
            name,
            birth_city: birthCity || undefined,
          } : {}),
        }),
      })
      // v2.2: 处理 429 配额超限 + 401 未登录
      if (res.status === 401) {
        const errBody = await res.json().catch(() => ({}))
        triggerAuthGate('login', errBody.detail)
        setPhase('input')
        return
      }
      if (res.status === 429) {
        const errBody = await res.json().catch(() => ({}))
        triggerAuthGate('quota', errBody.detail)
        setPhase('input')
        return
      }
      if (!res.ok) throw new Error(D(`占卜请求失败 (${res.status})`, `Divination request failed (${res.status})`))
      const data = await res.json()
      setResult(data)
      setInterpretation('')
      setInterpretError('')
      // 重置仪式进度
      setCoinStep(0)
      setTarotPickIdx([])
      setRevealedCoins(new Array(6).fill(false))
      // v5: 加载塔罗选牌牌堆 + 重置选牌状态
      if (data.tarot_pick_deck) {
        setTarotDeck(data.tarot_pick_deck)
      } else if (data.tarot || data.cards) {
        // 兼容旧API：用最终牌做候选（每位置1张）
        const fallback = (data.tarot || data.cards || []).map((c: any) => ({
          ...c.spread_position,
          candidates: [c],
        }))
        setTarotDeck(fallback)
      }
      setTarotPickStage(0)
      setTarotPicks([])
      // 根据模式进入下一步
      if (mode === 'tarot') {
        setPhase('tarot_shuffle')
      } else {
        setPhase('cast_coins')
      }
    } catch (e: any) {
      setError(e.name === 'AbortError' ? D('请求超时，请检查网络后重试', 'Request timed out. Check your network and retry.') : (e.message || D('请求出错', 'Request failed')))
      setPhase('input')
    }
  }

  function skipBreathing() {
    skipRef.current = true
  }

  async function quickDivine() {
    // v4.1: 快捷占卜也不需要问题
    setError('')
    setPhase('ritual_open')
  }

  function reset() {
    setPhase('input')
    setResult(null)
    setQuestion('')
    setError('')
    setSharing(false)
    setCoinStep(0)
    setRevealedCoins(new Array(6).fill(false))
    setTarotPickIdx([])
    setTarotCardsShuffled(false)
    setTarotPickStage(0)
    setTarotPicks([])
    setTarotDeck([])
  }

  // 仪式流程 helpers
  function throwNextCoin() {
    if (coinThrowing) return
    setCoinThrowing(true)
    // 抛铜钱动画 — 1.2s
    setTimeout(() => {
      setRevealedCoins(prev => {
        const next = [...prev]
        next[coinStep] = true
        return next
      })
      const nextStep = coinStep + 1
      setCoinStep(nextStep)
      setCoinThrowing(false)
      // 抛完 6 爻 → 揭示卦象
      if (nextStep >= 6) {
        setTimeout(() => setPhase('cast_reveal'), 800)
      }
    }, 1200)
  }

  function startTarotPick() {
    if (tarotCardsShuffled) {
      setPhase('tarot_pick')
    } else {
      // 洗牌动画 — 1.5s
      setTarotCardsShuffled(true)
      setTimeout(() => setPhase('tarot_pick'), 1500)
    }
  }

  // v5: 分阶段选牌 — 用户在当前位置的N张候选牌中选一张
  function pickTarotCard(candidateIdx: number) {
    if (tarotPickStage >= 3) return  // 已选完
    // 记录选择
    const newPicks = [...tarotPicks]
    newPicks[tarotPickStage] = candidateIdx
    setTarotPicks(newPicks)
    const nextStage = tarotPickStage + 1
    setTarotPickStage(nextStage)
    // 3个位置都选完 → 更新 result.tarot 为用户选的牌，进入揭示
    if (nextStage >= 3) {
      // 构造最终牌阵：从 tarotDeck 取出每个位置用户选的那张牌
      const finalCards = newPicks.map((pickIdx, stage) => {
        const pos = tarotDeck[stage]
        const chosen = pos?.candidates?.[pickIdx]
        if (chosen) {
          return {
            ...chosen,
            spread_position: {
              position: pos.position,
              label: pos.label,
              label_en: pos.label_en,
              meaning: pos.meaning,
            },
          }
        }
        return null
      }).filter(Boolean)
      // 更新 result
      if (result) {
        const updatedResult = { ...result, tarot: finalCards, cards: finalCards }
        setResult(updatedResult)
      }
      // 兼容旧状态
      setTarotPickIdx([0, 1, 2])
      setTimeout(() => setPhase('tarot_reveal'), 800)
    }
  }

  async function onShare() {
    if (!result || sharing) return
    setSharing(true)
    try {
      const aiText = (interpretation || '').replace(/[#*`>_\-\[\]!]/g, '').trim().slice(0, 200)
      const dataUrl = await renderShare({
        question,
        date: new Date().toISOString().split('T')[0],
        name,
        hexagram: result.iching?.original ? {
          name: result.iching.original.name,
          name_en: result.iching.original.name_en,
          binary: result.iching.original.binary,
          fortune: result.iching.original.fortune,
          judgment: result.iching.original.judgment,
        } : { name: '', name_en: '', binary: '111111', fortune: '中', judgment: '' },
        tarot: result.tarot,
        fortune_scores: result.fortune_scores,
        ai_summary: aiText,
      })
      const filename = `latestname-${result.iching?.original?.name || 'divination'}-${Date.now()}.png`
      downloadDataUrl(dataUrl, filename)
    } catch (e: any) {
      setError(D('分享图生成失败：', 'Share image generation failed:') + (e?.message || D('未知错误', 'Unknown error')))
    } finally {
      setSharing(false)
    }
  }

  // ============================================================
  // LLM 流式解读
  // ============================================================
  async function getInterpretation() {
    const settings = JSON.parse(localStorage.getItem('onyx_llm_config') || '{}')

    setInterpreting(true)
    setInterpretation('')
    setInterpretError('')

    // v2.4: 不再前置拦截 — 直接让后端判断（部署版用管理员配置，开源版用户自配）
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 120000)
      const token = localStorage.getItem('ln_token')
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          question,
          divination: result,
          // v2.4: 仅当用户在 Settings 自配时传 llm_config（部署版留空）
          ...(settings?.api_key && settings.api_key.length > 20
              ? { llm_config: settings }
              : {}),
        }),
        signal: controller.signal,
      })
      clearTimeout(timeout)

        // v2.2: 处理 401 + 429
        if (res.status === 401) {
          const errBody = await res.json().catch(() => ({}))
          triggerAuthGate('login', errBody.detail)
          return
        }
        if (res.status === 429) {
          const errBody = await res.json().catch(() => ({}))
          triggerAuthGate('quota', errBody.detail)
          return
        }
        if (!res.ok) throw new Error(D('解读请求失败', 'AI reading request failed'))

        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let text = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const chunk = line.slice(6)
              if (chunk.trim() === '[DONE]') break
              try {
                const data = JSON.parse(chunk)
                if (data.error) {
                  setInterpretError(data.error)
                  break
                }
                if (data.content) {
                  text += data.content
                  setInterpretation(text)
                }
              } catch { /* skip */ }
            }
          }
        }
      } catch (e: any) {
        // v2.4: 后端 503（管理员没配）才显示「请联系管理员」，其他错误统一提示
        if (e.name !== 'AbortError') {
          // 真正错误（AbortError 是用户取消）
          setInterpretError(e.message || D('解读出错', 'AI reading failed'))
        }
      } finally {
        setInterpreting(false)
        refreshQuota()
      }
    }

  return (
    <div className="container fade-in" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      {phase === 'input' && <InputView
        question={question} setQuestion={setQuestion}
        mode={mode} setMode={setMode}
        onStart={startDivine} onQuickStart={quickDivine} error={error}
        entryAction={(location.state as any)?.action || null}
        showBazi={showBazi} setShowBazi={setShowBazi}
        birthYear={birthYear} setBirthYear={setBirthYear}
        birthMonth={birthMonth} setBirthMonth={setBirthMonth}
        birthDay={birthDay} setBirthDay={setBirthDay}
        birthHour={birthHour} setBirthHour={setBirthHour}
        gender={gender} setGender={setGender}
        name={name} setName={setName}
        birthCity={birthCity} setBirthCity={setBirthCity}
        cityOptions={cityOptions} setCityOptions={setCityOptions}
        showCitySuggest={showCitySuggest} setShowCitySuggest={setShowCitySuggest}
        surveyDomain={surveyDomain} setSurveyDomain={setSurveyDomain}
        surveyMood={surveyMood} setSurveyMood={setSurveyMood}
        surveyUrgency={surveyUrgency} setSurveyUrgency={setSurveyUrgency}
        surveyOpenness={surveyOpenness} setSurveyOpenness={setSurveyOpenness}
        showSurvey={showSurvey} setShowSurvey={setShowSurvey}
        showPersonalityQuiz={showPersonalityQuiz} setShowPersonalityQuiz={setShowPersonalityQuiz}
        personalityAnswers={personalityAnswers} setPersonalityAnswers={setPersonalityAnswers}
        personalityResult={personalityResult} setPersonalityResult={setPersonalityResult}
        setPersonalityCode={setPersonalityCode}
      />}

      {/* === 仪式化占卜流程 === */}

      {/* 1. 仪式开场 — 心中默念 */}
      {phase === 'ritual_open' && (
        <RitualOpenView
          question={question}
          personalityName={personalityResult?.name}
          personalityCode={personalityResult?.code_display}
          personalityPortrait={personalityResult?.name}
          onBegin={beginRitual}
          onBack={() => setPhase('input')}
        />
      )}

      {/* 2. 加载中 */}
      {phase === 'casting_loading' && (
        <CastingLoadingView personalityName={personalityResult?.name} />
      )}

      {/* 3. 抛铜钱 × 6（仅 combined/iching 模式） */}
      {phase === 'cast_coins' && result?.iching && (
        <CoinCastingView
          coinStep={coinStep}
          coinThrowing={coinThrowing}
          revealedCoins={revealedCoins}
          coinThrows={result.iching.coin_throws || []}
          lineTotals={result.iching.line_totals || []}
          changingLines={result.iching.changing_lines || []}
          yaoNames={result.iching.yao_names || {}}
          personalityName={personalityResult?.name}
          onThrow={throwNextCoin}
        />
      )}

      {/* 4. 揭示卦象 */}
      {phase === 'cast_reveal' && result?.iching && (
        <CastRevealView
          iching={result.iching}
          personalityName={personalityResult?.name}
          onContinue={() => {
            if (mode === 'iching') {
              // 纯易经模式 → 直接进入结果
              saveToHistory({ ...result, mode, question, at: Date.now() })
              refreshQuota()
              setPhase('result')
            } else {
              // combined → 进入塔罗抽牌
              setPhase('tarot_shuffle')
            }
          }}
        />
      )}

      {/* 5. 洗塔罗牌 */}
      {phase === 'tarot_shuffle' && (result?.tarot || tarotDeck.length > 0) && (
        <TarotShuffleView
          personalityName={personalityResult?.name}
          shuffled={tarotCardsShuffled}
          onContinue={startTarotPick}
        />
      )}

      {/* 6. 用户分阶段选牌 — 过去N选一→现在N选一→未来N选一 */}
      {phase === 'tarot_pick' && tarotDeck.length > 0 && (
        <TarotPickView
          tarotCards={result?.tarot || []}
          pickedIdx={tarotPickIdx}
          personalityName={personalityResult?.name}
          onPick={pickTarotCard}
          deck={tarotDeck}
          stage={tarotPickStage}
          picks={tarotPicks}
        />
      )}

      {/* 7. 揭示塔罗 */}
      {phase === 'tarot_reveal' && result?.tarot && (
        <TarotRevealView
          tarotCards={result.tarot}
          pickedIdx={tarotPickIdx}
          personalityName={personalityResult?.name}
          onContinue={() => {
            saveToHistory({ ...result, mode, question, at: Date.now() })
            refreshQuota()
            setPhase('result')
          }}
        />
      )}

      {phase === 'result' && result && (
        <ResultView
          mode={mode} result={result} question={question} onReset={reset}
          interpretation={interpretation} interpreting={interpreting}
          interpretError={interpretError} onInterpret={getInterpretation}
          onShare={onShare} sharing={sharing}
          // v5: 传递问题/八字状态给结果页深度解读
          setQuestion={setQuestion}
          showBazi={showBazi} setShowBazi={setShowBazi}
          birthYear={birthYear} setBirthYear={setBirthYear}
          birthMonth={birthMonth} setBirthMonth={setBirthMonth}
          birthDay={birthDay} setBirthDay={setBirthDay}
          birthHour={birthHour} setBirthHour={setBirthHour}
          gender={gender} setGender={setGender}
          name={name} setName={setName}
          birthCity={birthCity} setBirthCity={setBirthCity}
          orientation={orientation} setOrientation={setOrientation}
        />
      )}
    </div>
  )
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

// ============================================================
// Fetch utilities: timeout + retry
// ============================================================
const FETCH_TIMEOUT = 30000 // 30s
const RETRY_DELAYS = [1000, 3000] // retry 2 times with backoff

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = FETCH_TIMEOUT): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(timer)
    return res
  } catch (e) {
    clearTimeout(timer)
    throw e
  }
}

async function fetchWithRetry(url: string, options: RequestInit = {}, timeout = FETCH_TIMEOUT): Promise<Response> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      const res = await fetchWithTimeout(url, options, timeout)
      if (!res.ok && res.status >= 500 && attempt < RETRY_DELAYS.length) {
        // Server error → retry
        await sleep(RETRY_DELAYS[attempt])
        continue
      }
      return res
    } catch (e: any) {
      lastError = e
      if (attempt < RETRY_DELAYS.length) {
        await sleep(RETRY_DELAYS[attempt])
        continue
      }
    }
  }
  throw lastError || new Error('请求失败')
}

function saveToHistory(entry: any) {
  // 1. 本地存储（始终保留，作为离线兜底）
  const key = 'onyx_history'
  const list = JSON.parse(localStorage.getItem(key) || '[]')
  list.unshift(entry)
  localStorage.setItem(key, JSON.stringify(list.slice(0, 50)))

  // 2. 云端同步（如果已登录）
  const token = localStorage.getItem('ln_token')
  if (token) {
    fetch('/api/auth/history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        question: entry.question || '',
        mode: entry.mode || 'combined',
        result: {
          iching: entry.iching,
          tarot: entry.tarot,
          cards: entry.cards,
          resonance: entry.resonance,
          latest_name: entry.latest_name,
          personality: entry.personality,
          // v2.3: 写 survey 字段，让 personalized-analysis 的 mood_curve 有真实数据
          survey: entry.survey,
        },
      }),
    }).catch(() => {})  // 云端保存失败不影响本地
  }
}

// ============================================================
// 输入视图
// ============================================================
async function searchCities(q: string): Promise<{name: string, lng: number, lat: number, province: string}[]> {
  if (!q || q.length < 1) return []
  try {
    const r = await fetch(`/api/cities?q=${encodeURIComponent(q)}`)
    if (!r.ok) return []
    return await r.json()
  } catch { return [] }
}

function InputView({ question, setQuestion, mode, setMode, onStart, onQuickStart, error,
  entryAction,
  showBazi, setShowBazi, birthYear, setBirthYear, birthMonth, setBirthMonth,
  birthDay, setBirthDay, birthHour, setBirthHour, gender, setGender, name, setName,
  birthCity, setBirthCity, cityOptions, setCityOptions, showCitySuggest, setShowCitySuggest,
  surveyDomain, setSurveyDomain, surveyMood, setSurveyMood, surveyUrgency, setSurveyUrgency,
  surveyOpenness, setSurveyOpenness, showSurvey, setShowSurvey,
  showPersonalityQuiz, setShowPersonalityQuiz,
  personalityAnswers, setPersonalityAnswers,
  personalityResult, setPersonalityResult,
  setPersonalityCode
}: any) {
  // step0Phase: 'gateway'(全屏入口) | 'quiz'(做题) | 'selector'(手动选卦格) | 'result'(解读展示) | 'completed'(完成/跳过)
  const [step0Phase, setStep0Phase] = useState<'gateway' | 'quiz' | 'selector' | 'result' | 'completed'>(() => {
    if (personalityResult) return 'completed'
    // v0.8: 首页入口区分 — 'quiz' 直接进做题，'skip' 跳过卦格
    // v0.9: 未登录时不直接进 quiz，等 useEffect 拦截
    if (entryAction === 'skip') return 'completed'
    if (entryAction === 'quiz') {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('ln_token') : null
      return token ? 'quiz' : 'gateway'
    }
    return 'gateway'
  })

  // v0.9: 从首页点"开始测卦格"但未登录 → 弹登录引导
  useEffect(() => {
    if (entryAction === 'quiz' && step0Phase === 'gateway') {
      const token = localStorage.getItem('ln_token')
      if (!token) {
        triggerAuthGate('login')
      }
    }
  }, [entryAction])

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* ====================================================
          Step 0: 卦格之问 — 全屏入口 / 做题 / 手动选择
          ==================================================== */}
      {step0Phase !== 'completed' && (
        <div className="step0-overlay">
          <div className="step0-bg-orb" />
          {step0Phase === 'gateway' && (
            <div className="step0-gateway">
              {/* 卦象符号作为视觉锚点 — 取代大白卡片 */}
              <div className="step0-trigram-symbol">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* 三爻：阳阳阳 (干) */}
                  <rect x="14" y="14" width="52" height="6" rx="2" fill="currentColor"/>
                  <rect x="14" y="37" width="52" height="6" rx="2" fill="currentColor"/>
                  <rect x="14" y="60" width="52" height="6" rx="2" fill="currentColor"/>
                </svg>
              </div>

              <div className="step0-label">{D('LATESTNAME · 此刻之名', 'LATESTNAME · DIVINATION')}</div>
              <h1 className="step0-title">{D('开始占卜', 'Begin Divination')}</h1>
              <p className="step0-subtitle">
                {D('测卦格 + 起卦 + 解读，', 'Archetype + Cast + Reading, ')}<br/>
                {D('三步完成一次占卜。', 'three steps to your result.')}
              </p>
              <div className="step0-paths">
                {/* 主路径：大按钮 — 直接放在背景上，不套卡片 */}
                <button className="step0-path-hero" onClick={() => {
                  const token = localStorage.getItem('ln_token')
                  if (!token) { triggerAuthGate('login'); return }
                  setStep0Phase('quiz')
                }}>
                  <span className="step0-hero-label">START</span>
                  <span className="step0-hero-title">{D('测定卦格', 'Discover Your Archetype')}</span>
                  <span className="step0-hero-desc">{D('二十八问 · 三分钟 · 测出你的底色之名', '28 questions · 3 minutes · find your ground-color name')}</span>
                </button>

                {/* 次路径：横向小卡 */}
                <div className="step0-path-secondary">
                  <button className="step0-path-mini" onClick={() => setStep0Phase('selector')}>
                    <span className="step0-mini-title">{D('我已知卦格', 'I already know my archetype')}</span>
                    <span className="step0-mini-desc">{D('十六格中认领', 'Pick from the 16')}</span>
                  </button>
                  <button className="step0-path-mini" onClick={() => { setStep0Phase('completed') }}>
                    <span className="step0-mini-title">{D('直接问事', 'Ask directly')}</span>
                    <span className="step0-mini-desc">{D('跳过卦格测定', 'Skip the archetype quiz')}</span>
                  </button>
                </div>
              </div>
              <p className="step0-brand-line">{D('测卦格 → 起卦 → 解读，三步出结果。', 'Archetype → Cast → Reading. Three steps to your result.')}</p>
            </div>
          )}

          {step0Phase === 'quiz' && (
            <div className="step0-quiz-wrap">
              <PersonalityQuiz
                onComplete={(answers: any) => {
                  setPersonalityAnswers(answers)
                  setPersonalityCode('')  // 做问卷时清空认领代码
                  // v2.2: 自动带 token
                  const token = localStorage.getItem('ln_token')
                  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
                  if (token) headers['Authorization'] = `Bearer ${token}`
                  fetch('/api/personality/result', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ answers }),
                  }).then(async r => {
                    if (r.status === 401) {
                      const errBody = await r.json().catch(() => ({}))
                      triggerAuthGate('login', errBody.detail)
                      throw new Error('auth')
                    }
                    if (r.status === 429) {
                      const errBody = await r.json().catch(() => ({}))
                      triggerAuthGate('quota', errBody.detail)
                      throw new Error('quota')
                    }
                    if (!r.ok) throw new Error('Personality result failed')
                    return r.json()
                  }).then(data => {
                    setPersonalityResult(data)
                    setStep0Phase('result')
                    refreshQuota()  // v2.3: 卦名完成后刷新配额
                  }).catch(e => console.error('Personality result error:', e))
                }}
              />
              <button className="step0-back-btn" onClick={() => setStep0Phase('gateway')}>{D('← 返回', '← Back')}</button>
            </div>
          )}

          {step0Phase === 'selector' && (
            <PersonalitySelector
              onSelect={(code: string, data: any) => {
                setPersonalityResult(data)
                setPersonalityCode(code)  // v2.1: 保存卦格代码，用于后续占卜
                setPersonalityAnswers([])  // 清空问卷答案（认领模式）
                setStep0Phase('result')
              }}
              onBack={() => setStep0Phase('gateway')}
            />
          )}

          {/* === 结果解读展示页（测试/选择完成后，完整解读 + 分享 + 继续问事） === */}
          {step0Phase === 'result' && personalityResult && (
            <div className="step0-result-page">
              <PersonalityCard
                personality={personalityResult}
                onSelectQuestion={(q: string) => {
                  setQuestion(q)
                  setStep0Phase('completed')
                  // 滚动到问事section
                  setTimeout(() => {
                    document.querySelector('.step1-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }, 200)
                }}
              />
              <div className="result-actions">
                <button
                  className="result-share-btn"
                  onClick={async () => {
                    const p = personalityResult
                    try {
                      const portraitUrl = `${import.meta.env.VITE_API_BASE || ''}/static/personalities/${p.name}.png`
                      const { renderPersonalityShareCard, downloadShareImage } = await import('../components/PersonalityShareCard')
                      const dataUrl = await renderPersonalityShareCard({
                        name: p.name,
                        code_display: p.code_display,
                        slogan: p.slogan,
                        trigrams: p.trigrams || [],
                        rarity: p.rarity,
                        portrait: portraitUrl,
                        psychology: p.psychology,
                        career: p.career,
                        growth: p.growth,
                        affinity_hexagrams: p.affinity_hexagrams?.map((h: number) => {
                          const hexNames: Record<number, string> = {1:'干',2:'坤',3:'屯',4:'蒙',5:'需',6:'讼',7:'师',8:'比',9:'小畜',10:'履',11:'泰',12:'否',13:'同人',14:'大有',15:'谦',16:'豫',17:'随',18:'蛊',19:'临',20:'观',21:'噬嗑',22:'贲',23:'剥',24:'复',25:'无妄',26:'大畜',27:'颐',28:'大过',29:'坎',30:'离',31:'咸',32:'恒',33:'遁',34:'大壮',35:'晋',36:'明夷',37:'家人',38:'睽',39:'蹇',40:'解',41:'损',42:'益',43:'夬',44:'姤',45:'萃',46:'升',47:'困',48:'井',49:'革',50:'鼎',51:'震',52:'艮',53:'渐',54:'归妹',55:'丰',56:'旅',57:'巽',58:'兑',59:'涣',60:'节',61:'中孚',62:'小过',63:'既济',64:'未济'}
                          return hexNames[h] || `${h}卦`
                        }),
                      })
                      downloadShareImage(dataUrl, `Latestname-${p.name}.png`)
                    } catch (e) {
                      console.error('Share card error:', e)
                      // Fallback: 纯文本分享
                      const shareText = D(`我的底色之名是「${p.name}」——${p.slogan}\n${p.code_display}`, `My archetype is “${p.name}” — ${p.slogan}\n${p.code_display}`)
                      try {
                        await navigator.clipboard.writeText(shareText)
                        alert(D('已复制到剪贴簿 ✓', 'Copied to clipboard ✓'))
                      } catch {}
                    }
                  }}
                >
                  <span className="result-share-icon">⤴</span> {D('保存卦格卡片', 'Save archetype card')}
                </button>
                <button
                  className="result-continue-btn"
                  onClick={() => setStep0Phase('completed')}
                >
                  {D('继续问事 →', 'Ask a question →')}
                </button>
                <button
                  className="btn-text result-redo"
                  onClick={() => setStep0Phase('gateway')}
                >
                  {D('↻ 重新测定', '↻ Retake')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 0 完成/跳过后的展示 */}
      {step0Phase === 'completed' && (
        <>
          {personalityResult ? (
            <div className="step0-result-summary">
              <div className="step0-summary-glow" />
              <div className="step0-summary-label">{D('✦ 你的底色之名 ✦', '✦ YOUR ARCHETYPE ✦')}</div>
              <div className="step0-summary-trigrams">
                {personalityResult.trigrams?.map((t: string, i: number) => (
                  <span key={i} className="step0-trigram-chip">{t}</span>
                ))}
              </div>
              <h2 className="step0-summary-name name-reveal" key={personalityResult.code}>
                {personalityResult.name}
              </h2>
              <div className="step0-summary-code">{personalityResult.code_display}</div>
              <div className="step0-summary-slogan">「{personalityResult.slogan}」</div>
              <button className="btn-text step0-redo" onClick={() => setStep0Phase('gateway')}>
                {D('↻ 重新测定', '↻ Retake')}
              </button>
            </div>
          ) : (
            <div className="step0-skipped-hint">
              <span className="step0-skip-text">{D('未测卦格 · 天机之答将少一层维度', 'No archetype yet — readings will lack that layer')}</span>
              <button className="btn-text step0-redo" onClick={() => setStep0Phase('gateway')}>
                {D('⟡ 补测卦格', '⟡ Discover archetype')}
              </button>
            </div>
          )}
        </>
      )}

      {/* ====================================================
          Step 1: 问事 — 仅在 Step 0 完成/跳过后才显示
          视觉与叩玄统一：暗金底色 + 玻璃卡 + 衬线宋体
          ==================================================== */}
      {step0Phase === 'completed' && (
      <>
      <div className="step1-section">
        {/* 卦格陪伴者 — 让卦格作为「对话伙伴」全程在场 */}
        {personalityResult && (
          <div className="step1-companion">
            <div className="step1-companion-avatar">
              <img
                src={`${import.meta.env.VITE_API_BASE || ''}/static/personalities/${personalityResult.name}.png`}
                alt={personalityResult.name}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <div className="step1-companion-body">
              <div className="step1-companion-line">
                <span className="step1-companion-name">{personalityResult.name}</span>
                <span className="step1-companion-status">{D('陪伴中 · 问卦状态', 'With you · casting')}</span>
              </div>
              <div className="step1-companion-slogan">「{personalityResult.slogan}」</div>
            </div>
            <button
              className="step1-companion-redo"
              onClick={() => setStep0Phase('gateway')}
              title={D('重新测卦格', 'Retake archetype')}
            >
              ↻
            </button>
          </div>
        )}

        {/* 章节标题 */}
        <div className="step1-header">
          <div className="step1-label">{D('LATESTNAME · 占卜', 'LATESTNAME · DIVINATION')}</div>
          <h2 className="step1-title">{D('问 事', 'Your Question')}</h2>
          {personalityResult ? (
            <p className="step1-subtitle">
              {D('以', 'Through the lens of')}「{personalityResult.name}」{D('之底色解读。', ' — your archetype colors the reading.')}<br/>
              <span className="step1-subtitle-dim">{D('测过卦格，解读会更贴合你的性格。', 'Your archetype makes the reading feel more like you.')}</span>
            </p>
          ) : (
            <p className="step1-subtitle">
              {D('写下你的疑问，点击起卦。', 'Write your question, then cast.')}<br/>
              <span className="step1-subtitle-dim">{D('未测卦格，解读会少一层个人维度。', 'Without an archetype, the reading loses a personal layer.')}</span>
            </p>
          )}
        </div>

      {/* 模式选择 */}
      <div className="step1-mode-row">
        {[
          { key: 'combined', cn_zh: '融合', cn_en: 'Fusion', desc_zh: '易经×塔罗 双系统共振', desc_en: 'I Ching × Tarot — dual-system resonance',
            tip_zh: '易经×塔罗双系统共振——同一问题同时起卦与抽牌，找到东西方占卜体系的共振点。最全面，推荐使用。',
            tip_en: 'I Ching and Tarot read the same question through two systems, finding the resonance point between Eastern and Western divination. Most thorough — recommended.' },
          { key: 'iching', cn_zh: '易经', cn_en: 'I Ching', desc_zh: '金钱卦 · 六爻排盘', desc_en: 'Coin cast · 6-line reading',
            tip_zh: '金钱卦起卦——6 爻铜钱法生成卦象，含变卦、错卦、综卦、互卦，传统易学排盘。',
            tip_en: 'Coin cast generates a hexagram via 6 coin-tossed lines, including the changed, opposing, reversed, and nuclear hexagrams.' },
          { key: 'tarot', cn_zh: '塔罗', cn_en: 'Tarot', desc_zh: '牌阵 · 正逆位解读', desc_en: 'Spread · upright & reversed',
            tip_zh: '塔罗牌阵——按位置语义（过去/现在/未来）抽牌，含正逆位解读。3 张塔罗牌的时间序列解读。',
            tip_en: 'Tarot spread — draw by position semantics (past / present / future) with upright and reversed meanings. A 3-card tarot timeline reading.' },
        ].map(m => (
          <div key={m.key} className="step1-mode-card-wrap">
            <button
              onClick={() => setMode(m.key)}
              className={`step1-mode-card ${mode === m.key ? 'active' : ''}`}
              onMouseEnter={(e) => {
                const tip = (e.currentTarget.parentElement?.querySelector('.mode-tip') as HTMLElement)
                if (tip) tip.style.opacity = '1'
              }}
              onMouseLeave={(e) => {
                const tip = (e.currentTarget.parentElement?.querySelector('.mode-tip') as HTMLElement)
                if (tip) tip.style.opacity = '0'
              }}
            >
              <span className="step1-mode-cn">{D(m.cn_zh, m.cn_en)}</span>
              <span className="step1-mode-desc">{D(m.desc_zh, m.desc_en)}</span>
            </button>
            <div className="mode-tip" style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '240px',
              padding: '0.7rem 0.9rem',
              background: 'var(--surface)',
              border: '1px solid var(--separator)',
              borderRadius: '6px',
              fontSize: '0.76rem',
              lineHeight: 1.6,
              color: 'var(--text-secondary)',
              opacity: 0,
              transition: 'opacity 0.3s ease',
              pointerEvents: 'none',
              zIndex: 100,
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}>
              {D(m.tip_zh, m.tip_en)}
            </div>
          </div>
        ))}
      </div>

      <textarea
        value={question}
        onChange={e => setQuestion(e.target.value)}
        placeholder={D('（可选）写下你要问的事⋯留空也可直接起卦', '(optional) Write your question… leave blank to cast directly')}
        rows={3}
        maxLength={200}
        className="step1-textarea"
        style={{ display: 'none' }}
      />
      <div className="step1-char-count" style={{ display: 'none' }}>
        {question.length}/200 · {D('留空也可直接起卦', 'leave blank to cast directly')}
      </div>
      </div>

      {/* v5: 八字和问题移到结果页深度解读，首页不再显示 */}
      {false && (
      <div style={{ marginTop: '1.5rem' }}>
        <button
          onClick={() => setShowBazi(!showBazi)}
          className="btn-ghost"
          style={{ fontSize: '0.85rem', padding: '0.4rem 1rem', width: '100%' }}
        >
          {showBazi ? '▾' : '▸'} 生辰八字（可选·提升精准度）
        </button>
        <div className={`expand-panel ${showBazi ? 'open' : ''}`}>
          <div style={{ padding: '1.5rem 0.5rem 0.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.8rem', marginBottom: '1rem' }}>
              <div>
                <label className="label" style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.3rem' }}>年</label>
                <input type="number" value={birthYear} onChange={e => setBirthYear(e.target.value)}
                  placeholder="1996" min="1900" max="2100" style={{ textAlign: 'center' }} />
              </div>
              <div>
                <label className="label" style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.3rem' }}>月</label>
                <input type="number" value={birthMonth} onChange={e => setBirthMonth(e.target.value)}
                  placeholder="6" min="1" max="12" style={{ textAlign: 'center' }} />
              </div>
              <div>
                <label className="label" style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.3rem' }}>日</label>
                <input type="number" value={birthDay} onChange={e => setBirthDay(e.target.value)}
                  placeholder="15" min="1" max="31" style={{ textAlign: 'center' }} />
              </div>
              <div>
                <label className="label" style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.3rem' }}>时</label>
                <input type="number" value={birthHour} onChange={e => setBirthHour(e.target.value)}
                  placeholder="10" min="0" max="23" style={{ textAlign: 'center' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label className="label" style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.3rem' }}>性别</label>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  {['male', 'female', 'unknown'].map(g => (
                    <button key={g} onClick={() => setGender(g)}
                      className={gender === g ? 'btn-primary' : 'btn-ghost'}
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.8rem', flex: 1 }}>
                      {g === 'male' ? '男' : g === 'female' ? '女' : '不填'}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label className="label" style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.3rem' }}>姓名（可选）</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="化名" maxLength={20} />
              </div>
            </div>
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <label className="label" style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.3rem' }}>
                出生城市（用于真太阳时校正·提升八字精度）
              </label>
              <input
                type="text"
                value={birthCity}
                onChange={async (e) => {
                  const v = e.target.value
                  setBirthCity(v)
                  if (v.length >= 1) {
                    setShowCitySuggest(true)
                    const results = await searchCities(v)
                    setCityOptions(results)
                  } else {
                    setCityOptions([])
                    setShowCitySuggest(false)
                  }
                }}
                onFocus={() => { if (birthCity) setShowCitySuggest(true) }}
                onBlur={() => setTimeout(() => setShowCitySuggest(false), 200)}
                placeholder="上海 / 北京 / 杭州 / 拼音也行"
                autoComplete="off"
              />
              {showCitySuggest && cityOptions.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0,
                  background: 'var(--onyx-black-light)',
                  border: '1px solid var(--separator)',
                  borderRadius: '4px',
                  marginTop: '4px',
                  zIndex: 10,
                  maxHeight: '200px', overflowY: 'auto',
                }}>
                  {cityOptions.map((c: any) => (
                    <div
                      key={c.name}
                      onClick={() => {
                        setBirthCity(c.name)
                        setShowCitySuggest(false)
                      }}
                      style={{
                        padding: '0.5rem 0.8rem',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--separator)',
                        fontSize: '0.9rem',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(184, 149, 106, 0.15)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ color: 'var(--onyx-white)' }}>{c.name}</span>
                      <span style={{ color: 'var(--onyx-gold-dim)', marginLeft: '0.5rem', fontSize: '0.8rem' }}>
                        {c.province} · {D('经度', 'lon.')} {c.lng}°
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="body-text" style={{ fontSize: '0.75rem', opacity: 0.5, fontStyle: 'italic' }}>
              ✦ 八字信息将融入占卜种子并传递给 AI，使解读更贴合个人命局。
            </p>
          </div>
        </div>
      </div>
      )}

      {error && (
        <div style={{ color: 'var(--onyx-crimson)', textAlign: 'center', margin: '1rem 0' }}>
          {error}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={onStart} className="btn-primary">
          {D('叩 玄 · Cast', 'Knock the Mystery · Cast')}
        </button>
      </div>

      <p className="body-text" style={{
        textAlign: 'center', marginTop: '2rem',
        fontSize: '0.9rem', fontStyle: 'italic', opacity: 0.6,
      }}>
        {D('选好模式，心中默念你的问题，即可起卦。', 'Pick a mode, hold your question in mind, then cast.')}<br/>
        {D('卦象揭晓后，可选择输入问题与八字，获取 AI 深度解读。', 'After the hexagram reveals itself, optionally add your question and birth info for a deeper AI reading.')}
      </p>
      </>
      )}
    </div>
  )
}
// ============================================================
// 呼吸引导（v0.2: 缩短+可跳过）
// ============================================================
// ============================================================
// Latestname v1.1: 问卷单题组件
// ============================================================
function SurveyQuestion({ label, subtitle, options, value, onChange }: {
  label: string; subtitle: string;
  options: { v: string; cn: string; icon: string }[];
  value: string; onChange: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom: '1.2rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <span style={{ fontFamily: 'var(--font-serif-cn)', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
          {label}
        </span>
        <span style={{ fontFamily: 'var(--font-system)', fontSize: '0.7rem', color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}>
          {subtitle}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {options.map(opt => (
          <button
            key={opt.v}
            onClick={() => onChange(opt.v)}
            className={value === opt.v ? 'btn-primary' : 'btn-ghost'}
            style={{
              fontSize: '0.8rem', padding: '0.35rem 0.8rem',
              opacity: value === opt.v ? 1 : 0.7,
              transition: 'all 0.2s',
            }}
          >
            <span style={{ marginRight: '0.3rem' }}>{opt.icon}</span>
            {opt.cn}
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// Latestname v1.2: 此刻之名展示卡 — 从卦象爻辞中生长
// ============================================================
function LatestNameCard({ latestName }: { latestName: any }) {
  const { name, source, source_type, meaning, hexagram_name, changed_name, changed_source, changed_meaning, changed_hexagram_name } = latestName

  return (
    <div className="card glass fade-in" style={{
      textAlign: 'center',
      padding: '3rem 2rem',
      marginBottom: '2rem',
      position: 'relative',
      overflow: 'hidden',
      borderTop: '1px solid var(--accent)',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute',
        top: '30%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '400px', height: '300px',
        background: 'radial-gradient(ellipse, var(--accent-glow, rgba(184,149,106,0.15)) 0%, transparent 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none',
      }} />

      <div className="label" style={{ position: 'relative', marginBottom: '1.5rem' }}>
        ✦ {D('Latestname · 此 刻 之 名', 'Latestname · NAME OF THE MOMENT')} ✦
      </div>

      {/* 大字名号 */}
      <div style={{
        position: 'relative',
        fontFamily: 'var(--font-serif-cn)',
        fontSize: '4rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        marginBottom: '0.3rem',
        letterSpacing: '0.2em',
        textShadow: '0 0 40px var(--accent-glow, rgba(184,149,106,0.3))',
        animation: 'nameReveal 1s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {name}
      </div>

      {/* 周易出处 */}
      <div style={{
        position: 'relative',
        fontFamily: 'var(--font-serif-cn)',
        fontSize: '0.85rem',
        color: 'var(--accent)',
        marginBottom: '0.5rem',
        opacity: 0.9,
      }}>
        {D('出自《', 'From ')}{hexagram_name}{D('卦 · ', ' hexagram · ')}{source_type}{D('》', '')}
      </div>
      <div style={{
        position: 'relative',
        fontFamily: 'var(--font-serif-cn)',
        fontSize: '0.9rem',
        color: 'var(--text-secondary)',
        fontStyle: 'italic',
        marginBottom: '0.8rem',
        lineHeight: 1.6,
      }}>
        「{source}」
      </div>

      {/* 释义 */}
      <div style={{
        position: 'relative',
        fontFamily: 'var(--font-serif-cn)',
        fontSize: '1rem',
        color: 'var(--text-primary)',
        opacity: 0.85,
        lineHeight: 1.8,
        maxWidth: '400px',
        margin: '0 auto 1.5rem',
      }}>
        {meaning}
      </div>

      {/* 变名（如有） */}
      {changed_name && (
        <div style={{
          position: 'relative',
          borderTop: '0.5px solid var(--separator)',
          paddingTop: '1.5rem',
          marginTop: '1rem',
        }}>
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--text-tertiary)',
            marginBottom: '0.8rem',
          }}>
            {D('动爻指向 · 变名', 'From the moving line · variant name')}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}>
            <span style={{
              fontFamily: 'var(--font-serif-cn)',
              fontSize: '1.5rem',
              color: 'var(--text-secondary)',
              opacity: 0.5,
            }}>
              {name}
            </span>
            <span style={{
              color: 'var(--accent)',
              fontSize: '1.2rem',
            }}>
              →
            </span>
            <span style={{
              fontFamily: 'var(--font-serif-cn)',
              fontSize: '1.8rem',
              fontWeight: 600,
              color: 'var(--accent)',
              textShadow: '0 0 20px var(--accent-glow, rgba(184,149,106,0.4))',
            }}>
              {changed_name}
            </span>
          </div>
          <div style={{
            fontFamily: 'var(--font-serif-cn)',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            fontStyle: 'italic',
            marginTop: '0.5rem',
          }}>
            「{changed_source}」
          </div>
          <div style={{
            fontFamily: 'var(--font-serif-cn)',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            marginTop: '0.3rem',
            opacity: 0.7,
          }}>
            {changed_meaning}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// 呼吸引导（v0.2: 缩短+可跳过）
// ============================================================
// ============================================================
// 仪式化占卜流程 - 7 个新组件
// ============================================================

// 0. 加载中（获取后端数据时的过渡画面）
function CastingLoadingView({ personalityName }: { personalityName?: string }) {
  return (
    <div className="ritual-open">
      <div className="ritual-open-bg" />
      <div className="ritual-open-content">
        <div className="casting-loading">
          <div className="casting-loading-spinner">
            <div className="casting-loading-spinner-inner">☯</div>
          </div>
          <div className="casting-loading-text">
            {personalityName ? `${personalityName} ${D('正在为你起卦', 'is casting for you')}` : D('天 地 起 卦 中', 'Casting…')}
          </div>
        </div>
      </div>
    </div>
  )
}

// 1. 仪式开场 — 让用户心中默念问题
function RitualOpenView({ question, personalityName, personalityCode, personalityPortrait, onBegin, onBack }: {
  question: string
  personalityName?: string
  personalityCode?: string
  personalityPortrait?: string
  onBegin: () => void
  onBack: () => void
}) {
  return (
    <div className="ritual-open">
      <div className="ritual-open-bg" />
      {/* 漂浮粒子背景 */}
      <div className="ritual-open-particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="ritual-particle"
            style={{
              left: `${2 + (i * 4.8) % 96}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${3.5 + (i % 4) * 0.8}s`,
            }}
          />
        ))}
      </div>

      <div className="ritual-open-content">
        {/* 卦格头像 — 如果测过 */}
        {personalityName && (
          <div className="ritual-open-companion">
            <div className="ritual-open-companion-avatar">
              <img
                src={`${import.meta.env.VITE_API_BASE || ''}/static/personalities/${personalityPortrait}.png`}
                alt={personalityName}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <div className="ritual-open-companion-text">
              <div className="ritual-open-companion-label">{personalityName} · 陪伴</div>
              <div className="ritual-open-companion-code">{personalityCode}</div>
            </div>
          </div>
        )}

        {/* 问题回显 — 如果用户输入了问题才显示 */}
        {question && question.trim() && (
          <div className="ritual-open-question">
            <div className="ritual-open-question-label">你 问 的 事</div>
            <div className="ritual-open-question-text">「{question}」</div>
          </div>
        )}

        {/* 默念引导 */}
        <div className="ritual-open-meditation">
          <div className="ritual-open-meditation-icon">
            <div className="candle-flame" />
          </div>
          <p className="ritual-open-meditation-text">
            闭 上 眼 睛
            <br/>
            {question && question.trim() ? (
              <>心 中 默 念 你 的 问 题 三 遍</>
            ) : (
              <>心 中 想 清 楚 你 要 问 什 么</>
            )}
            <br/>
            <span className="ritual-open-meditation-hint">不是嘴上念 — 是真的在心里「想清楚」</span>
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="ritual-open-actions">
          <button className="ritual-open-begin-btn" onClick={onBegin}>
            <span className="ritual-open-begin-icon">✦</span>
            心 中 默 念 好 了 · {D('开 始 起 卦', 'BEGIN CAST')}
          </button>
          <button className="ritual-open-back-btn" onClick={onBack}>
            ← 返 回
          </button>
        </div>
      </div>
    </div>
  )
}

// 2. 抛铜钱 — 用户每次点 [抛] 揭示下一爻
function CoinCastingView({ coinStep, coinThrowing, revealedCoins, coinThrows, lineTotals, changingLines, yaoNames, personalityName, onThrow }: {
  coinStep: number
  coinThrowing: boolean
  revealedCoins: boolean[]
  coinThrows: number[][]
  lineTotals: number[]
  changingLines: number[]
  yaoNames: any
  personalityName?: string
  onThrow: () => void
}) {
  // 默念引导文案 — 随爻数变化
  const hintText = D(
    [
      '把三枚铜钱合在手中。心中默念你的问题。准备抛下。',
      '再抛一次。每一爻都关系到你问题的走向。',
      '已经过半。继续 — 完成起卦。',
      '心中保持专注。你问的事正在成形。',
      '这是动爻的关键 — 它代表「变化」的所在。',
      '最后一爻。这一爻将决定最终的卦象。',
    ][Math.min(coinStep, 5)] || ['', ''].pop()!,
    [
      'Hold three coins in your hand. Silently speak your question. Ready to toss.',
      'Toss again. Each line shapes how your question unfolds.',
      'Past halfway. Keep going — complete the cast.',
      'Stay focused. What you asked is taking shape.',
      "This is the changing line — the seat of transformation.",
      'The final line. It seals the hexagram.',
    ][Math.min(coinStep, 5)] || ''
  )

  // 当前爻的爻名（如「初九」「六二」等）
  const currentYaoName = yaoNames[coinStep] || `${coinStep + 1}爻`

  // 已抛出的爻 → 渲染
  const renderedLines = revealedCoins.map((shown, i) => {
    if (!shown) return null
    const total = lineTotals[i] || 0
    const isYang = total === 9 || total === 7  // 9=老阳 7=少阳
    const isChanging = changingLines.includes(i)
    return (
      <div key={i} className="coin-line-display">
        <span className="coin-line-name">{yaoNames[i] || `${i+1}爻`}</span>
        <div className="coin-line-symbol">
          {isYang ? <span className="line-yang"></span> : <span className="line-yin"></span>}
          {isChanging && <span className="coin-line-changing">×</span>}
        </div>
      </div>
    )
  }).filter(Boolean).reverse()  // 从下到上显示（即最后一个爻在最上）

  return (
    <div className="coin-casting">
      <div className="ritual-open-bg" />

      <div className="coin-casting-content">
        <div className="coin-casting-header">
          <div className="label">{D('金 钱 起 卦 · 六 爻', 'COIN CASTING · 6 LINES')}</div>
          <div className="coin-casting-progress">第 {coinStep + 1} 爻 / 共 6 爻</div>
        </div>

        {/* 卦格陪伴语 */}
        {personalityName && (
          <div className="coin-casting-companion-voice">
            {personalityName}：心中默念 — 抛。
          </div>
        )}

        {/* 铜钱展示 */}
        <div className="coin-display-area">
          <div className={`coin-stack ${coinThrowing ? 'throwing' : ''}`}>
            {[0, 1, 2].map(i => {
              // 当前爻已揭示 → 显示实际结果
              const isRevealed = revealedCoins[coinStep - 1] || (coinStep >= 6)
              const revealIdx = coinStep >= 6 ? 5 : coinStep - 1
              const isThisRevealed = coinStep > 0 && revealedCoins[revealIdx]
              // 获取这一爻的铜钱结果 [2|3, 2|3, 2|3] (2=阴/背, 3=阳/字)
              const currentCoins = isThisRevealed ? (coinThrows[revealIdx] || [3, 3, 3]) : null
              const coinValue = currentCoins ? currentCoins[i] : 3
              const isYang = coinValue === 3

              return (
                <div key={i} className={`coin-piece ${isThisRevealed ? (isYang ? 'landed-yang' : 'landed-yin') : ''}`}>
                  <div className="coin-face coin-front">
                    <div className="coin-yang">阳</div>
                  </div>
                  <div className="coin-face coin-back">
                    <div className="coin-yin">阴</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 铜钱结果文字提示 */}
          {coinStep > 0 && coinStep <= 6 && revealedCoins[coinStep - 1] && (
            <div className="coin-result-text">
              {(() => {
                const idx = coinStep - 1
                const total = lineTotals[idx] || 0
                const coins = coinThrows[idx] || []
                const yangCount = coins.filter((c: number) => c === 3).length
                const yinCount = coins.filter((c: number) => c === 2).length
                const isChanging = changingLines.includes(idx)
                const isYang = total === 9 || total === 7
                const typeName = total === 9 ? '老阳（动）' : total === 7 ? '少阳' : total === 8 ? '少阴' : '老阴（动）'
                return (
                  <div className="coin-result-block">
                    <div className="coin-result-counts">
                      <span className="coin-count-yang">{yangCount} 阳</span>
                      <span className="coin-count-sep">·</span>
                      <span className="coin-count-yin">{yinCount} 阴</span>
                    </div>
                    <div className="coin-result-symbol">
                      <strong>{isYang ? '——— 阳爻' : '— — 阴爻'}</strong>
                      {isChanging && <span className="coin-changing-mark"> ⚡ 动爻</span>}
                    </div>
                    <div className="coin-type-name">{typeName}</div>
                  </div>
                )
              })()}
            </div>
          )}
        </div>

        {/* 默念引导 */}
        <div className="coin-meditation-hint">
          {hintText}
        </div>

        {/* 抛按钮 */}
        <button
          className="coin-throw-btn"
          onClick={onThrow}
          disabled={coinThrowing}
        >
          {coinThrowing ? '铜 钱 落 地 中...' : '✦ 抛'}
        </button>

        {/* 已抛出的爻（累积显示） */}
        {coinStep > 0 && (
          <div className="coin-lines-accumulated">
            <div className="coin-lines-label">已 得 之 爻</div>
            <div className="coin-lines-stack">
              {renderedLines}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// 3. 揭示卦象
function CastRevealView({ iching, personalityName, onContinue }: {
  iching: any
  personalityName?: string
  onContinue: () => void
}) {
  const original = iching?.original
  const changed = iching?.changed
  const changingLines = iching?.changing_lines || []

  return (
    <div className="cast-reveal">
      <div className="ritual-open-bg" />

      <div className="cast-reveal-content">
        <div className="label">卦 象 已 成</div>

        {/* 本卦 */}
        <div className="cast-reveal-hex">
          <div className="cast-reveal-hex-label">本 卦</div>
          <div className="cast-reveal-hex-svg">
            {/* 用文字爻渲染 — 自下而上 */}
            {(() => {
              const binary = original?.binary || ''
              // binary[0] 是最下爻，反转让最下爻先渲染（视觉上从上到下显示上爻到下爻）
              const lines = binary.split('')
              const visualOrder = [...lines].reverse()  // 从上爻到下爻渲染
              return visualOrder.map((b: string, i: number) => {
                const yaoIdx = lines.length - 1 - i  // 反推爻位置 0=初爻 5=上爻
                const isChanging = changingLines.includes(yaoIdx)
                return (
                  <div key={i} className={`hexagram-line-row ${isChanging ? 'changing' : ''}`}>
                    {b === '1' ? (
                      <div className="hexagram-line yang"></div>
                    ) : (
                      <div className="hexagram-line yin">
                        <span className="hexagram-line-half"></span>
                        <span className="hexagram-line-half"></span>
                      </div>
                    )}
                  </div>
                )
              })
            })()}
          </div>
          <div className="cast-reveal-hex-name">{original?.name}</div>
          <div className="cast-reveal-hex-juzge">{original?.judgment}</div>
        </div>

        {/* 变卦 */}
        {changed && (
          <div className="cast-reveal-hex changed">
            <div className="cast-reveal-hex-label">之 卦 · 未来之势</div>
            <div className="cast-reveal-hex-svg">
              {(() => {
                const binary = changed?.binary || ''
                const lines = binary.split('')
                const visualOrder = [...lines].reverse()
                return visualOrder.map((b: string, i: number) => (
                  <div key={i} className="hexagram-line-row">
                    {b === '1' ? (
                      <div className="hexagram-line yang"></div>
                    ) : (
                      <div className="hexagram-line yin">
                        <span className="hexagram-line-half"></span>
                        <span className="hexagram-line-half"></span>
                      </div>
                    )}
                  </div>
                ))
              })()}
            </div>
            <div className="cast-reveal-hex-name">{changed?.name}</div>
            <div className="cast-reveal-hex-juzge">{changed?.judgment}</div>
          </div>
        )}

        {/* 动爻信息 */}
        {changingLines.length > 0 && (
          <div className="cast-reveal-changing">
            <div className="cast-reveal-changing-label">动 爻</div>
            <div className="cast-reveal-changing-text">
              {changingLines.map((idx: number) => iching?.yao_names?.[idx] || `${idx+1}爻`).join(' · ')}
            </div>
            <div className="cast-reveal-changing-hint">
              动爻代表「变化」的位置 — 之卦正是从动爻变化而来。
            </div>
          </div>
        )}

        {/* 卦格简短解读 */}
        {personalityName && (
          <div className="cast-reveal-companion-voice">
            {personalityName}：卦已成。但天机未尽 — 让塔罗告诉你「此刻」的细节。
          </div>
        )}

        {/* 继续按钮 */}
        <button className="cast-reveal-continue-btn" onClick={onContinue}>
          {changed ? `${D('翻 开 之 卦', 'Show Changed')} →` : `${D('查 看 塔 罗', 'View Tarot')} →`}
        </button>
      </div>
    </div>
  )
}

// 4. 洗塔罗牌
function TarotShuffleView({ personalityName, shuffled, onContinue }: {
  personalityName?: string
  shuffled: boolean
  onContinue: () => void
}) {
  return (
    <div className="tarot-shuffle">
      <div className="ritual-open-bg" />

      <div className="tarot-shuffle-content">
        <div className="label">洗 牌</div>

        <div className="tarot-shuffle-deck">
          {/* 牌堆的视觉表示 */}
          <div className={`tarot-shuffle-stack ${shuffled ? 'shuffled' : ''}`}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="tarot-card-back-mini" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        </div>

        <div className="tarot-shuffle-hint">
          {!shuffled ? (
            <>点击下方洗牌 — 抽 3 张塔罗</>
          ) : (
            <>牌已洗好 · 下面凭直觉抽 3 张</>
          )}
        </div>

        {personalityName && (
          <div className="tarot-shuffle-companion-voice">
            {personalityName}：洗牌让能量均匀。接下来选 3 张 — 凭直觉。
          </div>
        )}

        <button className="tarot-shuffle-btn" onClick={onContinue}>
          {shuffled ? '开 始 抽 牌 →' : '✦ 洗 牌'}
        </button>
      </div>
    </div>
  )
}

// 5. 抽 3 张塔罗 — 3 张大牌横向展开，依次翻开
function TarotPickView({ tarotCards, pickedIdx, personalityName, onPick, deck, stage, picks }: {
  tarotCards: any[]
  pickedIdx: number[]
  personalityName?: string
  onPick: (idx: number) => void
  deck?: any[]      // v5: 候选牌堆 [{position, label, candidates:[...]}, ...]
  stage?: number    // v5: 当前选牌阶段 0=过去 1=现在 2=未来
  picks?: number[]  // v5: 每个阶段已选的候选idx
}) {
  // v5: 分阶段选牌模式
  const hasDeck = deck && deck.length > 0
  const currentStage = stage ?? 0
  const stageLabels = ['过 去', '现 在', '未 来']
  const stageHints = [
    '凭直觉选出代表你「过去」的牌',
    '选出代表你「现在」的牌',
    '选出代表你「未来」的牌',
  ]
  const stageIcons = ['☽', '✦', '☀']

  // 已选阶段的展示
  const completedStages = (picks || []).slice(0, currentStage)

  if (hasDeck && currentStage < 3) {
    const currentPos = deck![currentStage]
    const candidates = currentPos?.candidates || []
    const currentLabel = currentPos?.label || stageLabels[currentStage]

    return (
      <div className="tarot-pick">
        <div className="ritual-open-bg" />

        <div className="tarot-pick-content">
          <div className="label">抽 牌 · 凭 直 觉</div>

          {/* 进度指示器 */}
          <div className="tarot-pick-progress-bar">
            {stageLabels.map((lbl, i) => (
              <div key={i} className={`tp-stage-dot ${i < currentStage ? 'done' : ''} ${i === currentStage ? 'active' : ''} ${i > currentStage ? 'pending' : ''}`}>
                <span className="tp-stage-icon">{i < currentStage ? '✓' : stageIcons[i]}</span>
                <span className="tp-stage-label">{lbl}</span>
              </div>
            ))}
          </div>

          {personalityName && (
            <div className="tarot-pick-companion-voice">
              {personalityName}：{stageHints[currentStage]}
            </div>
          )}

          {/* 当前位置的候选牌 */}
          <div className="tp-current-label">
            <span className="tp-current-icon">{stageIcons[currentStage]}</span>
            <span className="tp-current-text">{currentLabel} · {currentPos?.meaning || ''}</span>
          </div>

          <div className="tp-candidates">
            {candidates.map((cand: any, i: number) => (
              <button
                key={i}
                className="tp-candidate-card"
                onClick={() => onPick(i)}
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                <div className="tp-candidate-inner">
                  <div className="tp-candidate-pattern">
                    <div className="tp-candidate-ornament-top">✦</div>
                    <div className="tp-candidate-ornament-lines">
                      <div className="tp-cl" /><div className="tp-cl" /><div className="tp-cl" />
                    </div>
                    <div className="tp-candidate-ornament-center">
                      <div className="tp-cd" />
                    </div>
                    <div className="tp-candidate-ornament-bot">✧</div>
                  </div>
                </div>
                <div className="tp-candidate-hint">选 此 牌</div>
              </button>
            ))}
          </div>

          {/* 已选阶段的牌（背面朝上小卡） */}
          {completedStages.length > 0 && (
            <div className="tp-completed-row">
              {completedStages.map((pickIdx, i) => (
                <div key={i} className="tp-completed-chip">
                  <span className="tp-completed-icon">{stageIcons[i]}</span>
                  <span>{stageLabels[i]} ✓</span>
                </div>
              ))}
            </div>
          )}

          <div className="tarot-pick-hint">
            凭 直 觉 · 避 免 思 考 · 第 一 感 觉 最 重 要
          </div>
        </div>
      </div>
    )
  }

  // Fallback: 旧版3张并排（兼容）
  return (
    <div className="tarot-pick">
      <div className="ritual-open-bg" />
      <div className="tarot-pick-content">
        <div className="label">抽 牌 · 凭 直 觉</div>
        <div className="tarot-pick-progress">
          已 选 <span className="tarot-pick-count">{pickedIdx.length}</span> / 3 张
        </div>
        <div className="tarot-pick-hint">凭直觉选牌</div>
      </div>
    </div>
  )
}

// 6. 揭示塔罗
function TarotRevealView({ tarotCards, pickedIdx, personalityName, onContinue }: {
  tarotCards: any[]
  pickedIdx: number[]
  personalityName?: string
  onContinue: () => void
}) {
  const positionLabels = ['过 去 · 来 因', '现 在 · 核 心', '未 来 · 走 向']
  const positionIcons = [' ☽ ', ' ✦ ', ' ☀ ']

  return (
    <div className="tarot-reveal">
      <div className="ritual-open-bg" />

      <div className="tarot-reveal-content">
        <div className="label">{D('塔 罗 启 示', 'TAROT REVEALED')}</div>
        <div className="tarot-reveal-subtitle">三 张 牌 已 翻 开</div>

        <div className="tarot-reveal-cards">
          {pickedIdx.map((idx, pos) => {
            const card = tarotCards[idx % tarotCards.length]
            if (!card) return null
            const c = card.card
            const imgUrl = getTarotImage(c.id)
            return (
              <div key={idx} className="tarot-reveal-card-wrap" style={{ animationDelay: `${0.2 + pos * 0.5}s` }}>
                <div className="tarot-reveal-position">
                  {positionIcons[pos]} {positionLabels[pos]}
                </div>
                <div className={`tarot-reveal-card-row ${card.reversed ? 'reversed' : ''}`}>
                  {/* 牌面图片 */}
                  <div className={`tarot-reveal-card-art ${card.reversed ? 'flipped' : ''}`}>
                    <img src={imgUrl} alt={c.name_cn} loading="lazy"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                  {/* 牌信息 */}
                  <div className="tarot-reveal-card-info">
                    <div className="tarot-reveal-card-name">{c.name_cn}</div>
                    <div className="tarot-reveal-card-en">{c.name}</div>
                    <div className={`tarot-reveal-card-status ${card.reversed ? 'rev' : ''}`}>
                      {card.reversed ? '↻ 逆 位' : '● 正 位'}
                    </div>
                    <div className="tarot-reveal-keywords">
                      {(card.reversed ? c.keywords_reversed : c.keywords || []).slice(0, 3).map((kw: string, i: number) => (
                        <span key={i} className="tarot-reveal-keyword">{kw}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="tarot-reveal-meaning">
                  {card.reversed ? c.reversed_meaning : c.upright_meaning}
                </div>
              </div>
            )
          })}
        </div>

        {personalityName && (
          <div className="tarot-reveal-companion-voice">
            {personalityName}：三张牌已出。现在让我用我的视角，告诉你这一切意味着什么。
          </div>
        )}

        <button className="tarot-reveal-continue-btn" onClick={onContinue}>
          {personalityName ? `让 ${personalityName} 解 读 →` : '查 看 完 整 答 案 →'}
        </button>
      </div>
    </div>
  )
}

// ============================================================
// 结果展示（v0.2: 增加卦变关系/五维度评分/LLM解读）
// ============================================================
function ResultView({ mode, result, question, onReset,
  interpretation, interpreting, interpretError, onInterpret,
  onShare, sharing,
  // v5: 传递问题/八字相关props给InterpretPanel
  setQuestion, showBazi, setShowBazi,
  birthYear, setBirthYear, birthMonth, setBirthMonth,
  birthDay, setBirthDay, birthHour, setBirthHour,
  gender, setGender, name, setName,
  birthCity, setBirthCity, orientation, setOrientation }: any) {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div className="label">Result</div>
        <div className="title-cn" style={{ marginTop: '0.5rem' }}>{D('卜 辞', 'Reading')}</div>
        <p style={{
          marginTop: '1rem', fontStyle: 'italic',
          color: 'var(--onyx-gold)', fontSize: '1.1rem',
          fontFamily: 'var(--font-serif-cn)',
        }}>
          「{question}」
        </p>
      </div>

      {/* v0.7: 叩玄结论卡 TL;DR */}
      {result.verdict && <VerdictCard verdict={result.verdict} />}

      {/* Latestname v1.1: 此刻之名 — 核心展示 */}
      {result.latest_name && <LatestNameCard latestName={result.latest_name} />}

      {/* v2.0: 卦格人格卡片 */}
      {result.personality && <PersonalityCard personality={result.personality} />}

      {/* 五维度运势评分 */}
      {result.fortune_scores && (
        <FortuneScorePanel scores={result.fortune_scores} />
      )}

      {/* v0.4: 八字四柱 */}
      {result.bazi && <BaziPanel bazi={result.bazi} />}

      {result.iching && <IchingPanel iching={result.iching} />}

      {/* v6: 卦象深度分析 — 无需LLM的确定性算法分析 */}
      {result.hexagram_analysis && <HexagramAnalysisPanel analysis={result.hexagram_analysis} />}

      {/* 卦变关系面板 */}
      {result.iching?.relations && mode !== 'tarot' && (
        <RelationsPanel relations={result.iching.relations} />
      )}

      {(result.tarot || result.cards) && <TarotPanel cards={result.tarot || result.cards} />}
      {result.resonance && (
        <div className="card fade-in">
          <div className="label" style={{ marginBottom: '1.5rem' }}>{D('共 振 指 数', 'Resonance Index')} · Resonance Index</div>
          <ResonanceRing resonance={result.resonance} />
          {result.resonance.summary && (
            <p className="body-text" style={{ marginTop: '1.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
              {result.resonance.summary}
            </p>
          )}
        </div>
      )}

      {/* LLM 深度解读 */}
      <InterpretPanel
        interpretation={interpretation}
        interpreting={interpreting}
        error={interpretError}
        onInterpret={onInterpret}
        question={question}
        setQuestion={setQuestion}
        showBazi={showBazi}
        setShowBazi={setShowBazi}
        birthYear={birthYear}
        setBirthYear={setBirthYear}
        birthMonth={birthMonth}
        setBirthMonth={setBirthMonth}
        birthDay={birthDay}
        setBirthDay={setBirthDay}
        birthHour={birthHour}
        setBirthHour={setBirthHour}
        gender={gender}
        setGender={setGender}
        name={name}
        setName={setName}
        birthCity={birthCity}
        setBirthCity={setBirthCity}
        orientation={orientation}
        setOrientation={setOrientation}
      />

      {/* v0.3: 追问功能 */}
      <FollowupPanel
        originalQuestion={question}
        divination={result}
        hasInterpretation={!!interpretation}
      />

      <div style={{ textAlign: 'center', marginTop: '3rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={onReset} className="btn-ghost">
          再 叩 一 卦
        </button>
        {mode === 'combined' && result && (
          <button onClick={onShare} className="btn-primary" disabled={sharing} style={{ opacity: sharing ? 0.6 : 1 }}>
            {sharing ? '生成中…' : '生 成 分 享 图'}
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================================
// v0.4: 八字四柱面板
// ============================================================
function BaziPanel({ bazi }: { bazi: any }) {
  if (!bazi || !bazi.pillars) return null

  const wxColors: Record<string, string> = {
    '木': '#4A7C59', '火': '#C85A3F', '土': '#B8956A',
    '金': '#C0C0C8', '水': '#4A6FA5',
  }
  const maxWx = Math.max(...Object.values(bazi.wuxing_count as Record<string, number>), 1)

  return (
    <div className="card stagger-in" style={{ animationDelay: '0.2s' }}>
      <div className="label">八 字 · Four Pillars</div>

      {/* 四柱展示 */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '0.8rem', marginTop: '1.5rem',
      }}>
        {bazi.pillars.map((p: any, i: number) => (
          <div key={i} className="bazi-pillar stagger-in" style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
            <div className="gan" style={{ color: wxColors[p.wuxing_gan] || 'var(--onyx-white)' }}>
              {p.gan}
            </div>
            <div className="zhi" style={{ color: wxColors[p.wuxing_zhi] || 'var(--onyx-gold)' }}>
              {p.zhi}
            </div>
            <div className="label-sm">{p.pillar}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--onyx-white-dim)', marginTop: '0.3rem', opacity: 0.7 }}>
              {p.nayin}
            </div>
          </div>
        ))}
      </div>

      {/* 五行分布 */}
      <div style={{ marginTop: '1.5rem' }}>
        <div className="label" style={{ fontSize: '0.75rem', marginBottom: '0.8rem' }}>五 行 · Wu Xing</div>
        {(Object.entries(bazi.wuxing_count) as [string, number][]).map(([wx, count]) => (
          <div key={wx} className="wuxing-bar">
            <span className="wx-name" style={{ color: wxColors[wx] }}>{wx}</span>
            <div className="wx-track">
              <div className="wx-fill" style={{
                width: `${(count / maxWx) * 100}%`,
                background: `linear-gradient(90deg, ${wxColors[wx]}88, ${wxColors[wx]})`,
              }} />
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--onyx-white-dim)', width: '1.5rem', textAlign: 'right' }}>{count}</span>
          </div>
        ))}
      </div>

      {/* 旺衰 + 喜用 */}
      <div style={{
        marginTop: '1.2rem', padding: '0.8rem 1rem',
        borderLeft: '2px solid var(--onyx-gold-dim)',
        fontSize: '0.9rem', lineHeight: 1.8,
      }}>
        <span style={{ color: 'var(--onyx-gold)' }}>日主：</span>
        <span style={{ color: 'var(--onyx-white)' }}>{bazi.day_master_full}</span>
        <span style={{ color: 'var(--onyx-white-dim)' }}>（{bazi.strength}）</span>
        {bazi.favorable_elements && bazi.favorable_elements.length > 0 && (
          <>
            <br />
            <span style={{ color: 'var(--onyx-gold)' }}>喜用：</span>
            <span style={{ color: 'var(--onyx-white)' }}>{bazi.favorable_elements.join('、')}</span>
          </>
        )}
        {bazi.missing_elements && bazi.missing_elements.length > 0 && (
          <>
            <br />
            <span style={{ color: 'var(--onyx-gold)' }}>缺失：</span>
            <span style={{ color: 'var(--onyx-crimson)' }}>{bazi.missing_elements.join('、')}</span>
          </>
        )}
        {bazi.birth_city && (
          <>
            <br />
            <span style={{ color: 'var(--onyx-gold)' }}>出生地：</span>
            <span style={{ color: 'var(--onyx-white)' }}>{bazi.birth_city.name}</span>
            <span style={{ color: 'var(--onyx-gold-dim)', marginLeft: '0.5rem' }}>
              ({bazi.birth_city.province} · 经度 {bazi.birth_city.lng}°)
            </span>
            {bazi.solar_correction_minutes !== 0 && (
              <span style={{ color: 'var(--onyx-gold)', marginLeft: '0.5rem' }}>
                · 真太阳时校正 {bazi.solar_correction_minutes > 0 ? '+' : ''}{bazi.solar_correction_minutes} 分钟
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ============================================================
// 五维度运势评分面板
// ============================================================
function FortuneScorePanel({ scores }: { scores: any }) {
  const dims = ['career', 'relationship', 'finance', 'health', 'timing']
  return (
    <div className="card fade-in">
      <div className="label">运 势 · Fortune</div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '1.5rem',
        marginTop: '1.5rem',
      }}>
        {dims.map(key => {
          const d = scores[key]
          if (!d) return null
          const pct = (d.score / 10) * 100
          return (
            <div key={key} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--font-serif-cn)',
                fontSize: '0.9rem',
                color: 'var(--onyx-white-dim)',
                marginBottom: '0.5rem',
                letterSpacing: '0.1em',
              }}>{d.label}</div>
              <div style={{
                fontSize: '2rem',
                fontFamily: 'var(--font-serif-en)',
                color: d.score >= 7 ? 'var(--onyx-jade)' : d.score <= 3 ? 'var(--onyx-crimson)' : 'var(--onyx-gold)',
                fontWeight: 600,
              }}>{d.score}<span style={{ fontSize: '1rem', opacity: 0.5 }}>/10</span></div>
              {/* 进度条 */}
              <div style={{
                height: '3px',
                background: 'var(--surface)',
                borderRadius: '2px',
                marginTop: '0.5rem',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: d.score >= 7 ? 'var(--onyx-jade)' : d.score <= 3 ? 'var(--onyx-crimson)' : 'var(--onyx-gold)',
                  transition: 'width 1s ease',
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// 卦变关系面板（错卦/综卦/互卦）
// ============================================================
function RelationsPanel({ relations }: { relations: any }) {
  const items = [relations.cuo, relations.zong, relations.hu].filter(r => r?.hexagram)
  if (items.length === 0) return null

  return (
    <div className="card fade-in">
      <div className="label">卦 变 · Hexagram Relations</div>
      <p className="body-text" style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.6, fontStyle: 'italic' }}>
        同一卦象的三个面——从不同角度审视同一件事
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginTop: '1.5rem',
      }}>
        {items.map((r, i) => (
          <div key={i} style={{
            textAlign: 'center',
            padding: '1rem',
            background: 'rgba(128,128,128,0.04)',
            borderRadius: '6px',
            border: '1px solid var(--separator)',
          }}>
            <HexagramSVG binary={r.hexagram.binary} size={80} />
            <div style={{
              fontFamily: 'var(--font-serif-cn)',
              fontSize: '1.3rem',
              color: 'var(--onyx-white)',
              marginTop: '0.5rem',
              letterSpacing: '0.15em',
            }}>{r.hexagram.name}</div>
            <div className="label" style={{ fontSize: '0.7rem', marginTop: '0.3rem' }}>
              {r.label} · {r.label_en}
            </div>
            <p className="body-text" style={{ fontSize: '0.8rem', marginTop: '0.5rem', lineHeight: 1.6 }}>
              {r.meaning}
            </p>
            <div style={{ marginTop: '0.5rem' }}>
              {r.hexagram.keywords.slice(0, 2).map((k: string) => (
                <span key={k} className="tag" style={{ fontSize: '0.75rem' }}>#{k}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// v6: 卦象深度分析面板 — 无需LLM的确定性算法分析
// ============================================================
function HexagramAnalysisPanel({ analysis }: { analysis: any }) {
  if (!analysis) return null
  const wx = analysis.wuxing_relation || {}
  const pos = analysis.positioning || {}
  const ca = analysis.changing_analysis || []
  const ti = analysis.trigram_interaction || ''
  const tt = analysis.transformation_trend || ''
  const advice = analysis.advice || []
  const aboveA = analysis.above_trigram_attrs || {}
  const belowA = analysis.below_trigram_attrs || {}
  const rarity = analysis.rarity || null

  const wxColors: Record<string, string> = {
    '木': '#4A7C59', '火': '#C85A3F', '土': '#B8956A', '金': '#C0C0C8', '水': '#4A6FA5',
  }

  const rarityColors: Record<string, string> = {
    '罕见': '#C85A3F', '少见': '#B8956A', '常见': '#7A8B6F', '大众': '#6B7280',
  }

  return (
    <div className="card stagger-in" style={{ animationDelay: '0.3s' }}>
      <div className="label">卦 象 推 演 · Hexagram Analysis</div>
      <p className="body-text" style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.5, fontStyle: 'italic' }}>
        基于五行生克、当位得中、动爻深度的确定性推演 — 无需 AI
      </p>

      {/* 0. 稀有度 & 大白话 */}
      {rarity && (
        <div style={{
          marginTop: '1.2rem', padding: '1rem 1.2rem',
          background: 'var(--surface)', borderRadius: '8px',
          border: `1px solid ${rarityColors[rarity.level] || 'var(--separator)'}30`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'var(--font-serif-cn)', fontSize: '1.3rem', fontWeight: 600,
              color: rarityColors[rarity.level] || 'var(--onyx-gold)',
            }}>
              {rarity.level}
            </span>
            <span style={{
              fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '3px',
              background: `${rarityColors[rarity.level] || 'var(--onyx-gold)'}15`,
              color: rarityColors[rarity.level] || 'var(--onyx-gold)',
            }}>
              稀有度 {rarity.score}/100
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--onyx-white-dim, var(--text-secondary))', opacity: 0.8 }}>
              {rarity.percentile}
            </span>
          </div>

          <p style={{
            fontFamily: 'var(--font-serif-cn)', fontSize: '0.88rem',
            color: 'var(--onyx-white, var(--text-primary))', lineHeight: 1.7,
            marginBottom: '0.5rem',
          }}>
            {rarity.vibe}
          </p>

          {/* 大白话解读 */}
          {rarity.plain_reading && rarity.plain_reading.length > 0 && (
            <div style={{ marginTop: '0.6rem' }}>
              {rarity.plain_reading.map((p: string, i: number) => (
                <p key={i} style={{
                  fontSize: '0.82rem', lineHeight: 1.6,
                  color: 'var(--onyx-white-dim, var(--text-secondary))',
                  marginBottom: '0.3rem',
                }}>
                  <span style={{ color: 'var(--onyx-gold, var(--accent))', marginRight: '0.3rem' }}>▸</span>
                  {p}
                </p>
              ))}
            </div>
          )}

          {/* 稀有原因 */}
          {rarity.reasons && rarity.reasons.length > 0 && (
            <div style={{ marginTop: '0.6rem', display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
              {rarity.reasons.map((r: string, i: number) => (
                <span key={i} style={{
                  fontSize: '0.7rem', padding: '0.15rem 0.5rem',
                  borderRadius: '3px',
                  background: `${rarityColors[rarity.level] || 'var(--onyx-gold)'}10`,
                  color: rarityColors[rarity.level] || 'var(--onyx-gold)',
                  border: `1px solid ${rarityColors[rarity.level] || 'var(--onyx-gold)'}25`,
                }}>
                  {r}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 1. 上下卦属性 */}
      {(aboveA.nature || belowA.nature) && (
        <div style={{ marginTop: '1.5rem' }}>
          <div className="label" style={{ fontSize: '0.75rem', marginBottom: '0.8rem' }}>八 卦 属 性 · Bagua</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {belowA.nature && (
              <div style={{ padding: '0.8rem', background: 'var(--surface)', borderRadius: '6px', border: '1px solid var(--separator)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--onyx-white-dim)', marginBottom: '0.3rem' }}>下卦 · 内</div>
                <div style={{ fontFamily: 'var(--font-serif-cn)', fontSize: '1.3rem', color: 'var(--onyx-gold)' }}>
                  {belowA.nature}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--onyx-white-dim)', marginTop: '0.3rem', lineHeight: 1.7 }}>
                  五行 <span style={{ color: wxColors[belowA.element] || 'var(--onyx-white)' }}>{belowA.element}</span> · 方位 {belowA.direction}<br />
                  性{belowA.trait} · 应{belowA.body} · {belowA.family}
                </div>
              </div>
            )}
            {aboveA.nature && (
              <div style={{ padding: '0.8rem', background: 'var(--surface)', borderRadius: '6px', border: '1px solid var(--separator)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--onyx-white-dim)', marginBottom: '0.3rem' }}>上卦 · 外</div>
                <div style={{ fontFamily: 'var(--font-serif-cn)', fontSize: '1.3rem', color: 'var(--onyx-gold)' }}>
                  {aboveA.nature}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--onyx-white-dim)', marginTop: '0.3rem', lineHeight: 1.7 }}>
                  五行 <span style={{ color: wxColors[aboveA.element] || 'var(--onyx-white)' }}>{aboveA.element}</span> · 方位 {aboveA.direction}<br />
                  性{aboveA.trait} · 应{aboveA.body} · {aboveA.family}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. 五行生克 */}
      {wx.relation && (
        <div style={{ marginTop: '1.2rem', padding: '0.8rem 1rem', borderLeft: '2px solid var(--onyx-gold-dim)' }}>
          <span style={{ color: 'var(--onyx-gold)', fontSize: '0.85rem' }}>五行生克：</span>
          <span style={{ color: 'var(--onyx-white)', fontSize: '0.9rem' }}>{wx.relation}</span>
          {wx.detail && (
            <div style={{ fontSize: '0.8rem', color: 'var(--onyx-white-dim)', marginTop: '0.3rem', lineHeight: 1.7 }}>
              {wx.detail}
            </div>
          )}
        </div>
      )}

      {/* 3. 上下卦互动 */}
      {ti && (
        <div style={{ marginTop: '1rem', padding: '0.8rem 1rem', borderLeft: '2px solid var(--onyx-gold-dim)' }}>
          <span style={{ color: 'var(--onyx-gold)', fontSize: '0.85rem' }}>卦象互动：</span>
          <div style={{ fontSize: '0.85rem', color: 'var(--onyx-white)', marginTop: '0.3rem', lineHeight: 1.8 }}>
            {ti}
          </div>
        </div>
      )}

      {/* 4. 爻位格局 */}
      {pos.pattern && (
        <div style={{ marginTop: '1.2rem' }}>
          <div className="label" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>爻 位 格 局 · Line Pattern</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--onyx-white)', lineHeight: 1.7 }}>
            {pos.pattern}
          </div>
          {pos.proper_lines && pos.proper_lines.length > 0 && (
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--onyx-white-dim)' }}>当位：</span>
              {pos.proper_lines.map((p: string) => (
                <span key={p} className="tag" style={{ fontSize: '0.7rem', borderColor: 'var(--onyx-jade)', color: 'var(--onyx-jade)' }}>{p}</span>
              ))}
              <span style={{ fontSize: '0.75rem', color: 'var(--onyx-white-dim)', marginLeft: '0.5rem' }}>不当位：</span>
              {pos.improper_lines?.map((p: string) => (
                <span key={p} className="tag" style={{ fontSize: '0.7rem', borderColor: 'var(--onyx-crimson)', color: 'var(--onyx-crimson)' }}>{p}</span>
              ))}
            </div>
          )}
          {pos.central_proper && pos.central_proper.length > 0 && (
            <div style={{ marginTop: '0.3rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--onyx-gold)' }}>✦ 得中当位：{pos.central_proper.join('、')}</span>
            </div>
          )}
        </div>
      )}

      {/* 5. 动爻分析 */}
      {ca.length > 0 && (
        <div style={{ marginTop: '1.2rem' }}>
          <div className="label" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>动 爻 推 演 · Changing Lines</div>
          {ca.map((c: any, i: number) => (
            <div key={i} style={{
              padding: '0.8rem', marginBottom: '0.5rem',
              background: 'var(--surface)', borderRadius: '6px',
              border: '1px solid var(--onyx-gold-dim)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-serif-cn)', color: 'var(--onyx-gold)', fontSize: '1rem' }}>
                  {c.position}爻
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--onyx-white-dim)' }}>
                  {c.original_yao}→{c.changing_to}
                </span>
                {c.is_central && <span className="tag" style={{ fontSize: '0.65rem', borderColor: 'var(--onyx-gold)', color: 'var(--onyx-gold)' }}>得中</span>}
                {c.is_proper && <span className="tag" style={{ fontSize: '0.65rem', borderColor: 'var(--onyx-jade)', color: 'var(--onyx-jade)' }}>当位</span>}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--onyx-white)', marginTop: '0.3rem', lineHeight: 1.6 }}>
                {c.detail}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--onyx-gold)', marginTop: '0.2rem', lineHeight: 1.5 }}>
                → {c.significance}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6. 变卦趋势 */}
      {tt && (
        <div style={{ marginTop: '1rem', padding: '0.8rem 1rem', borderLeft: '2px solid var(--onyx-gold-dim)' }}>
          <span style={{ color: 'var(--onyx-gold)', fontSize: '0.85rem' }}>{D('变卦趋势', 'Changed Trend')}：</span>
          <span style={{ color: 'var(--onyx-white)', fontSize: '0.9rem' }}>{tt}</span>
        </div>
      )}

      {/* 7. 塔罗交叉分析 */}
      {analysis.tarot_cross && <TarotCrossSection cross={analysis.tarot_cross} />}

      {/* 8. 行动建议 */}
      {advice.length > 0 && (
        <div style={{ marginTop: '1.2rem' }}>
          <div className="label" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>推 演 建 议 · Advice</div>
          {advice.map((a: string, i: number) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
              marginBottom: '0.4rem', fontSize: '0.85rem', lineHeight: 1.6,
            }}>
              <span style={{ color: 'var(--onyx-gold)', flexShrink: 0 }}>◆</span>
              <span style={{ color: 'var(--onyx-white)' }}>{a}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// v6.1: 塔罗交叉分析子组件
// ============================================================
function TarotCrossSection({ cross }: { cross: any }) {
  if (!cross) return null
  const ea = cross.element_analysis || {}
  const ba = cross.balance_analysis || ''
  const na = cross.narrative_arc || ''
  const kc = cross.keyword_cross || []
  const cards = cross.cards_info || []

  const elemColors: Record<string, string> = {
    '木': '#4A7C59', '火': '#C85A3F', '土': '#B8956A', '金': '#C0C0C8', '水': '#4A6FA5', '风': '#7AA0C8',
  }

  return (
    <div style={{ marginTop: '1.5rem', paddingTop: '1.2rem', borderTop: '1px dashed var(--separator)' }}>
      <div className="label" style={{ fontSize: '0.75rem', marginBottom: '0.8rem' }}>{D('塔 罗 交 叉', 'TAROT CROSS')} · Tarot Cross-Analysis</div>
      <p className="body-text" style={{ fontSize: '0.75rem', opacity: 0.5, fontStyle: 'italic', marginBottom: '1rem' }}>
        三张牌与卦象的五行生克、正逆平衡与叙事弧线 — 无需 AI
      </p>

      {/* 三张牌元素一览 */}
      {cards.length > 0 && (
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem' }}>
          {cards.map((c: any, i: number) => (
            <div key={i} style={{
              flex: 1, padding: '0.6rem', textAlign: 'center',
              background: 'var(--surface)', borderRadius: '6px',
              border: '1px solid var(--separator)',
            }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--onyx-white-dim)' }}>{c.position_label}</div>
              <div style={{
                fontFamily: 'var(--font-serif-cn)', fontSize: '0.9rem',
                color: c.reversed ? 'var(--onyx-crimson)' : 'var(--onyx-white)',
                marginTop: '0.2rem',
              }}>
                {c.name}{c.reversed ? ' ↻' : ''}
              </div>
              <div style={{
                display: 'inline-block', fontSize: '0.65rem',
                padding: '0.1rem 0.4rem', borderRadius: '3px',
                marginTop: '0.3rem',
                background: `${elemColors[c.element] || 'var(--onyx-gold)'}20`,
                color: elemColors[c.element] || 'var(--onyx-gold)',
                border: `1px solid ${elemColors[c.element] || 'var(--onyx-gold)'}40`,
              }}>
                {c.element}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--onyx-white-dim)', marginTop: '0.3rem' }}>
                {c.keywords.slice(0, 2).join('·')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 元素共振 */}
      {ea.summary && (
        <div style={{ padding: '0.8rem 1rem', borderLeft: '2px solid var(--onyx-gold-dim)', marginBottom: '0.8rem' }}>
          <span style={{ color: 'var(--onyx-gold)', fontSize: '0.85rem' }}>元素共振：</span>
          <span style={{ color: 'var(--onyx-white)', fontSize: '0.85rem' }}>{ea.summary}</span>
        </div>
      )}

      {/* 正逆平衡 */}
      {ba && (
        <div style={{ padding: '0.8rem 1rem', borderLeft: '2px solid var(--onyx-gold-dim)', marginBottom: '0.8rem' }}>
          <span style={{ color: 'var(--onyx-gold)', fontSize: '0.85rem' }}>阴阳正逆：</span>
          <span style={{ color: 'var(--onyx-white)', fontSize: '0.85rem' }}>{ba}</span>
        </div>
      )}

      {/* 叙事弧线 */}
      {na && (
        <div style={{ padding: '0.8rem 1rem', borderLeft: '2px solid var(--onyx-gold-dim)', marginBottom: '0.8rem' }}>
          <span style={{ color: 'var(--onyx-gold)', fontSize: '0.85rem' }}>叙事弧线：</span>
          <div style={{ fontSize: '0.82rem', color: 'var(--onyx-white)', marginTop: '0.3rem', lineHeight: 1.7 }}>
            {na}
          </div>
        </div>
      )}

      {/* 关键词交叉 */}
      {kc.length > 0 && (
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {kc.map((k: string, i: number) => (
            <span key={i} className="tag" style={{ fontSize: '0.7rem', borderColor: 'var(--onyx-gold)', color: 'var(--onyx-gold)' }}>
              ✦ {k}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// 易经面板
// ============================================================
function IchingPanel({ iching }: { iching: any }) {
  const o = iching?.original
  const c = iching?.changed
  if (!o) return null
  const changingLines = iching?.changing_lines || []
  const yaoNames = iching?.yao_names || {}

  // Jewelry-style fortune color
  const fortuneJewel: Record<string, string> = {
    '大吉': 'var(--fortune-good)', '吉': 'var(--accent)',
    '中': 'var(--text-secondary)', '凶': 'var(--fortune-bad)', '大凶': 'var(--fortune-bad)',
  }
  const fortuneGlow = fortuneJewel[o.fortune] || 'var(--accent)'

  return (
    <div className="card fade-in">
      <div className="label">{D('易 经 · I Ching', 'I CHING')}</div>

      {/* Jewelry-style hexagram display */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: '2rem',
        alignItems: 'center',
        marginTop: '1rem',
      }}>
        {/* Hexagram symbol with gemstone glow */}
        <div style={{
          position: 'relative',
          width: 180,
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Ambient glow behind hexagram */}
          <div style={{
            position: 'absolute',
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${fortuneGlow}15 0%, transparent 70%)`,
            filter: 'blur(20px)',
          }} />
          {/* Decorative ring */}
          <div style={{
            position: 'absolute',
            width: 170,
            height: 170,
            borderRadius: '50%',
            border: '1px solid var(--separator)',
            opacity: 0.4,
          }} />
          <HexagramSVG binary={o.binary} size={140} changingLines={changingLines} animated />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.8em', flexWrap: 'wrap' }}>
            <h3 style={{
              fontFamily: 'var(--font-serif-cn)',
              fontSize: '2.2rem', color: 'var(--text-primary)',
              letterSpacing: '0.2em',
              textShadow: '0 0 30px rgba(212, 185, 122, 0.15)',
            }}>{o.name}</h3>
            <span className="subtitle">{o.name_en}</span>
            {/* Fortune badge — gemstone style */}
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.15rem 0.6rem',
              borderRadius: '3px',
              fontSize: '0.78rem',
              fontFamily: 'var(--font-serif-cn)',
              letterSpacing: '0.1em',
              color: fortuneGlow,
              background: `${fortuneGlow}12`,
              border: `1px solid ${fortuneGlow}40`,
              boxShadow: `inset 0 1px 0 ${fortuneGlow}20`,
            }}>
              {o.fortune}
            </span>
          </div>
          <div className="body-text" style={{ fontSize: '0.85rem', marginTop: '0.3rem', opacity: 0.7 }}>
            {o.trigram_below}{o.trigram_below_symbol}下 · {o.trigram_above}{o.trigram_above_symbol}上
          </div>

          <div className="divider" style={{ margin: '1rem 0' }} />

          <div className="label" style={{ fontSize: '0.75rem' }}>卦 辞</div>
          <p style={{
            fontFamily: 'var(--font-serif-cn)',
            fontSize: '1.1rem', color: 'var(--onyx-gold)',
            marginTop: '0.3rem', lineHeight: 1.8,
          }}>{o.judgment}</p>
          {o.vernacular_judgment && (
            <p style={{
              fontSize: '0.85rem', color: 'var(--onyx-white-dim)',
              marginTop: '0.4rem', lineHeight: 1.7, fontStyle: 'italic',
            }}>💬 {o.vernacular_judgment}</p>
          )}

          <div className="label" style={{ fontSize: '0.75rem', marginTop: '1rem' }}>象 传</div>
          <p className="body-text" style={{ marginTop: '0.3rem' }}>
            {o.image?.split('\n')[0]}
          </p>
          {o.vernacular_image && (
            <p style={{
              fontSize: '0.85rem', color: 'var(--onyx-white-dim)',
              marginTop: '0.4rem', lineHeight: 1.7, fontStyle: 'italic',
            }}>💬 {o.vernacular_image}</p>
          )}

          <div style={{ marginTop: '1rem' }}>
            {o.keywords.map((k: string) => <span key={k} className="tag">#{k}</span>)}
          </div>

          <div className="divider" style={{ margin: '1rem 0' }} />

          <div className="label" style={{ fontSize: '0.75rem' }}>解 读</div>
          <p className="body-text" style={{ marginTop: '0.3rem', fontSize: '0.95rem' }}>
            {o.interpretation}
          </p>
        </div>
      </div>

      {c && (
        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px dashed var(--separator)' }}>
          <div className="label">变 卦 · Transformation</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <HexagramSVG binary={c.binary} size={100} />
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.8em' }}>
                <h4 style={{
                  fontFamily: 'var(--font-serif-cn)',
                  fontSize: '1.4rem', color: 'var(--onyx-white)',
                  letterSpacing: '0.2em',
                }}>{c.name}</h4>
                <span className="subtitle">{c.name_en}</span>
                <span className={`tag ${c.fortune === '大吉' ? 'text-jade' : c.fortune === '大凶' ? 'text-crimson' : ''}`}>
                  {c.fortune}
                </span>
              </div>
              <p style={{ fontFamily: 'var(--font-serif-cn)', color: 'var(--onyx-gold)', marginTop: '0.3rem' }}>
                {c.judgment}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 动爻（v0.2: 修复九/六命名） */}
      {changingLines.length > 0 && yaoNames.changing && (
        <div style={{ marginTop: '1rem' }}>
          <span className="label" style={{ fontSize: '0.75rem' }}>动 爻：</span>
          {yaoNames.changing.map((pos: string, i: number) => {
            const lineIdx = changingLines[i]
            const fullName = yaoNames[String(lineIdx)] || pos
            return (
              <span key={i} className="tag" style={{ marginLeft: '0.5rem' }}>
                {fullName}
              </span>
            )
          })}
        </div>
      )}

      {/* v0.5-D: 六爻爻辞原文（公有领域《周易》） */}
      {o.yao_lines && o.yao_lines.length > 0 && (
        <YaoLinesList yaoLines={o.yao_lines} changingLines={changingLines} />
      )}

      {c?.yao_lines && c.yao_lines.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <div className="label" style={{ fontSize: '0.7rem', opacity: 0.6 }}>{D('变卦六爻（参考）', 'Changed Lines (Reference)')}</div>
          <YaoLinesList yaoLines={c.yao_lines} changingLines={[]} dimmed />
        </div>
      )}
    </div>
  )
}

// ============================================================
// v0.5-D: 六爻爻辞列表（公有领域《周易》原文）
// ============================================================
function YaoLinesList({ yaoLines, changingLines, dimmed }: {
  yaoLines: any[]
  changingLines: number[]
  dimmed?: boolean
}) {
  // 自下而上：爻序 0(初) → 5(上)
  const ordered = [...yaoLines].reverse()
  return (
    <div style={{
      marginTop: '1.5rem',
      padding: '1.2rem 1.4rem',
      background: dimmed ? 'transparent' : 'var(--surface)',
      border: dimmed ? '1px dashed var(--separator)' : '1px solid var(--separator)',
      borderRadius: '4px',
      opacity: dimmed ? 0.6 : 1,
    }}>
      <div className="label" style={{ fontSize: '0.7rem', marginBottom: '0.8rem' }}>
        六 爻 爻 辞 · Six Yao Texts
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        {ordered.map((y: any, idx: number) => {
          // idx 0 = 上爻（顶部），idx 5 = 初爻（底部）
          const realIdx = 5 - idx
          const isChanging = changingLines.includes(realIdx)
          return (
            <div
              key={y.position}
              style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr',
                gap: '0.8rem',
                alignItems: 'baseline',
                padding: '0.4rem 0',
                borderBottom: '1px solid var(--separator)',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}>
                <span style={{
                  fontFamily: 'var(--font-serif-cn)',
                  color: isChanging ? 'var(--onyx-gold)' : 'var(--onyx-white)',
                  fontSize: '0.95rem',
                  letterSpacing: '0.1em',
                  fontWeight: isChanging ? 600 : 400,
                }}>
                  {y.position}
                </span>
                {isChanging && (
                  <span style={{
                    fontSize: '0.6rem',
                    color: 'var(--onyx-gold)',
                    border: '1px solid var(--onyx-gold)',
                    padding: '0.05rem 0.3rem',
                    borderRadius: '2px',
                  }}>动</span>
                )}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-serif-cn)', color: y.has_text ? 'var(--onyx-white)' : 'rgba(245, 241, 232, 0.4)', fontSize: '0.92rem', lineHeight: 1.7, letterSpacing: '0.05em' }}>
                  {y.has_text ? y.original_text : '—'}
                </div>
                {y.has_text && y.modern_meaning && (
                  <div style={{ fontSize: '0.78rem', lineHeight: 1.6, color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {y.modern_meaning}
                  </div>
                )}
                {y.has_text && y.advice && (
                  <div style={{ fontSize: '0.75rem', lineHeight: 1.5, color: 'var(--accent)', marginTop: '0.2rem' }}>
                    → {y.advice}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// 塔罗面板（v0.2: 增加位置语义）
// ============================================================
function TarotPanel({ cards }: { cards: any[] }) {
  return (
    <div className="card fade-in">
      <div className="label">{D('塔 罗 · Tarot', 'TAROT')}</div>

      {/* 详细解读 — v5 牌面插画+文字（删掉旧版黑卡） */}
      <div style={{ marginTop: '2rem' }}>
        {cards.map((c, i) => (
          <div key={i} className="result-tarot-card" style={{ animationDelay: `${i * 0.15}s` }}>
            {c.spread_position && (
              <div className="label" style={{ fontSize: '0.75rem', marginTop: i > 0 ? '1.5rem' : 0 }}>
                {c.spread_position.label} — {c.spread_position.meaning}
              </div>
            )}
            <div className="result-tarot-card-row">
              {/* 牌面插画 */}
              <div className={`result-tarot-card-art ${c.reversed ? 'has-rev-mark' : ''}`}>
                <img src={getTarotImage(c.card.id)} alt={c.card.name_cn} loading="lazy"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              {/* 文字 */}
              <div className="result-tarot-card-info">
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.8em', flexWrap: 'wrap' }}>
                  <h4 style={{
                    fontFamily: 'var(--font-serif-cn)',
                    fontSize: '1.2rem', color: 'var(--text-primary)',
                    letterSpacing: '0.15em',
                  }}>{c.card.name_cn}</h4>
                  <span className="subtitle" style={{ fontSize: '0.85rem' }}>{c.card.name}</span>
                  <span className={`tag ${c.reversed ? 'text-crimson' : 'text-jade'}`}>
                    {c.reversed ? '↻ 逆位' : '● 正位'}
                  </span>
                </div>
                <p className="body-text" style={{ marginTop: '0.5rem' }}>
                  {c.reversed ? c.card.reversed_meaning : c.card.upright_meaning}
                </p>
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                  {(c.reversed ? c.card.keywords_reversed : c.card.keywords).map((k: string) => (
                    <span key={k} className="tag">#{k}</span>
                  ))}
                </div>
              </div>
            </div>
            {i < cards.length - 1 && <div className="divider" style={{ margin: '1rem 0' }} />}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// 共振分析面板（v0.2: 三层）
// ============================================================
function ResonancePanel({ resonance }: { resonance: any }) {
  if (!resonance) return null
  const isStrong = resonance.type === 'strong'
  return (
    <div className="card fade-in" style={{
      background: isStrong
        ? 'linear-gradient(135deg, #1a2030 0%, #14141C 50%, #0a0a0f 100%)'
        : 'linear-gradient(135deg, var(--onyx-black-light) 0%, var(--onyx-black-soft) 50%, var(--onyx-black) 100%)',
      border: isStrong ? '1px solid var(--accent)' : '1px solid var(--separator)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{
          width: '40px', height: '40px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--onyx-gold-bright), var(--onyx-gold-dim))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.2rem', color: 'var(--onyx-black)',
          fontWeight: 600,
        }}>✦</div>
        <div>
          <div className="label" style={{ fontSize: '0.75rem' }}>{D('共 振 · Resonance', 'RESONANCE')}</div>
          <h3 style={{
            fontFamily: 'var(--font-serif-cn)',
            fontSize: '1.3rem', color: 'var(--onyx-gold)',
            letterSpacing: '0.3em', marginTop: '0.2rem',
          }}>
            {resonance.primary_theme}
          </h3>
        </div>
      </div>

      <p className="body-text" style={{
        fontSize: '1.05rem', lineHeight: 2,
        color: 'var(--onyx-white)', marginTop: '1rem',
      }}>
        {resonance.summary}
      </p>

      {/* 主题共振 */}
      {resonance.themes && resonance.themes.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <div className="label" style={{ fontSize: '0.75rem' }}>主题共振</div>
          <div style={{ marginTop: '0.5rem' }}>
            {resonance.themes.map((t: any) => (
              <span key={t.theme} className="tag" style={{ marginRight: '0.5rem' }}>
                {t.theme} (强度 {t.strength})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 五行元素共振（v0.2新增） */}
      {resonance.element_resonance?.matches?.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <div className="label" style={{ fontSize: '0.75rem' }}>五行 × 元素共振</div>
          <div style={{ marginTop: '0.5rem' }}>
            {resonance.element_resonance.matches.map((m: any, i: number) => (
              <div key={i} className="body-text" style={{ fontSize: '0.9rem', marginTop: '0.3rem' }}>
                ✦ {m.description}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 关键词共振（v0.2新增） */}
      {resonance.keyword_resonance?.matches?.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <div className="label" style={{ fontSize: '0.75rem' }}>关键词共振</div>
          <div style={{ marginTop: '0.5rem' }}>
            {resonance.keyword_resonance.matches.map((m: any, i: number) => (
              <div key={i} className="body-text" style={{ fontSize: '0.9rem', marginTop: '0.3rem' }}>
                ✦ {m.theme}：卦象「{m.hex_keywords.join('、')}」↔ 塔罗「{m.tarot_keywords.join('、')}」
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{
        marginTop: '1.5rem', fontSize: '0.85rem',
        color: 'var(--onyx-gold-dim)', fontStyle: 'italic', textAlign: 'right',
      }}>
        共振强度: {resonance.type === 'strong' ? '强烈' : resonance.type === 'moderate' ? '中度' : '微弱'}
        {resonance.total_score ? ` · 综合评分 ${resonance.total_score}` : ''}
      </div>
    </div>
  )
}

// ============================================================
// LLM 深度解读面板（v0.2 新增）
// ============================================================
// ============================================================
// v0.7: 叩玄结论卡 VerdictCard — TL;DR 一眼看清
// ============================================================
function VerdictCard({ verdict }: { verdict: any }) {
  const fortuneColor =
    verdict.fortune === '大吉' ? 'var(--text-jade)' :
    verdict.fortune === '吉' ? 'var(--text-jade)' :
    verdict.fortune === '凶' ? 'var(--text-crimson)' :
    verdict.fortune === '大凶' ? 'var(--text-crimson)' :
    'var(--onyx-gold)'

  const resColor =
    verdict.resonance_level === 'strong' ? 'var(--text-jade)' :
    verdict.resonance_level === 'moderate' ? 'var(--onyx-gold)' :
    'var(--onyx-white-dim)'

  return (
    <div className="card stagger-in" style={{
      animationDelay: '0.1s',
      borderColor: 'var(--onyx-gold)',
      borderWidth: '1px',
      background: 'linear-gradient(135deg, var(--surface) 0%, var(--bg) 100%)',
      marginBottom: '2rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div className="label" style={{ color: 'var(--onyx-gold)', letterSpacing: '0.3em' }}>
          ✦ 叩 玄 结 论 · VERDICT
        </div>
        <span className="tag" style={{
          color: fortuneColor,
          borderColor: fortuneColor,
          fontSize: '0.9rem',
          padding: '0.3rem 1rem',
        }}>
          {verdict.fortune}
        </span>
      </div>

      {/* 趋势 */}
      <div style={{
        fontFamily: 'var(--font-serif-cn)',
        fontSize: '1.4rem',
        color: 'var(--onyx-white)',
        marginBottom: '0.8rem',
        letterSpacing: '0.05em',
      }}>
        {verdict.trend}
      </div>

      {/* 核心提示 */}
      <p style={{
        color: 'var(--onyx-gold)',
        fontFamily: 'var(--font-serif-cn)',
        fontSize: '0.95rem',
        lineHeight: 1.7,
        marginBottom: '1rem',
        opacity: 0.85,
      }}>
        {verdict.core_hint}
      </p>

      <div className="divider" style={{ margin: '1rem 0', opacity: 0.3 }} />

      {/* 最佳行动 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem' }}>
        <span style={{
          color: 'var(--text-jade)',
          fontFamily: 'var(--font-serif-cn)',
          fontSize: '0.8rem',
          marginTop: '0.15rem',
          whiteSpace: 'nowrap',
          letterSpacing: '0.1em',
        }}>
          宜 行 →
        </span>
        <span style={{
          color: 'var(--onyx-white)',
          fontFamily: 'var(--font-serif-cn)',
          fontSize: '1.05rem',
          lineHeight: 1.6,
        }}>
          {verdict.best_action}
        </span>
      </div>

      {/* 共振提示 */}
      <div style={{
        marginTop: '0.8rem',
        fontSize: '0.8rem',
        color: resColor,
        opacity: 0.7,
        textAlign: 'right' as const,
      }}>
        {verdict.resonance_note}
      </div>
    </div>
  )
}


// ============================================================
// v0.7: 共振指数环形展示
// ============================================================
function ResonanceRing({ resonance }: { resonance: any }) {
  const score = resonance.total_score || 0
  const percent = Math.min(100, score * 5)  // score*5 映射到 0-100
  const level = resonance.type || 'subtle'
  const theme = resonance.primary_theme || '多元'

  const color =
    level === 'strong' ? '#7FB886' :
    level === 'moderate' ? '#B8956A' :
    '#666'

  const levelLabel =
    level === 'strong' ? '强共振' :
    level === 'moderate' ? '中等' :
    '微弱'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.8rem', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
        <svg width="110" height="110" viewBox="0 0 110 110">
          <circle cx="55" cy="55" r="46" fill="none" stroke="rgba(128,128,128,0.1)" strokeWidth="5" />
          <circle
            cx="55" cy="55" r="46" fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={`${percent * 2.89} 999`}
            strokeLinecap="round"
            transform="rotate(-90 55 55)"
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', top: 0, left: 0, width: 110, height: 110,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '1.8rem', fontWeight: 600, color, lineHeight: 1 }}>{percent}</span>
          <span style={{ fontSize: '0.5rem', color: 'var(--onyx-white-dim, var(--text-secondary))', letterSpacing: '0.15em', marginTop: '0.2rem' }}>指数</span>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ fontFamily: 'var(--font-serif-cn)', fontSize: '1.15rem', color }}>
          {levelLabel} · {theme}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--onyx-white-dim, var(--text-secondary))', marginTop: '0.4rem', lineHeight: 1.5 }}>
          东西方占卜体系在此议题上的一致程度
        </div>
      </div>
    </div>
  )
}


function InterpretPanel({ interpretation, interpreting, error, onInterpret, question, setQuestion, showBazi, setShowBazi, birthYear, setBirthYear, birthMonth, setBirthMonth, birthDay, setBirthDay, birthHour, setBirthHour, gender, setGender, name, setName, birthCity, setBirthCity, orientation, setOrientation }: any) {
  const settings = JSON.parse(localStorage.getItem('onyx_llm_config') || '{}')
  const hasCloudLLM = settings.api_key && settings.api_key.length > 20
  const [localQuestion, setLocalQuestion] = useState(question || '')
  const [localShowBazi, setLocalShowBazi] = useState(false)

  // 同步问题到父组件
  useEffect(() => {
    if (setQuestion) setQuestion(localQuestion)
  }, [localQuestion])

  return (
    <div className="card fade-in">
      <div className="label">深 度 解 读 · AI Interpretation</div>

      {/* v5: 在结果页输入问题+八字 → AI深度解读 */}
      {!interpretation && !interpreting && (
        <div style={{ marginTop: '1.5rem' }}>
          {/* 问题输入 */}
          <div style={{ marginBottom: '1.2rem' }}>
            <label className="label" style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem' }}>
              你问了什么？（让 AI 更精准地解读）
            </label>
            <textarea
              value={localQuestion}
              onChange={e => setLocalQuestion(e.target.value)}
              placeholder="写下你心中默念的问题⋯"
              rows={2}
              maxLength={200}
              className="step1-textarea"
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          {/* 八字折叠 */}
          <button
            onClick={() => setLocalShowBazi(!localShowBazi)}
            className="btn-ghost"
            style={{ fontSize: '0.85rem', padding: '0.4rem 1rem', width: '100%', marginBottom: '1rem' }}
          >
            {localShowBazi ? '▾' : '▸'} 生辰八字（可选·提升 AI 解读精准度）
          </button>
          {localShowBazi && (
            <div style={{ padding: '0.5rem 0.5rem 1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.8rem', marginBottom: '1rem' }}>
                <div>
                  <label className="label" style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.3rem' }}>年</label>
                  <input type="number" value={birthYear || ''} onChange={e => setBirthYear && setBirthYear(e.target.value)}
                    placeholder="1996" min="1900" max="2100" style={{ textAlign: 'center' }} />
                </div>
                <div>
                  <label className="label" style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.3rem' }}>月</label>
                  <input type="number" value={birthMonth || ''} onChange={e => setBirthMonth && setBirthMonth(e.target.value)}
                    placeholder="6" min="1" max="12" style={{ textAlign: 'center' }} />
                </div>
                <div>
                  <label className="label" style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.3rem' }}>日</label>
                  <input type="number" value={birthDay || ''} onChange={e => setBirthDay && setBirthDay(e.target.value)}
                    placeholder="15" min="1" max="31" style={{ textAlign: 'center' }} />
                </div>
                <div>
                  <label className="label" style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.3rem' }}>时</label>
                  <input type="number" value={birthHour || ''} onChange={e => setBirthHour && setBirthHour(e.target.value)}
                    placeholder="10" min="0" max="23" style={{ textAlign: 'center' }} />
                </div>
              </div>
              {/* 出生地 */}
              <div style={{ marginBottom: '0.8rem' }}>
                <label className="label" style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.3rem' }}>出生地（用于真太阳时校正）</label>
                <input type="text" value={birthCity || ''} onChange={e => setBirthCity && setBirthCity(e.target.value)}
                  placeholder="如：上海" maxLength={20} style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 120px' }}>
                  <label className="label" style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.3rem' }}>性别</label>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    {['male', 'female', 'unknown'].map(g => (
                      <button key={g} onClick={() => setGender && setGender(g)}
                        className={gender === g ? 'btn-primary' : 'btn-ghost'}
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.8rem', flex: 1 }}>
                        {g === 'male' ? '男' : g === 'female' ? '女' : '不填'}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ flex: '1 1 140px' }}>
                  <label className="label" style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.3rem' }}>性取向</label>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    {[
                      { v: 'hetero', l: '异性' },
                      { v: 'homo', l: '同性' },
                      { v: 'bi', l: '双性' },
                      { v: 'other', l: '其他' },
                    ].map(o => (
                      <button key={o.v} onClick={() => setOrientation && setOrientation(orientation === o.v ? '' : o.v)}
                        className={orientation === o.v ? 'btn-primary' : 'btn-ghost'}
                        style={{ fontSize: '0.7rem', padding: '0.35rem 0.5rem', flex: 1 }}>
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ flex: '1 1 100px' }}>
                  <label className="label" style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.3rem' }}>化名（可选）</label>
                  <input type="text" value={name || ''} onChange={e => setName && setName(e.target.value)}
                    placeholder="化名" maxLength={20} style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          )}

          {/* 启动按钮 */}
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <p className="body-text" style={{ fontSize: '0.85rem', marginBottom: '1rem', opacity: 0.6 }}>
              {hasCloudLLM
                ? '让 AI 基于以上卦象、牌阵与你的问题，生成专属深度解读'
                : '✦ 内置小模型模式（WebGPU）· 无需配置 API Key，首次加载约 1GB'
              }
            </p>
            <button onClick={onInterpret} className="btn-primary" style={{ fontSize: '1rem', padding: '0.8rem 2.5rem' }}>
              ✦ 启 动 深 度 解 读
            </button>
          </div>
        </div>
      )}

      {interpreting && (
        <div style={{ marginTop: '1.5rem' }}>
          <div className="body-text" style={{ fontStyle: 'italic', opacity: 0.5, marginBottom: '1rem' }}>
            AI 正在解读...
          </div>
          {interpretation && (
            <div className="md-body" style={{ borderLeft: '2px solid var(--onyx-gold-dim)', paddingLeft: '1rem' }}>
              <CleanText text={interpretation} />
              <span style={{ animation: 'pulse 1s infinite' }}>▋</span>
            </div>
          )}
        </div>
      )}

      {interpretation && !interpreting && (
        <div style={{ marginTop: '1.5rem' }}>
          <div className="md-body" style={{ borderLeft: '2px solid var(--onyx-gold-dim)', paddingLeft: '1rem' }}>
            <CleanText text={interpretation} />
          </div>
          <button
            onClick={() => {
              const printContent = `
                <html><head><meta charset="utf-8"><title>Latestname 占卜报告</title>
                <style>
                  @page { margin: 2cm; }
                  body { font-family: "Songti SC", "STSong", serif; color: #1a1a2e; line-height: 1.9; max-width: 680px; margin: 0 auto; }
                  .header { text-align: center; border-bottom: 2px solid #B8956A; padding-bottom: 1rem; margin-bottom: 1.5rem; }
                  .header h1 { font-size: 1.4rem; color: #B8956A; margin: 0; }
                  .header .subtitle { font-size: 0.85rem; color: #888; margin-top: 0.3rem; }
                  .question { font-size: 0.95rem; color: #333; margin: 1rem 0; padding: 0.8rem; background: #f8f5f0; border-radius: 8px; }
                  .question strong { color: #B8956A; }
                  .interpretation { font-size: 0.95rem; white-space: pre-wrap; }
                  .interpretation p { margin: 0.6em 0; }
                  .footer { margin-top: 2rem; text-align: center; font-size: 0.8rem; color: #aaa; border-top: 1px solid #eee; padding-top: 1rem; }
                </style></head><body>
                <div class="header">
                  <h1>Latestname · 此刻之名</h1>
                  <div class="subtitle">${new Date().toLocaleDateString('zh-CN')} · 占卜报告</div>
                </div>
                <div class="question"><strong>问题：</strong>${question || ''}</div>
                <div class="interpretation">${interpretation.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</div>
                <div class="footer">
                  Latestname · 此刻之名 · latestname.com<br/>
                  排盘为确定性算法生成，AI 解读仅供参考<br/>
                  <span style="opacity:0.5">© 2026 Latestname</span>
                </div>
                </body></html>`
              const w = window.open('', '_blank')
              if (w) {
                w.document.write(printContent)
                w.document.close()
                setTimeout(() => { w.print() }, 500)
              }
            }}
            className="btn-ghost"
            style={{ marginTop: '1rem', fontSize: '0.85rem', padding: '0.5rem 1.2rem' }}
          >
            📄 导出 PDF
          </button>
        </div>
      )}

      {error && (
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ color: 'var(--onyx-crimson)', fontSize: '0.9rem' }}>
            ⚠ {error}
          </div>
          <button onClick={onInterpret} className="btn-ghost" style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
            重 试
          </button>
        </div>
      )}

      <p className="body-text" style={{
        fontSize: '0.75rem', marginTop: '1.5rem', opacity: 0.4,
        fontStyle: 'italic',
      }}>
        AI 解读仅供参考。核心排盘为确定性算法，AI 只做叙事化展开。
      </p>
    </div>
  )
}

// _LN_WM: 4c3a8f2e7b1d9065a2c8e4f1b7d3096e8a5c2f4d (linmy666/latestname AGPL-3.0)
