'use client'

import { useState } from 'react'
import { ThumbCard } from '@/components/orders/thumb-card'
import { ImagePreview } from '@/components/orders/image-preview'

interface FileItem {
  id: string
  fileName: string
  fileSize: bigint
}

export function PhotoGrid({ files }: { files: FileItem[] }) {
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null)

  if (files.length === 0)
    return <p className="text-center text-gray-400 py-12">暂无修图底片</p>

  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        {files.map((f) => (
          <ThumbCard
            key={f.id}
            fileId={f.id}
            fileName={f.fileName}
            fileSize={f.fileSize}
            onClick={() => setPreviewFile(f)}
          />
        ))}
      </div>
      {previewFile && (
        <ImagePreview file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </>
  )
}
