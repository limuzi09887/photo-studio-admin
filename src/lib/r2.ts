import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// AliCloud OSS (S3-compatible)
export const oss = new S3Client({
  region: process.env.OSS_REGION!,
  endpoint: `https://${process.env.OSS_BUCKET!}.${process.env.OSS_REGION!}.aliyuncs.com`,
  credentials: {
    accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID!,
    secretAccessKey: process.env.ALIYUN_ACCESS_KEY_SECRET!,
  },
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
})

export const OSS_BUCKET = process.env.OSS_BUCKET!
export const OSS_PUBLIC_URL = process.env.OSS_PUBLIC_URL!

export async function getUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: OSS_BUCKET,
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(oss, command, { expiresIn: 3600 })
}

export function getPublicUrl(key: string): string {
  return `${OSS_PUBLIC_URL}/${key}`
}

// Keep backward-compatible aliases
export const r2 = oss
export const R2_BUCKET = OSS_BUCKET
export const R2_PUBLIC_URL = OSS_PUBLIC_URL
