'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
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
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
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
          <p className="text-stone-400 text-sm">Connexion à votre espace</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-stone-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="vous@exemple.com"
              className="bg-stone-900 border border-stone-700 rounded-lg px-3 py-2.5 text-sm placeholder:text-stone-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-stone-300">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="bg-stone-900 border border-stone-700 rounded-lg px-3 py-2.5 text-sm placeholder:text-stone-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-950 font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Se connecter
          </button>
        </form>

        <p className="text-center text-stone-400 text-sm">
          Pas encore de compte ?{' '}
          <Link href="/register" className="text-amber-400 hover:text-amber-300 transition-colors">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  )
}
