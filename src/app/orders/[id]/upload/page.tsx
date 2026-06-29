import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { getSignedImageUrl } from '@/lib/r2'
import { UploadClient } from './upload-client'

export default async function UploadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [order, files] = await Promise.all([
    prisma.order.findUnique({ where: { id } }),
    prisma.orderFile.findMany({
      where: { orderId: id, fileType: 'ORIGINAL' },
      orderBy: { createdAt: 'desc' },
    }),
  ])
  if (!order) notFound()

  return (
    <div className="bg-white rounded-2xl p-7 border border-gray-100">
      <h3 className="text-lg font-bold mb-5">原图上传</h3>
      <UploadClient orderId={id} existingFiles={files.map(f => ({
        id: f.id,
        fileName: f.fileName,
        fileUrl: f.fileUrl,
        fileSize: Number(f.fileSize),
        srcUrl: getSignedImageUrl(f.fileUrl, 400), // 400px 缩略图
      }))} />
    </div>
  )
}
