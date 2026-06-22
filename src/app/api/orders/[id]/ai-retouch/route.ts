import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { oss, OSS_PUBLIC_URL } from '@/lib/r2'
import { processImage } from '@/lib/ai'
import sharp from 'sharp'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30 // seconds (Pro plan: 300)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const startTime = Date.now()
  const log: string[] = []

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
    return NextResponse.json(
      { error: `缺少必要参数: fileId=${!!originalFileId}, params=${!!retouchParams}` },
      { status: 400 }
    )
  }

  try {
    // 0. Verify sharp is available  ──────────────────────────────
    log.push('sharp version: ' + (sharp.versions?.sharp || 'unknown'))

    // 1. Look up the original file  ──────────────────────────────
    const originalFile = await prisma.orderFile.findUnique({
      where: { id: originalFileId },
    })
    if (!originalFile) {
      return NextResponse.json({ error: `原图文件不存在: ${originalFileId}` }, { status: 404 })
    }
    log.push(`file found: ${originalFile.fileName}, url=${originalFile.fileUrl.slice(0, 80)}`)

    // 2. Extract OSS key robustly  ───────────────────────────────
    const publicPrefix = OSS_PUBLIC_URL.endsWith('/')
      ? OSS_PUBLIC_URL
      : OSS_PUBLIC_URL + '/'
    let ossKey = originalFile.fileUrl
    if (ossKey.startsWith(publicPrefix)) {
      ossKey = ossKey.slice(publicPrefix.length)
    } else {
      // try to extract key from URL path
      const url = new URL(originalFile.fileUrl)
      ossKey = url.pathname.replace(/^\//, '')
    }
    log.push(`oss key: ${ossKey.slice(0, 60)}`)

    // 3. Download original image from OSS  ───────────────────────
    let originalBuffer: Buffer
    try {
      const ossResult = await oss.get(ossKey)
      originalBuffer = Buffer.from(ossResult.content)
      log.push(`oss download OK: ${originalBuffer.length} bytes`)
    } catch (ossErr) {
      const msg = ossErr instanceof Error ? ossErr.message : String(ossErr)
      return NextResponse.json(
        { error: `OSS下载失败: ${msg}`, log },
        { status: 500 }
      )
    }

    // 4. Process the image with sharp  ───────────────────────────
    let processedBuffer: Buffer
    try {
      processedBuffer = await processImage(originalBuffer, {
        bgColor: retouchParams.bgColor || 'keep',
        clarity: retouchParams.clarity || '不处理',
        brightness: retouchParams.brightness || 'keep',
        skinSmooth: retouchParams.skinSmooth || 'none',
      })
      log.push(`processing OK: ${processedBuffer.length} bytes, ${Date.now() - startTime}ms`)
    } catch (procErr) {
      const msg = procErr instanceof Error ? procErr.message : String(procErr)
      return NextResponse.json(
        { error: `图像处理失败: ${msg}`, log },
        { status: 500 }
      )
    }

    const processingTime = Math.round((Date.now() - startTime) / 1000)

    // 5. Upload processed image to OSS  ──────────────────────────
    const ext = originalFile.fileName.match(/\.(jpg|jpeg|png|heic|webp)$/i)?.[0] || '.jpg'
    const retouchedName = originalFile.fileName.replace(
      /\.(jpg|jpeg|png|heic|webp)$/i,
      `_retouched${ext}`
    )
    const resultKey = `${id}/ai-retouch/${Date.now()}_${retouchedName}`

    try {
      await oss.put(resultKey, processedBuffer, {
        mime: 'image/jpeg',
      })
      log.push(`oss upload OK: ${resultKey}`)
    } catch (uploadErr) {
      const msg = uploadErr instanceof Error ? uploadErr.message : String(uploadErr)
      return NextResponse.json(
        { error: `OSS上传失败: ${msg}`, log },
        { status: 500 }
      )
    }

    // 6. Create database record  ─────────────────────────────────
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
    log.push(`db record created: ${aiFile.id}`)

    // 7. Update order status  ────────────────────────────────────
    const order = await prisma.order.findUnique({ where: { id } })
    if (order && (order.status === '已拍摄' || order.status === 'AI修图中')) {
      await prisma.order.update({ where: { id }, data: { status: 'AI修图中' } })
      log.push('order status -> AI修图中')
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
      log,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('AI retouch unexpected error:', msg)
    return NextResponse.json(
      { error: `未知错误: ${msg}`, log },
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
    if (!order) return NextResponse.json({ error: '订单不存在' }, { status: 404 })

    await prisma.order.update({ where: { id }, data: { status: '修图完成' } })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: '未知操作' }, { status: 400 })
}
