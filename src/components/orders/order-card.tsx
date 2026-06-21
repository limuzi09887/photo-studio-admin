import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ProgressBar } from './progress-bar'
import { formatDateTime, maskPhone } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  '已创建': 'bg-indigo-100 text-indigo-700',
  '已拍摄': 'bg-blue-100 text-blue-700',
  '一类修片中': 'bg-amber-100 text-amber-700',
  '待精修': 'bg-orange-100 text-orange-700',
  '待客户确认': 'bg-purple-100 text-purple-700',
  '待发送': 'bg-yellow-100 text-yellow-700',
  '已完成': 'bg-emerald-100 text-emerald-700',
  '已取消': 'bg-red-100 text-red-700',
  '发送失败': 'bg-red-100 text-red-700',
}

interface OrderCardProps {
  order: {
    id: string
    orderNo: string
    status: string
    shootType: string
    appointmentTime: Date | null
    shootTime: Date | null
    createdAt: Date
    customer: { name: string; phone: string }
  }
}

export function OrderCard({ order }: OrderCardProps) {
  return (
    <Link href={`/orders/${order.id}`}
      className="block bg-white rounded-2xl p-6 border border-gray-100 hover:border-indigo-200 hover:shadow-sm transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400">创建时间：{formatDateTime(order.createdAt)}</span>
          <span className="text-gray-200">|</span>
          <span className="text-xs text-gray-400">拍摄时间：{order.shootTime ? formatDateTime(order.shootTime) : '-'}</span>
        </div>
        <Badge className={STATUS_COLORS[order.status] || 'bg-gray-100'} variant="secondary">{order.status}</Badge>
      </div>

      <div className="flex items-center gap-6">
        <div className="min-w-[140px]">
          <p className="text-sm text-gray-400">订单号</p>
          <p className="text-base font-bold text-gray-900">{order.orderNo}</p>
        </div>
        <div className="min-w-[100px]">
          <p className="text-sm text-gray-400">客户</p>
          <p className="text-base font-semibold text-gray-900">{order.customer.name}</p>
        </div>
        <div className="min-w-[140px]">
          <p className="text-sm text-gray-400">手机号</p>
          <p className="text-base text-gray-700">{maskPhone(order.customer.phone)}</p>
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-400">客户服务</p>
          <p className="text-base font-semibold text-indigo-500">📸 {order.shootType}</p>
        </div>
        <span className="text-sm text-indigo-500 font-semibold whitespace-nowrap">查看详情 →</span>
      </div>

      <ProgressBar status={order.status} />
    </Link>
  )
}
