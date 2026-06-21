import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { ProgressBar } from '@/components/orders/progress-bar'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'

export default async function OrderSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: { customer: true },
  })
  if (!order) notFound()

  return (
    <div className="bg-white rounded-2xl p-7 border border-gray-100">
      <h3 className="text-lg font-bold mb-5">订单摘要</h3>

      <div className="bg-gray-50 rounded-xl p-5 mb-6">
        <ProgressBar status={order.status} />
      </div>

      <div className="grid grid-cols-2 gap-5 mb-6">
        <InfoBox label="订单号" value={order.orderNo} />
        <InfoBox label="订单状态" value={<Badge variant="secondary">{order.status}</Badge>} />
        <InfoBox label="创建时间" value={formatDateTime(order.createdAt)} />
        <InfoBox label="拍摄时间" value={order.shootTime ? formatDateTime(order.shootTime) : '-'} />
      </div>

      <h4 className="text-base font-semibold mb-4">客户信息</h4>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <InfoBox label="客户姓名" value={order.customer.name} />
        <InfoBox label="手机号" value={order.customer.phone} />
        <InfoBox label="邮箱" value={order.customer.email || '-'} />
        <InfoBox label="客户服务" value={`📸 ${order.shootType}`} />
      </div>

      <h4 className="text-base font-semibold mb-4">原图与修图概览</h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400 mb-2">原图</p>
          <div className="bg-gray-200 rounded-lg h-[120px] flex items-center justify-center text-sm text-gray-500">
            📷 原图预览
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400 mb-2">一类修片结果</p>
          <div className="bg-gray-200 rounded-lg h-[120px] flex items-center justify-center text-sm text-gray-500">
            🖼️ 修图预览
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoBox({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <div className="text-base font-semibold">{value}</div>
    </div>
  )
}
