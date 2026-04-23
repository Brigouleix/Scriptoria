import { createAdminClient } from '@/lib/supabase/admin'
import { Users, BookOpen, User, MapPin, Clock } from 'lucide-react'

// ── Stat card ──────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'amber',
}: {
  icon: React.ElementType
  label: string
  value: number | string
  sub?: string
  color?: 'amber' | 'blue' | 'green' | 'purple'
}) {
  const colors = {
    amber:  'text-amber-500  bg-amber-500/10  border-amber-500/20',
    blue:   'text-blue-500   bg-blue-500/10   border-blue-500/20',
    green:  'text-green-500  bg-green-500/10  border-green-500/20',
    purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  }
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-lg border ${colors[color]}`}>
        <Icon size={18} className={colors[color].split(' ')[0]} />
      </div>
      <div>
        <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-[var(--text-primary)] mt-0.5">{value}</p>
        {sub && <p className="text-[var(--text-muted)] text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function Badge({ label, variant }: { label: string; variant: 'novel' | 'team' }) {
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
      variant === 'team'
        ? 'bg-blue-500/15 text-blue-500'
        : 'bg-amber-500/15 text-amber-500'
    }`}>
      {label}
    </span>
  )
}

export default async function AdminPage() {
  const admin = createAdminClient()

  const [
    { data: { users }, error: usersError },
    { data: projects },
    { data: people },
    { data: locations },
    { data: links },
  ] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from('projects').select('id, title, user_id, project_type, created_at, updated_at').order('created_at', { ascending: false }),
    admin.from('people').select('id, user_id').order('created_at', { ascending: false }),
    admin.from('locations').select('id, user_id').order('created_at', { ascending: false }),
    admin.from('character_links').select('id'),
  ])

  if (usersError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 max-w-md text-center">
          <p className="text-red-500 font-semibold mb-2">Erreur de connexion admin</p>
          <p className="text-[var(--text-muted)] text-sm">
            Ajoute <code className="bg-[var(--bg-input)] px-1.5 py-0.5 rounded text-amber-500">SUPABASE_SERVICE_ROLE_KEY</code> dans{' '}
            <code className="bg-[var(--bg-input)] px-1.5 py-0.5 rounded text-amber-500">.env.local</code>{' '}
            (Supabase → Settings → API → service_role key).
          </p>
        </div>
      </div>
    )
  }

  const totalUsers     = users?.length ?? 0
  const totalProjects  = projects?.length ?? 0
  const totalPeople    = people?.length ?? 0
  const totalLocations = locations?.length ?? 0
  const totalLinks     = links?.length ?? 0

  type UserRow = { id: string; email?: string | null; created_at: string; last_sign_in_at?: string | null }
  const userMap = new Map<string, UserRow>()
  users?.forEach((u) => userMap.set(u.id, u as UserRow))

  const projectsByUser = new Map<string, number>()
  const peopleByUser   = new Map<string, number>()
  projects?.forEach((p) => projectsByUser.set(p.user_id, (projectsByUser.get(p.user_id) ?? 0) + 1))
  people?.forEach((p)   => peopleByUser.set(p.user_id,   (peopleByUser.get(p.user_id)   ?? 0) + 1))

  const sortedUsers    = [...(users ?? [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const activeUsers    = [...projectsByUser.entries()].filter(([, n]) => n > 0).length
  const oneWeekAgo     = new Date(Date.now() - 7 * 24 * 3600 * 1000)
  const recentProjects = projects?.filter((p) => new Date(p.created_at) > oneWeekAgo).length ?? 0

  function fmt(d: string | null | undefined) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  function fmtFull(d: string | null | undefined) {
    if (!d) return '—'
    return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col gap-8 max-w-6xl">

      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Vue d&apos;ensemble</h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">Tableau de bord administrateur — Scriptoria</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}   label="Utilisateurs"  value={totalUsers}     sub={`${activeUsers} actifs`}            color="blue"   />
        <StatCard icon={BookOpen} label="Projets"       value={totalProjects}  sub={`+${recentProjects} cette semaine`}  color="amber"  />
        <StatCard icon={User}    label="Personnages"   value={totalPeople}    sub={`${totalLinks} liens entre persos`}   color="purple" />
        <StatCard icon={MapPin}  label="Lieux"         value={totalLocations} sub="inspirations"                        color="green"  />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Users table */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
            <Users size={15} className="text-blue-500" />
            <h2 className="font-semibold text-sm text-[var(--text-primary)]">Utilisateurs ({totalUsers})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-xs">
                  <th className="text-left px-5 py-3 font-medium">Email</th>
                  <th className="text-center px-3 py-3 font-medium">Projets</th>
                  <th className="text-center px-3 py-3 font-medium">Persos</th>
                  <th className="text-left px-3 py-3 font-medium">Inscription</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((u) => (
                  <tr key={u.id} className="border-b border-[var(--border)]/50 hover:bg-[var(--bg-card-hover)] transition-colors">
                    <td className="px-5 py-3 text-[var(--text-secondary)] truncate max-w-[160px]">
                      {u.email === 'antoine.brigouleix@gmail.com' ? (
                        <span className="flex items-center gap-1.5">
                          <span className="truncate">{u.email}</span>
                          <span className="text-[9px] font-bold bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded-full shrink-0">ADMIN</span>
                        </span>
                      ) : (
                        <span className="truncate block">{u.email}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center text-[var(--text-secondary)] font-medium">
                      {projectsByUser.get(u.id) ?? 0}
                    </td>
                    <td className="px-3 py-3 text-center text-[var(--text-muted)]">
                      {peopleByUser.get(u.id) ?? 0}
                    </td>
                    <td className="px-3 py-3 text-[var(--text-muted)] text-xs whitespace-nowrap">
                      {fmt(u.created_at)}
                    </td>
                  </tr>
                ))}
                {totalUsers === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-[var(--text-muted)] text-sm italic">Aucun utilisateur</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent projects */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
            <BookOpen size={15} className="text-amber-500" />
            <h2 className="font-semibold text-sm text-[var(--text-primary)]">Derniers projets ({totalProjects})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-xs">
                  <th className="text-left px-5 py-3 font-medium">Titre</th>
                  <th className="text-left px-3 py-3 font-medium">Type</th>
                  <th className="text-left px-3 py-3 font-medium">Auteur</th>
                  <th className="text-left px-3 py-3 font-medium">Créé le</th>
                </tr>
              </thead>
              <tbody>
                {projects?.slice(0, 20).map((p) => {
                  const author = userMap.get(p.user_id)
                  const email  = author?.email ?? p.user_id.slice(0, 8) + '…'
                  return (
                    <tr key={p.id} className="border-b border-[var(--border)]/50 hover:bg-[var(--bg-card-hover)] transition-colors">
                      <td className="px-5 py-3 text-[var(--text-secondary)] font-medium truncate max-w-[140px]">{p.title}</td>
                      <td className="px-3 py-3">
                        <Badge label={p.project_type === 'team' ? 'Équipe' : 'Roman'} variant={p.project_type === 'team' ? 'team' : 'novel'} />
                      </td>
                      <td className="px-3 py-3 text-[var(--text-muted)] text-xs truncate max-w-[120px]">{email}</td>
                      <td className="px-3 py-3 text-[var(--text-muted)] text-xs whitespace-nowrap">{fmt(p.created_at)}</td>
                    </tr>
                  )
                })}
                {totalProjects === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-[var(--text-muted)] text-sm italic">Aucun projet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent signups timeline */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
          <Clock size={15} className="text-green-500" />
          <h2 className="font-semibold text-sm text-[var(--text-primary)]">Dernières connexions</h2>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {sortedUsers.slice(0, 10).map((u) => (
            <div key={u.id} className="flex items-center justify-between px-5 py-3 hover:bg-[var(--bg-card-hover)] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[var(--bg-input)] border border-[var(--border)] flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-[var(--text-muted)]">
                    {(u.email?.[0] ?? '?').toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">{u.email}</p>
                  <p className="text-xs text-[var(--text-muted)]">Inscrit le {fmt(u.created_at)}</p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="text-xs text-[var(--text-muted)]">Dernière connexion</p>
                <p className="text-xs text-[var(--text-secondary)]">{fmtFull(u.last_sign_in_at)}</p>
              </div>
            </div>
          ))}
          {totalUsers === 0 && (
            <p className="px-5 py-8 text-center text-[var(--text-muted)] text-sm italic">Aucun utilisateur</p>
          )}
        </div>
      </div>

    </div>
  )
}
