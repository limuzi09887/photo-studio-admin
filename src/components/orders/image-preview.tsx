'use client'

import { formatFileSize } from '@/lib/utils'

interface PreviewFile {
  id: string
  fileName: string
  fileSize: number | bigint
  srcUrl?: string // OSS签名URL（直连）
}

export function ImagePreview({
  file,
  onClose,
  extraInfo,
}: {
  file: PreviewFile
  onClose: () => void
  extraInfo?: string
}) {
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 z-10"
        onClick={onClose}
      >
        ✕
      </button>
      <img
        src={file.srcUrl || `/api/files/proxy?fileId=${file.id}`}
        alt={file.fileName}
        className="max-w-[90vw] max-h-[90vh] object-contain"
        onClick={(e) => e.stopPropagation()}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none'
        }}
      />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-lg">
        {file.fileName} · {formatFileSize(Number(file.fileSize))}
        {extraInfo && ` · ${extraInfo}`}
      </div>
    </div>
  )
}
