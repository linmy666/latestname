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
import { usePrefs } from '../App'
import { D, setLang } from '../i18n-shim'

/** CleanText: 清洗AI输出中的残留Markdown标记 */
function CleanText({ text }: { text: string }) {
  const cleaned = text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/^[\s]*[-*]\s+/gm, '')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^---+$/gm, '')
  return (
    <div>
      {cleaned.split(/\n\n+/).map((para, i) => (
        <p key={i} style={{ margin: '0.4em 0', lineHeight: 1.7 }}>{para.trim()}</p>
      ))}
    </div>
  )
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface FollowupPanelProps {
  originalQuestion: string
  divination: any
  hasInterpretation: boolean
}

export default function FollowupPanel({ originalQuestion, divination, hasInterpretation }: FollowupPanelProps) {
  const { lang } = usePrefs()
  setLang(lang)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  // Cleanup on unmount
  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  const getLLMConfig = () => {
    const settings = JSON.parse(localStorage.getItem('onyx_llm_config') || '{}')
    if (!settings.api_key || settings.api_key.length < 10) return null
    return {
      base_url: settings.base_url || 'https://api.openai.com/v1',
      api_key: settings.api_key,
      model: settings.model || 'gpt-4o-mini',
    }
  }

  const sendFollowup = async () => {
    if (!input.trim() || loading) return

    const llmConfig = getLLMConfig()
    if (!llmConfig) {
      setError(D('请先在设置中配置 LLM API Key', 'Please configure LLM API Key in Settings first'))
      return
    }

    const userMsg: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setError('')

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const resp = await fetch(`${import.meta.env.VITE_API_BASE || ''}/api/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followup_question: userMsg.content,
          original_question: originalQuestion,
          divination: divination,
          conversation_history: newMessages.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
          llm_config: llmConfig,
        }),
        signal: controller.signal,
      })

      if (!resp.ok) {
        setError(D(`服务器错误: ${resp.status}`, `Server error: ${resp.status}`))
        setLoading(false)
        return
      }

      const reader = resp.body?.getReader()
      if (!reader) return

      const decoder = new TextDecoder()
      let assistantContent = ''
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        const lines = text.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            if (parsed.error) {
              setError(parsed.error)
              continue
            }
            if (parsed.content) {
              assistantContent += parsed.content
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent }
                return updated
              })
            }
          } catch { /* skip */ }
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setError(`${D('追问失败', 'Follow-up failed')}: ${e.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  // Only show after initial interpretation is done OR always show if LLM configured
  // if (!hasInterpretation) return null

  const llmConfigured = !!getLLMConfig()

  return (
    <div className="card fade-in" style={{ marginTop: '1.5rem' }}>
      <div className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {D('追 问', 'Follow-up')} · Follow-up
        <span style={{ fontSize: '0.65rem', opacity: 0.5, fontWeight: 400 }}>{D('基于当前卦象继续深聊', 'Continue the conversation based on the current hexagram')}</span>
      </div>

      {!llmConfigured && (
        <p style={{ fontSize: '0.82rem', opacity: 0.5, marginTop: '1rem' }}>
          ⚠ {D('追问功能需要配置 LLM API Key（设置页）', 'Follow-up requires LLM API Key (see Settings)')}
        </p>
      )}

      {/* Conversation history */}
      {messages.length > 0 && (
        <div ref={scrollRef} style={{
          marginTop: '1rem',
          maxHeight: '400px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.8rem',
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              padding: '0.7rem 1rem',
              borderRadius: '8px',
              background: msg.role === 'user'
                ? 'var(--accent)'
                : 'var(--surface)',
              border: msg.role === 'assistant' ? '1px solid var(--separator)' : 'none',
            }}>
              {msg.role === 'user' ? (
                <span style={{ fontSize: '0.88rem', color: '#0A0A0F' }}>{msg.content}</span>
              ) : (
                <div className="md-body" style={{ fontSize: '0.85rem' }}>
                  <CleanText text={msg.content || '...'} />
                </div>
              )}
            </div>
          ))}
          {loading && messages.length > 0 && !messages[messages.length - 1].content && (
            <div style={{ alignSelf: 'flex-start', opacity: 0.4, fontSize: '0.8rem', fontStyle: 'italic' }}>
              {D('正在思考...', 'Thinking...')}
            </div>
          )}
        </div>
      )}

      {error && (
        <p style={{ color: 'var(--fortune-bad)', fontSize: '0.8rem', marginTop: '0.5rem' }}>{error}</p>
      )}

      {/* Input */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendFollowup() } }}
          placeholder={llmConfigured ? D('追问任何问题…', 'Ask a follow-up…') : D('请先配置 API Key', 'Please configure API Key first')}
          disabled={loading || !llmConfigured}
          style={{
            flex: 1,
            background: 'var(--surface)',
            border: '1px solid var(--separator)',
            borderRadius: '6px',
            padding: '0.6rem 0.9rem',
            color: 'var(--text-primary)',
            fontSize: '0.88rem',
            opacity: (loading || !llmConfigured) ? 0.5 : 1,
          }}
        />
        <button
          onClick={sendFollowup}
          disabled={loading || !input.trim() || !llmConfigured}
          className="btn-ghost"
          style={{
            fontSize: '0.82rem',
            padding: '0.5rem 1rem',
            opacity: (loading || !input.trim() || !llmConfigured) ? 0.4 : 1,
          }}
        >
          {loading ? '…' : D('追 问', 'Ask')}
        </button>
      </div>

      {/* Quick suggestion chips */}
      {llmConfigured && messages.length === 0 && (
        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
          {[
            D('这个卦象对我的事业有什么具体建议？', 'How does this hexagram apply to my career?'),
            D('变卦意味着什么？', 'What does the changed hexagram mean?'),
            D('我应该注意哪些风险？', 'What risks should I watch for?'),
          ].map(s => (
            <button
              key={s}
              onClick={() => setInput(s)}
              style={{
                fontSize: '0.72rem',
                padding: '0.3rem 0.7rem',
                borderRadius: '12px',
                border: '1px solid var(--separator)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
