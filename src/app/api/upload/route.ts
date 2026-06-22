import { NextRequest, NextResponse } from 'next/server'
import { oss, getPublicUrl } from '@/lib/r2'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // Step 1: Parse request
  let formData: FormData
  try {
    formData = await request.formData()
  } catch (e) {
    return NextResponse.json({ error: `表单解析失败: ${e instanceof Error ? e.message : e}` }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const orderId = formData.get('orderId') as string | null
  const fileType = (formData.get('fileType') as string) || 'ORIGINAL'

  if (!file || !orderId) {
    return NextResponse.json({ error: `缺少参数: file=${!!file} orderId=${!!orderId}` }, { status: 400 })
  }

  // Step 2: Read file buffer
  let buffer: Buffer
  try {
    buffer = Buffer.from(await file.arrayBuffer())
  } catch (e) {
    return NextResponse.json({ error: `文件读取失败: ${e instanceof Error ? e.message : e}` }, { status: 500 })
  }

  // Step 3: Upload to OSS using official SDK
  const key = `${orderId}/original/${Date.now()}_${file.name}`
  try {
    await oss.put(key, buffer, {
      mime: file.type || 'image/jpeg',
    })
  } catch (e) {
    return NextResponse.json({ error: `OSS上传失败: ${e instanceof Error ? e.message : e}` }, { status: 500 })
  }

  // Step 4: Save to database
  try {
    const record = await prisma.orderFile.create({
      data: {
        orderId,
        fileName: file.name,
        fileUrl: getPublicUrl(key),
        fileSize: BigInt(file.size),
        fileType: fileType as 'ORIGINAL' | 'AI_RESULT' | 'FINAL',
      },
    })

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
  } catch (e) {
    return NextResponse.json({ error: `数据库写入失败: ${e instanceof Error ? e.message : e}` }, { status: 500 })
  }
}
