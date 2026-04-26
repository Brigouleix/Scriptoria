import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import DocumentsPageClient from '@/components/DocumentsPageClient'

export default async function DocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects').select('id, title, map_bg_url').eq('id', id).single()
  if (!project) notFound()

  // Personnages de CE projet uniquement (sans fallback)
  const { data: people } = await supabase
    .from('people').select('id, name, avatar_url').eq('project_id', id).order('name')

  const [
    { data: chapters },
    { data: docCounts },
    { data: locations },
  ] = await Promise.all([
    supabase.from('chapters')
      .select('id, title, description, position')
      .eq('project_id', id)
      .order('position', { ascending: true }),
    supabase.from('documents').select('chapter_id').eq('project_id', id),
    supabase.from('locations')
      .select('id, name, description, map_x, map_y')
      .eq('project_id', id)
      .order('name'),
  ])

  const countByChapter = (docCounts ?? []).reduce<Record<string, number>>((acc, d) => {
    acc[d.chapter_id] = (acc[d.chapter_id] ?? 0) + 1
    return acc
  }, {})

  // map_x / map_y peuvent ne pas exister avant la migration → fallback
  const safeLocations = (locations ?? []).map((l: any) => ({
    id:          l.id,
    name:        l.name,
    description: l.description,
    map_x:       l.map_x ?? 50,
    map_y:       l.map_y ?? 50,
  }))

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm flex-wrap">
        <Link href="/dashboard" className="hover:text-[var(--text-primary)] transition-colors">Mes projets</Link>
        <ChevronRight size={14} />
        <Link href={`/project/${id}`} className="hover:text-[var(--text-primary)] transition-colors">{project.title}</Link>
        <ChevronRight size={14} />
        <span className="text-[var(--text-secondary)]">Productions écrites</span>
      </div>

      <DocumentsPageClient
        projectId={id}
        chapters={chapters ?? []}
        countByChapter={countByChapter}
        people={(people ?? []) as any}
        locations={safeLocations}
        initialBgUrl={(project as any)?.map_bg_url ?? null}
      />
    </div>
  )
}
