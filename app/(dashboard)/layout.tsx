import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import LeftNav from '@/components/LeftNav'
import BackButton from '@/components/BackButton'
import AiAssistant from '@/components/AiAssistant'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-base)]">
      <Navbar user={user} />
      <div className="flex flex-1 min-h-0">
        {/* Suspense requis par useSearchParams dans LeftNav */}
        <Suspense fallback={<div className="hidden sm:block w-52 shrink-0" />}>
          <LeftNav />
        </Suspense>
        <main className="flex-1 min-w-0 overflow-auto px-6 py-8">
          <div className="max-w-5xl mx-auto">
            <BackButton />
            {children}
          </div>
        </main>
      </div>
      <AiAssistant />
    </div>
  )
}
