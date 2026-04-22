import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Snowflake, CheckCircle2, Circle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import DeleteProjectButton from '@/components/DeleteProjectButton'

const STEPS = [
  {
    number: 1,
    label: 'La Prémisse',
    description: 'Une phrase qui résume tout votre roman.',
  },
  {
    number: 2,
    label: 'Le Résumé',
    description: 'Un paragraphe : setup, 3 conflits, résolution.',
  },
  {
    number: 3,
    label: 'Les Personnages',
    description: 'Vos personnages principaux et leurs arcs narratifs.',
  },
  {
    number: 4,
    label: 'Le Synopsis',
    description: 'Un synopsis d\'une page qui détaille l\'intrigue.',
  },
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

  const progress = Math.round((completedSteps.size / STEPS.length) * 100)

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-stone-500 text-sm">
          <Link href="/dashboard" className="hover:text-stone-300 transition-colors">
            Mes projets
          </Link>
          <ChevronRight size={14} />
          <span className="text-stone-300">{project.title}</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{project.title}</h1>
            {project.genre && (
              <span className="text-sm text-stone-400">{project.genre}</span>
            )}
          </div>
          <DeleteProjectButton projectId={id} />
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-stone-400">
            <Snowflake size={14} className="text-amber-400" />
            Méthode Snowflake
          </div>
          <span className="text-stone-400">{progress}%</span>
        </div>
        <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden">
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
              href={`/project/${id}/step/${step.number}`}
              className="group border border-stone-800 hover:border-amber-500/40 bg-stone-900/50 rounded-xl p-5 flex items-center gap-4 transition-colors"
            >
              <div className="shrink-0">
                {isDone ? (
                  <CheckCircle2 className="text-amber-400" size={22} />
                ) : (
                  <Circle className="text-stone-600 group-hover:text-stone-400 transition-colors" size={22} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500 font-mono">
                    Étape {step.number}
                  </span>
                </div>
                <p className="font-semibold text-stone-100">{step.label}</p>
                <p className="text-stone-400 text-sm mt-0.5">{step.description}</p>
              </div>
              <ChevronRight
                size={16}
                className="text-stone-600 group-hover:text-amber-400 shrink-0 transition-colors"
              />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
