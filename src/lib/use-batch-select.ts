'use client'

import { useState, useCallback } from 'react'

export function useBatchSelect() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  return {
    selectedIds: Array.from(selectedIds),
    selectedSet: selectedIds,
    toggleSelect,
    clearSelection,
  }
}
