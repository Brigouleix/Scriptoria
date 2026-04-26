'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Users, MapPin } from 'lucide-react'
import PeopleManager from '@/components/PeopleManager'
import LocationsManager from '@/components/LocationsManager'

interface Person {
  id: string; name: string; bio: string | null; avatar_url: string | null
}
interface CharacterLink {
  id: string; person_a_id: string; person_b_id: string; relationship: string
}

type Tab = 'personnages' | 'lieux'

export default function PeoplePageClient({
  people,
  links,
  locations,
}: {
  people: Person[]
  links: CharacterLink[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  locations: any[]
}) {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const [tab, setTab] = useState<Tab>(
    (searchParams.get('tab') as Tab) === 'lieux' ? 'lieux' : 'personnages',
  )

  useEffect(() => {
    const incoming = (searchParams.get('tab') as Tab) ?? 'personnages'
    if (incoming === 'lieux' || incoming === 'personnages') setTab(incoming)
  }, [searchParams])

  function switchTab(t: Tab) {
    setTab(t)
    router.replace(t === 'lieux' ? '/people?tab=lieux' : '/people', { scroll: false })
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">

      {/* Onglets */}
      <div className="flex gap-1 border-b border-[var(--border)]">
        <TabBtn
          active={tab === 'personnages'}
          onClick={() => switchTab('personnages')}
          icon={<Users size={14} />}
          label="Personnages"
        />
        <TabBtn
          active={tab === 'lieux'}
          onClick={() => switchTab('lieux')}
          icon={<MapPin size={14} />}
          label="Mes lieux"
        />
      </div>

      {/* Contenu */}
      {tab === 'personnages' && (
        <PeopleManager initialPeople={people} initialLinks={links} />
      )}
      {tab === 'lieux' && (
        <LocationsManager initialLocations={locations} />
      )}
    </div>
  )
}

function TabBtn({
  active, onClick, icon, label,
}: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string
}) {
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
