import OSS from 'ali-oss'

// AliCloud OSS
export const oss = new OSS({
  region: 'oss-cn-shanghai',
  accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID!,
  accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET!,
  bucket: process.env.OSS_BUCKET!,
})

export const OSS_BUCKET = process.env.OSS_BUCKET!
export const OSS_PUBLIC_URL = process.env.OSS_PUBLIC_URL!

/**
 * Generate a presigned upload URL (for client-side uploads, if needed)
 */
export async function getUploadUrl(key: string): Promise<string> {
  return oss.signatureUrl(key, { method: 'PUT' })
}

/**
 * Generate a public or signed URL for viewing a file
 */
export function getPublicUrl(key: string): string {
  return `${OSS_PUBLIC_URL}/${key}`
}

/**
 * Get a signed URL for viewing a private file
 */
export async function getFileUrl(key: string): Promise<string> {
  return oss.signatureUrl(key, { method: 'GET' })
}

// Keep backward-compatible aliases
export { oss as r2 }
export const R2_BUCKET = OSS_BUCKET
export const R2_PUBLIC_URL = OSS_PUBLIC_URL
