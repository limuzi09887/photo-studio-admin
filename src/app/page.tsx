import { prisma } from '@/lib/db'
import { StatCard } from '@/components/dashboard/stat-card'
import { PendingAlerts } from '@/components/dashboard/pending-alerts'
import { RecentOrders } from '@/components/dashboard/recent-orders'
import { formatCurrency, formatFileSize } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [todayOrders, todayAmount, todayOriginals, todayAiResults, todayFinals] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
    prisma.order.aggregate({
      _sum: { amount: true },
      where: { createdAt: { gte: today, lt: tomorrow } },
    }),
    prisma.orderFile.aggregate({
      _count: true,
      _sum: { fileSize: true },
      where: { fileType: 'ORIGINAL', createdAt: { gte: today, lt: tomorrow } },
    }),
    prisma.orderFile.aggregate({
      _count: true,
      _sum: { fileSize: true },
      where: { fileType: 'AI_RESULT', createdAt: { gte: today, lt: tomorrow } },
    }),
    prisma.orderFile.aggregate({
      _count: true,
      _sum: { fileSize: true },
      where: { fileType: 'FINAL', createdAt: { gte: today, lt: tomorrow } },
    }),
  ])

  const todayAmountValue = Number(todayAmount._sum.amount) || 0
  const originalCount = todayOriginals._count
  const originalSize = Number(todayOriginals._sum.fileSize) || 0
  const aiResultCount = todayAiResults._count
  const aiResultSize = Number(todayAiResults._sum.fileSize) || 0
  const finalCount = todayFinals._count
  const finalSize = Number(todayFinals._sum.fileSize) || 0

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">概览</h2>
        <p className="text-sm text-gray-400 mt-1">
          {today.toLocaleDateString('zh-CN')} · 今日经营数据总览
        </p>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-6">
        <StatCard label="今日订单金额" value={formatCurrency(todayAmountValue)} trend="up" trendText="vs 昨日" />
        <StatCard label="今日订单量" value={`${todayOrders} 单`} />
        <StatCard label="今日原片" value={`${originalCount} 张`} sub={`共 ${formatFileSize(originalSize)}`} />
        <StatCard label="今日成片" value={`${aiResultCount} 张`} sub={`共 ${formatFileSize(aiResultSize)}`} />
        <StatCard label="今日底片" value={`${finalCount} 张`} sub={`共 ${formatFileSize(finalSize)}`} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <PendingAlerts />
        <RecentOrders />
      </div>
    </div>
  )
}
