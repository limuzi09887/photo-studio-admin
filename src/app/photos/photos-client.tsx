'use client'

import { useState } from 'react'
import { ThumbCard } from '@/components/orders/thumb-card'
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
      <div className="grid grid-cols-4 gap-4">
        {files.map((f) => (
          <ThumbCard
            key={f.id}
            fileId={f.id}
            fileName={f.fileName}
            fileSize={f.fileSize}
            extraInfo={f.order.orderNo}
            onClick={() => setPreviewFile(f)}
          />
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
