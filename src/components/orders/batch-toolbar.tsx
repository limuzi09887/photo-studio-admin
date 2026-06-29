'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface BatchToolbarProps {
  selectedIds: string[]
  onClear: () => void
  onDeleted: () => void
}

export function BatchToolbar({ selectedIds, onClear, onDeleted }: BatchToolbarProps) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (selectedIds.length === 0) return null

  async function handleBatchDelete() {
    setDeleting(true)
    try {
      const res = await fetch('/api/files/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      })
      if (!res.ok) throw new Error('删除失败')
      const data = await res.json()
      toast.success(`已删除 ${data.deletedCount} 个文件`)
      onDeleted()
      onClear()
    } catch {
      toast.error('批量删除失败')
    } finally {
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-gray-900 text-white rounded-2xl px-6 py-3 shadow-2xl">
      <span className="text-sm font-medium">
        已选 <span className="text-indigo-300">{selectedIds.length}</span> 项
      </span>

      <button
        className="text-sm text-gray-400 hover:text-white transition-colors"
        onClick={onClear}
      >
        取消选择
      </button>

      <div className="w-px h-5 bg-gray-700" />

      {!confirming ? (
        <Button
          size="sm"
          className="bg-red-500 hover:bg-red-600 text-white text-xs h-8"
          onClick={() => setConfirming(true)}
        >
          🗑 批量删除
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 text-white text-xs h-8"
            onClick={handleBatchDelete}
          >
            {deleting ? '删除中...' : '⚠ 确认删除'}
          </Button>
          <button
            className="text-xs text-gray-400 hover:text-white"
            onClick={() => setConfirming(false)}
          >
            取消
          </button>
        </div>
      )}
    </div>
  )
}
