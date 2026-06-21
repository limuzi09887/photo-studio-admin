import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

async function updateCustomer(formData: FormData) {
  'use server'
  const orderId = formData.get('orderId') as string
  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const email = formData.get('email') as string
  const remark = formData.get('remark') as string

  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) notFound()

  await prisma.customer.update({
    where: { id: order.customerId },
    data: { name, phone, email, remark },
  })

  redirect(`/orders/${orderId}/customer`)
}

export default async function CustomerInfoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: { customer: true },
  })
  if (!order) notFound()
  const c = order.customer

  return (
    <div className="bg-white rounded-2xl p-7 border border-gray-100">
      <h3 className="text-lg font-bold mb-5">客户信息</h3>
      <form action={updateCustomer} className="space-y-4 max-w-xl">
        <input type="hidden" name="orderId" value={id} />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">客户姓名</Label>
            <Input id="name" name="name" defaultValue={c.name} required />
          </div>
          <div>
            <Label htmlFor="phone">手机号</Label>
            <Input id="phone" name="phone" defaultValue={c.phone} required />
          </div>
        </div>
        <div>
          <Label htmlFor="email">邮箱</Label>
          <Input id="email" name="email" type="email" defaultValue={c.email} />
        </div>
        <div>
          <Label htmlFor="remark">备注</Label>
          <Textarea id="remark" name="remark" defaultValue={c.remark} rows={3} />
        </div>
        <Button type="submit" className="bg-indigo-500 hover:bg-indigo-600">保存修改</Button>
      </form>
    </div>
  )
}
