import { prisma } from '@/lib/db'
import { PhotosClient } from './photos-client'

export const dynamic = 'force-dynamic'

export default async function PhotosPage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayFilter = { gte: today, lt: tomorrow }

  const [originals, aiResults, finals] = await Promise.all([
    prisma.orderFile.findMany({
      where: { fileType: 'ORIGINAL', createdAt: todayFilter },
      orderBy: { createdAt: 'desc' },
      include: { order: { select: { orderNo: true } } },
    }),
    prisma.orderFile.findMany({
      where: { fileType: 'AI_RESULT', createdAt: todayFilter },
      orderBy: { createdAt: 'desc' },
      include: { order: { select: { orderNo: true } } },
    }),
    prisma.orderFile.findMany({
      where: { fileType: 'FINAL', createdAt: todayFilter },
      orderBy: { createdAt: 'desc' },
      include: { order: { select: { orderNo: true } } },
    }),
  ])

  const tabs = [
    { key: 'originals', label: '📷 今日原片', count: originals.length, files: originals },
    { key: 'aiResults', label: '✨ 今日成片', count: aiResults.length, files: aiResults },
    { key: 'finals', label: '📋 今日底片', count: finals.length, files: finals },
  ]

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">照片</h2>
        <p className="text-sm text-gray-400 mt-1">今日拍摄照片 · {today.toLocaleDateString('zh-CN')}</p>
      </div>
      <PhotosClient tabs={tabs} />
    </div>
  )
}
