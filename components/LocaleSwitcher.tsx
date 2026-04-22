'use client'

import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Globe } from 'lucide-react'

const LOCALES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'ht', label: 'Kreyòl', flag: '🇭🇹' },
]

export default function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000`
    startTransition(() => router.refresh())
  }

  return (
    <div className="flex items-center gap-1.5 text-stone-300">
      <Globe size={14} />
      <select
        value={locale}
        onChange={handleChange}
        disabled={isPending}
        className="bg-transparent text-sm text-stone-300 hover:text-stone-100 cursor-pointer focus:outline-none transition-colors"
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code} className="bg-stone-900">
            {l.flag} {l.label}
          </option>
        ))}
      </select>
    </div>
  )
}
