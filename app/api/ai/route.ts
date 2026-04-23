import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { question, context } = await req.json()
  if (!question?.trim()) return new Response('Missing question', { status: 400 })

  const systemPrompt = `Tu es un assistant d'écriture intégré à Scriptoria, une plateforme d'aide à l'écriture de romans.
Tu aides les auteurs à analyser, résumer et améliorer leur travail.
Réponds toujours en français, de façon concise et utile.
Si on te fournit du contenu de page, utilise-le comme contexte pour répondre à la question.
Ne dépasse pas 300 mots sauf si explicitement demandé.`

  const userMessage = context?.trim()
    ? `Contenu de la page :\n"""\n${context.slice(0, 4000)}\n"""\n\nQuestion : ${question}`
    : question

  try {
    const stream = await client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(chunk.delta.text))
            }
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
    let message = 'Erreur lors de la requête IA.'
    if (status === 400) {
      const body = (err as { error?: { error?: { message?: string } } }).error
      if (body?.error?.message?.includes('credit')) {
        message = 'Crédits Anthropic insuffisants. Recharge ton compte sur console.anthropic.com/settings/billing.'
      }
    } else if (status === 401) {
      message = 'Clé API Anthropic invalide. Vérifie ANTHROPIC_API_KEY dans .env.local.'
    }
    return new Response(message, { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }
}
