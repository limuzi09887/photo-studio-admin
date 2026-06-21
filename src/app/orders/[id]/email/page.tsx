import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatFileSize, formatDateTime } from '@/lib/utils'
import { sendEmailWithAttachments } from '@/lib/email'
import { SendButton } from './send-button'

async function sendEmail(formData: FormData) {
  'use server'
  const orderId = formData.get('orderId') as string
  const to = formData.get('email') as string
  const subject = formData.get('subject') as string
  const body = formData.get('body') as string

  if (!to || !subject) return

  // Fetch order with customer and FINAL files
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: true },
  })
  if (!order) notFound()

  const finalFiles = await prisma.orderFile.findMany({
    where: { orderId, fileType: 'FINAL' },
  })

  try {
    await sendEmailWithAttachments({
      to,
      subject,
      html: body.replace(/\n/g, '<br />'),
      attachments: finalFiles.map((f) => ({
        filename: f.fileName,
        path: f.fileUrl,
      })),
    })

    await prisma.emailRecord.create({
      data: {
        orderId,
        receiverEmail: to,
        subject,
        status: '成功',
      },
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    await prisma.emailRecord.create({
      data: {
        orderId,
        receiverEmail: to,
        subject,
        status: '失败',
        errorMessage,
      },
    })
  }

  redirect(`/orders/${orderId}/email`)
}

export default async function EmailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      emailRecords: { orderBy: { sentAt: 'desc' } },
    },
  })
  if (!order) notFound()

  const finalFiles = await prisma.orderFile.findMany({
    where: { orderId: id, fileType: 'FINAL' },
    orderBy: { createdAt: 'desc' },
  })

  // Build default subject and body with variable substitution
  const variables: Record<string, string> = {
    '{{客户姓名}}': order.customer.name,
    '{{订单号}}': order.orderNo,
    '{{拍摄类型}}': order.shootType,
    '{{拍摄日期}}': order.shootTime
      ? formatDateTime(order.shootTime)
      : '待定',
    '{{成片数量}}': `${finalFiles.length} 张`,
  }

  const defaultSubject = `您拍摄的照片已完成 - 订单 ${order.orderNo}`
  const defaultBody = `尊敬的 {{客户姓名}}：

您好！您的照片已经完成精修处理。

订单号：{{订单号}}
拍摄类型：{{拍摄类型}}
拍摄日期：{{拍摄日期}}
成片数量：{{成片数量}}

请查收附件中的成片照片。如有任何问题，请随时联系我们。

祝好！`

  // Replace variables in body
  const previewBody = Object.entries(variables).reduce(
    (text, [variable, value]) => text.replaceAll(variable, value),
    defaultBody
  )

  const previewSubject = Object.entries(variables).reduce(
    (text, [variable, value]) => text.replaceAll(variable, value),
    defaultSubject
  )

  return (
    <div className="space-y-6">
      {/* Email Form */}
      <div className="bg-white rounded-2xl p-7 border border-gray-100">
        <h3 className="text-lg font-bold mb-5">邮件发送</h3>

        <form action={sendEmail} className="space-y-4 max-w-2xl">
          <input type="hidden" name="orderId" value={id} />

          <div>
            <Label htmlFor="email">收件人邮箱</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={order.customer.email}
              required
            />
          </div>

          <div>
            <Label htmlFor="subject">邮件主题</Label>
            <Input
              id="subject"
              name="subject"
              defaultValue={previewSubject}
              required
            />
          </div>

          <div>
            <Label htmlFor="body">邮件正文</Label>
            <Textarea
              id="body"
              name="body"
              rows={10}
              defaultValue={previewBody}
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              可用变量: {'{{'}客户姓名{'}}'}, {'{{'}订单号{'}}'}, {'{{'}拍摄类型{'}}'}, {'{{'}拍摄日期{'}}'}, {'{{'}成片数量{'}}'}
            </p>
          </div>

          {/* Attachment List */}
          <div>
            <Label>附件列表（所有成片）</Label>
            {finalFiles.length === 0 ? (
              <p className="text-sm text-gray-400 mt-1">暂无成片附件</p>
            ) : (
              <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg divide-y">
                {finalFiles.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 px-3 py-2 text-sm"
                  >
                    <span className="text-gray-400">📎</span>
                    <span className="flex-1 truncate">{f.fileName}</span>
                    <span className="text-gray-400 text-xs">
                      {formatFileSize(Number(f.fileSize))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <SendButton />
        </form>
      </div>

      {/* Send History */}
      <div className="bg-white rounded-2xl p-7 border border-gray-100">
        <h3 className="text-lg font-bold mb-5">发送记录</h3>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>收件人</TableHead>
              <TableHead>主题</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>发送时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.emailRecords.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-gray-400 py-6"
                >
                  暂无发送记录
                </TableCell>
              </TableRow>
            ) : (
              order.emailRecords.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.receiverEmail}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {r.subject || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        r.status === '成功' ? 'default' : 'destructive'
                      }
                    >
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {formatDateTime(r.sentAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
