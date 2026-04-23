'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, X, Send, Loader2, ChevronDown } from 'lucide-react'

const QUICK_PROMPTS = [
  'Résume le contenu de cette page',
  'Quels sont les points clés de cette page ?',
  'Donne-moi des suggestions pour améliorer ce qui est écrit',
  'Identifie les incohérences ou problèmes dans ce contenu',
]

export default function AiAssistant() {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const responseRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight
    }
  }, [response])

  useEffect(() => {
    if (open) textareaRef.current?.focus()
  }, [open])

  function getPageContext(): string {
    const main = document.querySelector('main')
    return (main ?? document.body).innerText.slice(0, 5000)
  }

  async function handleSubmit(q?: string) {
    const text = (q ?? question).trim()
    if (!text || loading) return

    setLoading(true)
    setResponse('')

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, context: getPageContext() }),
      })

      if (!res.ok || !res.body) throw new Error()

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setResponse(accumulated)
      }
    } catch {
      setResponse('Une erreur est survenue. Vérifie ta clé API dans `.env.local`.')
    } finally {
      setLoading(false)
      setQuestion('')
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Assistant IA"
        className={`fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          open
            ? 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)]'
            : 'bg-amber-500 hover:bg-amber-400 text-white'
        }`}
      >
        {open ? <ChevronDown size={20} /> : <Sparkles size={20} />}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-22 right-6 z-40 w-[min(420px,calc(100vw-3rem))] bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" />
              <span className="font-semibold text-sm text-[var(--text-primary)]">Assistant IA</span>
              <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-input)] px-1.5 py-0.5 rounded">Haiku</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Quick prompts */}
          {!response && !loading && (
            <div className="px-4 py-3 flex flex-col gap-1.5 border-b border-[var(--border)]">
              <p className="text-xs text-[var(--text-muted)] mb-1">Actions rapides</p>
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => handleSubmit(p)}
                  className="text-left text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-amber-500/5 px-2 py-1.5 rounded-lg transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Response */}
          {(response || loading) && (
            <div
              ref={responseRef}
              className="px-4 py-3 max-h-64 overflow-y-auto text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap"
            >
              {loading && !response && (
                <div className="flex items-center gap-2 text-[var(--text-muted)]">
                  <Loader2 size={13} className="animate-spin" />
                  Analyse en cours…
                </div>
              )}
              {response}
              {loading && response && <span className="inline-block w-1.5 h-4 bg-amber-500 animate-pulse ml-0.5 align-middle" />}
            </div>
          )}

          {/* New question button if response shown */}
          {response && !loading && (
            <div className="px-4 pb-2">
              <button
                onClick={() => { setResponse(''); setQuestion('') }}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
              >
                ← Nouvelle question
              </button>
            </div>
          )}

          {/* Input */}
          <div className="px-4 pb-4 pt-2 flex gap-2 items-end border-t border-[var(--border)]">
            <textarea
              ref={textareaRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Pose une question sur cette page… (Entrée pour envoyer)"
              rows={2}
              className="flex-1 resize-none bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-amber-500 transition-colors"
            />
            <button
              onClick={() => handleSubmit()}
              disabled={loading || !question.trim()}
              className="shrink-0 w-8 h-8 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 flex items-center justify-center transition-colors"
            >
              {loading ? <Loader2 size={14} className="animate-spin text-white" /> : <Send size={14} className="text-white" />}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
