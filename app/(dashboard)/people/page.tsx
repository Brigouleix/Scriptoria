import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PeopleManager from '@/components/PeopleManager'
import LocationsManager from '@/components/LocationsManager'

export default async function PeoplePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: people }, { data: locations }, { data: links }] = await Promise.all([
    supabase
      .from('people')
      .select('id, name, bio, avatar_url')
      .order('name'),
    supabase
      .from('locations')
      .select('id, name, description, location_photos(id, storage_path, name)')
      .order('created_at', { ascending: false }),
    supabase
      .from('character_links')
      .select('id, person_a_id, person_b_id, relationship'),
  ])

  return (
    <div className="flex flex-col gap-12 max-w-3xl">

      {/* Personnages */}
      <section className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Personnages</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Créez vos personnages, ajoutez une photo et réutilisez-les dans vos projets.
          </p>
        </div>
        <PeopleManager initialPeople={people ?? []} initialLinks={links ?? []} />
      </section>

      {/* Lieux */}
      <section className="flex flex-col gap-6 border-t border-[var(--border)] pt-10">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Lieux</h2>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Capturez vos lieux d&apos;inspiration avec des photos — même sans savoir encore où les intégrer.
          </p>
        </div>
        <LocationsManager initialLocations={(locations ?? []) as any} />
      </section>

    </div>
  )
}
