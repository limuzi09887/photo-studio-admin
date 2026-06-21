import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { FinalsClient } from './finals-client'
import { formatFileSize } from '@/lib/utils'

export default async function FinalsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [order, files] = await Promise.all([
    prisma.order.findUnique({ where: { id } }),
    prisma.orderFile.findMany({
      where: { orderId: id, fileType: 'FINAL' },
      orderBy: { createdAt: 'desc' },
    }),
  ])
  if (!order) notFound()

  return (
    <div className="bg-white rounded-2xl p-7 border border-gray-100">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold">成片管理</h3>
        <span className="text-sm text-gray-400">
          共 {files.length} 张成片
        </span>
      </div>

      <FinalsClient
        orderId={id}
        existingFiles={files.map((f) => ({
          id: f.id,
          fileName: f.fileName,
          fileUrl: f.fileUrl,
          fileSize: Number(f.fileSize),
        }))}
      />
    </div>
  )
}
