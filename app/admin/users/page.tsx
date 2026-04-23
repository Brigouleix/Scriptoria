import { createAdminClient } from '@/lib/supabase/admin'
import { Users, Calendar, Clock, BookOpen, User } from 'lucide-react'

const ADMIN_EMAIL = 'antoine.brigouleix@gmail.com'

export default async function AdminUsersPage() {
  const admin = createAdminClient()

  const [
    { data: { users }, error: usersError },
    { data: projects },
    { data: people },
  ] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from('projects').select('id, user_id, title, project_type'),
    admin.from('people').select('id, user_id'),
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

  const projectsByUser = new Map<string, typeof projects>()
  const peopleByUser   = new Map<string, number>()

  projects?.forEach((p) => {
    const arr = projectsByUser.get(p.user_id) ?? []
    arr.push(p)
    projectsByUser.set(p.user_id, arr)
  })
  people?.forEach((p) => {
    peopleByUser.set(p.user_id, (peopleByUser.get(p.user_id) ?? 0) + 1)
  })

  const sortedUsers  = [...(users ?? [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const activeCount  = sortedUsers.filter((u) => (projectsByUser.get(u.id)?.length ?? 0) > 0).length

  function fmt(d: string | null | undefined) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  function fmtFull(d: string | null | undefined) {
    if (!d) return '—'
    return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Utilisateurs</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            {sortedUsers.length} comptes — {activeCount} actifs (au moins 1 projet)
          </p>
        </div>
        <div className="flex gap-3">
          {[
            { value: sortedUsers.length, label: 'Total',      color: 'text-[var(--text-primary)]' },
            { value: activeCount,        label: 'Actifs',     color: 'text-green-500' },
            { value: sortedUsers.length - activeCount, label: 'Sans projet', color: 'text-[var(--text-muted)]' },
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
              <th className="text-left px-5 py-3.5 font-medium">Utilisateur</th>
              <th className="text-center px-4 py-3.5 font-medium">Projets</th>
              <th className="text-center px-4 py-3.5 font-medium">Personnages</th>
              <th className="text-left px-4 py-3.5 font-medium">Inscription</th>
              <th className="text-left px-4 py-3.5 font-medium">Dernière connexion</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((u) => {
              const userProjects = projectsByUser.get(u.id) ?? []
              const nbPeople     = peopleByUser.get(u.id) ?? 0
              const isAdmin      = u.email === ADMIN_EMAIL
              const isActive     = userProjects.length > 0

              return (
                <tr key={u.id} className="border-b border-[var(--border)]/50 hover:bg-[var(--bg-card-hover)] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--bg-input)] border border-[var(--border)] flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-[var(--text-muted)]">
                          {(u.email?.[0] ?? '?').toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[var(--text-secondary)] truncate">{u.email}</span>
                          {isAdmin && (
                            <span className="text-[9px] font-bold bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded-full shrink-0">ADMIN</span>
                          )}
                          {!isActive && (
                            <span className="text-[9px] font-medium bg-[var(--bg-input)] text-[var(--text-muted)] px-1.5 py-0.5 rounded-full shrink-0 border border-[var(--border)]">inactif</span>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">{u.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {userProjects.length > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[var(--text-secondary)] font-semibold">
                        <BookOpen size={12} className="text-amber-500" />
                        {userProjects.length}
                      </span>
                    ) : (
                      <span className="text-[var(--text-muted)]">0</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {nbPeople > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[var(--text-secondary)] font-semibold">
                        <User size={12} className="text-purple-500" />
                        {nbPeople}
                      </span>
                    ) : (
                      <span className="text-[var(--text-muted)]">0</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-xs">
                      <Calendar size={11} />
                      {fmt(u.created_at)}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-xs">
                      <Clock size={11} />
                      {fmtFull(u.last_sign_in_at)}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {sortedUsers.length === 0 && (
          <div className="px-5 py-16 text-center text-[var(--text-muted)] text-sm italic">Aucun utilisateur trouvé</div>
        )}
      </div>

      {/* Detail cards per user */}
      {sortedUsers.filter((u) => (projectsByUser.get(u.id)?.length ?? 0) > 0).map((u) => {
        const userProjects = projectsByUser.get(u.id) ?? []
        return (
          <div key={u.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-[var(--bg-input)] border border-[var(--border)] flex items-center justify-center shrink-0">
                <span className="text-[11px] font-bold text-[var(--text-muted)]">
                  {(u.email?.[0] ?? '?').toUpperCase()}
                </span>
              </div>
              <span className="text-[var(--text-secondary)] text-sm font-medium">{u.email}</span>
              <span className="ml-auto text-xs text-[var(--text-muted)]">{userProjects.length} projet{userProjects.length > 1 ? 's' : ''}</span>
            </div>
            <div className="divide-y divide-[var(--border)]/50">
              {userProjects.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--bg-card-hover)] transition-colors">
                  <BookOpen size={13} className={p.project_type === 'team' ? 'text-blue-500' : 'text-amber-500'} />
                  <span className="text-[var(--text-secondary)] text-sm">{p.title}</span>
                  <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    p.project_type === 'team'
                      ? 'bg-blue-500/15 text-blue-500'
                      : 'bg-amber-500/15 text-amber-500'
                  }`}>
                    {p.project_type === 'team' ? 'Équipe' : 'Roman'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}

    </div>
  )
}
