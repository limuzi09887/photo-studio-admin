'use client'

import { useState } from 'react'
import { formatFileSize, getFileProxyUrl } from '@/lib/utils'
import { ImagePreview } from '@/components/orders/image-preview'

interface FileItem {
  id: string
  fileName: string
  fileUrl: string
  fileSize: bigint
  fileType: string
  createdAt: Date
  order: { orderNo: string }
}

interface Tab {
  key: string
  label: string
  count: number
  files: FileItem[]
}

function PhotoGrid({ files }: { files: FileItem[] }) {
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null)

  if (files.length === 0)
    return <p className="text-center text-gray-400 py-16">暂无照片</p>

  return (
    <>
      <div className="grid grid-cols-5 gap-3">
        {files.map((f) => (
          <div
            key={f.id}
            className="bg-white rounded-xl border border-gray-100 overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all"
            onClick={() => setPreviewFile(f)}
          >
            <div className="h-[120px] bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-3xl overflow-hidden">
              <img
                src={getFileProxyUrl(f.id)}
                alt={f.fileName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                  ;(e.target as HTMLImageElement).parentElement!.innerHTML = '🖼️'
                }}
              />
            </div>
            <div className="p-3">
              <p className="text-xs font-semibold truncate">{f.fileName}</p>
              <p className="text-[11px] text-gray-400">
                {formatFileSize(Number(f.fileSize))} · {f.order.orderNo}
              </p>
            </div>
          </div>
        ))}
      </div>
      {previewFile && (
        <ImagePreview file={previewFile} onClose={() => setPreviewFile(null)} extraInfo={previewFile.order.orderNo} />
      )}
    </>
  )
}

export function PhotosClient({ tabs }: { tabs: Tab[] }) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.key ?? 'originals')

  const activeFiles = tabs.find((t) => t.key === activeTab)?.files ?? []

  return (
    <>
      <div className="flex gap-4 mb-5 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2 rounded-md text-sm font-medium ${
              activeTab === tab.key
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-500'
            }`}
          >
            {tab.label}（{tab.count}张）
          </button>
        ))}
      </div>
      <PhotoGrid files={activeFiles} />
    </>
  )
}
