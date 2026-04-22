import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import FileGrid from '@/components/FileGrid'
import FileUpload from '@/components/FileUpload'

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ id: string; chapterId: string }>
}) {
  const { id, chapterId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('id, title')
    .eq('id', id)
    .single()

  if (!project) notFound()

  const { data: chapter } = await supabase
    .from('chapters')
    .select('id, title, description')
    .eq('id', chapterId)
    .single()

  if (!chapter) notFound()

  const { data: documents } = await supabase
    .from('documents')
    .select('id, name, storage_path, mime_type, size_bytes, created_at')
    .eq('chapter_id', chapterId)
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-stone-500 text-sm flex-wrap">
        <Link href="/dashboard" className="hover:text-stone-300 transition-colors">Mes projets</Link>
        <ChevronRight size={14} />
        <Link href={`/project/${id}`} className="hover:text-stone-300 transition-colors">{project.title}</Link>
        <ChevronRight size={14} />
        <Link href={`/project/${id}/documents`} className="hover:text-stone-300 transition-colors">Documents</Link>
        <ChevronRight size={14} />
        <span className="text-stone-300">{chapter.title}</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{chapter.title}</h1>
        {chapter.description && (
          <p className="text-stone-400 mt-1">{chapter.description}</p>
        )}
      </div>

      {/* Upload zone */}
      <FileUpload
        projectId={id}
        chapterId={chapterId}
        userId={user.id}
      />

      {/* File grid */}
      <FileGrid
        documents={documents ?? []}
        userId={user.id}
        chapterId={chapterId}
      />
    </div>
  )
}
