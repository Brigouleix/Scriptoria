'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const t = useTranslations('auth')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(t('wrong_credentials'))
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="flex flex-col items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="text-amber-400" size={28} />
            <span className="text-2xl font-bold tracking-tight">Scriptoria</span>
          </Link>
          <p className="text-stone-400 text-sm">{t('login_title')}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-stone-300">{t('email')}</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com"
              className="bg-stone-900 border border-stone-700 rounded-lg px-3 py-2.5 text-sm placeholder:text-stone-600 focus:outline-none focus:border-amber-500 transition-colors" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-stone-300">{t('password')}</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••"
              className="bg-stone-900 border border-stone-700 rounded-lg px-3 py-2.5 text-sm placeholder:text-stone-600 focus:outline-none focus:border-amber-500 transition-colors" />
          </div>
          <button type="submit" disabled={loading}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-950 font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2">
            {loading && <Loader2 size={16} className="animate-spin" />}
            {t('login_btn')}
          </button>
        </form>

        <p className="text-center text-stone-400 text-sm">
          {t('no_account')}{' '}
          <Link href="/register" className="text-amber-400 hover:text-amber-300 transition-colors">
            {t('create_account')}
          </Link>
        </p>
      </div>
    </div>
  )
}
