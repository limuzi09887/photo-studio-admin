import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getFileUrl, OSS_PUBLIC_URL } from '@/lib/r2'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const fileId = request.nextUrl.searchParams.get('fileId')
  if (!fileId) return NextResponse.json({ error: 'Missing fileId' }, { status: 400 })

  const file = await prisma.orderFile.findUnique({ where: { id: fileId } })
  if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })

  // Extract OSS key from fileUrl
  const key = file.fileUrl.replace(`${OSS_PUBLIC_URL}/`, '')

  try {
    // Try generating a signed URL (works even if bucket is private)
    const signedUrl = await getFileUrl(key)
    return NextResponse.redirect(signedUrl)
  } catch {
    // Fallback: try public URL directly
    return NextResponse.redirect(file.fileUrl)
  }
}
