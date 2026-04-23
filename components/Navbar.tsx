'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, LogOut, Shield } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import LocaleSwitcher from '@/components/LocaleSwitcher'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import type { User } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'antoine.brigouleix@gmail.com'

export default function Navbar({ user }: { user: User }) {
  const router = useRouter()
  const t = useTranslations('nav')

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
      <Link href="/dashboard" className="flex items-center gap-2">
        <BookOpen className="text-amber-500" size={22} />
        <span className="font-bold tracking-tight text-[var(--text-primary)]">Scriptoria</span>
      </Link>
      <div className="flex items-center gap-4">
        <ThemeSwitcher />
        <LocaleSwitcher />
        {user.email === ADMIN_EMAIL && (
          <Link
            href="/admin"
            title="Admin"
            className="flex items-center gap-1 text-amber-500 hover:text-amber-400 text-xs font-semibold transition-colors"
          >
            <Shield size={14} />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        )}
        <span className="text-[var(--text-muted)] text-sm hidden sm:block">{user.email}</span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition-colors"
        >
          <LogOut size={15} />
          {t('logout')}
        </button>
      </div>
    </nav>
  )
}
