import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const files = await prisma.orderFile.findMany({
    take: 3,
    orderBy: { createdAt: 'desc' },
    select: { id: true, fileName: true, fileUrl: true, fileType: true, createdAt: true },
  })
  return NextResponse.json(files)
}
