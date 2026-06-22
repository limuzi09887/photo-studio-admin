import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface BeforeAfterProps {
  original: { name: string; url: string }
  retouched: {
    name: string
    url?: string
    status: '待处理' | '处理中' | '完成' | '失败'
    errorMessage?: string
    processingTime?: number
  }
  onRetry?: () => void
  onConfirm?: () => void
}

export function BeforeAfter({ original, retouched, onRetry, onConfirm }: BeforeAfterProps) {
  const statusConfig = {
    '待处理': { color: 'bg-gray-100 text-gray-500', label: '待处理' },
    '处理中': { color: 'bg-amber-100 text-amber-600', label: '处理中' },
    '完成': { color: 'bg-emerald-100 text-emerald-600', label: '完成' },
    '失败': { color: 'bg-red-100 text-red-600', label: '失败' },
  }
  const config = statusConfig[retouched.status]

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-100 px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs font-semibold">原图 · {original.name}</span>
        </div>
        <div className="h-[180px] bg-gray-200 flex items-center justify-center">
          <img src={original.url} alt="原图" className="h-full w-full object-cover" />
        </div>
      </div>
      <div className={`border-2 rounded-xl overflow-hidden ${retouched.status === '完成' ? 'border-indigo-500' : 'border-gray-200'}`}>
        <div className="bg-gray-50 px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs font-semibold">一类修片 · {retouched.name}</span>
          <Badge className={config.color} variant="secondary">{config.label}</Badge>
        </div>
        <div className="h-[180px] flex items-center justify-center"
          style={{ background: retouched.status === '处理中' ? '#fffbeb' : retouched.status === '失败' ? '#fef2f2' : '#fafafe' }}
        >
          {retouched.status === '处理中' && (
            <div className="text-center">
              <div className="w-8 h-8 border-3 border-gray-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-2" />
              <span className="text-xs text-amber-600">AI 处理中...</span>
            </div>
          )}
          {retouched.status === '失败' && (
            <div className="text-center">
              <span className="text-2xl">⚠️</span>
              <p className="text-xs text-red-500 mt-1">{retouched.errorMessage || '处理失败'}</p>
              {onRetry && <Button variant="outline" size="sm" onClick={onRetry} className="mt-2 text-xs">重新修图</Button>}
            </div>
          )}
          {retouched.status === '完成' && retouched.url && (
            <img src={retouched.url} alt="修图结果" className="h-full w-full object-cover" />
          )}
          {retouched.status === '待处理' && <span className="text-gray-400 text-sm">等待处理</span>}
        </div>
        {retouched.status === '完成' && (
          <div className="px-4 py-2.5 bg-gray-50 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">🕐 处理耗时 {retouched.processingTime || '--'}秒</span>
            <div className="flex gap-2">
              <a href={retouched.url} download={retouched.name} className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors">⬇ 下载</a>
              {onConfirm && <Button size="sm" onClick={onConfirm} className="bg-indigo-500 hover:bg-indigo-600 text-xs">✅ 确认</Button>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
