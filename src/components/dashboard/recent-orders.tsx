import { prisma } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  '已创建': 'bg-indigo-100 text-indigo-700',
  '已拍摄': 'bg-blue-100 text-blue-700',
  '一类修片中': 'bg-amber-100 text-amber-700',
  '待精修': 'bg-orange-100 text-orange-700',
  '待发送': 'bg-amber-100 text-amber-700',
  '已完成': 'bg-emerald-100 text-emerald-700',
}

export async function RecentOrders() {
  const orders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { customer: true },
  })

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <h3 className="text-base font-semibold mb-4">{'📋'} 最近订单</h3>
      <div className="flex flex-col gap-2">
        {orders.map((o) => (
          <Link key={o.id} href={`/orders/${o.id}`}
            className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
          >
            <div>
              <span className="text-sm font-semibold">{o.orderNo}</span>
              <br />
              <span className="text-xs text-gray-400">{o.customer.name} · {o.shootType}</span>
            </div>
            <Badge className={STATUS_COLORS[o.status] || 'bg-gray-100'} variant="secondary">
              {o.status}
            </Badge>
          </Link>
        ))}
        {orders.length === 0 && <p className="text-sm text-gray-400 text-center py-4">暂无订单</p>}
      </div>
    </div>
  )
}
