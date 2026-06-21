'use server'

import { prisma } from '@/lib/db'
import { generateOrderNo } from '@/lib/utils'
import { redirect } from 'next/navigation'

export async function createOrder(formData: FormData) {
  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const email = formData.get('email') as string
  const shootType = formData.get('shootType') as string
  const amount = formData.get('amount') as string
  const appointmentTime = formData.get('appointmentTime') as string

  if (!name || !phone || !email || !shootType) {
    throw new Error('请填写所有必填字段')
  }

  const orderNo = generateOrderNo()

  // Upsert: create customer if phone not exists, otherwise update name/email
  let customer = await prisma.customer.findUnique({ where: { phone } })
  if (customer) {
    customer = await prisma.customer.update({
      where: { phone },
      data: { name, email },
    })
  } else {
    customer = await prisma.customer.create({
      data: { name, phone, email },
    })
  }

  await prisma.order.create({
    data: {
      orderNo,
      customerId: customer.id,
      shootType,
      amount: amount ? parseFloat(amount) : null,
      appointmentTime: appointmentTime ? new Date(appointmentTime) : null,
    },
  })

  redirect('/orders')
}
