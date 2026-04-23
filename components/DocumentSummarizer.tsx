'use client'

import { useCallback, useRef, useState } from 'react'
import {
  Upload, FileText, Loader2, CheckCircle, AlertCircle,
  X, ChevronDown, ChevronUp, Cpu, Languages,
} from 'lucide-react'
import { useLocalLLM } from '@/hooks/useLocalLLM'

// ── Types ────────────────────────────────────────────────────────
const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md']
const ACCEPTED_MIME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
]

function isAccepted(file: File): boolean {
  const ext = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '')
  return ACCEPTED_EXTENSIONS.includes(ext) || ACCEPTED_MIME.includes(file.type)
}

// ── Sub-components ───────────────────────────────────────────────

function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--text-muted)] truncate max-w-[80%]">{label}</span>
        <span className="text-amber-500 font-semibold shrink-0">{value}%</span>
      </div>
      <div className="h-2 bg-[var(--bg-input)] rounded-full overflow-hidden border border-[var(--border)]">
        <div
          className="h-full bg-amber-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function StageIcon({ stage }: { stage: string }) {
  if (stage === 'parsing' || stage === 'loading' || stage === 'summarizing') {
    return <Loader2 size={16} className="animate-spin text-amber-500 shrink-0" />
  }
  if (stage === 'done') return <CheckCircle size={16} className="text-green-500 shrink-0" />
  if (stage === 'error') return <AlertCircle size={16} className="text-red-500 shrink-0" />
  return <Cpu size={16} className="text-[var(--text-muted)] shrink-0" />
}

// ── Main Component ───────────────────────────────────────────────
export default function DocumentSummarizer() {
  const { stage, progress, progressMsg, chunkResults, summary, error, wordCount, summarize, reset } =
    useLocalLLM()

  const [dragOver,        setDragOver]        = useState(false)
  const [selectedFile,    setSelectedFile]    = useState<File | null>(null)
  const [lang,            setLang]            = useState<'fr' | 'en'>('fr')
  const [showChunks,      setShowChunks]      = useState(false)
  const [fileError,       setFileError]       = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    setFileError(null)
    if (!isAccepted(file)) {
      setFileError(`Format non supporté. Accepté : ${ACCEPTED_EXTENSIONS.join(', ')}`)
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setFileError('Fichier trop volumineux (max 20 Mo).')
      return
    }
    setSelectedFile(file)
    reset()
  }, [reset])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleSummarize = () => {
    if (selectedFile) summarize(selectedFile, lang)
  }

  const handleReset = () => {
    setSelectedFile(null)
    setFileError(null)
    reset()
    if (inputRef.current) inputRef.current.value = ''
  }

  const isRunning = ['parsing', 'loading', 'summarizing'].includes(stage)

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 max-w-2xl">

      {/* Header info */}
      <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3">
        <Cpu size={16} className="text-amber-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">Résumé 100% local</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Propulsé par <span className="text-amber-500 font-medium">SmolLM2-1.7B-Instruct</span> via Transformers.js —
            aucune donnée ne quitte ton navigateur. Le modèle (~900 Mo) est mis en cache après le premier téléchargement.
          </p>
        </div>
      </div>

      {/* Upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => !selectedFile && inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl transition-all duration-200
          ${dragOver
            ? 'border-amber-500 bg-amber-500/5 scale-[1.01]'
            : selectedFile
              ? 'border-[var(--border)] bg-[var(--bg-card)] cursor-default'
              : 'border-[var(--border)] hover:border-amber-500/50 hover:bg-amber-500/3 cursor-pointer'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(',')}
          className="hidden"
          onChange={handleInputChange}
        />

        {selectedFile ? (
          /* Fichier sélectionné */
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <FileText size={18} className="text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[var(--text-primary)] truncate">{selectedFile.name}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {(selectedFile.size / 1024).toFixed(0)} Ko
                {wordCount > 0 && ` · ${wordCount.toLocaleString('fr-FR')} mots`}
              </p>
            </div>
            {!isRunning && (
              <button
                onClick={(e) => { e.stopPropagation(); handleReset() }}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/5 transition-colors shrink-0"
                title="Supprimer"
              >
                <X size={15} />
              </button>
            )}
          </div>
        ) : (
          /* Zone de drop vide */
          <div className="flex flex-col items-center gap-3 py-12 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--bg-input)] border border-[var(--border)] flex items-center justify-center">
              <Upload size={20} className="text-[var(--text-muted)]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                Glisse un document ici ou <span className="text-amber-500">clique pour choisir</span>
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">PDF, DOCX, TXT, Markdown — max 20 Mo</p>
            </div>
          </div>
        )}
      </div>

      {/* Erreur fichier */}
      {fileError && (
        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/8 border border-red-500/20 rounded-lg px-3 py-2">
          <AlertCircle size={14} className="shrink-0" />
          {fileError}
        </div>
      )}

      {/* Options + bouton */}
      {selectedFile && stage === 'idle' && (
        <div className="flex items-center gap-3">
          {/* Sélecteur de langue */}
          <div className="flex items-center gap-2 border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--bg-card)]">
            <Languages size={14} className="text-[var(--text-muted)] shrink-0" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as 'fr' | 'en')}
              className="text-sm bg-transparent border-none outline-none text-[var(--text-secondary)] cursor-pointer"
            >
              <option value="fr">Résumé en français</option>
              <option value="en">Summary in English</option>
            </select>
          </div>

          <button
            onClick={handleSummarize}
            className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
          >
            <Cpu size={15} />
            Générer le résumé
          </button>
        </div>
      )}

      {/* Progression */}
      {isRunning && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-5 py-4 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <StageIcon stage={stage} />
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {stage === 'parsing'     && 'Lecture du document…'}
              {stage === 'loading'     && 'Chargement du modèle…'}
              {stage === 'summarizing' && 'Résumé en cours…'}
            </span>
          </div>

          <ProgressBar value={progress} label={progressMsg} />

          {/* Résumés intermédiaires en temps réel */}
          {chunkResults.length > 0 && (
            <div className="flex flex-col gap-2">
              {chunkResults.map((c) => (
                <div key={c.index} className="bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2">
                  <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">
                    Bloc {c.index + 1}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{c.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Résultat final */}
      {stage === 'done' && summary && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <CheckCircle size={15} className="text-green-500" />
              <span className="font-semibold text-sm text-[var(--text-primary)]">Résumé final</span>
            </div>
            <button
              onClick={handleReset}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              Nouveau document
            </button>
          </div>

          {/* Résumé */}
          <div className="px-5 py-4">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{summary}</p>
          </div>

          {/* Résumés partiels (accordion) */}
          {chunkResults.length > 1 && (
            <div className="border-t border-[var(--border)]">
              <button
                onClick={() => setShowChunks((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-3 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
              >
                <span>{chunkResults.length} résumés partiels (phase Map)</span>
                {showChunks ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {showChunks && (
                <div className="px-5 pb-4 flex flex-col gap-2">
                  {chunkResults.map((c) => (
                    <div key={c.index} className="bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2">
                      <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Bloc {c.index + 1}</p>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{c.summary}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Erreur */}
      {stage === 'error' && error && (
        <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-5 py-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="text-red-500 shrink-0" />
            <span className="text-sm font-semibold text-red-500">Erreur</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">{error}</p>
          <button
            onClick={handleReset}
            className="self-start text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] underline transition-colors"
          >
            Réessayer
          </button>
        </div>
      )}
    </div>
  )
}
