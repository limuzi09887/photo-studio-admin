declare module 'ali-oss' {
  interface OSSOptions {
    region: string
    accessKeyId: string
    accessKeySecret: string
    bucket: string
    [key: string]: unknown
  }

  interface PutObjectResult {
    name: string
    url: string
    res: {
      status: number
      headers: Record<string, string>
    }
  }

  class OSS {
    constructor(options: OSSOptions)
    put(key: string, content: Buffer | string, options?: Record<string, unknown>): Promise<PutObjectResult>
    signatureUrl(key: string, options?: { method?: string; expires?: number }): string
    getBucketInfo(): Promise<{ bucket: Record<string, unknown> }>
  }

  export = OSS
}
