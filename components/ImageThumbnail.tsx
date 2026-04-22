'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

interface Props {
  storagePath: string
  name: string
}

export default function ImageThumbnail({ storagePath, name }: Props) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.storage
      .from('documents')
      .createSignedUrl(storagePath, 3600)
      .then(({ data }) => {
        if (data?.signedUrl) setUrl(data.signedUrl)
      })
  }, [storagePath])

  if (!url) {
    return <div className="w-full h-full bg-stone-800 animate-pulse" />
  }

  return (
    <Image
      src={url}
      alt={name}
      fill
      className="object-cover"
      sizes="(max-width: 640px) 50vw, 25vw"
    />
  )
}
