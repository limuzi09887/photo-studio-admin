import { NextRequest, NextResponse } from 'next/server'
import { oss, OSS_PUBLIC_URL } from '@/lib/r2'
import { prisma } from '@/lib/db'

// POST /api/files/batch-delete
// Body: { ids: string[] }
export async function POST(request: NextRequest) {
  try {
    const { ids } = (await request.json()) as { ids: string[] }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: '请提供要删除的文件 ID 列表' }, { status: 400 })
    }

    // 获取文件记录
    const files = await prisma.orderFile.findMany({
      where: { id: { in: ids } },
      select: { id: true, fileUrl: true },
    })

    // 从 OSS 删除（不阻塞数据库删除）
    const deleteOssPromises = files.map((f) => {
      const key = f.fileUrl.replace(`${OSS_PUBLIC_URL}/`, '')
      return oss.delete(key).catch((e) => {
        console.error(`OSS 删除失败 (${f.id}):`, e)
      })
    })
    await Promise.all(deleteOssPromises)

    // 从数据库批量删除
    const result = await prisma.orderFile.deleteMany({
      where: { id: { in: ids } },
    })

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
    })
  } catch (err) {
    console.error('批量删除失败:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '批量删除失败' },
      { status: 500 }
    )
  }
}
