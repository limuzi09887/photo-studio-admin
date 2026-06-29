import nodemailer from 'nodemailer'
import { oss, OSS_PUBLIC_URL } from '@/lib/r2'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
})

export interface EmailAttachment {
  filename: string
  /** OSS 文件URL（会自动下载） */
  fileUrl: string
}

export async function sendEmailWithAttachments({
  to,
  subject,
  html,
  attachments,
}: {
  to: string
  subject: string
  html: string
  attachments: EmailAttachment[]
}) {
  // 服务端先下载附件（避免 OSS URL 中文字符编码问题）
  const nodemailerAttachments: { filename: string; content: Buffer }[] = []

  for (const att of attachments) {
    try {
      const key = att.fileUrl.replace(`${OSS_PUBLIC_URL}/`, '')
      const result = await oss.get(decodeURIComponent(key))
      nodemailerAttachments.push({
        filename: att.filename,
        content: Buffer.from(result.content),
      })
    } catch (err) {
      console.error(`下载附件失败: ${att.filename}`, err)
      // 跳过下载失败的附件，不阻塞邮件发送
    }
  }

  return transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    html,
    attachments: nodemailerAttachments,
  })
}
