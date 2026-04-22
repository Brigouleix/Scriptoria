import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, BookOpen, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import NewProjectButton from '@/components/NewProjectButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, genre, created_at, updated_at')
    .order('updated_at', { ascending: false })

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mes projets</h1>
          <p className="text-stone-400 text-sm mt-1">
            {projects?.length ?? 0} projet{(projects?.length ?? 0) > 1 ? 's' : ''}
          </p>
        </div>
        <NewProjectButton />
      </div>

      {/* Projects grid */}
      {!projects || projects.length === 0 ? (
        <div className="border border-dashed border-stone-700 rounded-xl p-16 flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
            <BookOpen className="text-amber-400" size={24} />
          </div>
          <div>
            <p className="font-semibold">Aucun projet pour l&apos;instant</p>
            <p className="text-stone-400 text-sm mt-1">
              Créez votre premier projet pour commencer la méthode Snowflake.
            </p>
          </div>
          <NewProjectButton variant="outline" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/project/${project.id}`}
              className="group border border-stone-800 hover:border-amber-500/40 bg-stone-900/50 rounded-xl p-5 flex flex-col gap-3 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <BookOpen className="text-amber-400" size={16} />
                </div>
                <ChevronRight
                  size={16}
                  className="text-stone-600 group-hover:text-amber-400 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="font-semibold text-stone-100 truncate">{project.title}</h2>
                {project.genre && (
                  <span className="text-xs text-stone-500">{project.genre}</span>
                )}
              </div>
              <p className="text-xs text-stone-600 mt-auto">
                Modifié le{' '}
                {new Date(project.updated_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
