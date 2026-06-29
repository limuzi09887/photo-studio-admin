import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { getSignedImageUrl } from '@/lib/r2'
import { AiRetouchClient } from './client'

export default async function AiRetouchPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [order, originalFiles, aiFiles] = await Promise.all([
    prisma.order.findUnique({ where: { id } }),
    prisma.orderFile.findMany({ where: { orderId: id, fileType: 'ORIGINAL' } }),
    prisma.orderFile.findMany({ where: { orderId: id, fileType: 'AI_RESULT' } }),
  ])
  if (!order) notFound()

  return <AiRetouchClient orderId={id} status={order.status}
    originalFiles={originalFiles.map(f => ({
      id: f.id,
      name: f.fileName,
      url: getSignedImageUrl(f.fileUrl, 600),
    }))}
    aiFiles={aiFiles.map(f => ({
      id: f.id,
      name: f.fileName,
      url: getSignedImageUrl(f.fileUrl, 600),
      params: f.aiParams as Record<string, string> | null,
    }))} />
}
