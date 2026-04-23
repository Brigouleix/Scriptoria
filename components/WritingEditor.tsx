'use client'

import { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import CharacterCount from '@tiptap/extension-character-count'
import {
  Bold, Italic, Strikethrough, Heading2, Heading3,
  List, ListOrdered, Quote, Minus, Undo, Redo,
  Save, X, FolderOpen, Loader2, FileText,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Chapter {
  id: string
  title: string
}

interface Props {
  projectId: string
  userId: string
  chapters: Chapter[]
}

function ToolbarButton({
  onClick, active, title, children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active
          ? 'bg-amber-500/20 text-amber-400'
          : 'text-stone-400 hover:text-stone-100 hover:bg-stone-700'
      }`}
    >
      {children}
    </button>
  )
}

export default function WritingEditor({ projectId, userId, chapters }: Props) {
  const [documentTitle, setDocumentTitle] = useState('Sans titre')
  const [saving, setSaving] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [selectedChapter, setSelectedChapter] = useState('')
  const [savedMessage, setSavedMessage] = useState('')

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Typography,
      Placeholder.configure({ placeholder: 'Commencez à écrire votre histoire…' }),
      CharacterCount,
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-stone max-w-none focus:outline-none min-h-[60vh] px-1 leading-relaxed',
      },
    },
  })

  const wordCount = editor
    ? editor.storage.characterCount.words()
    : 0

  async function handleSave() {
    if (!editor || !selectedChapter) return
    setSaving(true)

    const text = editor.getText()
    const blob = new Blob([text], { type: 'text/plain' })
    const filename = `${documentTitle.trim() || 'note'}.txt`
    const path = `${userId}/${projectId}/${selectedChapter}/${Date.now()}_${Math.random().toString(36).slice(2)}.txt`

    const supabase = createClient()

    const { error: storageError } = await supabase.storage
      .from('documents')
      .upload(path, blob, { contentType: 'text/plain' })

    if (storageError) {
      setSaving(false)
      return
    }

    await supabase.from('documents').insert({
      chapter_id: selectedChapter,
      project_id: projectId,
      name: filename,
      storage_path: path,
      mime_type: 'text/plain',
      size_bytes: blob.size,
    })

    setSaving(false)
    setShowSaveModal(false)
    setSavedMessage(`Sauvegardé dans "${chapters.find((c) => c.id === selectedChapter)?.title}"`)
    setTimeout(() => setSavedMessage(''), 3000)
  }

  if (!editor) return null

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <input
        type="text"
        value={documentTitle}
        onChange={(e) => setDocumentTitle(e.target.value)}
        placeholder="Titre du document"
        className="text-2xl font-bold bg-transparent border-none outline-none text-stone-100 placeholder:text-stone-600 w-full"
      />

      {/* Toolbar */}
      <div className="border border-stone-800 bg-stone-900 rounded-xl p-2 flex items-center gap-1 flex-wrap">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Gras">
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italique">
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Barré">
          <Strikethrough size={15} />
        </ToolbarButton>

        <div className="w-px h-5 bg-stone-700 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Titre 2">
          <Heading2 size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Titre 3">
          <Heading3 size={15} />
        </ToolbarButton>

        <div className="w-px h-5 bg-stone-700 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Liste">
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Liste numérotée">
          <ListOrdered size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Citation">
          <Quote size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Séparateur" active={false}>
          <Minus size={15} />
        </ToolbarButton>

        <div className="w-px h-5 bg-stone-700 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Annuler" active={false}>
          <Undo size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Rétablir" active={false}>
          <Redo size={15} />
        </ToolbarButton>

        <div className="flex-1" />

        {/* Word count */}
        <span className="text-xs text-stone-500 mr-2">{wordCount} mot{wordCount > 1 ? 's' : ''}</span>

        {/* Save button */}
        <button
          onClick={() => setShowSaveModal(true)}
          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors"
        >
          <Save size={13} />
          Sauvegarder
        </button>
      </div>

      {/* Editor */}
      <div
        className="border border-stone-800 bg-stone-900/30 rounded-xl px-8 py-6 cursor-text"
        onClick={() => editor.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Saved message */}
      {savedMessage && (
        <div className="flex items-center gap-2 text-sm text-amber-400">
          <FileText size={14} />
          {savedMessage}
        </div>
      )}

      {/* Save modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-700 rounded-xl p-6 w-full max-w-md flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="text-amber-400" size={20} />
                <h2 className="font-bold text-lg">Sauvegarder dans...</h2>
              </div>
              <button onClick={() => setShowSaveModal(false)} className="text-stone-500 hover:text-stone-200">
                <X size={20} />
              </button>
            </div>

            {chapters.length === 0 ? (
              <p className="text-stone-400 text-sm">
                Aucun chapitre disponible. Créez d&apos;abord un chapitre dans la section Documents.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {chapters.map((chapter) => (
                  <button
                    key={chapter.id}
                    onClick={() => setSelectedChapter(chapter.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors ${
                      selectedChapter === chapter.id
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                        : 'border-stone-700 hover:border-stone-600 text-stone-300'
                    }`}
                  >
                    <FolderOpen size={16} />
                    {chapter.title}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-stone-400 hover:text-stone-200 text-sm px-4 py-2 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !selectedChapter}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                <Save size={14} />
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
