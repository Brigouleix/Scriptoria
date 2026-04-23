import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Snowflake, CheckCircle2, Circle, FolderOpen, PenLine, Users, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import DeleteProjectButton from '@/components/DeleteProjectButton'
import ProjectSidebar from '@/components/ProjectSidebar'
import { WheelNode } from '@/components/PersonaWheel'

const STEPS_NOVEL = [
  { number: 1, label: 'La Prémisse', description: 'Une phrase qui résume tout votre roman.' },
  { number: 2, label: 'Le Résumé', description: 'Un paragraphe : setup, 3 conflits, résolution.' },
  { number: 3, label: 'Les Personnages', description: 'Vos personnages principaux et leurs arcs narratifs.' },
  { number: 4, label: 'Le Synopsis', description: "Un synopsis d'une page qui détaille l'intrigue." },
]

const STEPS_TEAM = [
  { number: 1, label: 'La Prémisse', description: "En une phrase, résumez l'objectif du projet." },
  { number: 2, label: 'Le Résumé', description: 'Contexte, enjeux, jalons et résultat attendu.' },
  { number: 3, label: "L'Équipe", description: "Les membres de l'équipe et leurs rôles." },
  { number: 4, label: 'Le Synopsis', description: 'Une description complète du projet.' },
]

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (!project) notFound()

  const isTeam = project.project_type === 'team'
  const STEPS = isTeam ? STEPS_TEAM : STEPS_NOVEL

  const [{ data: steps }, { data: members }, { data: people }, { data: links }, { data: chapters }] = await Promise.all([
    supabase.from('snowflake_steps').select('step_number, content').eq('project_id', id),
    isTeam
      ? supabase.from('project_members').select('id, role, people(id, name)').eq('project_id', id).order('position')
      : Promise.resolve({ data: [] }),
    supabase.from('people').select('id, name, bio, avatar_url').order('name'),
    supabase.from('character_links').select('id, person_a_id, person_b_id, relationship'),
    supabase.from('chapters').select('id, title').eq('project_id', id).order('position', { ascending: true }),
  ])

  const completedSteps = new Set(
    (steps ?? [])
      .filter((s) => {
        const c = s.content as Record<string, string>
        return Object.values(c).some((v) => v?.trim?.())
      })
      .map((s) => s.step_number)
  )

  const progress = Math.round((completedSteps.size / STEPS.length) * 100)

  // Build persona wheel nodes
  const wheelNodes: WheelNode[] = []
  const step3 = (steps ?? []).find((s) => s.step_number === 3)?.content as Record<string, string> | undefined

  if (isTeam) {
    ;(members as any[] ?? []).forEach((m) => {
      const name = (m.people as { name: string } | null)?.name
      if (name) wheelNodes.push({ id: m.id, label: name, sublabel: m.role || undefined, type: 'team' })
    })
  } else {
    // Use people table; cross-reference step3 for protagonist/antagonist labels
    const protagonistName = step3?.protagonist_name?.trim().toLowerCase()
    const antagonistName  = step3?.antagonist_name?.trim().toLowerCase()

    ;(people ?? []).forEach((p) => {
      const lower = p.name.toLowerCase()
      let type: WheelNode['type'] = 'secondary'
      if (protagonistName && lower === protagonistName) type = 'protagonist'
      else if (antagonistName && lower === antagonistName) type = 'antagonist'
      wheelNodes.push({ id: p.id, label: p.name, type })
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

      {/* ── LEFT: project content ── */}
      <div className="flex flex-col gap-8">
        {/* Breadcrumb + header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm">
            <Link href="/dashboard" className="hover:text-[var(--text-primary)] transition-colors">
              Mes projets
            </Link>
            <ChevronRight size={14} />
            <span className="text-[var(--text-secondary)]">{project.title}</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">{project.title}</h1>
                {isTeam && (
                  <span className="flex items-center gap-1 text-xs bg-amber-500/10 text-amber-600 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    <Users size={11} />
                    Équipe
                  </span>
                )}
              </div>
              {project.genre && (
                <span className="text-sm text-[var(--text-muted)]">{project.genre}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/project/${id}/write`}
                title="Ouvrir l'éditeur"
                className="flex items-center gap-1.5 border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--accent)] px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                <PenLine size={15} />
                Écrire
              </Link>
              <DeleteProjectButton projectId={id} />
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <Snowflake size={14} className="text-amber-500" />
              Méthode Snowflake
            </div>
            <span className="text-[var(--text-muted)]">{progress}%</span>
          </div>
          <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-3">
          {STEPS.map((step) => {
            const isDone = completedSteps.has(step.number)
            return (
              <Link
                key={step.number}
                href={`/project/${id}/steps`}
                className="group border border-[var(--border)] hover:border-[var(--border-hover)] bg-[var(--bg-card)] rounded-xl p-5 flex items-center gap-4 transition-colors"
              >
                <div className="shrink-0">
                  {isDone
                    ? <CheckCircle2 className="text-amber-500" size={22} />
                    : <Circle className="text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors" size={22} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-[var(--text-muted)] font-mono">Étape {step.number}</span>
                  <p className="font-semibold text-[var(--text-primary)]">{step.label}</p>
                  <p className="text-[var(--text-secondary)] text-sm mt-0.5">{step.description}</p>
                </div>
                <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-amber-500 shrink-0 transition-colors" />
              </Link>
            )
          })}
        </div>

        {/* Chapitres écrits */}
        <div className="border-t border-[var(--border)] pt-6">
          <Link
            href={`/project/${id}/documents`}
            className="group border border-[var(--border)] hover:border-amber-500/40 bg-[var(--bg-card)] rounded-xl p-5 flex items-start gap-4 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <BookOpen className="text-amber-500" size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[var(--text-primary)]">Productions écrites</p>
              <p className="text-[var(--text-secondary)] text-sm mt-0.5">
                {(chapters ?? []).length === 0
                  ? 'Organisez vos documents Word et écrits par chapitre'
                  : `${(chapters ?? []).length} chapitre${(chapters ?? []).length > 1 ? 's' : ''}`
                }
              </p>
              {(chapters ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(chapters ?? []).slice(0, 4).map((ch) => (
                    <span
                      key={ch.id}
                      className="text-xs bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded-full truncate max-w-[140px]"
                    >
                      {ch.title}
                    </span>
                  ))}
                  {(chapters ?? []).length > 4 && (
                    <span className="text-xs text-[var(--text-muted)] py-0.5">
                      +{(chapters ?? []).length - 4} autres
                    </span>
                  )}
                </div>
              )}
            </div>
            <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-amber-500 shrink-0 transition-colors mt-0.5" />
          </Link>
        </div>

        {/* Documents divers */}
        <div>
          <Link
            href={`/project/${id}/documents`}
            className="group border border-[var(--border)] hover:border-[var(--border-hover)] bg-[var(--bg-card)] rounded-xl p-5 flex items-center gap-4 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-input)] flex items-center justify-center shrink-0">
              <FolderOpen className="text-[var(--text-muted)]" size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[var(--text-primary)]">Documents</p>
              <p className="text-[var(--text-secondary)] text-sm mt-0.5">Images, PDF, références organisées par chapitre</p>
            </div>
            <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-amber-500 shrink-0 transition-colors" />
          </Link>
        </div>
      </div>

      {/* ── RIGHT: sidebar (wheel + book cover) ── */}
      <div className="flex items-start pt-2">
        <ProjectSidebar
          wheelNodes={wheelNodes}
          centerLabel={project.title}
          projectId={id}
          projectTitle={project.title}
          projectGenre={project.genre}
          projectCoverUrl={(project as any).cover_url ?? null}
          initialPeople={people ?? []}
          initialLinks={links ?? []}
        />
      </div>

    </div>
  )
}
