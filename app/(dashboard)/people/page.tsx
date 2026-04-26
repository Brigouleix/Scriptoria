import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import PeoplePageClient from '@/components/PeoplePageClient'

export default async function PeoplePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: people }, { data: locations }, { data: links }, t] = await Promise.all([
    supabase.from('people').select('id, name, bio, avatar_url').eq('user_id', user.id).order('name'),
    supabase
      .from('locations')
      .select('id, name, description, location_photos(id, storage_path, name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('character_links').select('id, person_a_id, person_b_id, relationship').eq('user_id', user.id),
    getTranslations('people'),
  ])

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t('title')}</h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">{t('subtitle')}</p>
      </div>

      {/* Tabs client — Personnages | Lieux */}
      <Suspense>
        <PeoplePageClient
          people={people ?? []}
          links={links ?? []}
          locations={(locations ?? []) as any}
        />
      </Suspense>
    </div>
  )
}
