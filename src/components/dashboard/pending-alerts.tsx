import { prisma } from '@/lib/db'

export async function PendingAlerts() {
  const [aiPending, emailPending, overdue] = await Promise.all([
    prisma.order.count({ where: { status: '一类修片中' } }),
    prisma.order.count({ where: { status: '待发送' } }),
    prisma.order.count({
      where: {
        status: { notIn: ['已完成', '已取消'] },
        createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ])

  const alerts = [
    { icon: '🖼️', label: '待一类修片', count: aiPending, color: 'bg-amber-50 border-amber-200 text-amber-700' },
    { icon: '📧', label: '待邮件发送', count: emailPending, color: 'bg-amber-50 border-amber-200 text-amber-700' },
    ...(overdue > 0 ? [{ icon: '⚠️', label: '超时未交付', count: overdue, color: 'bg-red-50 border-red-200 text-red-600' }] : []),
  ]

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <h3 className="text-base font-semibold mb-4">{'⏳'} 待处理</h3>
      <div className="flex flex-col gap-3">
        {alerts.map((a, i) => (
          <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${a.color}`}>
            <span className="text-sm">{a.icon} {a.label}</span>
            <span className="text-lg font-bold">{a.count} 单</span>
          </div>
        ))}
        {alerts.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">暂无待处理事项 {'🎉'}</p>
        )}
      </div>
    </div>
  )
}
