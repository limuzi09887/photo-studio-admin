import { NextRequest, NextResponse } from 'next/server'
import { oss, OSS_PUBLIC_URL } from '@/lib/r2'
import { prisma } from '@/lib/db'

// DELETE /api/files/[id] — 删除文件（OSS + 数据库）
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const file = await prisma.orderFile.findUnique({ where: { id } })
    if (!file) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 })
    }

    // 从 fileUrl 提取 OSS key
    const key = file.fileUrl.replace(`${OSS_PUBLIC_URL}/`, '')

    // 从 OSS 删除
    try {
      await oss.delete(key)
    } catch (ossErr) {
      console.error('OSS 删除失败（继续删除数据库记录）:', ossErr)
    }

    // 从数据库删除
    await prisma.orderFile.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('删除文件失败:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '删除失败' },
      { status: 500 }
    )
  }
}
