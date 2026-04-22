'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { X, Download, FileText, File } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

interface Doc {
  id: string
  name: string
  storage_path: string
  mime_type: string
  size_bytes: number
}

interface Props {
  doc: Doc
  onClose: () => void
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

export default function DocumentViewer({ doc, onClose }: Props) {
  const t = useTranslations('common')
  const [url, setUrl] = useState<string | null>(null)
  const isImage = doc.mime_type.startsWith('image/')
  const isPdf = doc.mime_type === 'application/pdf'

  useEffect(() => {
    const supabase = createClient()
    supabase.storage
      .from('documents')
      .createSignedUrl(doc.storage_path, 3600)
      .then(({ data }) => {
        if (data?.signedUrl) setUrl(data.signedUrl)
      })
  }, [doc.storage_path])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleDownload() {
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = doc.name
    a.click()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Liquid glass backdrop */}
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: 'blur(24px) saturate(180%) brightness(0.6)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%) brightness(0.6)',
          background: 'rgba(12, 10, 9, 0.55)',
        }}
      />

      {/* Modal panel */}
      <div
        className="relative z-10 flex flex-col max-w-3xl w-full max-h-[90vh] rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="text-amber-400 shrink-0" size={18} />
            <div className="min-w-0">
              <p className="font-semibold text-stone-100 truncate text-sm">{doc.name}</p>
              <p className="text-xs text-stone-400">{formatSize(doc.size_bytes)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 text-xs text-stone-300 hover:text-amber-400 transition-colors px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <Download size={13} />
              {t('download')}
            </button>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-100 transition-colors p-1.5 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-6">
          {!url ? (
            <div className="w-12 h-12 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
          ) : isImage ? (
            <div className="relative w-full" style={{ maxHeight: '65vh' }}>
              <img
                src={url}
                alt={doc.name}
                className="max-w-full max-h-[65vh] object-contain mx-auto rounded-lg"
                style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
              />
            </div>
          ) : isPdf ? (
            <iframe
              src={url}
              className="w-full rounded-lg"
              style={{ height: '65vh', border: 'none' }}
              title={doc.name}
            />
          ) : (
            <div className="flex flex-col items-center gap-4 text-center py-12">
              <File className="text-stone-500" size={48} />
              <div>
                <p className="text-stone-300 font-medium">{doc.name}</p>
                <p className="text-stone-500 text-sm mt-1">{formatSize(doc.size_bytes)}</p>
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                <Download size={15} />
                {t('download')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
