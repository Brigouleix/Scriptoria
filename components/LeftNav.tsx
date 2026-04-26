'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { LayoutDashboard, Users, ChevronDown, Cpu, MapPin } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

interface Project { id: string; title: string; project_type: string }

export default function LeftNav() {
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const t            = useTranslations('nav')

  const [openProjects, setOpenProjects] = useState(true)
  const [projects,     setProjects]     = useState<Project[]>([])

  // Détecter le projet courant depuis l'URL
  const projectIdMatch   = pathname.match(/\/project\/([a-f0-9-]+)/)
  const currentProjectId = projectIdMatch?.[1] ?? null

  useEffect(() => {
    createClient()
      .from('projects')
      .select('id, title, project_type')
      .order('updated_at', { ascending: false })
      .then(({ data }) => setProjects(data ?? []))
  }, [])

  const projectsActive = pathname === '/dashboard' || !!currentProjectId
  const lieuxActive    = pathname === '/people' && searchParams.get('tab') === 'lieux'

  return (
    <aside className="hidden sm:flex w-52 shrink-0 border-r border-[var(--border)] bg-[var(--bg-card)] flex-col py-5 px-3 gap-1 overflow-y-auto">

      {/* ── Mes projets ── */}
      <div>
        <button
          onClick={() => setOpenProjects((v) => !v)}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            projectsActive
              ? 'bg-amber-500/10 text-amber-500'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <LayoutDashboard size={16} />
            {t('my_projects')}
          </span>
          <ChevronDown
            size={13}
            className={`shrink-0 transition-transform duration-200 ${openProjects ? 'rotate-180' : ''}`}
          />
        </button>

        {openProjects && (
          <div className="mt-1 ml-4 pl-3 border-l border-[var(--border)] flex flex-col gap-0.5">
            {/* Tous les projets */}
            <Link
              href="/dashboard"
              className={`text-xs py-1.5 px-2 rounded-md transition-colors truncate block font-medium ${
                pathname === '/dashboard'
                  ? 'text-amber-500'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
              }`}
            >
              {t('all_projects')}
            </Link>

            {/* Liste des projets avec sous-lien Personnages */}
            {projects.map((p) => {
              const isCurrentProject = currentProjectId === p.id
              const onProjectPage    = isCurrentProject && !pathname.includes('/people') && !pathname.includes('/documents')
              const onPeoplePage     = pathname === `/project/${p.id}/people`
              const onDocumentsPage  = pathname.startsWith(`/project/${p.id}/documents`)

              return (
                <div key={p.id} className="flex flex-col gap-0">
                  {/* Nom du projet */}
                  <Link
                    href={`/project/${p.id}`}
                    className={`text-[11px] py-1 pl-2 pr-2 rounded-md transition-colors truncate block font-medium ${
                      onProjectPage
                        ? 'text-amber-500'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                    }`}
                  >
                    {p.title}
                  </Link>

                  {/* Sous-liens visibles uniquement si on est dans ce projet */}
                  {isCurrentProject && (
                    <div className="ml-3 pl-2 border-l border-[var(--border)]/60 flex flex-col gap-0">
                      {/* Personnages */}
                      <Link
                        href={`/project/${p.id}/people`}
                        className={`text-[10px] py-0.5 px-2 rounded-md transition-colors flex items-center gap-1.5 ${
                          onPeoplePage
                            ? 'text-amber-500 font-medium'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                        }`}
                      >
                        <Users size={9} />
                        {p.project_type === 'team' ? t('members') : t('my_characters')}
                      </Link>

                      {/* Productions écrites */}
                      <Link
                        href={`/project/${p.id}/documents`}
                        className={`text-[10px] py-0.5 px-2 rounded-md transition-colors flex items-center gap-1.5 ${
                          onDocumentsPage
                            ? 'text-amber-500 font-medium'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                        }`}
                      >
                        <span className="text-[8px]">✍</span>
                        Productions écrites
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}

            {projects.length === 0 && (
              <span className="text-[11px] text-[var(--text-muted)] py-1 pl-2 italic">
                Aucun projet
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Mes lieux ── */}
      <Link
        href="/people?tab=lieux"
        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          lieuxActive
            ? 'bg-amber-500/10 text-amber-500'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
        }`}
      >
        <MapPin size={16} />
        Mes lieux
      </Link>

      {/* ── Résumé IA ── */}
      <Link
        href="/summarizer"
        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          pathname === '/summarizer'
            ? 'bg-amber-500/10 text-amber-500'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
        }`}
      >
        <Cpu size={16} />
        Résumé IA
      </Link>

    </aside>
  )
}
