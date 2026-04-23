import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, LayoutDashboard, LogOut, Shield } from 'lucide-react'

const ADMIN_EMAIL = 'antoine.brigouleix@gmail.com'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex bg-zinc-950 text-zinc-100">
      {/* Sidebar admin */}
      <aside className="w-56 shrink-0 border-r border-zinc-800 flex flex-col py-6 px-4 gap-6">
        <div className="flex items-center gap-2.5">
          <Shield size={18} className="text-amber-500" />
          <span className="font-bold text-sm tracking-wide text-zinc-100">Admin</span>
        </div>

        <nav className="flex flex-col gap-1">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <LayoutDashboard size={15} />
            Vue d&apos;ensemble
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Utilisateurs
          </Link>
          <Link
            href="/admin/projects"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <BookOpen size={15} />
            Projets
          </Link>
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          <p className="text-[11px] text-zinc-500 px-3 truncate">{user.email}</p>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
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
