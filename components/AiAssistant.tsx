'use client'

import { useEffect, useRef, useState } from 'react'
import { Sparkles, X, Send, Loader2, ChevronDown, Cpu, AlertCircle } from 'lucide-react'
import { useLocalLLM } from '@/hooks/useLocalLLM'

const QUICK_PROMPTS = [
  'Résume le contenu de cette page',
  'Quels sont les points clés ?',
  'Donne-moi des suggestions pour améliorer ce texte',
  'Identifie les incohérences dans ce contenu',
]

function getPageContext(): string {
  const main = document.querySelector('main')
  return (main ?? document.body).innerText.slice(0, 4000)
}

export default function AiAssistant() {
  const [open,     setOpen]     = useState(false)
  const [question, setQuestion] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const responseRef = useRef<HTMLDivElement>(null)

  const { stage, progress, progressMsg, summary, error, ask, reset } = useLocalLLM()

  const isRunning = ['parsing', 'loading', 'summarizing'].includes(stage)
  const hasAnswer = stage === 'done' && !!summary
  const hasError  = stage === 'error'

  useEffect(() => {
    if (responseRef.current) responseRef.current.scrollTop = responseRef.current.scrollHeight
  }, [summary])

  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 50)
  }, [open])

  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  function handleSubmit(q?: string) {
    const text = (q ?? question).trim()
    if (!text || isRunning) return
    reset()
    setQuestion('')
    ask(text, getPageContext(), 'fr')
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Assistant IA local"
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
              <span className="flex items-center gap-1 text-xs text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded font-medium">
                <Cpu size={10} /> Local
              </span>
            </div>
            <button onClick={() => setOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Note premier chargement */}
          {stage === 'idle' && (
            <div className="px-4 py-2 bg-amber-500/5 border-b border-[var(--border)]">
              <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                <Cpu size={9} className="inline mr-1 text-amber-500" />
                Propulsé par <span className="text-amber-500 font-medium">SmolLM2-1.7B</span> — 100% local, aucune donnée envoyée.
                Le modèle (~900 Mo) se télécharge une seule fois puis reste en cache.
              </p>
            </div>
          )}

          {/* Quick prompts */}
          {stage === 'idle' && (
            <div className="px-4 py-3 flex flex-col gap-1 border-b border-[var(--border)]">
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

          {/* Chargement */}
          {isRunning && (
            <div className="px-4 py-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Loader2 size={13} className="animate-spin text-amber-500 shrink-0" />
                <span className="text-xs text-[var(--text-secondary)] truncate">{progressMsg}</span>
              </div>
              {stage === 'loading' && progress > 0 && (
                <div className="flex flex-col gap-1">
                  <div className="h-1.5 bg-[var(--bg-input)] rounded-full overflow-hidden border border-[var(--border)]">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] text-right">{progress}%</span>
                </div>
              )}
            </div>
          )}

          {/* Réponse */}
          {hasAnswer && (
            <div ref={responseRef} className="px-4 py-3 max-h-64 overflow-y-auto text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap border-b border-[var(--border)]">
              {summary}
            </div>
          )}

          {/* Erreur */}
          {hasError && (
            <div className="px-4 py-3 flex items-start gap-2 text-xs text-red-500 bg-red-500/5 border-b border-[var(--border)]">
              <AlertCircle size={12} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Retour */}
          {(hasAnswer || hasError) && (
            <div className="px-4 pt-2 pb-1">
              <button onClick={() => { reset(); setQuestion('') }} className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
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
              placeholder="Pose une question sur cette page… (Entrée)"
              rows={2}
              disabled={isRunning}
              className="flex-1 resize-none bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-amber-500 transition-colors disabled:opacity-50"
            />
            <button
              onClick={() => handleSubmit()}
              disabled={isRunning || !question.trim()}
              className="shrink-0 w-8 h-8 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 flex items-center justify-center transition-colors"
            >
              {isRunning ? <Loader2 size={14} className="animate-spin text-white" /> : <Send size={14} className="text-white" />}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
