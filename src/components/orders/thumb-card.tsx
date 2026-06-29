'use client'

import { useState } from 'react'
import { formatFileSize } from '@/lib/utils'

interface ThumbCardProps {
  fileId: string
  fileName: string
  fileSize: number | bigint
  extraInfo?: string
  onClick?: () => void
  ringColor?: string
  onDelete?: (fileId: string) => void
  selectable?: boolean
  selected?: boolean
  onSelect?: (fileId: string) => void
}

export function ThumbCard({
  fileId,
  fileName,
  fileSize,
  extraInfo,
  onClick,
  ringColor = 'hover:ring-indigo-400',
  onDelete,
  selectable,
  selected = false,
  onSelect,
}: ThumbCardProps) {
  const [dims, setDims] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:ring-2 ${ringColor} hover:shadow-md transition-all`}
      onClick={onClick}
    >
      <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center overflow-hidden relative">
        {selectable && (
          <div
            className="absolute top-2 left-2 z-10"
            onClick={(e) => {
              e.stopPropagation()
              onSelect?.(fileId)
            }}
          >
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                selected
                  ? 'bg-indigo-500 border-indigo-500 text-white'
                  : 'bg-white/80 border-gray-300 hover:border-indigo-400'
              }`}
            >
              {selected && <span className="text-xs leading-none">✓</span>}
            </div>
          </div>
        )}
        {error ? (
          <span className="text-3xl text-gray-300">🖼️</span>
        ) : (
          <img
            src={`/api/files/proxy?fileId=${fileId}`}
            alt={fileName}
            className="w-full h-full object-cover"
            loading="lazy"
            onLoad={(e) => {
              const img = e.target as HTMLImageElement
              setDims(`${img.naturalWidth} × ${img.naturalHeight}`)
            }}
            onError={() => setError(true)}
          />
        )}
      </div>
      <div className="p-3">
        <p className="text-xs font-medium truncate" title={fileName}>{fileName}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[11px] text-gray-400">{dims || '...'}</span>
          <span className="text-[11px] text-gray-400">{formatFileSize(Number(fileSize))}</span>
        </div>
        {extraInfo && (
          <p className="text-[10px] text-gray-300 mt-0.5">{extraInfo}</p>
        )}
        <a
          href={`/api/files/proxy?fileId=${fileId}&download=1`}
          download={fileName}
          className="flex items-center justify-center gap-1 mt-2 py-1.5 rounded-md bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-xs text-gray-500 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          ⬇ 下载
        </a>
        {onDelete && (
          <button
            disabled={deleting}
            className={`flex items-center justify-center gap-1 mt-1 py-1.5 rounded-md text-xs transition-colors w-full ${
              confirmDelete
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500'
            }`}
            onClick={async (e) => {
              e.stopPropagation()
              if (!confirmDelete) {
                setConfirmDelete(true)
                // Auto-cancel after 3 seconds
                setTimeout(() => setConfirmDelete(false), 3000)
                return
              }
              setDeleting(true)
              onDelete(fileId)
            }}
          >
            {deleting ? '删除中...' : confirmDelete ? '⚠ 确认删除' : '🗑 删除'}
          </button>
        )}
      </div>
    </div>
  )
}
