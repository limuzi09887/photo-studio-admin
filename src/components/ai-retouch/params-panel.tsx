'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useState } from 'react'

interface ParamsPanelProps {
  onSubmit: (params: Record<string, string>) => void
  onReset: () => void
  disabled?: boolean
}

export function ParamsPanel({ onSubmit, onReset, disabled }: ParamsPanelProps) {
  const [bgColor, setBgColor] = useState('#FFFFFF')
  const [clarity, setClarity] = useState('标准增强')
  const [brightness, setBrightness] = useState('自动优化')
  const [skinSmooth, setSkinSmooth] = useState('标准磨皮')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ bgColor, clarity, brightness, skinSmooth })
  }

  return (
    <div className="bg-gray-50 rounded-xl p-4 mb-5">
      <h4 className="text-sm font-semibold mb-3">🎛️ 修图参数设置</h4>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">背景色</Label>
            <Select value={bgColor} onValueChange={setBgColor}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="#FFFFFF">白色</SelectItem>
                <SelectItem value="#438EDB">蓝色</SelectItem>
                <SelectItem value="#CC0000">红色</SelectItem>
                <SelectItem value="#D3D3D3">灰色</SelectItem>
                <SelectItem value="keep">保持原背景</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">人物清晰度</Label>
            <Select value={clarity} onValueChange={setClarity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="标准增强">标准增强</SelectItem>
                <SelectItem value="轻度增强">轻度增强</SelectItem>
                <SelectItem value="高度增强">高度增强</SelectItem>
                <SelectItem value="不处理">不处理</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">整体亮度</Label>
            <Select value={brightness} onValueChange={setBrightness}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="自动优化">自动优化</SelectItem>
                <SelectItem value="调亮+0.5">调亮 +0.5</SelectItem>
                <SelectItem value="调亮+1.0">调亮 +1.0</SelectItem>
                <SelectItem value="keep">保持原亮度</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">肤色匀称</Label>
            <Select value={skinSmooth} onValueChange={setSkinSmooth}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="标准磨皮">标准磨皮</SelectItem>
                <SelectItem value="轻度磨皮">轻度磨皮</SelectItem>
                <SelectItem value="深度磨皮">深度磨皮</SelectItem>
                <SelectItem value="none">不处理</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-3">
          <Button type="submit" disabled={disabled} className="bg-indigo-500 hover:bg-indigo-600 text-sm">
            🚀 提交修图任务
          </Button>
          <Button type="button" variant="outline" onClick={() => { setBgColor('#FFFFFF'); setClarity('标准增强'); setBrightness('自动优化'); setSkinSmooth('标准磨皮'); onReset() }} className="text-sm">重置参数</Button>
        </div>
      </form>
    </div>
  )
}
