import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { originalFileId, originalUrl, params: retouchParams } = body

  try {
    const startTime = Date.now()

    // Submit AI retouch task
    const actions: { type: string; [key: string]: string }[] = []
    if (retouchParams.bgColor && retouchParams.bgColor !== 'keep') {
      actions.push({ type: 'changeBackground', color: retouchParams.bgColor })
    }
    if (retouchParams.clarity && retouchParams.clarity !== '不处理') {
      actions.push({ type: 'enhanceFace', level: retouchParams.clarity })
    }
    if (retouchParams.brightness && retouchParams.brightness !== 'keep') {
      actions.push({ type: 'adjustBrightness', level: retouchParams.brightness })
    }
    if (retouchParams.skinSmooth && retouchParams.skinSmooth !== 'none') {
      actions.push({ type: 'smoothSkin', level: retouchParams.skinSmooth })
    }

    let taskId: string
    if (process.env.ALIYUN_AI_ACCESS_KEY) {
      const response = await fetch('https://vision.aliyuncs.com/api/v1/retouch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.ALIYUN_AI_ACCESS_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: originalUrl, actions }),
      })
      const data = await response.json()
      taskId = data.taskId || `task_${Date.now()}`
    } else {
      // Fallback for development without API key
      taskId = `task_${Date.now()}`
    }

    // Poll for result (simplified: in production use webhook/callback)
    let resultUrl = originalUrl
    let attempts = 0
    const maxAttempts = 10

    if (process.env.ALIYUN_AI_ACCESS_KEY) {
      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        const pollRes = await fetch(`https://vision.aliyuncs.com/api/v1/tasks/${taskId}`, {
          headers: { 'Authorization': `Bearer ${process.env.ALIYUN_AI_ACCESS_KEY}` },
        })
        const pollData = await pollRes.json()
        if (pollData.success && pollData.resultUrl) {
          resultUrl = pollData.resultUrl
          break
        }
        attempts++
      }
    }

    const processingTime = Math.round((Date.now() - startTime) / 1000)

    // Create AI result file record
    const originalFile = await prisma.orderFile.findUnique({ where: { id: originalFileId } })
    const retouchedName = originalFile
      ? originalFile.fileName.replace(/\.(jpg|jpeg|png|heic)$/i, '_retouched.$1')
      : `retouched_${Date.now()}.jpg`

    const aiFile = await prisma.orderFile.create({
      data: {
        orderId: id,
        fileName: retouchedName,
        fileUrl: resultUrl,
        fileSize: BigInt(0),
        fileType: 'AI_RESULT',
        aiParams: { ...retouchParams, taskId, processingTime },
      },
    })

    // Update order status if currently in appropriate state
    const order = await prisma.order.findUnique({ where: { id } })
    if (order && order.status === '已拍摄') {
      await prisma.order.update({
        where: { id },
        data: { status: 'AI修图中' },
      })
    }

    return NextResponse.json({
      success: true,
      taskId,
      aiFile: {
        id: aiFile.id,
        fileName: aiFile.fileName,
        fileUrl: aiFile.fileUrl,
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
  const body = await request.json()

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
