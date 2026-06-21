import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import type { PaymentMethod } from '@/types'

async function addProduct(formData: FormData) {
  'use server'
  const orderId = formData.get('orderId') as string
  const name = formData.get('name') as string
  const unitPrice = parseFloat(formData.get('unitPrice') as string)
  const quantity = parseInt(formData.get('quantity') as string)

  if (!name || !unitPrice || !quantity) return

  await prisma.orderProduct.create({
    data: {
      orderId,
      name,
      unitPrice,
      quantity,
      subtotal: unitPrice * quantity,
    },
  })

  redirect(`/orders/${orderId}/billing`)
}

async function addPayment(formData: FormData) {
  'use server'
  const orderId = formData.get('orderId') as string
  const amount = parseFloat(formData.get('amount') as string)
  const method = formData.get('method') as string

  if (!amount || !method) return

  await prisma.payment.create({
    data: {
      orderId,
      amount,
      method,
      type: '尾款',
    },
  })

  redirect(`/orders/${orderId}/billing`)
}

export default async function BillingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      products: { orderBy: { id: 'asc' } },
      payments: { orderBy: { paidAt: 'desc' } },
    },
  })
  if (!order) notFound()

  const products = order.products
  const payments = order.payments

  const totalAmount = products.reduce(
    (sum, p) => sum + Number(p.subtotal),
    0
  )
  const paidAmount = payments.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  )
  const unpaidAmount = totalAmount - paidAmount

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <p className="text-xs text-gray-400 mb-1">总金额</p>
          <p className="text-2xl font-bold text-gray-800">
            {formatCurrency(totalAmount)}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <p className="text-xs text-gray-400 mb-1">已支付</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(paidAmount)}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <p className="text-xs text-gray-400 mb-1">待支付</p>
          <p className="text-2xl font-bold text-red-500">
            {formatCurrency(unpaidAmount)}
          </p>
        </div>
      </div>

      {/* Product Table & Add Form */}
      <div className="bg-white rounded-2xl p-7 border border-gray-100">
        <h3 className="text-lg font-bold mb-5">产品明细</h3>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>产品名称</TableHead>
              <TableHead className="text-right">单价</TableHead>
              <TableHead className="text-right">数量</TableHead>
              <TableHead className="text-right">小计</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-400 py-6">
                  暂无产品记录
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Number(p.unitPrice))}
                  </TableCell>
                  <TableCell className="text-right">{p.quantity}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(Number(p.subtotal))}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <form action={addProduct} className="mt-5 flex items-end gap-3 border-t pt-5">
          <input type="hidden" name="orderId" value={id} />
          <div className="flex-1">
            <Label htmlFor="name">产品名称</Label>
            <Input id="name" name="name" placeholder="如: 精修套餐 A" required />
          </div>
          <div className="w-28">
            <Label htmlFor="unitPrice">单价</Label>
            <Input
              id="unitPrice"
              name="unitPrice"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              required
            />
          </div>
          <div className="w-20">
            <Label htmlFor="quantity">数量</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              defaultValue={1}
              required
            />
          </div>
          <Button type="submit" className="bg-indigo-500 hover:bg-indigo-600">
            添加
          </Button>
        </form>
      </div>

      {/* Payment Records & Add Form */}
      <div className="bg-white rounded-2xl p-7 border border-gray-100">
        <h3 className="text-lg font-bold mb-5">收款记录</h3>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>金额</TableHead>
              <TableHead>支付方式</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>收款时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-400 py-6">
                  暂无收款记录
                </TableCell>
              </TableRow>
            ) : (
              payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-semibold">
                    {formatCurrency(Number(p.amount))}
                  </TableCell>
                  <TableCell>{p.method}</TableCell>
                  <TableCell>{p.type}</TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {formatDateTime(p.paidAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <form action={addPayment} className="mt-5 flex items-end gap-3 border-t pt-5">
          <input type="hidden" name="orderId" value={id} />
          <div className="w-40">
            <Label htmlFor="amount">收款金额</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="金额"
              required
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="method">支付方式</Label>
            <Select name="method" defaultValue="微信支付">
              <SelectTrigger>
                <SelectValue placeholder="选择支付方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="微信支付">微信支付</SelectItem>
                <SelectItem value="支付宝">支付宝</SelectItem>
                <SelectItem value="现金">现金</SelectItem>
                <SelectItem value="银行转账">银行转账</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="bg-green-500 hover:bg-green-600">
            收尾款
          </Button>
        </form>
      </div>
    </div>
  )
}
