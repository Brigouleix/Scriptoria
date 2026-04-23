import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, LayoutDashboard, LogOut, Shield, Users } from 'lucide-react'

const ADMIN_EMAIL = 'antoine.brigouleix@gmail.com'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg-base)] text-[var(--text-primary)]">
      {/* Sidebar admin */}
      <aside className="w-56 shrink-0 border-r border-[var(--border)] bg-[var(--bg-card)] flex flex-col py-6 px-4 gap-6">
        <div className="flex items-center gap-2.5">
          <Shield size={18} className="text-amber-500" />
          <span className="font-bold text-sm tracking-wide text-[var(--text-primary)]">Admin</span>
        </div>

        <nav className="flex flex-col gap-1">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
          >
            <LayoutDashboard size={15} />
            Vue d&apos;ensemble
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
          >
            <Users size={15} />
            Utilisateurs
          </Link>
          <Link
            href="/admin/projects"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
          >
            <BookOpen size={15} />
            Projets
          </Link>
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          <p className="text-[11px] text-[var(--text-muted)] px-3 truncate">{user.email}</p>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
          >
            <LogOut size={13} />
            Retour app
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-auto p-8">
        {children}
      </main>
    </div>
  )
}
