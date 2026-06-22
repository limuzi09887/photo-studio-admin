import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { oss, OSS_BUCKET, getPublicUrl } from '@/lib/r2'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const orderId = formData.get('orderId') as string | null
    const fileType = (formData.get('fileType') as string) || 'ORIGINAL'

    if (!file || !orderId) {
      return NextResponse.json({ error: '缺少文件或订单ID' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const key = `${orderId}/original/${Date.now()}_${file.name}`

    // Upload directly to OSS (server-side, no CORS issues)
    await oss.send(new PutObjectCommand({
      Bucket: OSS_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }))

    // Save file record
    const record = await prisma.orderFile.create({
      data: {
        orderId,
        fileName: file.name,
        fileUrl: getPublicUrl(key),
        fileSize: BigInt(file.size),
        fileType: fileType as 'ORIGINAL' | 'AI_RESULT' | 'FINAL',
      },
    })

    // Update order shootTime on first upload
    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (order && !order.shootTime && fileType === 'ORIGINAL') {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          shootTime: new Date(),
          status: order.status === '已创建' ? '已拍摄' : undefined,
        },
      })
    }

    return NextResponse.json({ success: true, fileId: record.id, fileUrl: getPublicUrl(key) })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: '上传失败' }, { status: 500 })
  }
}
