'use client'

import { useState, useCallback } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Field {
  key: string
  label: string
  placeholder: string
  type: string
  rows?: number
}

interface Props {
  projectId: string
  stepNumber: number
  fields: Field[]
  initialContent: Record<string, string>
}

type SaveStatus = 'idle' | 'saving' | 'saved'

export default function StepEditor({ projectId, stepNumber, fields, initialContent }: Props) {
  const [content, setContent] = useState<Record<string, string>>(initialContent)
  const [status, setStatus] = useState<SaveStatus>('idle')

  const save = useCallback(async (updatedContent: Record<string, string>) => {
    setStatus('saving')
    const supabase = createClient()

    await supabase
      .from('snowflake_steps')
      .upsert(
        { project_id: projectId, step_number: stepNumber, content: updatedContent },
        { onConflict: 'project_id,step_number' }
      )

    setStatus('saved')
    setTimeout(() => setStatus('idle'), 2000)
  }, [projectId, stepNumber])

  function handleChange(key: string, value: string) {
    const updated = { ...content, [key]: value }
    setContent(updated)
  }

  function handleBlur() {
    save(content)
  }

  return (
    <div className="flex flex-col gap-5">
      {fields.map((field) => (
        <div key={field.key} className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-stone-300">{field.label}</label>
          {field.type === 'input' ? (
            <input
              type="text"
              value={content[field.key] ?? ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              onBlur={handleBlur}
              placeholder={field.placeholder}
              className="bg-stone-900 border border-stone-700 rounded-lg px-3 py-2.5 text-sm placeholder:text-stone-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          ) : (
            <textarea
              rows={field.rows ?? 4}
              value={content[field.key] ?? ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              onBlur={handleBlur}
              placeholder={field.placeholder}
              className="bg-stone-900 border border-stone-700 rounded-lg px-3 py-2.5 text-sm placeholder:text-stone-600 focus:outline-none focus:border-amber-500 transition-colors resize-y leading-relaxed"
            />
          )}
        </div>
      ))}

      {/* Save indicator */}
      <div className="flex items-center gap-1.5 text-xs h-4">
        {status === 'saving' && (
          <>
            <Loader2 size={12} className="animate-spin text-stone-500" />
            <span className="text-stone-500">Enregistrement...</span>
          </>
        )}
        {status === 'saved' && (
          <>
            <CheckCircle2 size={12} className="text-amber-400" />
            <span className="text-amber-400">Enregistré</span>
          </>
        )}
      </div>
    </div>
  )
}
