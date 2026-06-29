import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

async function addTemplate(formData: FormData) {
  'use server'
  const name = formData.get('name') as string
  const subject = formData.get('subject') as string
  const body = formData.get('body') as string
  const isDefault = formData.get('isDefault') === 'on'

  if (!name || !subject) return

  // If this is default, unset other defaults
  if (isDefault) {
    await prisma.emailTemplate.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    })
  }

  await prisma.emailTemplate.create({
    data: { name, subject, body, isDefault },
  })

  redirect('/settings/email-templates')
}

async function updateTemplate(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const subject = formData.get('subject') as string
  const body = formData.get('body') as string
  const isDefault = formData.get('isDefault') === 'on'

  if (!id || !name || !subject) return

  if (isDefault) {
    await prisma.emailTemplate.updateMany({
      where: { isDefault: true, id: { not: id } },
      data: { isDefault: false },
    })
  }

  await prisma.emailTemplate.update({
    where: { id },
    data: { name, subject, body, isDefault },
  })

  redirect('/settings/email-templates')
}

async function deleteTemplate(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  if (!id) return
  await prisma.emailTemplate.delete({ where: { id } })
  redirect('/settings/email-templates')
}

export default async function EmailTemplatesPage() {
  const templates = await prisma.emailTemplate.findMany({
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
  })

  return (
    <div className="space-y-6">
      {/* Add Form */}
      <div className="bg-white rounded-2xl p-7 border border-gray-100">
        <h3 className="text-lg font-bold mb-5">新建邮件模板</h3>
        <form action={addTemplate} className="space-y-4 max-w-2xl">
          <div>
            <Label htmlFor="name">模板名称</Label>
            <Input id="name" name="name" placeholder="如: 成片通知、订单确认" required />
          </div>
          <div>
            <Label htmlFor="subject">邮件主题</Label>
            <Input
              id="subject"
              name="subject"
              placeholder="支持变量: {{客户姓名}} {{订单号}} {{拍摄类型}} {{拍摄日期}} {{成片数量}}"
              required
            />
          </div>
          <div>
            <Label htmlFor="body">邮件正文</Label>
            <Textarea
              id="body"
              name="body"
              rows={8}
              placeholder={`尊敬的 {{客户姓名}}：\n\n您的照片已完成精修...\n\n订单号：{{订单号}}\n拍摄类型：{{拍摄类型}}`}
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              可用变量: {'{{'}客户姓名{'}}'}, {'{{'}订单号{'}}'}, {'{{'}拍摄类型{'}}'}, {'{{'}拍摄日期{'}}'}, {'{{'}成片数量{'}}'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isDefault" name="isDefault" className="rounded" />
            <Label htmlFor="isDefault" className="text-sm cursor-pointer">设为默认模板</Label>
          </div>
          <Button type="submit" className="bg-indigo-500 hover:bg-indigo-600">
            ➕ 创建模板
          </Button>
        </form>
      </div>

      {/* Existing Templates */}
      <div className="bg-white rounded-2xl p-7 border border-gray-100">
        <h3 className="text-lg font-bold mb-5">
          已有模板
          <span className="text-sm font-normal text-gray-400 ml-2">共 {templates.length} 个</span>
        </h3>

        {templates.length === 0 ? (
          <p className="text-center text-gray-400 py-8">暂无邮件模板，请创建</p>
        ) : (
          <div className="space-y-4">
            {templates.map((t) => (
              <form
                key={t.id}
                action={updateTemplate}
                className="p-5 bg-gray-50 rounded-xl space-y-3"
              >
                <input type="hidden" name="id" value={t.id} />
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Label className="text-xs text-gray-400">模板名称</Label>
                    <Input
                      name="name"
                      defaultValue={t.name}
                      required
                      className="bg-white"
                    />
                  </div>
                  {t.isDefault && <Badge className="mt-4">默认</Badge>}
                </div>
                <div>
                  <Label className="text-xs text-gray-400">邮件主题</Label>
                  <Input
                    name="subject"
                    defaultValue={t.subject}
                    required
                    className="bg-white"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">邮件正文</Label>
                  <Textarea
                    name="body"
                    defaultValue={t.body}
                    rows={5}
                    required
                    className="bg-white"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`isDefault-${t.id}`}
                      name="isDefault"
                      defaultChecked={t.isDefault}
                      className="rounded"
                    />
                    <Label htmlFor={`isDefault-${t.id}`} className="text-sm text-gray-500 cursor-pointer">
                      设为默认
                    </Label>
                  </div>
                  <div className="flex-1" />
                  <Button type="submit" size="sm" className="bg-indigo-500 hover:bg-indigo-600 text-xs">
                    💾 保存
                  </Button>
                  <button
                    formAction={deleteTemplate}
                    className="px-3 py-2 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    onClick={(e) => {
                      if (!confirm(`确定要删除模板「${t.name}」吗？`)) {
                        e.preventDefault()
                      }
                    }}
                  >
                    🗑 删除
                  </button>
                </div>
              </form>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
