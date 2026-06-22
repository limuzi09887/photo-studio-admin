import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { oss, OSS_PUBLIC_URL } from '@/lib/r2'
import { processImage } from '@/lib/ai'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '请求体解析失败' }, { status: 400 })
  }

  const { originalFileId, params: retouchParams } = body as {
    originalFileId?: string
    params?: Record<string, string>
  }

  if (!originalFileId || !retouchParams) {
    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
  }

  try {
    const startTime = Date.now()

    // 1. Look up the original file in DB
    const originalFile = await prisma.orderFile.findUnique({
      where: { id: originalFileId },
    })
    if (!originalFile) {
      return NextResponse.json({ error: '原图文件不存在' }, { status: 404 })
    }

    // 2. Extract OSS key from fileUrl
    const ossKey = originalFile.fileUrl.replace(`${OSS_PUBLIC_URL}/`, '')

    // 3. Download original image from OSS
    let originalBuffer: Buffer
    try {
      const ossResult = await oss.get(ossKey)
      originalBuffer = Buffer.from(ossResult.content)
    } catch (ossErr) {
      console.error('OSS download error:', ossErr)
      return NextResponse.json(
        { error: `原图下载失败: ${ossErr instanceof Error ? ossErr.message : 'OSS 错误'}` },
        { status: 500 }
      )
    }

    // 4. Process the image with sharp
    let processedBuffer: Buffer
    try {
      processedBuffer = await processImage(originalBuffer, {
        bgColor: retouchParams.bgColor || 'keep',
        clarity: retouchParams.clarity || '不处理',
        brightness: retouchParams.brightness || 'keep',
        skinSmooth: retouchParams.skinSmooth || 'none',
      })
    } catch (procErr) {
      console.error('Image processing error:', procErr)
      return NextResponse.json(
        { error: `图像处理失败: ${procErr instanceof Error ? procErr.message : '处理错误'}` },
        { status: 500 }
      )
    }

    const processingTime = Math.round((Date.now() - startTime) / 1000)

    // 5. Upload processed image to OSS
    const retouchedName = originalFile.fileName.replace(
      /\.(jpg|jpeg|png|heic|webp)$/i,
      '_retouched.$1'
    )
    const resultKey = `${id}/ai-retouch/${Date.now()}_${retouchedName}`

    try {
      await oss.put(resultKey, processedBuffer, {
        mime: 'image/jpeg',
        headers: { 'Content-Type': 'image/jpeg' },
      })
    } catch (uploadErr) {
      console.error('OSS upload error:', uploadErr)
      return NextResponse.json(
        { error: `修图上传失败: ${uploadErr instanceof Error ? uploadErr.message : 'OSS 错误'}` },
        { status: 500 }
      )
    }

    // 6. Create AI_RESULT record in database
    const resultUrl = `${OSS_PUBLIC_URL}/${resultKey}`
    const aiFile = await prisma.orderFile.create({
      data: {
        orderId: id,
        fileName: retouchedName,
        fileUrl: resultUrl,
        fileSize: BigInt(processedBuffer.length),
        fileType: 'AI_RESULT',
        aiParams: {
          ...retouchParams,
          processingTime,
          originalFileId,
        },
      },
    })

    // 7. Update order status if appropriate
    const order = await prisma.order.findUnique({ where: { id } })
    if (order && (order.status === '已拍摄' || order.status === 'AI修图中')) {
      await prisma.order.update({
        where: { id },
        data: { status: 'AI修图中' },
      })
    }

    return NextResponse.json({
      success: true,
      processingTime,
      aiFile: {
        id: aiFile.id,
        fileName: aiFile.fileName,
        fileUrl: aiFile.fileUrl,
        fileSize: aiFile.fileSize.toString(),
        aiParams: aiFile.aiParams,
      },
    })
  } catch (error) {
    console.error('AI retouch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI 修图处理失败' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '请求体解析失败' }, { status: 400 })
  }

  if (body.action === 'confirm') {
    const order = await prisma.order.findUnique({ where: { id } })
    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 })
    }

    await prisma.order.update({
      where: { id },
      data: { status: '修图完成' },
    })

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: '未知操作' }, { status: 400 })
}
