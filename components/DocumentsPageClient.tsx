'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FolderOpen, File, Map } from 'lucide-react'
import NewChapterButton from '@/components/NewChapterButton'
import DeleteChapterButton from '@/components/DeleteChapterButton'
import CharacterMap from '@/components/CharacterMap'

interface Chapter {
  id: string; title: string; description: string | null; position: number
}
interface Person {
  id: string; name: string; avatar_url: string | null
}
interface MapLocation {
  id: string; name: string; description: string | null; map_x: number; map_y: number
}

type Tab = 'chapitres' | 'carte'

export default function DocumentsPageClient({
  projectId,
  chapters,
  countByChapter,
  people,
  locations,
  initialBgUrl,
}: {
  projectId: string
  chapters: Chapter[]
  countByChapter: Record<string, number>
  people: Person[]
  locations: MapLocation[]
  initialBgUrl?: string | null
}) {
  const [tab, setTab] = useState<Tab>('chapitres')

  return (
    <div className="flex flex-col gap-6">
      {/* Header + bouton */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Productions écrites</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            {chapters.length} chapitre{chapters.length > 1 ? 's' : ''} · {people.length} personnage{people.length > 1 ? 's' : ''}
          </p>
        </div>
        {tab === 'chapitres' && <NewChapterButton projectId={projectId} />}
      </div>

      {/* Onglets */}
      <div className="flex gap-1 border-b border-[var(--border)]">
        <TabBtn active={tab === 'chapitres'} onClick={() => setTab('chapitres')} icon={<FolderOpen size={14} />} label="Chapitres" />
        <TabBtn active={tab === 'carte'} onClick={() => setTab('carte')} icon={<Map size={14} />} label="Carte des mouvements" />
      </div>

      {/* ── Chapitres ── */}
      {tab === 'chapitres' && (
        <>
          {chapters.length === 0 ? (
            <div className="border border-dashed border-[var(--border)] rounded-xl p-16 flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <FolderOpen className="text-amber-500" size={24} />
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)]">Aucun chapitre</p>
                <p className="text-[var(--text-muted)] text-sm mt-1">
                  Créez un chapitre pour y déposer vos fichiers écrits.
                </p>
              </div>
              <NewChapterButton projectId={projectId} variant="outline" />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {chapters.map((chapter) => {
                const count = countByChapter[chapter.id] ?? 0
                return (
                  <div
                    key={chapter.id}
                    className="group border border-[var(--border)] hover:border-amber-500/30 bg-[var(--bg-card)] rounded-xl p-5 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <Link
                        href={`/project/${projectId}/documents/${chapter.id}`}
                        className="flex items-start gap-3 flex-1 min-w-0"
                      >
                        <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                          <FolderOpen className="text-amber-500" size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[var(--text-primary)] truncate">{chapter.title}</p>
                          {chapter.description && (
                            <p className="text-[var(--text-muted)] text-sm mt-0.5 line-clamp-1">{chapter.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
                            <span className="flex items-center gap-1">
                              <File size={11} />
                              {count} fichier{count !== 1 ? 's' : ''}
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
        </>
      )}

      {/* ── Carte des mouvements ── */}
      {tab === 'carte' && (
        <CharacterMap
          initialLocations={locations}
          people={people}
          chapters={chapters}
          projectId={projectId}
          initialBgUrl={initialBgUrl}
        />
      )}
    </div>
  )
}

function TabBtn({
  active, onClick, icon, label,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-amber-500 text-amber-500'
          : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border)]'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
