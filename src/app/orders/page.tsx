import { prisma } from '@/lib/db'
import { OrderCard } from '@/components/orders/order-card'
import { OrderSearch } from '@/components/orders/order-search'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; type?: string; status?: string }>
}) {
  const params = await searchParams
  const where: Prisma.OrderWhereInput = {}

  if (params.query) {
    where.OR = [
      { orderNo: { contains: params.query } },
      { customer: { phone: { contains: params.query } } },
      { customer: { name: { contains: params.query } } },
    ]
  }
  if (params.type && params.type !== 'all') {
    where.shootType = params.type
  }
  if (params.status && params.status !== 'all') {
    where.status = params.status
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { customer: true },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">订单管理</h2>
          <p className="text-sm text-gray-400 mt-1">共 {orders.length} 单</p>
        </div>
        <Link href="/orders/new">
          <Button className="bg-indigo-500 hover:bg-indigo-600 rounded-lg px-6 py-2.5 text-sm font-semibold">
            ➕ 新建订单
          </Button>
        </Link>
      </div>

      <OrderSearch />

      <div className="flex flex-col gap-4">
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} />
        ))}
        {orders.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-2">📭</p>
            <p>暂无订单</p>
          </div>
        )}
      </div>
    </div>
  )
}
