'use client'

import { useState } from 'react'
import { createOrder } from './actions'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

const SHOOT_TYPES = ['1寸', '2寸', '签证照', '身份证', '商务半身照', '婚纱照', '艺术写真', '全家福']

export function NewOrderForm() {
  const [shootType, setShootType] = useState('')

  async function handleSubmit(formData: FormData) {
    formData.set('shootType', shootType)
    await createOrder(formData)
  }

  return (
    <div className="bg-white rounded-2xl p-8 border border-gray-100 max-w-2xl">
      <form action={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">客户姓名 *</Label>
            <Input id="name" name="name" required placeholder="请输入客户姓名" />
          </div>
          <div>
            <Label htmlFor="phone">手机号 *</Label>
            <Input id="phone" name="phone" required placeholder="请输入手机号" />
          </div>
        </div>

        <div>
          <Label htmlFor="email">邮箱 *</Label>
          <Input id="email" name="email" type="email" required placeholder="用于接收成片" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="shootType">拍摄类型 *</Label>
            <input type="hidden" name="shootType" value={shootType} />
            <Select required value={shootType} onValueChange={setShootType}>
              <SelectTrigger><SelectValue placeholder="请选择拍摄类型" /></SelectTrigger>
              <SelectContent>
                {SHOOT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="amount">订单金额</Label>
            <Input id="amount" name="amount" type="number" step="0.01" placeholder="选填" />
          </div>
        </div>

        <div>
          <Label htmlFor="appointmentTime">拍摄日期</Label>
          <Input id="appointmentTime" name="appointmentTime" type="datetime-local" />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" className="bg-indigo-500 hover:bg-indigo-600">创建订单</Button>
          <Link href="/orders">
            <Button type="button" variant="outline">取消</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
