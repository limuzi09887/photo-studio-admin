'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ParamsPanel } from '@/components/ai-retouch/params-panel'
import { BeforeAfter } from '@/components/ai-retouch/before-after'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface OriginalFile {
  id: string
  name: string
  url: string
}

interface AiFile {
  id: string
  name: string
  url: string
  params: Record<string, string> | null
}

type RetouchStatus = '待处理' | '处理中' | '完成' | '失败'

interface PairState {
  originalId: string
  originalName: string
  originalUrl: string
  retouchedName: string
  retouchedUrl?: string
  retouchedStatus: RetouchStatus
  errorMessage?: string
  processingTime?: number
}

export function AiRetouchClient({
  orderId,
  status,
  originalFiles,
  aiFiles,
}: {
  orderId: string
  status: string
  originalFiles: OriginalFile[]
  aiFiles: AiFile[]
}) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [currentParams, setCurrentParams] = useState<Record<string, string> | null>(null)

  // Initialize pairs from originals + existing AI results
  const buildInitialPairs = (): PairState[] => {
    const aiMap = new Map<string, AiFile>()
    aiFiles.forEach((f) => {
      if (f.params) {
        // Match AI result to original by filename convention (strip suffix)
        const origName = f.name.replace(/_retouched/, '').replace(/_ai/, '')
        aiMap.set(origName, f)
      }
    })

    return originalFiles.map((orig) => {
      const matched = aiMap.get(orig.name)
      if (matched) {
        return {
          originalId: orig.id,
          originalName: orig.name,
          originalUrl: orig.url,
          retouchedName: matched.name,
          retouchedUrl: matched.url,
          retouchedStatus: '完成' as RetouchStatus,
        }
      }
      return {
        originalId: orig.id,
        originalName: orig.name,
        originalUrl: orig.url,
        retouchedName: `${orig.name}_retouched`,
        retouchedStatus: '待处理' as RetouchStatus,
      }
    })
  }

  const [pairs, setPairs] = useState<PairState[]>(buildInitialPairs)

  const handleSubmit = useCallback(async (params: Record<string, string>) => {
    setCurrentParams(params)
    setSubmitting(true)

    // Mark all pending pairs as processing
    setPairs((prev) =>
      prev.map((p) =>
        p.retouchedStatus === '待处理' ? { ...p, retouchedStatus: '处理中' as RetouchStatus } : p
      )
    )

    const pendingPairs = pairs.filter((p) => p.retouchedStatus === '待处理')

    for (const pair of pendingPairs) {
      try {
        const res = await fetch(`/api/orders/${orderId}/ai-retouch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originalFileId: pair.originalId,
            originalUrl: pair.originalUrl,
            params,
          }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'AI 修图失败' }))
          throw new Error(err.error || 'AI 修图失败')
        }

        const data = await res.json()

        setPairs((prev) =>
          prev.map((p) =>
            p.originalId === pair.originalId
              ? {
                  ...p,
                  retouchedStatus: '完成' as RetouchStatus,
                  retouchedUrl: `/api/files/proxy?fileId=${data.aiFile.id}`,
                  retouchedName: data.aiFile.fileName,
                  processingTime: data.aiFile.aiParams?.processingTime,
                }
              : p
          )
        )
      } catch (err) {
        setPairs((prev) =>
          prev.map((p) =>
            p.originalId === pair.originalId
              ? {
                  ...p,
                  retouchedStatus: '失败' as RetouchStatus,
                  errorMessage: err instanceof Error ? err.message : 'AI 修图失败',
                }
              : p
          )
        )
      }
    }

    setSubmitting(false)
    toast.success('AI 修图任务处理完成')
    router.refresh()
  }, [orderId, pairs, router])

  const handleRetry = useCallback(async (originalId: string) => {
    if (!currentParams) {
      toast.error('请先设置修图参数并提交任务')
      return
    }

    const pair = pairs.find((p) => p.originalId === originalId)
    if (!pair) return

    setPairs((prev) =>
      prev.map((p) =>
        p.originalId === originalId ? { ...p, retouchedStatus: '处理中' as RetouchStatus, errorMessage: undefined } : p
      )
    )

    try {
      const res = await fetch(`/api/orders/${orderId}/ai-retouch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalFileId: originalId,
          originalUrl: pair.originalUrl,
          params: currentParams,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'AI 修图失败' }))
        throw new Error(err.error || 'AI 修图失败')
      }

      const data = await res.json()

      setPairs((prev) =>
        prev.map((p) =>
          p.originalId === originalId
            ? {
                ...p,
                retouchedStatus: '完成' as RetouchStatus,
                retouchedUrl: data.aiFile.fileUrl,
                retouchedName: data.aiFile.fileName,
                processingTime: data.aiFile.aiParams?.processingTime,
              }
            : p
        )
      )
      toast.success('重新修图成功')
      router.refresh()
    } catch (err) {
      setPairs((prev) =>
        prev.map((p) =>
          p.originalId === originalId
            ? {
                ...p,
                retouchedStatus: '失败' as RetouchStatus,
                errorMessage: err instanceof Error ? err.message : 'AI 修图失败',
              }
            : p
        )
      )
      toast.error('重新修图失败')
    }
  }, [orderId, pairs, currentParams, router])

  const handleReset = useCallback(() => {
    setCurrentParams(null)
  }, [])

  const handleConfirmAll = useCallback(async () => {
    const allDone = pairs.every((p) => p.retouchedStatus === '完成')
    if (!allDone) {
      toast.error('还有图片未完成修图处理')
      return
    }

    try {
      const res = await fetch(`/api/orders/${orderId}/ai-retouch`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm' }),
      })
      if (!res.ok) throw new Error('确认失败')
      toast.success('全部修图已确认，订单进入下一阶段')
      router.refresh()
      router.push(`/orders/${orderId}`)
    } catch {
      toast.error('确认失败，请重试')
    }
  }, [orderId, pairs, router])

  const completedCount = pairs.filter((p) => p.retouchedStatus === '完成').length
  const allDone = pairs.length > 0 && completedCount === pairs.length

  return (
    <div className="bg-white rounded-2xl p-7 border border-gray-100">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold">🤖 AI 修图（一类修片）</h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {completedCount}/{pairs.length} 已完成
          </span>
          {allDone && (
            <Button onClick={handleConfirmAll} className="bg-indigo-500 hover:bg-indigo-600 text-sm">
              ✅ 确认全部 · 进入下一环节
            </Button>
          )}
        </div>
      </div>

      <ParamsPanel onSubmit={handleSubmit} onReset={handleReset} disabled={submitting} />

      {pairs.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📸</p>
          <p>请先上传原图</p>
        </div>
      )}

      <div className="space-y-4">
        {pairs.map((pair) => (
          <BeforeAfter
            key={pair.originalId}
            original={{ name: pair.originalName, url: pair.originalUrl }}
            retouched={{
              name: pair.retouchedName,
              url: pair.retouchedUrl,
              status: pair.retouchedStatus,
              errorMessage: pair.errorMessage,
              processingTime: pair.processingTime,
            }}
            onRetry={pair.retouchedStatus === '失败' ? () => handleRetry(pair.originalId) : undefined}
          />
        ))}
      </div>
    </div>
  )
}
