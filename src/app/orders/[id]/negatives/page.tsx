import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PhotoGrid } from '@/components/orders/photo-grid'

export default async function NegativesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [order, files] = await Promise.all([
    prisma.order.findUnique({ where: { id } }),
    prisma.orderFile.findMany({
      where: { orderId: id, fileType: 'AI_RESULT' },
      orderBy: { createdAt: 'desc' },
    }),
  ])
  if (!order) notFound()

  return (
    <div className="bg-white rounded-2xl p-7 border border-gray-100">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold">修图底片</h3>
        <Link href={`/orders/${id}/ai-retouch`}>
          <Button className="bg-indigo-500 hover:bg-indigo-600 text-sm">再次修图</Button>
        </Link>
      </div>
      <PhotoGrid showDelete files={files.map(f => ({ id: f.id, fileName: f.fileName, fileSize: f.fileSize }))} />
    </div>
  )
}
