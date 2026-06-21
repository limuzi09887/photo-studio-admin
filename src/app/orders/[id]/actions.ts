'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function cancelOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw new Error('订单不存在')
  if (order.status === '已取消') throw new Error('订单已取消')
  if (order.status === '已完成') throw new Error('已完成的订单无法取消')

  await prisma.order.update({
    where: { id: orderId },
    data: { status: '已取消' },
  })

  revalidatePath(`/orders/${orderId}`)
  return { success: true }
}
