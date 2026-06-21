import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string
  sub?: string
  trend?: 'up' | 'down'
  trendText?: string
}

export function StatCard({ label, value, sub, trend, trendText }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <p className="text-sm text-gray-400">{label}</p>
      <h3 className="text-2xl font-bold mt-2 text-gray-900">{value}</h3>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      {trendText && (
        <p className={cn('text-xs mt-1', trend === 'up' ? 'text-green-500' : 'text-red-500')}>
          {trend === 'up' ? '↑' : '↓'} {trendText}
        </p>
      )}
    </div>
  )
}
