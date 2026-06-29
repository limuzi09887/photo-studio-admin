import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'

async function addShootType(formData: FormData) {
  'use server'
  const name = formData.get('name') as string
  const priceStr = formData.get('price') as string
  const description = formData.get('description') as string

  if (!name) return

  await prisma.shootType.create({
    data: {
      name,
      price: priceStr ? parseFloat(priceStr) : null,
      description,
    },
  })

  redirect('/settings/shoot-types')
}

async function updateShootType(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const priceStr = formData.get('price') as string
  const description = formData.get('description') as string

  if (!id || !name) return

  await prisma.shootType.update({
    where: { id },
    data: {
      name,
      price: priceStr ? parseFloat(priceStr) : null,
      description,
    },
  })

  redirect('/settings/shoot-types')
}

async function deleteShootType(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  if (!id) return
  await prisma.shootType.delete({ where: { id } })
  redirect('/settings/shoot-types')
}

export default async function ShootTypesPage() {
  const types = await prisma.shootType.findMany({
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      {/* Add Form */}
      <div className="bg-white rounded-2xl p-7 border border-gray-100">
        <h3 className="text-lg font-bold mb-5">添加拍摄类型</h3>
        <form action={addShootType} className="flex items-end gap-3">
          <div className="flex-1">
            <Label htmlFor="name">类型名称</Label>
            <Input id="name" name="name" placeholder="如: 证件照、全家福、儿童写真" required />
          </div>
          <div className="w-32">
            <Label htmlFor="price">标准价格</Label>
            <Input id="price" name="price" type="number" step="0.01" min="0" placeholder="0.00" />
          </div>
          <div className="flex-1">
            <Label htmlFor="description">描述</Label>
            <Input id="description" name="description" placeholder="简要描述（可选）" />
          </div>
          <Button type="submit" className="bg-indigo-500 hover:bg-indigo-600">
            ➕ 添加
          </Button>
        </form>
      </div>

      {/* Existing Types — Inline Edit */}
      <div className="bg-white rounded-2xl p-7 border border-gray-100">
        <h3 className="text-lg font-bold mb-5">
          现有拍摄类型
          <span className="text-sm font-normal text-gray-400 ml-2">共 {types.length} 种</span>
        </h3>

        {types.length === 0 ? (
          <p className="text-center text-gray-400 py-8">暂无拍摄类型，请添加</p>
        ) : (
          <div className="space-y-3">
            {types.map((t) => (
              <form
                key={t.id}
                action={updateShootType}
                className="flex items-end gap-3 p-4 bg-gray-50 rounded-xl"
              >
                <input type="hidden" name="id" value={t.id} />
                <div className="flex-1">
                  <Label className="text-xs text-gray-400">名称</Label>
                  <Input
                    name="name"
                    defaultValue={t.name}
                    required
                    className="bg-white"
                  />
                </div>
                <div className="w-32">
                  <Label className="text-xs text-gray-400">标准价格</Label>
                  <Input
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={t.price ? String(t.price) : ''}
                    placeholder="-"
                    className="bg-white"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-gray-400">描述</Label>
                  <Input
                    name="description"
                    defaultValue={t.description}
                    placeholder="-"
                    className="bg-white"
                  />
                </div>
                <Button type="submit" size="sm" className="bg-indigo-500 hover:bg-indigo-600 text-xs">
                  💾 保存
                </Button>
                <button
                  formAction={deleteShootType}
                  className="px-3 py-2 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  onClick={(e) => {
                    if (!confirm(`确定要删除「${t.name}」吗？此操作不可撤销。`)) {
                      e.preventDefault()
                    }
                  }}
                >
                  🗑
                </button>
              </form>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
