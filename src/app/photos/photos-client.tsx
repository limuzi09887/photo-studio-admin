'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ThumbCard } from '@/components/orders/thumb-card'
import { ImagePreview } from '@/components/orders/image-preview'
import { BatchToolbar } from '@/components/orders/batch-toolbar'
import { useBatchSelect } from '@/lib/use-batch-select'

interface FileItem {
  id: string
  fileName: string
  fileUrl: string
  fileSize: bigint
  fileType: string
  createdAt: Date
  order: { orderNo: string }
  srcUrl?: string
}

interface Tab {
  key: string
  label: string
  count: number
  files: FileItem[]
}

function PhotoGrid({ files: initialFiles }: { files: FileItem[] }) {
  const [files, setFiles] = useState(initialFiles)
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null)
  const [selectMode, setSelectMode] = useState(false)
  const { selectedIds, selectedSet, toggleSelect, clearSelection } = useBatchSelect()

  async function handleDelete(fileId: string) {
    try {
      const res = await fetch(`/api/files/${fileId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('删除失败')
      setFiles((prev) => prev.filter((f) => f.id !== fileId))
      clearSelection()
      toast.success('已删除')
    } catch {
      toast.error('删除失败，请重试')
    }
  }

  if (files.length === 0)
    return <p className="text-center text-gray-400 py-16">暂无照片</p>

  return (
    <>
      <div className="flex items-center justify-end mb-3">
        <button
          className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
            selectMode
              ? 'bg-indigo-100 text-indigo-600'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
          onClick={() => {
            setSelectMode(!selectMode)
            clearSelection()
          }}
        >
          {selectMode ? '退出选择' : '☐ 批量选择'}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {files.map((f) => (
          <ThumbCard
            key={f.id}
            fileId={f.id}
            fileName={f.fileName}
            fileSize={f.fileSize}
            srcUrl={f.srcUrl}
            extraInfo={f.order.orderNo}
            onClick={() => {
              if (selectMode) {
                toggleSelect(f.id)
              } else {
                setPreviewFile(f)
              }
            }}
            onDelete={handleDelete}
            selectable={selectMode}
            selected={selectedSet.has(f.id)}
            onSelect={toggleSelect}
          />
        ))}
      </div>

      <BatchToolbar
        selectedIds={selectedIds}
        onClear={clearSelection}
        onDeleted={() => {
          setFiles((prev) =>
            prev.filter((f) => !selectedIds.includes(f.id))
          )
        }}
      />

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
