'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface RoleAutocompleteProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

export default function RoleAutocomplete({ value, onChange, placeholder = 'Rôle...' }: RoleAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [filtered, setFiltered] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('saved_roles').select('role').then(({ data }) => {
      setSuggestions((data ?? []).map((r) => r.role))
    })
  }, [])

  useEffect(() => {
    if (!value.trim()) {
      setFiltered(suggestions.slice(0, 8))
    } else {
      setFiltered(
        suggestions.filter((r) => r.toLowerCase().includes(value.toLowerCase())).slice(0, 8)
      )
    }
  }, [value, suggestions])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function select(role: string) {
    onChange(role)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm placeholder:text-stone-600 focus:outline-none focus:border-amber-500 transition-colors"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 top-full mt-1 w-full bg-stone-900 border border-stone-700 rounded-lg shadow-xl overflow-hidden">
          {filtered.map((role) => (
            <li key={role}>
              <button
                type="button"
                onMouseDown={() => select(role)}
                className="w-full text-left px-3 py-2 text-sm text-stone-300 hover:bg-stone-800 hover:text-amber-400 transition-colors"
              >
                {role}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
