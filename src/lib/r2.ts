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

/**
 * 生成图片签名URL（用于前端直连OSS，跳过代理）
 *
 * @param fileUrl — 数据库中的完整 OSS URL
 * @param width — 可选：缩略图宽度（利用OSS图片处理）
 * @returns 签名URL，有效期24小时
 */
export function getSignedImageUrl(fileUrl: string, width?: number): string {
  const url = fileUrl.replace(`${OSS_PUBLIC_URL}/`, '')
  const key = decodeURIComponent(url)
  // 签名URL有效期24小时（门店营业时间内足够）
  let signedUrl = oss.signatureUrl(key, { method: 'GET', expires: 86400 })
  // 修复混合内容：强制 https
  signedUrl = signedUrl.replace(/^http:/, 'https:')
  // OSS 图片处理参数（缩略图）
  if (width) {
    signedUrl += `&x-oss-process=image/resize,w_${width}`
  }
  return signedUrl
}

/**
 * 生成缩略图 Buffer（上传时调用）
 */
export async function generateThumbnail(buffer: Buffer, width = 200): Promise<Buffer> {
  const sharp = (await import('sharp')).default
  return sharp(buffer)
    .resize(width, undefined, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer()
}

// Keep backward-compatible aliases
export { oss as r2 }
export const R2_BUCKET = OSS_BUCKET
export const R2_PUBLIC_URL = OSS_PUBLIC_URL
