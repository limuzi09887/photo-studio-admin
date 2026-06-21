import { prisma } from '@/lib/db'
import { ReportsClient } from './reports-client'

export const dynamic = 'force-dynamic'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const params = await searchParams
  const from = params.from ? new Date(params.from) : new Date(new Date().setDate(1))
  const to = params.to ? new Date(params.to) : new Date()
  to.setHours(23, 59, 59, 999)

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: from, lte: to },
    },
    orderBy: { createdAt: 'asc' },
  })

  const totalAmount = orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0)
  const avgAmount = orders.length > 0 ? totalAmount / orders.length : 0

  // Group by date for chart
  const dailyData = orders.reduce(
    (acc: Record<string, { date: string; count: number; amount: number }>, o) => {
      const dateKey = o.createdAt.toISOString().slice(0, 10)
      if (!acc[dateKey]) acc[dateKey] = { date: dateKey, count: 0, amount: 0 }
      acc[dateKey].count++
      acc[dateKey].amount += Number(o.amount) || 0
      return acc
    },
    {},
  )

  // Group by shootType
  const typeData = orders.reduce(
    (acc: Record<string, number>, o) => {
      acc[o.shootType] = (acc[o.shootType] || 0) + 1
      return acc
    },
    {},
  )

  return (
    <ReportsClient
      orders={JSON.parse(JSON.stringify(orders))}
      totalAmount={totalAmount}
      avgAmount={avgAmount}
      dailyData={Object.values(dailyData)}
      typeData={Object.entries(typeData).map(([name, value]) => ({ name, value }))}
      from={from.toISOString().slice(0, 10)}
      to={params.to || new Date().toISOString().slice(0, 10)}
    />
  )
}
