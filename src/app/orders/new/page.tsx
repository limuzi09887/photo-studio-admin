import { NewOrderForm } from './new-order-form'
import Link from 'next/link'

export default function NewOrderPage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/orders" className="text-sm text-gray-400 hover:text-gray-600">← 返回订单列表</Link>
        <h2 className="text-2xl font-bold mt-2">新建订单</h2>
        <p className="text-sm text-gray-400 mt-1">录入客户信息和拍摄需求</p>
      </div>

      <NewOrderForm />
    </div>
  )
}
