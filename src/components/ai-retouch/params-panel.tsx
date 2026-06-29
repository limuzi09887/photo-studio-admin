'use client'

import { Button } from '@/components/ui/button'

interface ParamsPanelProps {
  onSubmit: (params: Record<string, string>) => void
  disabled?: boolean
  bgColor: string
  onBgColorChange: (bgColor: string) => void
}

const BG_OPTIONS = [
  { value: 'white', label: '白底', desc: '证件照/签证' },
  { value: 'blue', label: '蓝底', desc: '护照/驾照' },
  { value: 'red', label: '红底', desc: '结婚照/入党' },
  { value: 'keep', label: '保留原背景', desc: '不换背景' },
]

/**
 * AI 修图参数面板
 *
 * 店员选择目标背景色 → 点击「AI一键优化」→ AI 自动完成美颜+白底分割+方向校正。
 * 固定 AI 参数（磨皮0.35/美白0.25/锐化0.30）无需手动调整。
 */
export function ParamsPanel({ onSubmit, disabled, bgColor, onBgColorChange }: ParamsPanelProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ bgColor })
  }

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-5 mb-5 border border-indigo-100">
      {/* 背景色选择 */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">选择背景色</h4>
        <div className="flex gap-2">
          {BG_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => onBgColorChange(opt.value)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all border-2 ${
                bgColor === opt.value
                  ? 'border-indigo-500 bg-white shadow-sm'
                  : 'border-transparent bg-white/60 text-gray-500 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold">{opt.label}</div>
              <div className="text-[10px] text-gray-400">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* AI一键优化按钮 + 说明 */}
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <Button
            type="button"
            disabled={disabled}
            onClick={handleSubmit}
            size="lg"
            className="bg-indigo-500 hover:bg-indigo-600 text-base px-6 h-auto py-4"
          >
            <span className="text-xl mr-2">🤖</span>
            AI 一键优化
          </Button>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 leading-relaxed">
            AI 将自动完成：<strong>智能美颜</strong>（磨皮+美白+锐化）
            + <strong>{BG_OPTIONS.find(o => o.value === bgColor)?.label}背景</strong>
            + <strong>方向校正</strong>。
          </p>
          <p className="text-xs text-gray-400 mt-1">
            AI 初修后请放入 Photoshop 进行二次精修。
          </p>
        </div>
      </div>
    </div>
  )
}
