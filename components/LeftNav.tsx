'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function LeftNav() {
  const pathname = usePathname()
  const t = useTranslations('nav')

  const links = [
    { href: '/dashboard', label: t('my_projects'), icon: LayoutDashboard },
    { href: '/people', label: t('members'), icon: Users },
  ]

  return (
    <aside className="hidden sm:flex w-52 shrink-0 border-r border-[var(--border)] bg-[var(--bg-card)] flex-col py-5 px-3 gap-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href ||
          (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              active
                ? 'bg-amber-500/10 text-amber-500'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)]'
            }`}
          >
            <Icon size={16} />
            {label}
          </Link>
        )
      })}
    </aside>
  )
}
