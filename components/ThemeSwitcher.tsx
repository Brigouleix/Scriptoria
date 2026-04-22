'use client'

import { useTheme } from '@/components/ThemeProvider'
import { Moon, Sun, BookOpen } from 'lucide-react'

const THEMES = [
  { id: 'dark' as const, icon: Moon, label: 'Sombre' },
  { id: 'light' as const, icon: Sun, label: 'Clair' },
  { id: 'retro' as const, icon: BookOpen, label: 'Rétro' },
]

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-black/10 border border-white/10">
      {THEMES.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => setTheme(id)}
          title={label}
          className={`p-1.5 rounded-md transition-all ${
            theme === id
              ? 'bg-amber-500 text-stone-950'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  )
}
