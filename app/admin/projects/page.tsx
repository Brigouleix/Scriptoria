import { createAdminClient } from '@/lib/supabase/admin'
import { BookOpen, Calendar, RefreshCw, User, FileText, Users } from 'lucide-react'

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
          <p className="text-red-400 font-semibold mb-2">Erreur service_role</p>
          <p className="text-zinc-400 text-sm">
            Vérifie que <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-amber-400">SUPABASE_SERVICE_ROLE_KEY</code> est bien défini dans{' '}
            <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-amber-400">.env.local</code>.
          </p>
        </div>
      </div>
    )
  }

  // Maps
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

  // Projects modified in last 7 days
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000)
  const recentCount = projects?.filter((p) => new Date(p.updated_at) > oneWeekAgo).length ?? 0

  function fmt(d: string | null | undefined) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // Progress bar component (inline)
  function ProgressSteps({ filled }: { filled: number }) {
    const total = 4
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-5 rounded-full ${i < filled ? 'bg-amber-500' : 'bg-zinc-700'}`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Projets</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {totalProjects} projets au total — {recentCount} modifiés cette semaine
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-center">
            <p className="text-xl font-bold text-zinc-100">{totalProjects}</p>
            <p className="text-[11px] text-zinc-500 uppercase tracking-wide">Total</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-center">
            <p className="text-xl font-bold text-amber-400">{novelCount}</p>
            <p className="text-[11px] text-zinc-500 uppercase tracking-wide">Romans</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-center">
            <p className="text-xl font-bold text-blue-400">{teamCount}</p>
            <p className="text-[11px] text-zinc-500 uppercase tracking-wide">Équipes</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-center">
            <p className="text-xl font-bold text-green-400">{recentCount}</p>
            <p className="text-[11px] text-zinc-500 uppercase tracking-wide">Récents</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500 text-xs">
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
                <tr key={p.id} className="border-b border-zinc-800/40 hover:bg-zinc-800/30 transition-colors">
                  {/* Title */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <BookOpen size={14} className={p.project_type === 'team' ? 'text-blue-400 shrink-0' : 'text-amber-400 shrink-0'} />
                      <span className="text-zinc-200 font-medium truncate max-w-[180px]">{p.title}</span>
                      {isRecent && (
                        <span className="text-[9px] font-bold bg-green-500/15 text-green-400 px-1.5 py-0.5 rounded-full shrink-0">RÉCENT</span>
                      )}
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-4">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      p.project_type === 'team'
                        ? 'bg-blue-500/15 text-blue-400'
                        : 'bg-amber-500/15 text-amber-400'
                    }`}>
                      {p.project_type === 'team' ? 'Équipe' : 'Roman'}
                    </span>
                  </td>

                  {/* Author */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                      <User size={11} className="shrink-0" />
                      <span className="truncate max-w-[130px]">{author}</span>
                    </div>
                  </td>

                  {/* Steps progress */}
                  <td className="px-4 py-4">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs text-zinc-400">{filledSteps}/4</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className={`h-1.5 w-4 rounded-full ${i < filledSteps ? 'bg-amber-500' : 'bg-zinc-700'}`} />
                        ))}
                      </div>
                    </div>
                  </td>

                  {/* Chapters */}
                  <td className="px-4 py-4 text-center">
                    {nbChapters > 0 ? (
                      <span className="flex items-center justify-center gap-1 text-zinc-200 font-medium">
                        <FileText size={11} className="text-zinc-400" />
                        {nbChapters}
                      </span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>

                  {/* Created */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                      <Calendar size={11} />
                      {fmt(p.created_at)}
                    </div>
                  </td>

                  {/* Updated */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 text-xs">
                      <RefreshCw size={11} className={isRecent ? 'text-green-400' : 'text-zinc-600'} />
                      <span className={isRecent ? 'text-green-400' : 'text-zinc-500'}>{fmt(p.updated_at)}</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {totalProjects === 0 && (
          <div className="px-5 py-16 text-center text-zinc-600 text-sm italic">
            Aucun projet trouvé
          </div>
        )}
      </div>

    </div>
  )
}
