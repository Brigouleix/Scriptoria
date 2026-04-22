import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PeopleManager from '@/components/PeopleManager'

export default async function PeoplePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: people } = await supabase
    .from('people')
    .select('id, name, bio')
    .order('name')

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Membres</h1>
        <p className="text-stone-400 text-sm mt-1">
          Gérez les profils de personnes utilisables dans vos projets d&apos;équipe.
        </p>
      </div>
      <PeopleManager initialPeople={people ?? []} />
    </div>
  )
}
