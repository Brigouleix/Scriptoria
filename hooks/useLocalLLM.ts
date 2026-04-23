'use client'

/**
 * useLocalLLM.ts
 * Hook personnalisé — gère le cycle de vie du Web Worker,
 * le parsing des fichiers (PDF/DOCX/TXT) et les états de l'UI.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { WorkerInput, WorkerOutput } from '@/workers/summarizer.worker'

// ── Types publics exposés par le hook ────────────────────────────

export type SupportedFile = File & { type: string }

export type LLMStage =
  | 'idle'         // aucune action en cours
  | 'parsing'      // lecture / parsing du fichier
  | 'loading'      // téléchargement du modèle
  | 'summarizing'  // résumé en cours
  | 'done'         // résumé terminé
  | 'error'        // erreur

export interface ChunkResult {
  index:   number
  summary: string
}

export interface LLMState {
  stage:          LLMStage
  progress:       number           // 0–100
  progressMsg:    string
  chunkResults:   ChunkResult[]    // résumés intermédiaires (Map)
  summary:        string           // résumé final (Reduce)
  error:          string | null
  wordCount:      number           // nb de mots dans le document
}

export interface UseLocalLLMReturn extends LLMState {
  summarize: (file: File, lang?: 'fr' | 'en') => Promise<void>
  ask:       (question: string, context: string, lang?: 'fr' | 'en') => void
  reset:     () => void
}

// ── Parsers ──────────────────────────────────────────────────────

/** Extrait le texte brut d'un fichier PDF */
async function parsePDF(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist')

  // Pointer vers le worker PDF.js embarqué dans public/
  GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()

  const arrayBuffer = await file.arrayBuffer()
  const pdf         = await getDocument({ data: arrayBuffer }).promise

  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page    = await pdf.getPage(i)
    const content = await page.getTextContent()
    pages.push(content.items.map((item: { str?: string }) => item.str ?? '').join(' '))
  }

  return pages.join('\n\n')
}

/** Extrait le texte brut d'un fichier DOCX */
async function parseDOCX(file: File): Promise<string> {
  const mammoth     = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const result      = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}

/** Extrait le texte d'un fichier TXT / Markdown */
async function parseTXT(file: File): Promise<string> {
  return file.text()
}

async function parseFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const mime = file.type.toLowerCase()

  if (mime === 'application/pdf' || ext === 'pdf') return parsePDF(file)
  if (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'docx'
  ) return parseDOCX(file)
  if (ext === 'doc') throw new Error('.doc non supporté. Convertis en .docx ou .txt.')
  // TXT, MD, etc.
  return parseTXT(file)
}

// ── Initial state ────────────────────────────────────────────────
const INITIAL_STATE: LLMState = {
  stage:        'idle',
  progress:     0,
  progressMsg:  '',
  chunkResults: [],
  summary:      '',
  error:        null,
  wordCount:    0,
}

// ── Hook ─────────────────────────────────────────────────────────
export function useLocalLLM(): UseLocalLLMReturn {
  const [state, setState] = useState<LLMState>(INITIAL_STATE)
  const workerRef         = useRef<Worker | null>(null)

  // Crée le Worker une seule fois (il persiste entre les appels → modèle mis en cache)
  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/summarizer.worker.ts', import.meta.url),
      { type: 'module' },
    )

    workerRef.current.addEventListener('message', (event: MessageEvent<WorkerOutput>) => {
      const msg = event.data

      switch (msg.type) {
        case 'progress':
          setState((prev) => ({
            ...prev,
            stage:       msg.stage,
            progress:    msg.value,
            progressMsg: msg.message,
          }))
          break

        case 'chunk_done':
          setState((prev) => ({
            ...prev,
            chunkResults: [
              ...prev.chunkResults,
              { index: msg.chunkIndex, summary: msg.chunkSummary },
            ],
          }))
          break

        case 'done':
          setState((prev) => ({
            ...prev,
            stage:       'done',
            progress:    100,
            progressMsg: 'Résumé terminé ✓',
            summary:     msg.summary,
          }))
          break

        case 'error':
          setState((prev) => ({
            ...prev,
            stage: 'error',
            error: msg.message,
          }))
          break
      }
    })

    workerRef.current.addEventListener('error', (err) => {
      setState((prev) => ({
        ...prev,
        stage: 'error',
        error: err.message ?? 'Erreur inattendue dans le worker.',
      }))
    })

    return () => {
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, [])

  /** Démarre le résumé d'un fichier */
  const summarize = useCallback(async (file: File, lang: 'fr' | 'en' = 'fr') => {
    setState({ ...INITIAL_STATE, stage: 'parsing', progressMsg: 'Lecture du fichier…' })

    try {
      // 1. Parser le fichier côté main thread (pdfjs / mammoth sont lourds pour le worker)
      const text      = await parseFile(file)
      const wordCount = text.split(/\s+/).filter(Boolean).length

      if (wordCount < 30) {
        setState((prev) => ({
          ...prev,
          stage: 'error',
          error: 'Le document est trop court pour être résumé (moins de 30 mots).',
        }))
        return
      }

      setState((prev) => ({ ...prev, wordCount, stage: 'loading' }))

      // 2. Envoyer au Worker
      const msg: WorkerInput = { type: 'summarize', text, lang }
      workerRef.current?.postMessage(msg)

    } catch (err: unknown) {
      setState((prev) => ({
        ...prev,
        stage: 'error',
        error: err instanceof Error ? err.message : 'Impossible de lire ce fichier.',
      }))
    }
  }, [])

  /** Pose une question libre sur un contexte textuel */
  const ask = useCallback((question: string, context: string, lang: 'fr' | 'en' = 'fr') => {
    setState({ ...INITIAL_STATE, stage: 'loading', progressMsg: 'Chargement du modèle…' })
    const msg: WorkerInput = { type: 'ask', question, context, lang }
    workerRef.current?.postMessage(msg)
  }, [])

  const reset = useCallback(() => setState(INITIAL_STATE), [])

  return { ...state, summarize, ask, reset }
}
