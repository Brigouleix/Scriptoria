'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, LogOut, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import LocaleSwitcher from '@/components/LocaleSwitcher'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import type { User } from '@supabase/supabase-js'

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
        <Link
          href="/people"
          className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition-colors"
        >
          <Users size={15} />
          <span className="hidden sm:block">Membres</span>
        </Link>
        <ThemeSwitcher />
        <LocaleSwitcher />
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
