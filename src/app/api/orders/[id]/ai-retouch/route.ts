import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { oss, OSS_PUBLIC_URL, getSignedImageUrl } from '@/lib/r2'
import { autoEnhance } from '@/lib/aliyun-vision'
import { sharpFallback } from '@/lib/ai'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30 // Vercel Hobby 限制

/**
 * POST /api/orders/[id]/ai-retouch
 *
 * 🤖 一键 AI 自动优化
 * 请求体: { originalFileId, bgColor? }
 *  - originalFileId: 原图文件 ID
 *  - bgColor: 'white'(默认) | 'blue' | 'red' | 'keep'
 *
 * AI 处理流程（autoEnhance）:
 *  1. FaceBeauty — 固定最优参数（磨皮0.35 / 美白0.25 / 锐化0.3）
 *  2. SegmentCommonImage — AI白底分割
 *  3. 方向校正 + 背景色替换
 *
 * 降级策略：阿里云 API 不可用时自动降级到 sharp 本地处理
 */
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

  const { originalFileId, bgColor } = body as {
    originalFileId?: string
    bgColor?: string
  }

  if (!originalFileId) {
    return NextResponse.json({ error: '缺少参数: originalFileId' }, { status: 400 })
  }

  const safeBgColor = (bgColor === 'blue' || bgColor === 'red' || bgColor === 'keep')
    ? bgColor as 'blue' | 'red' | 'keep'
    : 'white'

  try {
    // 1. 查找原图文件 ────────────────────────────
    const originalFile = await prisma.orderFile.findUnique({
      where: { id: originalFileId },
    })
    if (!originalFile) {
      return NextResponse.json({ error: `原图文件不存在: ${originalFileId}` }, { status: 404 })
    }
    log.push(`原图: ${originalFile.fileName}`)

    // 2. 获取 OSS 访问 URL ─────────────────────
    // 优先用公网 URL（bucket 公开读取时），否则生成签名 URL
    const ossKey = originalFile.fileUrl.replace(`${OSS_PUBLIC_URL}/`, '')
    const signedUrl = oss.signatureUrl(ossKey, { method: 'GET', expires: 3600 })
    const ossAccessUrl = signedUrl.replace(/^http:/, 'https:')
    log.push(`OSS key: ${ossKey.slice(0, 60)}`)

    // 3. 调用 AI 自动优化 ──────────────────────
    let processedBuffer: Buffer
    let aiSteps: string[] = []

    try {
      const result = await autoEnhance(ossAccessUrl, safeBgColor as 'white' | 'blue' | 'red' | 'keep')
      processedBuffer = result.buffer
      aiSteps = result.steps
      log.push('AI优化完成')
    } catch (aiErr) {
      const msg = aiErr instanceof Error ? aiErr.message : String(aiErr)
      log.push(`AI API 失败，降级到 sharp: ${msg}`)

      // 降级：从 OSS 下载 → sharp 本地处理
      const ossResult = await oss.get(ossKey)
      const origBuffer = Buffer.from(ossResult.content)

      processedBuffer = await sharpFallback(origBuffer, {
        bgColor: safeBgColor === 'keep' ? 'keep' : '#FFFFFF',
        clarity: safeBgColor !== 'keep' ? '标准增强' : '不处理',
        brightness: '自动优化',
        skinSmooth: '标准磨皮',
      })
      aiSteps = ['sharp 降级处理']
    }

    const processingTime = Math.round((Date.now() - startTime) / 1000)

    // 4. 上传处理结果到 OSS ────────────────────
    const retouchedName = originalFile.fileName.replace(
      /\.(jpg|jpeg|png|heic|webp)$/i,
      '_AI.$1'
    )
    const resultKey = `${id}/ai-retouch/${Date.now()}_${retouchedName}`

    await oss.put(resultKey, processedBuffer, {
      mime: 'image/jpeg',
    })
    log.push(`OSS上传: ${resultKey}`)

    // 5. 创建 AI_RESULT 数据库记录 ─────────────
    const resultUrl = `${OSS_PUBLIC_URL}/${resultKey}`
    const aiFile = await prisma.orderFile.create({
      data: {
        orderId: id,
        fileName: retouchedName,
        fileUrl: resultUrl,
        fileSize: BigInt(processedBuffer.length),
        fileType: 'AI_RESULT',
        aiParams: {
          bgColor: safeBgColor,
          processingTime,
          originalFileId,
          aiSteps,
          mode: aiSteps.some(s => s.includes('AI美颜') || s.includes('AI白底分割')) ? 'ai' : 'sharp_fallback',
        },
      },
    })
    log.push(`DB记录: ${aiFile.id}`)

    // 6. 更新订单状态 ──────────────────────────
    const order = await prisma.order.findUnique({ where: { id } })
    if (order && (order.status === '已拍摄' || order.status === 'AI修图中')) {
      await prisma.order.update({ where: { id }, data: { status: 'AI修图中' } })
      log.push('订单状态 → AI修图中')
    }

    return NextResponse.json({
      success: true,
      processingTime,
      mode: aiSteps.includes('AI优化完成') ? 'ai' : 'sharp_fallback',
      aiFile: {
        id: aiFile.id,
        fileName: aiFile.fileName,
        fileUrl: aiFile.fileUrl,
        viewUrl: getSignedImageUrl(aiFile.fileUrl, 600),
        fileSize: aiFile.fileSize.toString(),
        aiParams: aiFile.aiParams,
      },
      log: [...log, ...aiSteps],
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('AI retouch error:', msg)
    return NextResponse.json(
      { error: `处理失败: ${msg}`, log },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/orders/[id]/ai-retouch
 * 确认修图完成，进入下一环节
 */
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
