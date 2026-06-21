'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { formatFileSize } from '@/lib/utils'

interface FileInfo {
  id: string
  fileName: string
  fileUrl: string
  fileSize: number
}

export function UploadClient({ orderId, existingFiles }: { orderId: string; existingFiles: FileInfo[] }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<Record<string, number>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleUpload(files: FileList) {
    setUploading(true)
    const newProgress: Record<string, number> = {}

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        newProgress[file.name] = 0
        setProgress({ ...newProgress })

        // 1. Get presigned URL
        const key = `${orderId}/original/${Date.now()}_${file.name}`
        const presignedRes = await fetch(`/api/upload-url?key=${encodeURIComponent(key)}&contentType=${encodeURIComponent(file.type)}`)
        if (!presignedRes.ok) throw new Error('Failed to get upload URL')
        const { url } = await presignedRes.json()

        // 2. Upload to R2
        const uploadRes = await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
        if (!uploadRes.ok) throw new Error('Upload failed')

        // 3. Save record to database
        const saveRes = await fetch(`/api/orders/${orderId}/files`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, fileName: file.name, fileSize: file.size, fileType: 'ORIGINAL' }),
        })
        if (!saveRes.ok) throw new Error('Failed to save file record')

        newProgress[file.name] = 100
        setProgress({ ...newProgress })
      } catch (err) {
        newProgress[file.name] = -1
        setProgress({ ...newProgress })
        toast.error(`${file.name} 上传失败`)
      }
    }

    setUploading(false)
    toast.success('上传完成')
    router.refresh()
  }

  return (
    <div>
      <div
        className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-indigo-400 transition-colors cursor-pointer mb-6"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          if (e.dataTransfer.files) handleUpload(e.dataTransfer.files)
        }}
      >
        <p className="text-4xl mb-3">📤</p>
        <p className="text-base font-semibold text-gray-700">拖拽照片到此处，或点击上传</p>
        <p className="text-sm text-gray-400 mt-1">支持 JPG / PNG / HEIC，可批量上传</p>
        <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
          onChange={(e) => e.target.files && handleUpload(e.target.files)} disabled={uploading} />
      </div>

      {uploading && Object.keys(progress).length > 0 && (
        <div className="mb-6 space-y-2">
          {Object.entries(progress).map(([name, pct]) => (
            <div key={name} className="flex items-center gap-3">
              <span className="text-sm w-40 truncate">{name}</span>
              <div className="flex-1 h-2 bg-gray-200 rounded">
                <div className={`h-full rounded transition-all ${pct < 0 ? 'bg-red-500 w-full' : 'bg-indigo-500'}`}
                  style={{ width: pct < 0 ? '100%' : `${pct}%` }} />
              </div>
              <span className="text-xs w-16 text-right">{pct < 0 ? '失败' : `${pct}%`}</span>
            </div>
          ))}
        </div>
      )}

      {existingFiles.length > 0 && (
        <div className="grid grid-cols-5 gap-3">
          {existingFiles.map((f) => (
            <div key={f.id} className="bg-gray-50 rounded-lg p-2 text-center">
              <div className="h-20 bg-gray-200 rounded flex items-center justify-center text-2xl">🖼️</div>
              <p className="text-xs mt-1 truncate">{f.fileName}</p>
              <p className="text-[10px] text-gray-400">{formatFileSize(f.fileSize)}</p>
            </div>
          ))}
        </div>
      )}

      {existingFiles.length === 0 && !uploading && (
        <p className="text-center text-gray-400 py-8">暂未上传原图</p>
      )}
    </div>
  )
}
