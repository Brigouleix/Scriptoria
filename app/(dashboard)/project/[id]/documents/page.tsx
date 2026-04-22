import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, FolderOpen, FileText, Image, File } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import NewChapterButton from '@/components/NewChapterButton'
import DeleteChapterButton from '@/components/DeleteChapterButton'

export default async function DocumentsPage({ params }: { params: Promise<{ id: string }> }) {
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
    .select('id, title, description, position')
    .eq('project_id', id)
    .order('position', { ascending: true })

  const { data: docCounts } = await supabase
    .from('documents')
    .select('chapter_id')
    .eq('project_id', id)

  const countByChapter = (docCounts ?? []).reduce<Record<string, number>>((acc, d) => {
    acc[d.chapter_id] = (acc[d.chapter_id] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-stone-500 text-sm flex-wrap">
        <Link href="/dashboard" className="hover:text-stone-300 transition-colors">Mes projets</Link>
        <ChevronRight size={14} />
        <Link href={`/project/${id}`} className="hover:text-stone-300 transition-colors">{project.title}</Link>
        <ChevronRight size={14} />
        <span className="text-stone-300">Documents</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-stone-400 text-sm mt-1">
            {chapters?.length ?? 0} chapitre{(chapters?.length ?? 0) > 1 ? 's' : ''}
          </p>
        </div>
        <NewChapterButton projectId={id} />
      </div>

      {/* Chapters list */}
      {!chapters || chapters.length === 0 ? (
        <div className="border border-dashed border-stone-700 rounded-xl p-16 flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
            <FolderOpen className="text-amber-400" size={24} />
          </div>
          <div>
            <p className="font-semibold">Aucun chapitre</p>
            <p className="text-stone-400 text-sm mt-1">
              Créez un chapitre pour commencer à organiser vos documents.
            </p>
          </div>
          <NewChapterButton projectId={id} variant="outline" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {chapters.map((chapter) => {
            const count = countByChapter[chapter.id] ?? 0
            return (
              <div
                key={chapter.id}
                className="group border border-stone-800 hover:border-amber-500/30 bg-stone-900/50 rounded-xl p-5 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <Link
                    href={`/project/${id}/documents/${chapter.id}`}
                    className="flex items-start gap-3 flex-1 min-w-0"
                  >
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <FolderOpen className="text-amber-400" size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-stone-100 truncate">{chapter.title}</p>
                      {chapter.description && (
                        <p className="text-stone-400 text-sm mt-0.5 line-clamp-1">{chapter.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-stone-500">
                        <span className="flex items-center gap-1">
                          <File size={11} />
                          {count} fichier{count > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </Link>
                  <DeleteChapterButton chapterId={chapter.id} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
