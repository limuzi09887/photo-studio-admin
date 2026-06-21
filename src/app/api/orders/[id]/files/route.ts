import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getPublicUrl } from '@/lib/r2'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { key, fileName, fileSize, fileType } = body

  const file = await prisma.orderFile.create({
    data: {
      orderId: id,
      fileName,
      fileUrl: getPublicUrl(key),
      fileSize: BigInt(fileSize),
      fileType,
    },
  })

  // Update shootTime if first upload
  const order = await prisma.order.findUnique({ where: { id } })
  if (order && !order.shootTime && fileType === 'ORIGINAL') {
    await prisma.order.update({
      where: { id },
      data: {
        shootTime: new Date(),
        status: order.status === '已创建' ? '已拍摄' : undefined,
      },
    })
  }

  return NextResponse.json({ success: true, fileId: file.id })
}
