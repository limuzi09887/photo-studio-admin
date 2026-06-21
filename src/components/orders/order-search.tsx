'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

export function OrderSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleSearch(formData: FormData) {
    const params = new URLSearchParams()
    const query = formData.get('query') as string
    const type = formData.get('type') as string
    const status = formData.get('status') as string
    if (query) params.set('query', query)
    if (type && type !== 'all') params.set('type', type)
    if (status && status !== 'all') params.set('status', status)
    router.push(`/orders?${params.toString()}`)
  }

  return (
    <form action={handleSearch} className="flex gap-3 mb-6">
      <div className="flex-1">
        <Input name="query" placeholder="🔍 输入客户手机号或订单号查询" defaultValue={searchParams.get('query') || ''} />
      </div>
      <Select name="type" defaultValue={searchParams.get('type') || 'all'}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="全部类型" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部类型</SelectItem>
          <SelectItem value="1寸">1寸</SelectItem>
          <SelectItem value="2寸">2寸</SelectItem>
          <SelectItem value="签证照">签证照</SelectItem>
          <SelectItem value="身份证">身份证</SelectItem>
          <SelectItem value="商务半身照">商务半身照</SelectItem>
          <SelectItem value="婚纱照">婚纱照</SelectItem>
          <SelectItem value="艺术写真">艺术写真</SelectItem>
          <SelectItem value="全家福">全家福</SelectItem>
        </SelectContent>
      </Select>
      <Select name="status" defaultValue={searchParams.get('status') || 'all'}>
        <SelectTrigger className="w-[150px]"><SelectValue placeholder="全部状态" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部状态</SelectItem>
          <SelectItem value="已创建">已创建</SelectItem>
          <SelectItem value="已拍摄">已拍摄</SelectItem>
          <SelectItem value="一类修片中">一类修片中</SelectItem>
          <SelectItem value="待发送">待发送</SelectItem>
          <SelectItem value="已完成">已完成</SelectItem>
        </SelectContent>
      </Select>
      <Button type="submit">搜索</Button>
    </form>
  )
}
