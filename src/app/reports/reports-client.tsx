'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format, subDays, startOfWeek, startOfMonth } from 'date-fns'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface OrderItem {
  id: string
  orderNo: string
  shootType: string
  amount: string | null
  status: string
  createdAt: string
}

interface DailyDataItem {
  date: string
  count: number
  amount: number
}

interface TypeDataItem {
  name: string
  value: number
}

interface ReportsClientProps {
  orders: OrderItem[]
  totalAmount: number
  avgAmount: number
  dailyData: DailyDataItem[]
  typeData: TypeDataItem[]
  from: string
  to: string
}

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#e0e7ff', '#818cf8', '#4f46e5']

const QUICK_FILTERS = [
  { label: '今日', days: 0 },
  { label: '昨日', days: 1 },
  { label: '本周', weekStart: true },
  { label: '本月', monthStart: true },
]

export function ReportsClient({
  orders,
  totalAmount,
  avgAmount,
  dailyData,
  typeData,
  from,
  to,
}: ReportsClientProps) {
  const router = useRouter()
  const [dateFrom, setDateFrom] = useState(from)
  const [dateTo, setDateTo] = useState(to)

  const highestOrder = useMemo(() => {
    if (orders.length === 0) return 0
    return Math.max(...orders.map((o) => Number(o.amount) || 0))
  }, [orders])

  const applyFilter = (days?: number, weekStart?: boolean, monthStart?: boolean) => {
    const now = new Date()
    let start: Date
    if (weekStart) {
      start = startOfWeek(now, { weekStartsOn: 1 })
    } else if (monthStart) {
      start = startOfMonth(now)
    } else {
      start = subDays(now, days ?? 0)
    }
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)

    const fromStr = format(start, 'yyyy-MM-dd')
    const toStr = format(end, 'yyyy-MM-dd')
    setDateFrom(fromStr)
    setDateTo(toStr)
    router.push(`/reports?from=${fromStr}&to=${toStr}`)
  }

  const handleCustomQuery = () => {
    if (dateFrom && dateTo) {
      router.push(`/reports?from=${dateFrom}&to=${dateTo}`)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">报表</h2>
        <p className="text-sm text-gray-400 mt-1">
          营业数据统计 · {from} 至 {to}
        </p>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {QUICK_FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => applyFilter(f.days, f.weekStart, f.monthStart)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {f.label}
          </button>
        ))}
        <div className="flex items-center gap-2 ml-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-[150px] h-9"
          />
          <span className="text-gray-400 text-sm">至</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-[150px] h-9"
          />
          <button
            onClick={handleCustomQuery}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
          >
            查询
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              总收入
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalAmount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              订单数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{orders.length} 单</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              平均订单金额
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(avgAmount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              最高订单金额
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(highestOrder)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Daily Revenue Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">每日收入</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyData.length === 0 ? (
              <p className="text-center text-gray-400 py-8">暂无数据</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v: string) => v.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), '收入']}
                    labelFormatter={(label: string) => `日期: ${label}`}
                  />
                  <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Shoot Type Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">拍摄类型分布</CardTitle>
          </CardHeader>
          <CardContent>
            {typeData.length === 0 ? (
              <p className="text-center text-gray-400 py-8">暂无数据</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {typeData.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Detail Table */}
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">每日明细</CardTitle>
          <button
            onClick={() => alert('导出功能即将上线')}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            导出
          </button>
        </CardHeader>
        <CardContent>
          {dailyData.length === 0 ? (
            <p className="text-center text-gray-400 py-8">暂无数据</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">
                    日期
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">
                    订单数
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">
                    收入
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">
                    平均客单价
                  </th>
                </tr>
              </thead>
              <tbody>
                {dailyData.map((d) => (
                  <tr
                    key={d.date}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm">{d.date}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant="outline">{d.count} 单</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold">
                      {formatCurrency(d.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatCurrency(d.count > 0 ? d.amount / d.count : 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Recent Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">近期订单</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-center text-gray-400 py-8">暂无订单</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">
                    订单号
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">
                    拍摄类型
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">
                    金额
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">
                    状态
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">
                    日期
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders
                  .slice()
                  .reverse()
                  .slice(0, 20)
                  .map((o) => (
                    <tr
                      key={o.id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-semibold">
                        {o.orderNo}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant="secondary">{o.shootType}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        {formatCurrency(Number(o.amount) || 0)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {o.status}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {o.createdAt.slice(0, 10)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
