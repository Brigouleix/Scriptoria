import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import WritingEditor from '@/components/WritingEditor'

export default async function WritePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('id, title')
    .eq('id', id)
    .single()

  if (!project) notFound()

  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, title')
    .eq('project_id', id)
    .order('position', { ascending: true })

  return (
    <div className="flex flex-col gap-4 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-stone-500 text-sm flex-wrap">
        <Link href="/dashboard" className="hover:text-stone-300 transition-colors">Mes projets</Link>
        <ChevronRight size={14} />
        <Link href={`/project/${id}`} className="hover:text-stone-300 transition-colors">{project.title}</Link>
        <ChevronRight size={14} />
        <span className="text-stone-300">Éditeur</span>
      </div>

      <WritingEditor
        projectId={id}
        userId={user.id}
        chapters={chapters ?? []}
      />
    </div>
  )
}
