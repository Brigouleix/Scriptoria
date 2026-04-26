'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-8 text-center max-w-md">

        {/* Icône */}
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <FileQuestion size={44} className="text-amber-500/70" />
          </div>
          <span className="absolute -top-2 -right-2 text-2xl font-black text-amber-500 bg-[var(--bg-base)] px-1">
            404
          </span>
        </div>

        {/* Texte */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Page introuvable
          </h1>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed">
            Cette page n&apos;existe pas ou a été déplacée.
            <br />
            Vérifie l&apos;URL ou retourne à l&apos;accueil.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-colors"
          >
            <Home size={15} />
            Mes projets
          </Link>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] hover:border-amber-500/40 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition-colors"
          >
            <ArrowLeft size={15} />
            Retour
          </button>
        </div>

      </div>
    </div>
  )
}
