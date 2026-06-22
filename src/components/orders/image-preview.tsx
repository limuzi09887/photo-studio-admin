'use client'

import { formatFileSize } from '@/lib/utils'

interface PreviewFile {
  id: string
  fileName: string
  fileSize: number | bigint
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
  const src = `/api/files/proxy?fileId=${file.id}`
  const downloadUrl = `/api/files/proxy?fileId=${file.id}&download=1`

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
        <a
          href={downloadUrl}
          className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          ⬇ 下载
        </a>
        <button
          className="text-white text-3xl hover:text-gray-300"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
      <img
        src={src}
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
