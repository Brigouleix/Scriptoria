import { createAdminClient } from '@/lib/supabase/admin'
import { BookOpen, Calendar, RefreshCw, User, FileText } from 'lucide-react'

export default async function AdminProjectsPage() {
  const admin = createAdminClient()

  const [
    { data: { users }, error: usersError },
    { data: projects },
    { data: chapters },
    { data: steps },
  ] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from('projects').select('id, title, user_id, project_type, created_at, updated_at').order('created_at', { ascending: false }),
    admin.from('chapters').select('id, project_id, title').order('created_at', { ascending: false }),
    admin.from('snowflake_steps').select('id, project_id, step_number, content'),
  ])

  if (usersError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 max-w-md text-center">
          <p className="text-red-500 font-semibold mb-2">Erreur service_role</p>
          <p className="text-[var(--text-muted)] text-sm">
            Vérifie que <code className="bg-[var(--bg-input)] px-1.5 py-0.5 rounded text-amber-500">SUPABASE_SERVICE_ROLE_KEY</code> est bien défini dans{' '}
            <code className="bg-[var(--bg-input)] px-1.5 py-0.5 rounded text-amber-500">.env.local</code>.
          </p>
        </div>
      </div>
    )
  }

  const userEmailMap = new Map<string, string>()
  users?.forEach((u) => userEmailMap.set(u.id, u.email ?? u.id.slice(0, 8)))

  const chaptersByProject = new Map<string, number>()
  chapters?.forEach((c) => {
    chaptersByProject.set(c.project_id, (chaptersByProject.get(c.project_id) ?? 0) + 1)
  })

  const stepsByProject = new Map<string, number>()
  steps?.forEach((s) => {
    if (s.content && String(s.content).trim().length > 0) {
      stepsByProject.set(s.project_id, (stepsByProject.get(s.project_id) ?? 0) + 1)
    }
  })

  const totalProjects = projects?.length ?? 0
  const novelCount    = projects?.filter((p) => p.project_type !== 'team').length ?? 0
  const teamCount     = projects?.filter((p) => p.project_type === 'team').length ?? 0
  const oneWeekAgo    = new Date(Date.now() - 7 * 24 * 3600 * 1000)
  const recentCount   = projects?.filter((p) => new Date(p.updated_at) > oneWeekAgo).length ?? 0

  function fmt(d: string | null | undefined) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Projets</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            {totalProjects} projets au total — {recentCount} modifiés cette semaine
          </p>
        </div>
        <div className="flex gap-3">
          {[
            { value: totalProjects, label: 'Total',   color: 'text-[var(--text-primary)]' },
            { value: novelCount,    label: 'Romans',  color: 'text-amber-500' },
            { value: teamCount,     label: 'Équipes', color: 'text-blue-500' },
            { value: recentCount,   label: 'Récents', color: 'text-green-500' },
          ].map(({ value, label, color }) => (
            <div key={label} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-center">
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-xs">
              <th className="text-left px-5 py-3.5 font-medium">Titre</th>
              <th className="text-left px-4 py-3.5 font-medium">Type</th>
              <th className="text-left px-4 py-3.5 font-medium">Auteur</th>
              <th className="text-center px-4 py-3.5 font-medium">Étapes</th>
              <th className="text-center px-4 py-3.5 font-medium">Chapitres</th>
              <th className="text-left px-4 py-3.5 font-medium">Créé</th>
              <th className="text-left px-4 py-3.5 font-medium">Modifié</th>
            </tr>
          </thead>
          <tbody>
            {projects?.map((p) => {
              const filledSteps = stepsByProject.get(p.id) ?? 0
              const nbChapters  = chaptersByProject.get(p.id) ?? 0
              const author      = userEmailMap.get(p.user_id) ?? p.user_id.slice(0, 8) + '…'
              const isRecent    = new Date(p.updated_at) > oneWeekAgo

              return (
                <tr key={p.id} className="border-b border-[var(--border)]/50 hover:bg-[var(--bg-card-hover)] transition-colors">
                  {/* Title */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <BookOpen size={14} className={`shrink-0 ${p.project_type === 'team' ? 'text-blue-500' : 'text-amber-500'}`} />
                      <span className="text-[var(--text-secondary)] font-medium truncate max-w-[180px]">{p.title}</span>
                      {isRecent && (
                        <span className="text-[9px] font-bold bg-green-500/15 text-green-500 px-1.5 py-0.5 rounded-full shrink-0">RÉCENT</span>
                      )}
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-4">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      p.project_type === 'team'
                        ? 'bg-blue-500/15 text-blue-500'
                        : 'bg-amber-500/15 text-amber-500'
                    }`}>
                      {p.project_type === 'team' ? 'Équipe' : 'Roman'}
                    </span>
                  </td>

                  {/* Author */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-xs">
                      <User size={11} className="shrink-0" />
                      <span className="truncate max-w-[130px]">{author}</span>
                    </div>
                  </td>

                  {/* Steps */}
                  <td className="px-4 py-4">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs text-[var(--text-muted)]">{filledSteps}/4</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className={`h-1.5 w-4 rounded-full ${i < filledSteps ? 'bg-amber-500' : 'bg-[var(--border)]'}`} />
                        ))}
                      </div>
                    </div>
                  </td>

                  {/* Chapters */}
                  <td className="px-4 py-4 text-center">
                    {nbChapters > 0 ? (
                      <span className="flex items-center justify-center gap-1 text-[var(--text-secondary)] font-medium">
                        <FileText size={11} className="text-[var(--text-muted)]" />
                        {nbChapters}
                      </span>
                    ) : (
                      <span className="text-[var(--text-muted)]">—</span>
                    )}
                  </td>

                  {/* Created */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-xs">
                      <Calendar size={11} />
                      {fmt(p.created_at)}
                    </div>
                  </td>

                  {/* Updated */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 text-xs">
                      <RefreshCw size={11} className={isRecent ? 'text-green-500' : 'text-[var(--text-muted)]'} />
                      <span className={isRecent ? 'text-green-500' : 'text-[var(--text-muted)]'}>{fmt(p.updated_at)}</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {totalProjects === 0 && (
          <div className="px-5 py-16 text-center text-[var(--text-muted)] text-sm italic">Aucun projet trouvé</div>
        )}
      </div>

    </div>
  )
}
