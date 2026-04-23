import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Snowflake, CheckCircle2, Circle, FolderOpen, PenLine, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import DeleteProjectButton from '@/components/DeleteProjectButton'

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

  const { data: steps } = await supabase
    .from('snowflake_steps')
    .select('step_number, content')
    .eq('project_id', id)

  const completedSteps = new Set(
    (steps ?? [])
      .filter((s) => {
        const c = s.content as Record<string, string>
        return Object.values(c).some((v) => v?.trim?.())
      })
      .map((s) => s.step_number)
  )

  const isTeam = project.project_type === 'team'
  const STEPS = isTeam ? STEPS_TEAM : STEPS_NOVEL
  const progress = Math.round((completedSteps.size / STEPS.length) * 100)

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      {/* Breadcrumb */}
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
                {isDone ? (
                  <CheckCircle2 className="text-amber-500" size={22} />
                ) : (
                  <Circle className="text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors" size={22} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-[var(--text-muted)] font-mono">
                  Étape {step.number}
                </span>
                <p className="font-semibold text-[var(--text-primary)]">{step.label}</p>
                <p className="text-[var(--text-secondary)] text-sm mt-0.5">{step.description}</p>
              </div>
              <ChevronRight
                size={16}
                className="text-[var(--text-muted)] group-hover:text-amber-500 shrink-0 transition-colors"
              />
            </Link>
          )
        })}
      </div>

      {/* Documents section */}
      <div className="border-t border-[var(--border)] pt-6">
        <Link
          href={`/project/${id}/documents`}
          className="group border border-[var(--border)] hover:border-[var(--border-hover)] bg-[var(--bg-card)] rounded-xl p-5 flex items-center gap-4 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
            <FolderOpen className="text-amber-500" size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[var(--text-primary)]">Documents</p>
            <p className="text-[var(--text-secondary)] text-sm mt-0.5">Images, PDF, DOC, TXT organisés par chapitre</p>
          </div>
          <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-amber-500 shrink-0 transition-colors" />
        </Link>
      </div>
    </div>
  )
}
