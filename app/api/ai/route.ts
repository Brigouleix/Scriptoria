import Groq from 'groq-sdk'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { question, context } = await req.json()
  if (!question?.trim()) return new Response('Missing question', { status: 400 })

  const systemPrompt = `Tu es un assistant d'écriture intégré à Scriptoria, une plateforme d'aide à l'écriture de romans et de projets d'équipe.
Tu aides les auteurs à analyser, résumer et améliorer leur travail.
Réponds toujours en français, de façon concise et utile.
Si on te fournit du contenu de page, utilise-le comme contexte pour répondre.
Ne dépasse pas 300 mots sauf si explicitement demandé.`

  const userMessage = context?.trim()
    ? `Contenu de la page :\n"""\n${context.slice(0, 4000)}\n"""\n\nQuestion : ${question}`
    : question

  try {
    const stream = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 512,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      stream: true,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? ''
            if (text) controller.enqueue(encoder.encode(text))
          }
        } catch {
          controller.enqueue(encoder.encode('\n\n[Erreur de streaming]'))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500
    // Logger côté serveur uniquement (ne jamais exposer les détails au client)
    console.error('[AI route] Groq error:', { status, message: (err as { message?: string }).message })
    const clientMessage = status === 429
      ? 'Limite de requêtes atteinte. Réessaie dans quelques secondes.'
      : 'Une erreur est survenue. Réessaie plus tard.'
    return new Response(clientMessage, {
      status,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}
