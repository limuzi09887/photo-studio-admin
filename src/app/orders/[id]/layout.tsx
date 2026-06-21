import Link from 'next/link'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'

const SUB_NAV = [
  { href: '', label: '① 订单摘要' },
  { href: '/customer', label: '② 客户信息' },
  { href: '/billing', label: '③ 账单/收款' },
  { href: '/upload', label: '④ 原图上传' },
  { href: '/ai-retouch', label: '⑤ 一类修片' },
  { href: '/negatives', label: '⑥ 修图底片' },
  { href: '/finals', label: '⑦ 成片管理' },
  { href: '/email', label: '⑧ 邮件发送' },
]

export default async function OrderDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) notFound()

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <Link href="/orders" className="text-gray-400 text-sm hover:text-gray-600">← 订单管理</Link>
        <span className="text-gray-200">|</span>
        <h2 className="text-lg font-bold">订单详情</h2>
        <span className="text-gray-400 text-sm">{order.orderNo}</span>
      </div>

      <div className="flex gap-5">
        <nav className="w-[180px] flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden sticky top-4">
            {SUB_NAV.map((item) => (
              <Link key={item.href} href={`/orders/${id}${item.href}`}
                className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 border-l-3 border-transparent hover:border-indigo-500 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  )
}
