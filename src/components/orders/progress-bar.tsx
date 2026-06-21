import { cn } from '@/lib/utils'
import type { ProgressStep } from '@/types'

const STEPS: { step: ProgressStep; label: string }[] = [
  { step: 1, label: '已拍摄原片' },
  { step: 2, label: '后期修片已完成' },
  { step: 3, label: '顾客可下载' },
  { step: 4, label: '订单结束' },
]

function getCurrentStep(status: string): ProgressStep {
  const map: Record<string, ProgressStep> = {
    '已创建': 1, '已拍摄': 1,
    '一类修片中': 2, '待精修': 2,
    '待客户确认': 3, '待发送': 3,
    '已完成': 4,
  }
  return map[status] || 1
}

export function ProgressBar({ status }: { status: string }) {
  const current = getCurrentStep(status)

  return (
    <div className="flex items-center gap-0 mt-4">
      {STEPS.map((s, i) => {
        const isDone = s.step <= current
        const isLast = i === STEPS.length - 1
        return (
          <div key={s.step} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-1.5">
              <div className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                isDone ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-400'
              )}>
                {isDone ? '✓' : s.step}
              </div>
              <span className={cn(
                'text-xs font-semibold whitespace-nowrap',
                isDone ? 'text-indigo-500' : 'text-gray-400'
              )}>
                {s.label}
              </span>
            </div>
            {!isLast && (
              <div className={cn(
                'flex-1 h-0.5 mx-3 rounded',
                s.step < current ? 'bg-indigo-500' : 'bg-gray-200'
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}
