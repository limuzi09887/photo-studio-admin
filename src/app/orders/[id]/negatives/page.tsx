import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatFileSize } from '@/lib/utils'

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
          <Button className="bg-indigo-500 hover:bg-indigo-600 text-sm">
            再次修图
          </Button>
        </Link>
      </div>

      {files.length === 0 ? (
        <p className="text-center text-gray-400 py-12">暂无修图底片</p>
      ) : (
        <div className="grid grid-cols-5 gap-3">
          {files.map((f) => (
            <div key={f.id} className="bg-gray-50 rounded-lg p-2 text-center">
              <div className="h-24 bg-gray-200 rounded flex items-center justify-center overflow-hidden mb-1">
                <img
                  src={f.fileUrl}
                  alt={f.fileName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <p className="text-xs mt-1 truncate" title={f.fileName}>
                {f.fileName}
              </p>
              <p className="text-[10px] text-gray-400">
                {formatFileSize(Number(f.fileSize))}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
