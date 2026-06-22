import { NextResponse } from 'next/server'
import { oss, OSS_BUCKET, OSS_PUBLIC_URL } from '@/lib/r2'

export const dynamic = 'force-dynamic'

export async function GET() {
  const info: Record<string, unknown> = {
    bucket: OSS_BUCKET,
    publicUrl: OSS_PUBLIC_URL,
    region: process.env.OSS_REGION,
    hasAccessKeyId: !!process.env.ALIYUN_ACCESS_KEY_ID,
    hasAccessKeySecret: !!process.env.ALIYUN_ACCESS_KEY_SECRET,
    ossOptions: {
      region: (oss as any).options?.region,
      bucket: (oss as any).options?.bucket,
      accessKeyId: !!(oss as any).options?.accessKeyId,
    },
  }

  try {
    const result = await oss.put('test/vercel-debug.txt', Buffer.from('vercel test'))
    info.putResult = result.url
  } catch (e: any) {
    info.putError = e.message
    info.putErrorCode = e.code
    info.putErrorName = e.name
  }

  return NextResponse.json(info)
}
