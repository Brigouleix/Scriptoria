import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PersonNotebook from '@/components/PersonNotebook'
import { ArrowLeft, Users } from 'lucide-react'

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
}

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Charger le personnage + ses détails
  const [{ data: person }, { data: details }, { data: links }] = await Promise.all([
    supabase.from('people').select('id, name, bio, avatar_url').eq('id', id).single(),
    supabase.from('person_details').select('*').eq('person_id', id).maybeSingle(),
    supabase
      .from('character_links')
      .select('id, person_a_id, person_b_id, relationship, people!character_links_person_a_id_fkey(name), people!character_links_person_b_id_fkey(name)')
      .or(`person_a_id.eq.${id},person_b_id.eq.${id}`),
  ])

  if (!person) notFound()

  // Vérifier que le personnage appartient à l'utilisateur (sécurité)
  const { data: ownership } = await supabase
    .from('people')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!ownership) redirect('/people')

  return (
    <div className="flex flex-col gap-8 max-w-2xl">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <Link href="/people" className="flex items-center gap-1.5 hover:text-[var(--text-primary)] transition-colors">
          <Users size={14} />
          Personnages
        </Link>
        <span>/</span>
        <span className="text-[var(--text-primary)] font-medium">{person.name}</span>
      </div>

      {/* Hero : avatar + infos principales */}
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center shrink-0">
          {person.avatar_url ? (
            <img src={person.avatar_url} alt={person.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-amber-500 text-xl font-bold">{initials(person.name)}</span>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{person.name}</h1>
          {person.bio && <p className="text-[var(--text-muted)] text-sm mt-0.5">{person.bio}</p>}
          {/* Liens entre personnages */}
          {links && links.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {links.map((l) => {
                const isA    = l.person_a_id === id
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const other  = isA ? (l as any)['people!character_links_person_b_id_fkey'] : (l as any)['people!character_links_person_a_id_fkey']
                const otherId = isA ? l.person_b_id : l.person_a_id
                return (
                  <Link
                    key={l.id}
                    href={`/people/${otherId}`}
                    className="text-[10px] flex items-center gap-1 bg-[var(--bg-input)] border border-[var(--border)] px-2 py-0.5 rounded-full text-[var(--text-muted)] hover:border-amber-500/50 hover:text-amber-500 transition-colors"
                  >
                    {l.relationship && <span className="text-[var(--text-muted)]">{l.relationship} ·</span>}
                    {other?.name ?? otherId.slice(0, 8)}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Calepin */}
      <PersonNotebook
        personId={id}
        userId={user.id}
        initialDetails={details ? {
          id:             details.id,
          metier:         details.metier         ?? '',
          date_naissance: details.date_naissance ?? '',
          traits:         details.traits         ?? '',
          notes:          details.notes          ?? '',
          custom_fields:  (details.custom_fields as { name: string; value: string }[]) ?? [],
        } : null}
      />

    </div>
  )
}
