'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Plus, Trash2, Loader2, Check, Pencil, X, GripVertical,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ── Types ────────────────────────────────────────────────────────
interface CustomField { name: string; value: string }

interface Details {
  id?:            string
  metier:         string
  date_naissance: string
  traits:         string
  notes:          string
  custom_fields:  CustomField[]
}

const EMPTY: Details = {
  metier: '', date_naissance: '', traits: '', notes: '', custom_fields: [],
}

// ── Debounce hook ────────────────────────────────────────────────
function useDebounce<T>(value: T, delay = 900): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// ── Field component ──────────────────────────────────────────────
function NotebookField({
  label, value, onChange, multiline = false, placeholder = '',
}: {
  label: string; value: string; onChange: (v: string) => void
  multiline?: boolean; placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={5}
          className="w-full resize-none bg-transparent border-b-2 border-[var(--border)] focus:border-amber-500 outline-none py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors leading-relaxed font-[Georgia,serif]"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent border-b-2 border-[var(--border)] focus:border-amber-500 outline-none py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors font-[Georgia,serif]"
        />
      )}
    </div>
  )
}

// ── Custom field row ─────────────────────────────────────────────
function CustomFieldRow({
  field, index, onChangeName, onChangeValue, onDelete,
}: {
  field: CustomField; index: number
  onChangeName: (i: number, v: string) => void
  onChangeValue: (i: number, v: string) => void
  onDelete: (i: number) => void
}) {
  return (
    <div className="flex items-start gap-2 group">
      <GripVertical size={14} className="text-[var(--text-muted)] mt-2 shrink-0 opacity-40" />
      <div className="flex-1 flex flex-col gap-1">
        <input
          type="text"
          value={field.name}
          onChange={(e) => onChangeName(index, e.target.value)}
          placeholder="Nom du champ…"
          className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider bg-transparent border-none outline-none placeholder:text-[var(--text-muted)]/50 w-full"
        />
        <input
          type="text"
          value={field.value}
          onChange={(e) => onChangeValue(index, e.target.value)}
          placeholder="Valeur…"
          className="bg-transparent border-b border-[var(--border)] focus:border-amber-500 outline-none py-1 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors w-full font-[Georgia,serif]"
        />
      </div>
      <button
        onClick={() => onDelete(index)}
        className="p-1 rounded text-[var(--text-muted)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all mt-1 shrink-0"
      >
        <X size={13} />
      </button>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────
export default function PersonNotebook({
  personId,
  userId,
  initialDetails,
}: {
  personId:       string
  userId:         string
  initialDetails: Details | null
}) {
  const [details,  setDetails]  = useState<Details>(initialDetails ?? EMPTY)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const detailsRef = useRef(details)
  detailsRef.current = details

  const debouncedDetails = useDebounce(details, 1200)

  // Auto-save dès que les données changent (debounced)
  const save = useCallback(async (data: Details) => {
    setSaving(true)
    setSaved(false)
    const supabase = createClient()

    const payload = {
      person_id:      personId,
      user_id:        userId,
      metier:         data.metier         || null,
      date_naissance: data.date_naissance || null,
      traits:         data.traits         || null,
      notes:          data.notes          || null,
      custom_fields:  data.custom_fields,
    }

    await supabase
      .from('person_details')
      .upsert(payload, { onConflict: 'person_id' })

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [personId, userId])

  // Déclencher l'auto-save sur changement debounced
  useEffect(() => {
    save(debouncedDetails)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedDetails])

  // ── Handlers ──────────────────────────────────────────────────
  function setField<K extends keyof Details>(key: K, value: Details[K]) {
    setDetails((prev) => ({ ...prev, [key]: value }))
  }

  function addCustomField() {
    setField('custom_fields', [...details.custom_fields, { name: '', value: '' }])
  }

  function updateCustomName(i: number, name: string) {
    const updated = details.custom_fields.map((f, idx) => idx === i ? { ...f, name } : f)
    setField('custom_fields', updated)
  }

  function updateCustomValue(i: number, value: string) {
    const updated = details.custom_fields.map((f, idx) => idx === i ? { ...f, value } : f)
    setField('custom_fields', updated)
  }

  function deleteCustomField(i: number) {
    setField('custom_fields', details.custom_fields.filter((_, idx) => idx !== i))
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="relative">

      {/* Indicateur de sauvegarde */}
      <div className="absolute top-0 right-0 flex items-center gap-1.5 text-xs">
        {saving && (
          <>
            <Loader2 size={11} className="animate-spin text-[var(--text-muted)]" />
            <span className="text-[var(--text-muted)]">Enregistrement…</span>
          </>
        )}
        {saved && !saving && (
          <>
            <Check size={11} className="text-green-500" />
            <span className="text-green-500">Enregistré</span>
          </>
        )}
      </div>

      {/* Notebook paper */}
      <div
        className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden"
        style={{
          backgroundImage: `repeating-linear-gradient(
            transparent,
            transparent 31px,
            var(--border) 31px,
            var(--border) 32px
          )`,
          backgroundPositionY: '48px',
        }}
      >
        {/* Marge rouge façon cahier */}
        <div className="flex">
          <div className="w-8 shrink-0 border-r-2 border-red-300/40 bg-red-50/5" />

          <div className="flex-1 px-6 py-6 flex flex-col gap-8">

            {/* Section : Identité */}
            <section className="flex flex-col gap-6">
              <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                <span className="h-px flex-1 bg-amber-500/20" />
                Identité
                <span className="h-px flex-1 bg-amber-500/20" />
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <NotebookField
                  label="Métier / Rôle"
                  value={details.metier}
                  onChange={(v) => setField('metier', v)}
                  placeholder="ex: Détective, Reine de Navarre…"
                />
                <NotebookField
                  label="Date de naissance / Âge"
                  value={details.date_naissance}
                  onChange={(v) => setField('date_naissance', v)}
                  placeholder="ex: 12 mars 1985 · 38 ans"
                />
              </div>
            </section>

            {/* Section : Caractère */}
            <section className="flex flex-col gap-4">
              <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                <span className="h-px flex-1 bg-amber-500/20" />
                Caractère
                <span className="h-px flex-1 bg-amber-500/20" />
              </h3>

              <NotebookField
                label="Traits de caractère"
                value={details.traits}
                onChange={(v) => setField('traits', v)}
                placeholder="ex: Impulsif, loyal envers ses amis, cynique en apparence mais bienveillant…"
                multiline
              />
            </section>

            {/* Section : Notes libres */}
            <section className="flex flex-col gap-4">
              <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                <span className="h-px flex-1 bg-amber-500/20" />
                Notes
                <span className="h-px flex-1 bg-amber-500/20" />
              </h3>

              <NotebookField
                label="Notes libres"
                value={details.notes}
                onChange={(v) => setField('notes', v)}
                placeholder="Arc narratif, backstory, scènes importantes, motivations secrètes…"
                multiline
              />
            </section>

            {/* Section : Champs personnalisés */}
            <section className="flex flex-col gap-4">
              <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                <span className="h-px flex-1 bg-amber-500/20" />
                Champs personnalisés
                <span className="h-px flex-1 bg-amber-500/20" />
              </h3>

              <div className="flex flex-col gap-4">
                {details.custom_fields.map((field, i) => (
                  <CustomFieldRow
                    key={i}
                    field={field}
                    index={i}
                    onChangeName={updateCustomName}
                    onChangeValue={updateCustomValue}
                    onDelete={deleteCustomField}
                  />
                ))}
              </div>

              <button
                onClick={addCustomField}
                className="flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-amber-500 transition-colors self-start mt-1"
              >
                <Plus size={13} />
                Ajouter un champ
              </button>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}
