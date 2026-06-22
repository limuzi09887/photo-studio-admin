import { NextRequest, NextResponse } from 'next/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { prisma } from '@/lib/db'
import { oss, OSS_BUCKET, OSS_PUBLIC_URL } from '@/lib/r2'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const fileId = request.nextUrl.searchParams.get('fileId')
  if (!fileId) return NextResponse.json({ error: 'Missing fileId' }, { status: 400 })

  const file = await prisma.orderFile.findUnique({ where: { id: fileId } })
  if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })

  // Extract OSS key from fileUrl
  const key = file.fileUrl.replace(`${OSS_PUBLIC_URL}/`, '')

  try {
    const command = new GetObjectCommand({ Bucket: OSS_BUCKET, Key: key })
    const signedUrl = await getSignedUrl(oss, command, { expiresIn: 3600 })
    return NextResponse.redirect(signedUrl)
  } catch {
    // Fallback: try public URL directly
    return NextResponse.redirect(file.fileUrl)
  }
}
