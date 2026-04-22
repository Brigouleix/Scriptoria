import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, CheckCircle2, Circle, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'

const STEPS_META = [
  {
    number: 1,
    labelKey: 'premise_label',
    descKey: 'premise_desc',
    previewFields: ['premise'],
    color: 'from-amber-500/20 to-amber-500/5',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
  },
  {
    number: 2,
    labelKey: 'summary_label',
    descKey: 'summary_desc',
    previewFields: ['setup', 'conflict1'],
    color: 'from-orange-500/20 to-orange-500/5',
    border: 'border-orange-500/30',
    dot: 'bg-orange-400',
  },
  {
    number: 3,
    labelKey: 'characters_label',
    descKey: 'characters_desc',
    previewFields: ['protagonist_name', 'antagonist_name'],
    color: 'from-rose-500/20 to-rose-500/5',
    border: 'border-rose-500/30',
    dot: 'bg-rose-400',
  },
  {
    number: 4,
    labelKey: 'synopsis_label',
    descKey: 'synopsis_desc',
    previewFields: ['synopsis'],
    color: 'from-violet-500/20 to-violet-500/5',
    border: 'border-violet-500/30',
    dot: 'bg-violet-400',
  },
] as const

function getPreview(content: Record<string, string>, fields: readonly string[]): string | null {
  for (const field of fields) {
    const val = content[field]?.trim()
    if (val) return val.length > 120 ? val.slice(0, 120) + '…' : val
  }
  return null
}

export default async function StepsOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('id, title, genre')
    .eq('id', id)
    .single()

  if (!project) notFound()

  const { data: stepsData } = await supabase
    .from('snowflake_steps')
    .select('step_number, content')
    .eq('project_id', id)

  const stepMap = Object.fromEntries(
    (stepsData ?? []).map((s) => [s.step_number, s.content as Record<string, string>])
  )

  const t = await getTranslations('steps')
  const tp = await getTranslations('project')

  const completedCount = STEPS_META.filter((s) => {
    const content = stepMap[s.number] ?? {}
    return s.previewFields.some((f) => content[f]?.trim())
  }).length

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-stone-500 text-sm flex-wrap">
        <Link href="/dashboard" className="hover:text-stone-300 transition-colors">{tp('breadcrumb')}</Link>
        <ChevronRight size={14} />
        <Link href={`/project/${id}`} className="hover:text-stone-300 transition-colors">{project.title}</Link>
        <ChevronRight size={14} />
        <span className="text-stone-300">Méthode Snowflake</span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{project.title}</h1>
        {project.genre && <p className="text-stone-400 text-sm">{project.genre}</p>}
        <p className="text-stone-500 text-sm mt-1">{completedCount} / {STEPS_META.length} étapes complétées</p>
      </div>

      {/* Steps cards */}
      <div className="flex flex-col gap-4">
        {STEPS_META.map((step) => {
          const content = stepMap[step.number] ?? {}
          const preview = getPreview(content, step.previewFields)
          const isDone = !!preview

          return (
            <Link
              key={step.number}
              href={`/project/${id}/step/${step.number}`}
              className={`group relative border rounded-2xl p-6 flex flex-col gap-3 transition-all duration-200
                hover:scale-[1.01] hover:shadow-xl hover:shadow-black/20
                ${isDone ? step.border : 'border-stone-800'}
                bg-gradient-to-br ${isDone ? step.color : 'from-stone-900/60 to-stone-900/20'}
              `}
            >
              {/* Step number + status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isDone ? step.dot : 'bg-stone-600'}`} />
                  <span className="text-xs font-mono text-stone-500 uppercase tracking-wider">
                    Étape {step.number}
                  </span>
                </div>
                {isDone
                  ? <CheckCircle2 size={18} className="text-amber-400" />
                  : <Circle size={18} className="text-stone-600 group-hover:text-stone-400 transition-colors" />
                }
              </div>

              {/* Title */}
              <h2 className="text-lg font-bold text-stone-100">{t(step.labelKey)}</h2>

              {/* Preview or description */}
              {preview ? (
                <p className="text-stone-300 text-sm leading-relaxed italic">
                  &ldquo;{preview}&rdquo;
                </p>
              ) : (
                <p className="text-stone-500 text-sm leading-relaxed">{t(step.descKey)}</p>
              )}

              {/* CTA */}
              <div className="flex items-center gap-1.5 text-xs font-medium mt-1
                text-stone-500 group-hover:text-amber-400 transition-colors">
                {isDone ? 'Modifier' : 'Commencer'}
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
