/**
 * summarizer.worker.ts
 * Web Worker isolé — charge le modèle SmolLM2 et exécute les résumés
 * sans bloquer le thread principal (UI).
 *
 * Communication :
 *  Main → Worker : WorkerInput
 *  Worker → Main : WorkerOutput
 */

import { pipeline, env } from '@huggingface/transformers'

// ── Config Transformers.js ───────────────────────────────────────
// Le cache est géré automatiquement dans l'IndexedDB du navigateur
env.allowLocalModels   = false
env.useBrowserCache    = true   // mise en cache IndexedDB après le 1er téléchargement

const MODEL_ID        = 'HuggingFaceTB/SmolLM2-1.7B-Instruct'
const MAX_CHUNK_WORDS = 380   // ~512 tokens — fenêtre de contexte sécurisée
const MAX_NEW_TOKENS  = 180   // longueur max du résumé par chunk

// ── Types ────────────────────────────────────────────────────────
export type WorkerInput = {
  type: 'summarize'
  text: string
  lang?: 'fr' | 'en'
}

export type WorkerOutput =
  | { type: 'progress';    stage: 'loading' | 'summarizing'; value: number; message: string }
  | { type: 'chunk_done'; chunkIndex: number; total: number; chunkSummary: string }
  | { type: 'done';        summary: string }
  | { type: 'error';       message: string }

// ── Singleton pipeline ───────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let generator: any = null

// ── Helpers ──────────────────────────────────────────────────────

/** Découpe le texte en blocs de ~maxWords mots */
function chunkText(text: string, maxWords: number): string[] {
  // Nettoyage basique : lignes vides multiples, espaces excessifs
  const cleaned = text.replace(/\s{3,}/g, '\n\n').trim()
  const words   = cleaned.split(/\s+/).filter(Boolean)

  if (words.length === 0) return []

  const chunks: string[] = []
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(' '))
  }
  return chunks
}

/** Appelle le modèle pour résumer un passage */
async function callModel(userPrompt: string, lang: 'fr' | 'en'): Promise<string> {
  const systemPrompt =
    lang === 'fr'
      ? 'Tu es un assistant de synthèse. Résume le texte suivant de façon concise en 2 à 3 phrases, en français.'
      : 'You are a summarization assistant. Summarize the following text concisely in 2-3 sentences, in English.'

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user',   content: userPrompt   },
  ]

  const output = await generator(messages, {
    max_new_tokens:    MAX_NEW_TOKENS,
    temperature:       0.3,   // déterministe — meilleur pour les résumés
    repetition_penalty: 1.2,
    do_sample:         false,
  })

  // Transformers.js v3 : le dernier message généré est à l'index -1
  const generated = output[0]?.generated_text
  if (Array.isArray(generated)) {
    return (generated.at(-1)?.content as string ?? '').trim()
  }
  return String(generated ?? '').trim()
}

/** Phase MAP : résume chaque chunk indépendamment */
async function mapPhase(chunks: string[], lang: 'fr' | 'en'): Promise<string[]> {
  const summaries: string[] = []

  for (let i = 0; i < chunks.length; i++) {
    const prompt =
      lang === 'fr'
        ? `Passage ${i + 1}/${chunks.length} :\n\n${chunks[i]}`
        : `Passage ${i + 1}/${chunks.length}:\n\n${chunks[i]}`

    const summary = await callModel(prompt, lang)
    summaries.push(summary)

    // Notification chunk par chunk
    const msg: WorkerOutput = {
      type:         'chunk_done',
      chunkIndex:   i,
      total:        chunks.length,
      chunkSummary: summary,
    }
    self.postMessage(msg)

    const progressMsg: WorkerOutput = {
      type:    'progress',
      stage:   'summarizing',
      value:   Math.round(((i + 1) / chunks.length) * (chunks.length > 1 ? 75 : 100)),
      message: lang === 'fr'
        ? `Bloc ${i + 1} / ${chunks.length} résumé…`
        : `Block ${i + 1} / ${chunks.length} summarized…`,
    }
    self.postMessage(progressMsg)
  }

  return summaries
}

/** Phase REDUCE : fusionne les résumés partiels en un résumé final */
async function reducePhase(partialSummaries: string[], lang: 'fr' | 'en'): Promise<string> {
  const combined = partialSummaries.join('\n\n')

  const prompt =
    lang === 'fr'
      ? `Voici plusieurs résumés partiels d'un même document. Synthétise-les en un seul résumé cohérent et fluide :\n\n${combined}`
      : `Here are several partial summaries of the same document. Merge them into one coherent and fluent summary:\n\n${combined}`

  return callModel(prompt, lang)
}

// ── Message handler ──────────────────────────────────────────────
self.addEventListener('message', async (event: MessageEvent<WorkerInput>) => {
  const { type, text, lang = 'fr' } = event.data

  if (type !== 'summarize') return

  try {
    // ── 1. Chargement du modèle (une seule fois, mis en cache) ──
    if (!generator) {
      const loadingMsg: WorkerOutput = {
        type: 'progress', stage: 'loading', value: 0,
        message: lang === 'fr' ? 'Initialisation du modèle…' : 'Initializing model…',
      }
      self.postMessage(loadingMsg)

      generator = await pipeline('text-generation', MODEL_ID, {
        dtype: 'q4',            // version quantifiée 4-bit (≈ 900 Mo)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        progress_callback: (info: any) => {
          if (info.status === 'progress') {
            const pct = Math.round(info.progress ?? 0)
            const progressMsg: WorkerOutput = {
              type:    'progress',
              stage:   'loading',
              value:   pct,
              message: `${info.file ?? 'modèle'} — ${pct}%`,
            }
            self.postMessage(progressMsg)
          } else if (info.status === 'done') {
            const doneMsg: WorkerOutput = {
              type: 'progress', stage: 'loading', value: 100,
              message: lang === 'fr' ? 'Modèle prêt ✓' : 'Model ready ✓',
            }
            self.postMessage(doneMsg)
          }
        },
      })
    }

    // ── 2. Découpage du texte ────────────────────────────────────
    const chunks = chunkText(text, MAX_CHUNK_WORDS)

    if (chunks.length === 0) {
      const errMsg: WorkerOutput = { type: 'error', message: 'Aucun texte détecté dans le document.' }
      self.postMessage(errMsg)
      return
    }

    const startMsg: WorkerOutput = {
      type: 'progress', stage: 'summarizing', value: 0,
      message: lang === 'fr'
        ? `Document découpé en ${chunks.length} bloc${chunks.length > 1 ? 's' : ''}…`
        : `Document split into ${chunks.length} block${chunks.length > 1 ? 's' : ''}…`,
    }
    self.postMessage(startMsg)

    // ── 3. Phase MAP ─────────────────────────────────────────────
    const partialSummaries = await mapPhase(chunks, lang)

    // ── 4. Phase REDUCE (si plusieurs chunks) ───────────────────
    let finalSummary: string

    if (chunks.length > 1) {
      const reduceMsg: WorkerOutput = {
        type: 'progress', stage: 'summarizing', value: 80,
        message: lang === 'fr' ? 'Synthèse finale…' : 'Final synthesis…',
      }
      self.postMessage(reduceMsg)

      finalSummary = await reducePhase(partialSummaries, lang)
    } else {
      finalSummary = partialSummaries[0]
    }

    // ── 5. Résultat ──────────────────────────────────────────────
    const doneMsg: WorkerOutput = { type: 'done', summary: finalSummary }
    self.postMessage(doneMsg)

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue dans le worker.'
    const errMsg: WorkerOutput = { type: 'error', message }
    self.postMessage(errMsg)
  }
})
