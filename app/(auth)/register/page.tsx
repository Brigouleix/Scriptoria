'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, Loader2, CheckCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const t = useTranslations('auth')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password.length < 8) {
      setError(t('password_too_short'))
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/api/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm flex flex-col items-center gap-4 text-center">
          <CheckCircle className="text-amber-400" size={48} />
          <h2 className="text-xl font-bold">{t('check_email')}</h2>
          <p className="text-stone-400 text-sm leading-relaxed">
            {t('check_email_desc', { email })}
          </p>
          <Link href="/login" className="text-amber-400 hover:text-amber-300 text-sm transition-colors">
            {t('back_to_login')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="text-amber-400" size={28} />
            <span className="text-2xl font-bold tracking-tight">Scriptoria</span>
          </Link>
          <p className="text-stone-400 text-sm">{t('register_title')}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-stone-300">{t('email')}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="bg-stone-900 border border-stone-700 rounded-lg px-3 py-2.5 text-sm placeholder:text-stone-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-stone-300">{t('password')}</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder={t('password_placeholder')}
              className="bg-stone-900 border border-stone-700 rounded-lg px-3 py-2.5 text-sm placeholder:text-stone-600 focus:outline-none focus:border-amber-500 transition-colors" />
          </div>
          <button type="submit" disabled={loading}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-950 font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2">
            {loading && <Loader2 size={16} className="animate-spin" />}
            {t('register_btn')}
          </button>
        </form>

        <p className="text-center text-stone-400 text-sm">
          {t('has_account')}{' '}
          <Link href="/login" className="text-amber-400 hover:text-amber-300 transition-colors">
            {t('sign_in')}
          </Link>
        </p>
      </div>
    </div>
  )
}
