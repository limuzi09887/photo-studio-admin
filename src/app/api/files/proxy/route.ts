import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { oss } from '@/lib/r2'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const fileId = request.nextUrl.searchParams.get('fileId')
  if (!fileId) return NextResponse.json({ error: 'Missing fileId' }, { status: 400 })

  const file = await prisma.orderFile.findUnique({ where: { id: fileId } })
  if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })

  const isDownload = request.nextUrl.searchParams.get('download') === '1'
  const OSS_PUBLIC_URL = process.env.OSS_PUBLIC_URL!
  const key = file.fileUrl.replace(`${OSS_PUBLIC_URL}/`, '')

  try {
    // Download from OSS
    const result = await oss.get(key)
    const headers: Record<string, string> = {
      'Content-Type': result.res.headers['content-type'] || 'image/jpeg',
      'Content-Length': String(result.res.headers['content-length'] || result.content.length),
      'Cache-Control': 'public, max-age=86400',
    }
    if (isDownload) {
      headers['Content-Disposition'] = `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`
    }

    return new NextResponse(new Uint8Array(result.content), { headers })
  } catch (err) {
    // Fallback: signed URL redirect
    try {
      const url = oss.signatureUrl(key, { method: 'GET', expires: 3600 })
      return NextResponse.redirect(url.replace(/^http:/, 'https:'))
    } catch {
      return NextResponse.json({ error: '加载图片失败' }, { status: 500 })
    }
  }
}
