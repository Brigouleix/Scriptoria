import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import PeopleManager from '@/components/PeopleManager'
import LocationsManager from '@/components/LocationsManager'

export default async function PeoplePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: people }, { data: locations }, { data: links }, t] = await Promise.all([
    supabase.from('people').select('id, name, bio, avatar_url').order('name'),
    supabase
      .from('locations')
      .select('id, name, description, location_photos(id, storage_path, name)')
      .order('created_at', { ascending: false }),
    supabase.from('character_links').select('id, person_a_id, person_b_id, relationship'),
    getTranslations('people'),
  ])

  return (
    <div className="flex flex-col gap-12 max-w-3xl">

      <section className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t('title')}</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">{t('subtitle')}</p>
        </div>
        <PeopleManager initialPeople={people ?? []} initialLinks={links ?? []} />
      </section>

      <section className="flex flex-col gap-6 border-t border-[var(--border)] pt-10">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">{t('locations_title')}</h2>
          <p className="text-[var(--text-muted)] text-sm mt-1">{t('locations_subtitle')}</p>
        </div>
        <LocationsManager initialLocations={(locations ?? []) as any} />
      </section>

    </div>
  )
}
