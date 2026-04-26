import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import StepEditor from '@/components/StepEditor'
import TeamMembersEditor from '@/components/TeamMembersEditor'

const STEPS_CONFIG = {
  1: {
    label: 'La Prémisse',
    description:
      'En une seule phrase (max 25 mots), résumez votre roman. Cette phrase doit contenir : le personnage principal, son but, et l\'obstacle principal.',
    hint: 'Exemple : "Un sorcier orphelin découvre sa véritable identité et doit affronter le mage maléfique qui a tué ses parents."',
    fields: [
      { key: 'premise', label: 'Votre prémisse en une phrase', placeholder: 'Écrivez votre prémisse ici...', type: 'textarea', rows: 3 },
    ],
  },
  2: {
    label: 'Le Résumé',
    description:
      'Développez la prémisse en un paragraphe de 5 phrases : le contexte, le premier conflit, le second conflit, le troisième conflit (climax), et la résolution.',
    hint: 'Chaque phrase correspond à un acte de votre roman.',
    fields: [
      { key: 'setup', label: '1. Le contexte (Qui ? Où ? Quand ?)', placeholder: 'Décrivez le contexte initial...', type: 'textarea', rows: 2 },
      { key: 'conflict1', label: '2. Premier conflit', placeholder: 'Quel est le premier obstacle ?', type: 'textarea', rows: 2 },
      { key: 'conflict2', label: '3. Deuxième conflit', placeholder: 'La situation se complique...', type: 'textarea', rows: 2 },
      { key: 'conflict3', label: '4. Climax', placeholder: 'Le point de non-retour...', type: 'textarea', rows: 2 },
      { key: 'resolution', label: '5. La résolution', placeholder: 'Comment tout se termine...', type: 'textarea', rows: 2 },
    ],
  },
  3: {
    label: 'Les Personnages',
    description:
      'Pour chaque personnage principal, définissez son nom, son but (ce qu\'il veut), son conflit interne (ce qui le bloque) et son arc narratif (comment il change).',
    hint: 'Concentrez-vous sur 2 à 3 personnages maximum pour le MVP.',
    fields: [
      { key: 'protagonist_name', label: 'Protagoniste — Nom', placeholder: 'Nom du personnage principal', type: 'input' },
      { key: 'protagonist_goal', label: 'Protagoniste — But', placeholder: 'Que veut-il/elle accomplir ?', type: 'textarea', rows: 2 },
      { key: 'protagonist_conflict', label: 'Protagoniste — Conflit interne', placeholder: 'Qu\'est-ce qui le/la retient ?', type: 'textarea', rows: 2 },
      { key: 'protagonist_arc', label: 'Protagoniste — Arc narratif', placeholder: 'Comment change-t-il/elle à la fin ?', type: 'textarea', rows: 2 },
      { key: 'antagonist_name', label: 'Antagoniste — Nom', placeholder: 'Nom de l\'antagoniste', type: 'input' },
      { key: 'antagonist_motivation', label: 'Antagoniste — Motivation', placeholder: 'Pourquoi s\'oppose-t-il/elle au protagoniste ?', type: 'textarea', rows: 2 },
    ],
  },
  4: {
    label: 'Le Synopsis',
    description:
      'Rédigez un synopsis complet d\'une page (environ 500 mots). Utilisez tout ce que vous avez construit aux étapes précédentes.',
    hint: 'Le synopsis doit couvrir l\'intégralité de l\'histoire, y compris la fin. Soyez précis et chronologique.',
    fields: [
      { key: 'synopsis', label: 'Synopsis complet', placeholder: 'Rédigez votre synopsis ici (environ 500 mots)...', type: 'textarea', rows: 20 },
    ],
  },
} as const

type StepNumber = keyof typeof STEPS_CONFIG

export default async function StepPage({
  params,
}: {
  params: Promise<{ id: string; step: string }>
}) {
  const { id, step } = await params
  const stepNum = parseInt(step) as StepNumber

  if (![1, 2, 3, 4].includes(stepNum)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('id, title, project_type, user_id')
    .eq('id', id)
    .eq('user_id', user.id)   // vérification de propriété explicite
    .single()

  if (!project) notFound()

  const { data: stepData } = await supabase
    .from('snowflake_steps')
    .select('content')
    .eq('project_id', id)
    .eq('step_number', stepNum)
    .single()

  const isTeam = project.project_type === 'team'
  const config = STEPS_CONFIG[stepNum]
  const isTeamMembersStep = isTeam && stepNum === 3
  const prevStep = stepNum > 1 ? stepNum - 1 : null
  const nextStep = stepNum < 4 ? stepNum + 1 : null

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-stone-500 text-sm flex-wrap">
        <Link href="/dashboard" className="hover:text-stone-300 transition-colors">
          Mes projets
        </Link>
        <ChevronRight size={14} />
        <Link href={`/project/${id}`} className="hover:text-stone-300 transition-colors">
          {project.title}
        </Link>
        <ChevronRight size={14} />
        <span className="text-stone-300">Étape {stepNum}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-amber-400 font-mono font-medium uppercase tracking-wider">
          Étape {stepNum} / 4
        </span>
        <h1 className="text-2xl font-bold">
          {isTeamMembersStep ? "L'Équipe" : config.label}
        </h1>
        <p className="text-stone-400 leading-relaxed">
          {isTeamMembersStep
            ? "Ajoutez les membres de votre équipe et définissez leur rôle dans ce projet."
            : config.description}
        </p>
        {!isTeamMembersStep && (
          <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg px-4 py-3 text-sm text-stone-400 leading-relaxed">
            💡 {config.hint}
          </div>
        )}
      </div>

      {/* Editor */}
      {isTeamMembersStep ? (
        <TeamMembersEditor projectId={id} />
      ) : (
        <StepEditor
          projectId={id}
          stepNumber={stepNum}
          fields={config.fields as unknown as Array<{ key: string; label: string; placeholder: string; type: string; rows?: number }>}
          initialContent={(stepData?.content ?? {}) as Record<string, string>}
        />
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-stone-800">
        {prevStep ? (
          <Link
            href={`/project/${id}/step/${prevStep}`}
            className="text-stone-400 hover:text-stone-100 text-sm transition-colors"
          >
            ← Étape {prevStep}
          </Link>
        ) : (
          <Link
            href={`/project/${id}`}
            className="text-stone-400 hover:text-stone-100 text-sm transition-colors"
          >
            ← Vue d&apos;ensemble
          </Link>
        )}
        {nextStep ? (
          <Link
            href={`/project/${id}/step/${nextStep}`}
            className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Étape {nextStep} →
          </Link>
        ) : (
          <Link
            href={`/project/${id}`}
            className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Terminer →
          </Link>
        )}
      </div>
    </div>
  )
}
