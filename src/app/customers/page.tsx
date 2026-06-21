import { prisma } from '@/lib/db'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    include: {
      orders: { select: { id: true, amount: true, createdAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">客资</h2>
        <p className="text-sm text-gray-400 mt-1">客户资料管理 · 共 {customers.length} 位客户</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-5 py-3.5 text-xs font-semibold text-gray-500">客户姓名</th>
              <th className="px-5 py-3.5 text-xs font-semibold text-gray-500">手机号</th>
              <th className="px-5 py-3.5 text-xs font-semibold text-gray-500">邮箱</th>
              <th className="px-5 py-3.5 text-xs font-semibold text-gray-500">历史订单</th>
              <th className="px-5 py-3.5 text-xs font-semibold text-gray-500">累计消费</th>
              <th className="px-5 py-3.5 text-xs font-semibold text-gray-500">最近拍摄</th>
              <th className="px-5 py-3.5 text-xs font-semibold text-gray-500">备注</th>
              <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 text-center w-20">操作</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => {
              const totalSpent = c.orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0)
              const lastOrder = c.orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
              return (
                <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 text-sm font-semibold">{c.name}</td>
                  <td className="px-5 py-4 text-sm">{c.phone}</td>
                  <td className="px-5 py-4 text-sm text-indigo-500">{c.email || '-'}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-indigo-500">{c.orders.length} 单</td>
                  <td className="px-5 py-4 text-sm font-semibold">{formatCurrency(totalSpent)}</td>
                  <td className="px-5 py-4 text-sm text-gray-400">{lastOrder ? new Intl.DateTimeFormat('zh-CN').format(lastOrder.createdAt) : '-'}</td>
                  <td className="px-5 py-4 text-sm text-gray-400 max-w-[120px] truncate">{c.remark || '-'}</td>
                  <td className="px-5 py-4 text-center">
                    <Link href={`/orders?query=${c.phone}`} className="text-sm text-indigo-500 hover:underline">查看订单</Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
