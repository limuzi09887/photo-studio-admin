import { NextRequest, NextResponse } from 'next/server'
import { getUploadUrl } from '@/lib/r2'

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key')
  const contentType = request.nextUrl.searchParams.get('contentType') || 'image/jpeg'
  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })
  const url = await getUploadUrl(key, contentType)
  return NextResponse.json({ url })
}
