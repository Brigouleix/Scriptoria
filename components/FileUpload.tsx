'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const ACCEPTED = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]
const MAX_SIZE_MB = 20

interface Props {
  projectId: string
  chapterId: string
  userId: string
}

interface UploadFile {
  file: File
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

export default function FileUpload({ projectId, chapterId, userId }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [queue, setQueue] = useState<UploadFile[]>([])

  function updateQueue(index: number, patch: Partial<UploadFile>) {
    setQueue((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  async function uploadFile(file: File, index: number) {
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${userId}/${projectId}/${chapterId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

    updateQueue(index, { status: 'uploading' })

    const { error: storageError } = await supabase.storage
      .from('documents')
      .upload(path, file, { contentType: file.type })

    if (storageError) {
      console.error('Storage error:', JSON.stringify(storageError))
      updateQueue(index, { status: 'error', error: storageError.message })
      return
    }

    const { error: dbError } = await supabase.from('documents').insert({
      chapter_id: chapterId,
      project_id: projectId,
      name: file.name,
      storage_path: path,
      mime_type: file.type,
      size_bytes: file.size,
    })

    if (dbError) {
      await supabase.storage.from('documents').remove([path])
      updateQueue(index, { status: 'error', error: dbError.message })
      return
    }

    updateQueue(index, { status: 'done' })
    setTimeout(() => {
      setQueue((prev) => prev.filter((_, i) => i !== index))
      router.refresh()
    }, 1200)
  }

  function addFiles(files: FileList | null) {
    if (!files) return
    const valid: UploadFile[] = []
    Array.from(files).forEach((file) => {
      if (!ACCEPTED.includes(file.type)) return
      if (file.size > MAX_SIZE_MB * 1024 * 1024) return
      valid.push({ file, status: 'pending' })
    })
    const startIndex = queue.length
    setQueue((prev) => [...prev, ...valid])
    valid.forEach((item, i) => uploadFile(item.file, startIndex + i))
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }, [queue.length])

  return (
    <div className="flex flex-col gap-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
          dragging
            ? 'border-amber-500 bg-amber-500/5'
            : 'border-stone-700 hover:border-stone-500'
        }`}
      >
        <Upload className="text-stone-500" size={28} />
        <div className="text-center">
          <p className="text-sm font-medium text-stone-300">
            Glissez vos fichiers ici ou <span className="text-amber-400">cliquez pour choisir</span>
          </p>
          <p className="text-xs text-stone-500 mt-1">
            Images, PDF, DOC, DOCX, TXT — max {MAX_SIZE_MB} Mo par fichier
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED.join(',')}
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* Upload queue */}
      {queue.length > 0 && (
        <div className="flex flex-col gap-2">
          {queue.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-sm"
            >
              {item.status === 'uploading' && <Loader2 size={14} className="animate-spin text-amber-400 shrink-0" />}
              {item.status === 'done' && <span className="text-amber-400 shrink-0">✓</span>}
              {item.status === 'error' && <X size={14} className="text-red-400 shrink-0" />}
              {item.status === 'pending' && <div className="w-3.5 h-3.5 rounded-full border border-stone-600 shrink-0" />}
              <span className="flex-1 truncate text-stone-300">{item.file.name}</span>
              {item.error && <span className="text-red-400 text-xs">{item.error}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
