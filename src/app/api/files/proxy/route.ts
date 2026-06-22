import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { oss } from '@/lib/r2'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const fileId = request.nextUrl.searchParams.get('fileId')
  if (!fileId) return NextResponse.json({ error: 'Missing fileId' }, { status: 400 })

  const file = await prisma.orderFile.findUnique({ where: { id: fileId } })
  if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })

  const isDownload = request.nextUrl.searchParams.get('download') === '1'

  // Extract OSS key from fileUrl
  const OSS_PUBLIC_URL = process.env.OSS_PUBLIC_URL!
  const key = file.fileUrl.replace(`${OSS_PUBLIC_URL}/`, '')

  try {
    // Stream the file from OSS through our server
    const result = await oss.getStream(key)
    const headers: Record<string, string> = {
      'Content-Type': result.res.headers['content-type'] || 'image/jpeg',
      'Cache-Control': 'public, max-age=3600',
    }
    if (isDownload) {
      headers['Content-Disposition'] = `attachment; filename="${encodeURIComponent(file.fileName)}"`
    }

    return new NextResponse(result.stream as any, { headers })
  } catch {
    // Fallback: redirect to signed URL
    const url = oss.signatureUrl(key, { method: 'GET' })
    return NextResponse.redirect(url.replace(/^http:/, 'https:'))
  }
}
