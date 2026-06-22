'use client'

import { useState } from 'react'
import { formatFileSize } from '@/lib/utils'

interface FileItem {
  id: string
  fileName: string
  fileSize: bigint
}

function ImagePreview({ file, onClose }: { file: FileItem; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center cursor-pointer"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 z-10"
        onClick={onClose}
      >
        ✕
      </button>
      <img
        src={`/api/files/proxy?fileId=${file.id}`}
        alt={file.fileName}
        className="max-w-[90vw] max-h-[90vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-lg">
        {file.fileName} · {formatFileSize(Number(file.fileSize))}
      </div>
    </div>
  )
}

export function PhotoGrid({ files }: { files: FileItem[] }) {
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null)

  if (files.length === 0)
    return <p className="text-center text-gray-400 py-12">暂无修图底片</p>

  return (
    <>
      <div className="grid grid-cols-5 gap-3">
        {files.map((f) => (
          <div
            key={f.id}
            className="bg-gray-50 rounded-lg p-2 text-center cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all"
            onClick={() => setPreviewFile(f)}
          >
            <div className="h-24 bg-gray-200 rounded flex items-center justify-center overflow-hidden mb-1">
              <img
                src={`/api/files/proxy?fileId=${f.id}`}
                alt={f.fileName}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <p className="text-xs mt-1 truncate" title={f.fileName}>{f.fileName}</p>
            <p className="text-[10px] text-gray-400">{formatFileSize(Number(f.fileSize))}</p>
          </div>
        ))}
      </div>
      {previewFile && (
        <ImagePreview file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </>
  )
}
