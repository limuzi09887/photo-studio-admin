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
  fileSize: bigint
}

export function PhotoGrid({
  files: initialFiles,
  showDelete = false,
}: {
  files: FileItem[]
  showDelete?: boolean
}) {
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
    return <p className="text-center text-gray-400 py-12">暂无修图底片</p>

  return (
    <>
      {showDelete && (
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
      )}

      <div className="grid grid-cols-4 gap-4">
        {files.map((f) => (
          <ThumbCard
            key={f.id}
            fileId={f.id}
            fileName={f.fileName}
            fileSize={f.fileSize}
            onClick={() => {
              if (selectMode) {
                toggleSelect(f.id)
              } else {
                setPreviewFile(f)
              }
            }}
            onDelete={showDelete ? handleDelete : undefined}
            selectable={selectMode}
            selected={selectedSet.has(f.id)}
            onSelect={toggleSelect}
          />
        ))}
      </div>

      {showDelete && (
        <BatchToolbar
          selectedIds={selectedIds}
          onClear={clearSelection}
          onDeleted={() => {
            setFiles((prev) =>
              prev.filter((f) => !selectedIds.includes(f.id))
            )
          }}
        />
      )}

      {previewFile && (
        <ImagePreview file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </>
  )
}
