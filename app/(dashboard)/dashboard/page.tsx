import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BookOpen, ChevronRight, Users } from 'lucide-react'
import { getTranslations, getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import NewProjectButton from '@/components/NewProjectButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: projects }, t, locale] = await Promise.all([
    supabase
      .from('projects')
      .select('id, title, genre, project_type, created_at, updated_at')
      .order('updated_at', { ascending: false }),
    getTranslations('dashboard'),
    getLocale(),
  ])

  const count = projects?.length ?? 0

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t('title')}</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            {t(count > 1 ? 'project_count_plural' : 'project_count', { count })}
          </p>
        </div>
        <NewProjectButton />
      </div>

      {!projects || projects.length === 0 ? (
        <div className="border border-dashed border-[var(--border)] rounded-xl p-16 flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
            <BookOpen className="text-amber-500" size={24} />
          </div>
          <div>
            <p className="font-semibold text-[var(--text-primary)]">{t('no_projects')}</p>
            <p className="text-[var(--text-muted)] text-sm mt-1">{t('no_projects_desc')}</p>
          </div>
          <NewProjectButton variant="outline" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/project/${project.id}`}
              className="group border border-[var(--border)] hover:border-[var(--border-hover)] bg-[var(--bg-card)] rounded-xl p-5 flex flex-col gap-3 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  {project.project_type === 'team'
                    ? <Users className="text-amber-500" size={16} />
                    : <BookOpen className="text-amber-500" size={16} />
                  }
                </div>
                <ChevronRight
                  size={16}
                  className="text-[var(--text-muted)] group-hover:text-amber-500 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="font-semibold text-[var(--text-primary)] truncate">{project.title}</h2>
                {project.genre && (
                  <span className="text-xs text-[var(--text-muted)]">{project.genre}</span>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-auto">
                {t('modified', {
                  date: new Date(project.updated_at).toLocaleDateString(locale, {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  }),
                })}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
