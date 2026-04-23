import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DocumentSummarizer from '@/components/DocumentSummarizer'
import { Cpu } from 'lucide-react'

export default async function SummarizerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex flex-col gap-8 max-w-2xl">

      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <Cpu size={22} className="text-amber-500" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Résumé de documents</h1>
        </div>
        <p className="text-[var(--text-muted)] text-sm">
          Résume tes PDF, DOCX et fichiers texte localement — sans connexion internet, sans partage de données.
        </p>
      </div>

      {/* Comment ça marche */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { step: '1', label: 'Upload', desc: 'Glisse ton PDF, DOCX ou TXT' },
          { step: '2', label: 'Analyse', desc: 'Le modèle tourne dans ton navigateur' },
          { step: '3', label: 'Résumé', desc: 'Résultat instantané, données privées' },
        ].map(({ step, label, desc }) => (
          <div key={step} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 flex flex-col gap-2">
            <span className="text-xs font-bold text-amber-500 bg-amber-500/10 rounded-full w-6 h-6 flex items-center justify-center">
              {step}
            </span>
            <p className="font-semibold text-sm text-[var(--text-primary)]">{label}</p>
            <p className="text-xs text-[var(--text-muted)]">{desc}</p>
          </div>
        ))}
      </div>

      {/* Composant principal */}
      <DocumentSummarizer />
    </div>
  )
}
