import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (!from || !to) {
    return NextResponse.json({ error: '缺少日期参数' }, { status: 400 })
  }

  const fromDate = new Date(from)
  const toDate = new Date(to)
  toDate.setHours(23, 59, 59, 999)

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: fromDate, lte: toDate } },
    orderBy: { createdAt: 'asc' },
    include: { customer: true },
  })

  // Build CSV
  const BOM = '﻿'
  const header = '订单号,客户姓名,手机号,拍摄类型,金额,状态,创建时间,拍摄时间'
  const rows = orders.map((o) => {
    const createdAt = o.createdAt.toISOString().slice(0, 19).replace('T', ' ')
    const shootTime = o.shootTime
      ? o.shootTime.toISOString().slice(0, 19).replace('T', ' ')
      : ''
    return [
      o.orderNo,
      o.customer.name,
      o.customer.phone,
      o.shootType,
      Number(o.amount) || 0,
      o.status,
      createdAt,
      shootTime,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  })

  const csv = BOM + header + '\n' + rows.join('\n')

  const filename = `报表_${from}_至_${to}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  })
}
