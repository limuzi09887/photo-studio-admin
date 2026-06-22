'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ThumbCard } from '@/components/orders/thumb-card'
import { ImagePreview } from '@/components/orders/image-preview'

interface FileInfo {
  id: string
  fileName: string
  fileUrl: string
  fileSize: number
}

export function FinalsClient({ orderId, existingFiles }: { orderId: string; existingFiles: FileInfo[] }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [previewFile, setPreviewFile] = useState<FileInfo | null>(null)
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

        const formData = new FormData()
        formData.append('file', file)
        formData.append('orderId', orderId)
        formData.append('fileType', 'FINAL')

        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!uploadRes.ok) throw new Error('Upload failed')

        newProgress[file.name] = 100
        setProgress({ ...newProgress })
      } catch (err) {
        newProgress[file.name] = -1
        setProgress({ ...newProgress })
        toast.error(`${file.name} 上传失败`)
      }
    }

    setUploading(false)
    toast.success('成片上传完成')
    router.refresh()
  }

  return (
    <div>
      <div
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-400 transition-colors cursor-pointer mb-6"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          if (e.dataTransfer.files) handleUpload(e.dataTransfer.files)
        }}
      >
        <p className="text-4xl mb-3">✅</p>
        <p className="text-base font-semibold text-gray-700">上传最终成片</p>
        <p className="text-sm text-gray-400 mt-1">上传确认后的精修照片，支持批量上传</p>
        <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
          onChange={(e) => e.target.files && handleUpload(e.target.files)} disabled={uploading} />
      </div>

      {uploading && Object.keys(progress).length > 0 && (
        <div className="mb-6 space-y-2">
          {Object.entries(progress).map(([name, pct]) => (
            <div key={name} className="flex items-center gap-3">
              <span className="text-sm w-40 truncate">{name}</span>
              <div className="flex-1 h-2 bg-gray-200 rounded">
                <div className={`h-full rounded transition-all ${pct < 0 ? 'bg-red-500 w-full' : 'bg-green-500'}`}
                  style={{ width: pct < 0 ? '100%' : `${pct}%` }} />
              </div>
              <span className="text-xs w-16 text-right">{pct < 0 ? '失败' : `${pct}%`}</span>
            </div>
          ))}
        </div>
      )}

      {existingFiles.length > 0 ? (
        <div className="grid grid-cols-4 gap-4">
          {existingFiles.map((f) => (
            <ThumbCard
              key={f.id}
              fileId={f.id}
              fileName={f.fileName}
              fileSize={f.fileSize}
              ringColor="hover:ring-green-400"
              onClick={() => setPreviewFile(f)}
            />
          ))}
        </div>
      ) : (
        !uploading && <p className="text-center text-gray-400 py-8">暂无成片</p>
      )}

      {previewFile && (
        <ImagePreview file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  )
}
