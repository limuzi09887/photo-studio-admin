import { NextRequest, NextResponse } from 'next/server'
import { getUploadUrl } from '@/lib/r2'

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })
  const url = await getUploadUrl(key)
  return NextResponse.json({ url })
}
