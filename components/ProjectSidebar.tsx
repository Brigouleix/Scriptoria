'use client'

import { useCallback, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import PersonaWheel, { WheelNode, WheelLink } from '@/components/PersonaWheel'
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

  // ── État local réactif pour synchroniser la roue avec les modifications ──
  const [localPeople, setLocalPeople] = useState<Person[]>(initialPeople)
  const [localLinks,  setLocalLinks]  = useState<CharacterLink[]>(initialLinks)

  const handlePeopleChange = useCallback((p: Person[]) => setLocalPeople(p), [])
  const handleLinksChange  = useCallback((l: CharacterLink[]) => setLocalLinks(l), [])

  // Carte de type par personId (protagoniste / antagoniste / etc.)
  // On conserve les types calculés côté serveur, les nouveaux arrivants sont 'secondary'
  const nodeTypeMap = useMemo(() => {
    const m = new Map<string, WheelNode['type']>()
    wheelNodes.forEach((n) => m.set(n.id, n.type))
    return m
  }, [wheelNodes])

  // Nœuds dérivés dynamiquement de l'état local
  const localWheelNodes: WheelNode[] = useMemo(
    () =>
      localPeople.map((p) => ({
        id:    p.id,
        label: p.name,
        type:  nodeTypeMap.get(p.id) ?? 'secondary',
        href:  `/people/${p.id}`,
      })),
    [localPeople, nodeTypeMap],
  )

  // Liens au format WheelLink
  const wheelLinks: WheelLink[] = useMemo(
    () =>
      localLinks.map((l) => ({
        person_a_id:  l.person_a_id,
        person_b_id:  l.person_b_id,
        relationship: l.relationship || undefined,
      })),
    [localLinks],
  )

  return (
    <>
      <div className="flex flex-col gap-6 w-full">
        {/* Persona Wheel — se met à jour en temps réel */}
        <PersonaWheel
          nodes={localWheelNodes}
          links={wheelLinks}
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

      {/* Panneau latéral personnages */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={() => setPanelOpen(false)}
          />

          {/* Slide-in panel */}
          <div className="w-full max-w-lg bg-[var(--bg-base)] border-l border-[var(--border)] flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
              <div>
                <h2 className="font-bold text-lg text-[var(--text-primary)]">Personnages</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Créez, reliez et gérez vos personnages
                </p>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <PeopleManager
                initialPeople={initialPeople}
                initialLinks={initialLinks}
                projectId={projectId}
                onPeopleChange={handlePeopleChange}
                onLinksChange={handleLinksChange}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
