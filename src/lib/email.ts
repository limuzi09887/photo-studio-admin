import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
})

export async function sendEmailWithAttachments({
  to,
  subject,
  html,
  attachments,
}: {
  to: string
  subject: string
  html: string
  attachments: { filename: string; path: string }[]
}) {
  return transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    html,
    attachments,
  })
}
