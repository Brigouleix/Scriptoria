import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import PeopleManager from '@/components/PeopleManager'

export default async function ProjectPeoplePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects').select('id, title, project_type').eq('id', id).single()
  if (!project) notFound()

  // Personnages de CE projet uniquement (sans fallback)
  const { data: people } = await supabase
    .from('people')
    .select('id, name, bio, avatar_url')
    .eq('project_id', id)
    .order('name')

  // Liens entre ces personnages
  const personIds = (people ?? []).map((p) => p.id)
  const { data: links } = personIds.length > 0
    ? await supabase
        .from('character_links')
        .select('id, person_a_id, person_b_id, relationship')
        .or(`person_a_id.in.(${personIds.join(',')}),person_b_id.in.(${personIds.join(',')})`)
    : { data: [] }

  const isTeam = project.project_type === 'team'

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm flex-wrap">
        <Link href="/dashboard" className="hover:text-[var(--text-primary)] transition-colors">
          Mes projets
        </Link>
        <ChevronRight size={14} />
        <Link href={`/project/${id}`} className="hover:text-[var(--text-primary)] transition-colors">
          {project.title}
        </Link>
        <ChevronRight size={14} />
        <span className="text-[var(--text-secondary)]">
          {isTeam ? 'Membres' : 'Personnages'}
        </span>
      </div>

      {/* Titre */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          {isTeam ? 'Membres' : 'Personnages'}
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {project.title}
        </p>
      </div>

      {/* PeopleManager filtré sur ce projet */}
      <PeopleManager
        initialPeople={(people ?? []) as any}
        initialLinks={(links ?? []) as any}
        projectId={id}
      />
    </div>
  )
}
