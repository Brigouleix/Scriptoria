'use client'

import { useRouter, usePathname } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function BackButton() {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('nav')

  if (pathname === '/dashboard') return null

  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm transition-colors mb-5"
    >
      <ArrowLeft size={15} />
      {t('back')}
    </button>
  )
}
