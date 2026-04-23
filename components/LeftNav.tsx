'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

interface Project { id: string; title: string; project_type: string }
interface Person  { id: string; name: string }

export default function LeftNav() {
  const pathname = usePathname()
  const t = useTranslations('nav')

  const [open, setOpen]       = useState<'projects' | 'people' | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [people,   setPeople]   = useState<Person[]>([])

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('projects').select('id, title, project_type').order('updated_at', { ascending: false }),
      supabase.from('people').select('id, name').order('name'),
    ]).then(([{ data: p }, { data: pp }]) => {
      setProjects(p ?? [])
      setPeople(pp ?? [])
    })
  }, [])

  // Detect current project from URL to determine team vs novel context
  const projectIdMatch = pathname.match(/\/project\/([a-f0-9-]+)/)
  const currentProjectId = projectIdMatch?.[1]
  const currentProject = projects.find((p) => p.id === currentProjectId)
  const isTeam = currentProject?.project_type === 'team'

  function toggle(key: 'projects' | 'people') {
    setOpen((prev) => (prev === key ? null : key))
  }

  const projectsActive = pathname === '/dashboard' || !!currentProjectId
  const peopleActive   = pathname.startsWith('/people')

  // Premier niveau : "Tous les projets", "Mes personnages"
  const subHeader = (href: string, label: string, active: boolean) => (
    <Link
      key={href}
      href={href}
      className={`text-xs py-1.5 px-2 rounded-md transition-colors truncate block font-medium ${
        active
          ? 'text-amber-500'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)]'
      }`}
    >
      {label}
    </Link>
  )

  // Deuxième niveau : chaque projet / chaque personnage
  const subItem = (href: string, label: string, active: boolean) => (
    <Link
      key={href}
      href={href}
      className={`text-[11px] py-1 pl-3 pr-2 rounded-md transition-colors truncate block ${
        active
          ? 'text-amber-500 font-medium'
          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)]'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <aside className="hidden sm:flex w-52 shrink-0 border-r border-[var(--border)] bg-[var(--bg-card)] flex-col py-5 px-3 gap-1 overflow-y-auto">

      {/* ── Mes projets ── */}
      <div>
        <button
          onClick={() => toggle('projects')}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            projectsActive
              ? 'bg-amber-500/10 text-amber-500'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)]'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <LayoutDashboard size={16} />
            {t('my_projects')}
          </span>
          <ChevronDown
            size={13}
            className={`shrink-0 transition-transform duration-200 ${open === 'projects' ? 'rotate-180' : ''}`}
          />
        </button>

        {open === 'projects' && (
          <div className="mt-1 ml-4 pl-3 border-l border-[var(--border)] flex flex-col gap-0.5">
            {subHeader('/dashboard', t('all_projects'), pathname === '/dashboard')}
            {projects.map((p) =>
              subItem(`/project/${p.id}`, p.title, currentProjectId === p.id)
            )}
            {projects.length === 0 && (
              <span className="text-[11px] text-[var(--text-muted)] py-1 pl-3 italic">
                Aucun projet
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Personnages / Membres ── */}
      <div>
        <button
          onClick={() => toggle('people')}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            peopleActive
              ? 'bg-amber-500/10 text-amber-500'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)]'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <Users size={16} />
            {isTeam ? t('members') : t('my_characters')}
          </span>
          <ChevronDown
            size={13}
            className={`shrink-0 transition-transform duration-200 ${open === 'people' ? 'rotate-180' : ''}`}
          />
        </button>

        {open === 'people' && (
          <div className="mt-1 ml-4 pl-3 border-l border-[var(--border)] flex flex-col gap-0.5">
            {subHeader('/people', isTeam ? t('my_team') : t('my_characters'), pathname === '/people')}
            {people.map((p) =>
              subItem(`/people#${p.id}`, p.name, false)
            )}
            {people.length === 0 && (
              <span className="text-xs text-[var(--text-muted)] py-1 px-2 italic">
                Aucun personnage
              </span>
            )}
          </div>
        )}
      </div>

    </aside>
  )
}
