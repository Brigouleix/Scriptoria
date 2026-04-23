'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import PersonaWheel, { WheelNode } from '@/components/PersonaWheel'
import PeopleManager from '@/components/PeopleManager'
import BookCover from '@/components/BookCover'

interface Person {
  id: string
  name: string
  bio: string | null
  avatar_url: string | null
}

interface CharacterLink {
  id: string
  person_a_id: string
  person_b_id: string
  relationship: string
}

interface Props {
  wheelNodes: WheelNode[]
  centerLabel: string
  projectId: string
  projectTitle: string
  projectGenre?: string | null
  projectCoverUrl?: string | null
  initialPeople: Person[]
  initialLinks: CharacterLink[]
}

export default function ProjectSidebar({
  wheelNodes,
  centerLabel,
  projectId,
  projectTitle,
  projectGenre,
  projectCoverUrl,
  initialPeople,
  initialLinks,
}: Props) {
  const [panelOpen, setPanelOpen] = useState(false)

  return (
    <>
      <div className="flex flex-col gap-6 w-full">
        {/* Persona Wheel */}
        <PersonaWheel
          nodes={wheelNodes}
          centerLabel={centerLabel}
          onNodeClick={() => setPanelOpen(true)}
        />

        {/* Book Cover */}
        <BookCover
          projectId={projectId}
          title={projectTitle}
          genre={projectGenre}
          initialCoverUrl={projectCoverUrl}
        />
      </div>

      {/* People panel overlay */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={() => setPanelOpen(false)}
          />

          {/* Slide-in panel */}
          <div className="w-full max-w-lg bg-[var(--bg-base)] border-l border-[var(--border)] flex flex-col overflow-hidden shadow-2xl">
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
              <div>
                <h2 className="font-bold text-lg text-[var(--text-primary)]">Personnages</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Créez et gérez vos personnages
                </p>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Panel body — scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <PeopleManager
                initialPeople={initialPeople}
                initialLinks={initialLinks}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
