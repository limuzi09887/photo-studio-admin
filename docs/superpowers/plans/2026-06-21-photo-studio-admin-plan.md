# 照相馆经营管理系统 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建照相馆经营管理系统 MVP，实现订单管理、AI修图、邮件交付、经营报表四核心闭环。

**Architecture:** Next.js 14 App Router 全栈单体，PostgreSQL + Prisma ORM，Cloudflare R2 文件存储，阿里云视觉智能 API 修图，nodemailer 邮件发送，Railway 部署。

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Prisma, PostgreSQL, Cloudflare R2 SDK, Recharts, nodemailer, react-email

---

## 文件结构总览

```
photo-studio-admin/
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env.example
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # 概览
│   │   ├── orders/
│   │   │   ├── page.tsx                # 订单列表
│   │   │   ├── new/page.tsx            # 新建订单
│   │   │   └── [id]/
│   │   │       ├── page.tsx            # 订单摘要
│   │   │       ├── customer/page.tsx
│   │   │       ├── billing/page.tsx
│   │   │       ├── upload/page.tsx
│   │   │       ├── ai-retouch/page.tsx
│   │   │       ├── negatives/page.tsx
│   │   │       ├── finals/page.tsx
│   │   │       └── email/page.tsx
│   │   ├── customers/page.tsx
│   │   ├── photos/page.tsx
│   │   └── reports/page.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   └── sidebar.tsx
│   │   ├── dashboard/
│   │   │   ├── stat-card.tsx
│   │   │   ├── pending-alerts.tsx
│   │   │   └── recent-orders.tsx
│   │   ├── orders/
│   │   │   ├── order-card.tsx
│   │   │   ├── progress-bar.tsx
│   │   │   ├── order-search.tsx
│   │   │   └── order-list.tsx
│   │   ├── ai-retouch/
│   │   │   ├── params-panel.tsx
│   │   │   └── before-after.tsx
│   │   ├── billing/
│   │   │   ├── product-table.tsx
│   │   │   └── payment-record.tsx
│   │   ├── email/
│   │   │   ├── email-preview.tsx
│   │   │   └── attachment-list.tsx
│   │   └── ui/                        # shadcn/ui 自动生成
│   ├── lib/
│   │   ├── db.ts
│   │   ├── r2.ts
│   │   ├── ai.ts
│   │   ├── email.ts
│   │   └── utils.ts
│   └── types/
│       └── index.ts
├── docs/
│   └── superpowers/
│       ├── specs/2026-06-21-photo-studio-admin-design.md
│       └── plans/2026-06-21-photo-studio-admin-plan.md
└── .env.example
```

---

## 阶段一：项目脚手架 + 数据库

### Task 1: 初始化 Next.js 项目

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/globals.css`

- [ ] **Step 1: 创建 Next.js 项目**

```bash
npx create-next-app@latest photo-studio-admin --typescript --tailwind --eslint --app --src-dir --no-import-alias
cd photo-studio-admin
```

- [ ] **Step 2: 安装核心依赖**

```bash
npm install prisma @prisma/client zod react-hot-toast recharts
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm install nodemailer react-email @react-email/components
npm install date-fns
npm install -D @types/nodemailer
```

- [ ] **Step 3: 初始化 shadcn/ui**

```bash
npx shadcn@latest init
# Select: Default style, Neutral base color, yes to CSS variables
```

- [ ] **Step 4: 安装 shadcn 组件**

```bash
npx shadcn@latest add button input select table card dialog tabs separator badge progress textarea label toast sonner
```

- [ ] **Step 5: 初始化 Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 6: 创建 .env.example**

```env
DATABASE_URL=postgresql://user:password@host:5432/photo_studio
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://your-bucket.your-account.r2.cloudflarestorage.com
ALIYUN_AI_ACCESS_KEY=
ALIYUN_AI_SECRET=
SMTP_HOST=smtp.qq.com
SMTP_PORT=465
SMTP_USER=your-email@qq.com
SMTP_PASS=your-auth-code
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: scaffold Next.js project with dependencies"
```

---

### Task 2: 数据库 Schema + 类型定义

**Files:**
- Create: `prisma/schema.prisma`, `src/lib/db.ts`, `src/types/index.ts`

- [ ] **Step 1: 编写 Prisma Schema**

`prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Customer {
  id        String   @id @default(cuid())
  name      String
  phone     String
  email     String   @default("")
  remark    String   @default("") @db.Text
  createdAt DateTime @default(now()) @map("created_at")
  orders    Order[]

  @@index([phone])
  @@map("customers")
}

model Order {
  id              String    @id @default(cuid())
  orderNo         String    @unique @map("order_no")
  customerId      String    @map("customer_id")
  customer        Customer  @relation(fields: [customerId], references: [id])
  shootType       String    @map("shoot_type")
  amount          Decimal?  @db.Decimal(10, 2)
  status          String    @default("已创建")
  appointmentTime DateTime? @map("appointment_time")
  shootTime       DateTime? @map("shoot_time")
  createdAt       DateTime  @default(now()) @map("created_at")

  files        OrderFile[]
  products     OrderProduct[]
  payments     Payment[]
  emailRecords EmailRecord[]

  @@index([customerId])
  @@index([status])
  @@index([createdAt])
  @@map("orders")
}

model OrderFile {
  id        String   @id @default(cuid())
  orderId   String   @map("order_id")
  order     Order    @relation(fields: [orderId], references: [id])
  fileName  String   @map("file_name")
  fileUrl   String   @map("file_url") @db.Text
  fileSize  BigInt   @map("file_size")
  fileType  String   @map("file_type") // ORIGINAL, AI_RESULT, FINAL
  aiParams  Json?    @map("ai_params")
  createdAt DateTime @default(now()) @map("created_at")

  @@index([orderId])
  @@index([fileType])
  @@map("order_files")
}

model OrderProduct {
  id        String  @id @default(cuid())
  orderId   String  @map("order_id")
  order     Order   @relation(fields: [orderId], references: [id])
  name      String
  unitPrice Decimal @map("unit_price") @db.Decimal(10, 2)
  quantity  Int     @default(1)
  subtotal  Decimal @db.Decimal(10, 2)

  @@map("order_products")
}

model Payment {
  id       String   @id @default(cuid())
  orderId  String   @map("order_id")
  order    Order    @relation(fields: [orderId], references: [id])
  amount   Decimal  @db.Decimal(10, 2)
  method   String
  type     String   @default("尾款") // 定金 or 尾款
  paidAt   DateTime @default(now()) @map("paid_at")

  @@map("payments")
}

model EmailRecord {
  id            String   @id @default(cuid())
  orderId       String   @map("order_id")
  order         Order    @relation(fields: [orderId], references: [id])
  receiverEmail String   @map("receiver_email")
  subject       String   @default("")
  status        String   @default("成功") // 成功, 失败
  errorMessage  String?  @map("error_message") @db.Text
  sentAt        DateTime @default(now()) @map("sent_at")

  @@map("email_records")
}

model ShootType {
  id    String @id @default(cuid())
  name  String @unique
  price Decimal? @db.Decimal(10, 2)
  description String @default("")

  @@map("shoot_types")
}

model EmailTemplate {
  id      String @id @default(cuid())
  name    String
  subject String
  body    String @db.Text
  isDefault Boolean @default(false) @map("is_default")

  @@map("email_templates")
}
```

- [ ] **Step 2: 创建 Prisma 客户端单例**

`src/lib/db.ts`:
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 3: 创建共享类型**

`src/types/index.ts`:
```typescript
export type OrderStatus =
  | '已创建'
  | '已拍摄'
  | '一类修片中'
  | '待精修'
  | '待客户确认'
  | '待发送'
  | '已完成'
  | '已取消'
  | '发送失败'

export type FileType = 'ORIGINAL' | 'AI_RESULT' | 'FINAL'

export type PaymentMethod = '微信支付' | '支付宝' | '现金' | '银行转账'

export type PaymentType = '定金' | '尾款'

export type AiRetouchParams = {
  bgColor: string       // 背景色 hex
  clarity: string       // 清晰度等级
  brightness: string    // 亮度等级
  skinSmooth: string    // 肤色匀称等级
}

export type ProgressStep = 1 | 2 | 3 | 4

export type EmailSendStatus = '成功' | '失败'
```

- [ ] **Step 4: 生成 Prisma 客户端 + 推送数据库**

```bash
npx prisma generate
# 注意：需要先有 PostgreSQL 数据库才能 push
# npx prisma db push
```

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma src/lib/db.ts src/types/index.ts
git commit -m "feat: add database schema and shared types"
```

---

## 阶段二：布局 + 通用组件

### Task 3: 根布局 + 侧边栏

**Files:**
- Create: `src/components/layout/sidebar.tsx`
- Modify: `src/app/layout.tsx`, `src/app/globals.css`

- [ ] **Step 1: 创建侧边栏组件**

`src/components/layout/sidebar.tsx`:
```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', label: '概览', icon: '📊' },
  { href: '/orders', label: '订单管理', icon: '📋' },
  { href: '/customers', label: '客资', icon: '👥' },
  { href: '/photos', label: '照片', icon: '🖼️' },
  { href: '/reports', label: '报表', icon: '📈' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-[220px] bg-[#1a1a2e] rounded-2xl flex flex-col text-white flex-shrink-0">
      <div className="px-5 py-6 border-b border-white/10">
        <h1 className="text-lg font-bold">📷 光影照相馆</h1>
        <p className="text-xs text-gray-400 mt-1">经营管理后台</p>
      </div>
      <nav className="px-3 py-2 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-colors',
                isActive
                  ? 'bg-indigo-500/20 text-indigo-400 font-semibold'
                  : 'text-gray-400 hover:bg-white/5'
              )}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-2">
        <button className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-white/5 w-full">
          <span>🚪</span> 退出
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: 创建工具函数**

`src/lib/utils.ts`:
```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN')}`
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}

export function generateOrderNo(): string {
  const now = new Date()
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '')
  const seq = String(Math.floor(Math.random() * 999)).padStart(3, '0')
  return `PS${datePart}${seq}`
}

export function maskPhone(phone: string): string {
  if (phone.length < 7) return phone
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}
```

```bash
npm install clsx tailwind-merge
```

- [ ] **Step 3: 更新根布局**

`src/app/layout.tsx`:
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Sidebar } from '@/components/layout/sidebar'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '光影照相馆 - 经营管理后台',
  description: '照相馆经营管理系统',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <div className="flex gap-6 min-h-screen p-4 bg-gray-50">
          <Sidebar />
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  )
}
```

- [ ] **Step 4: 更新全局样式**

`src/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 239 84% 67%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --radius: 0.75rem;
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/sidebar.tsx src/app/layout.tsx src/app/globals.css src/lib/utils.ts
git commit -m "feat: add root layout with sidebar navigation"
```

---

## 阶段三：概览页面（首页）

### Task 4: 概览页面

**Files:**
- Create: `src/app/page.tsx`, `src/components/dashboard/stat-card.tsx`, `src/components/dashboard/pending-alerts.tsx`, `src/components/dashboard/recent-orders.tsx`

- [ ] **Step 1: 创建统计卡片组件**

`src/components/dashboard/stat-card.tsx`:
```typescript
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string
  sub?: string
  trend?: 'up' | 'down'
  trendText?: string
}

export function StatCard({ label, value, sub, trend, trendText }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <p className="text-sm text-gray-400">{label}</p>
      <h3 className="text-2xl font-bold mt-2 text-gray-900">{value}</h3>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      {trendText && (
        <p className={cn('text-xs mt-1', trend === 'up' ? 'text-green-500' : 'text-red-500')}>
          {trend === 'up' ? '↑' : '↓'} {trendText}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: 创建待处理提醒组件**

`src/components/dashboard/pending-alerts.tsx`:
```typescript
import { prisma } from '@/lib/db'

export async function PendingAlerts() {
  const [aiPending, emailPending, overdue] = await Promise.all([
    prisma.order.count({ where: { status: '一类修片中' } }),
    prisma.order.count({ where: { status: '待发送' } }),
    prisma.order.count({
      where: {
        status: { notIn: ['已完成', '已取消'] },
        createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ])

  const alerts = [
    { icon: '🖼️', label: '待一类修片', count: aiPending, color: 'bg-amber-50 border-amber-200 text-amber-700' },
    { icon: '📧', label: '待邮件发送', count: emailPending, color: 'bg-amber-50 border-amber-200 text-amber-700' },
    ...(overdue > 0 ? [{ icon: '⚠️', label: '超时未交付', count: overdue, color: 'bg-red-50 border-red-200 text-red-600' }] : []),
  ]

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <h3 className="text-base font-semibold mb-4">⏳ 待处理</h3>
      <div className="flex flex-col gap-3">
        {alerts.map((a, i) => (
          <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${a.color}`}>
            <span className="text-sm">{a.icon} {a.label}</span>
            <span className="text-lg font-bold">{a.count} 单</span>
          </div>
        ))}
        {alerts.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">暂无待处理事项 🎉</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 创建最近订单组件**

`src/components/dashboard/recent-orders.tsx`:
```typescript
import { prisma } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  '已创建': 'bg-indigo-100 text-indigo-700',
  '已拍摄': 'bg-blue-100 text-blue-700',
  '一类修片中': 'bg-amber-100 text-amber-700',
  '待精修': 'bg-orange-100 text-orange-700',
  '待发送': 'bg-amber-100 text-amber-700',
  '已完成': 'bg-emerald-100 text-emerald-700',
}

export async function RecentOrders() {
  const orders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { customer: true },
  })

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <h3 className="text-base font-semibold mb-4">📋 最近订单</h3>
      <div className="flex flex-col gap-2">
        {orders.map((o) => (
          <Link key={o.id} href={`/orders/${o.id}`}
            className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
          >
            <div>
              <span className="text-sm font-semibold">{o.orderNo}</span>
              <br />
              <span className="text-xs text-gray-400">{o.customer.name} · {o.shootType}</span>
            </div>
            <Badge className={STATUS_COLORS[o.status] || 'bg-gray-100'} variant="secondary">
              {o.status}
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 创建首页概览页面**

`src/app/page.tsx`:
```typescript
import { prisma } from '@/lib/db'
import { StatCard } from '@/components/dashboard/stat-card'
import { PendingAlerts } from '@/components/dashboard/pending-alerts'
import { RecentOrders } from '@/components/dashboard/recent-orders'
import { formatCurrency, formatFileSize } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [todayOrders, todayAmount, todayOriginals, todayAiResults, todayFinals] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
    prisma.order.aggregate({
      _sum: { amount: true },
      where: { createdAt: { gte: today, lt: tomorrow } },
    }),
    prisma.orderFile.aggregate({
      _count: true,
      _sum: { fileSize: true },
      where: { fileType: 'ORIGINAL', createdAt: { gte: today, lt: tomorrow } },
    }),
    prisma.orderFile.aggregate({
      _count: true,
      _sum: { fileSize: true },
      where: { fileType: 'AI_RESULT', createdAt: { gte: today, lt: tomorrow } },
    }),
    prisma.orderFile.aggregate({
      _count: true,
      _sum: { fileSize: true },
      where: { fileType: 'FINAL', createdAt: { gte: today, lt: tomorrow } },
    }),
  ])

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">概览</h2>
        <p className="text-sm text-gray-400 mt-1">
          {today.toLocaleDateString('zh-CN')} · 今日经营数据总览
        </p>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-6">
        <StatCard
          label="今日订单金额"
          value={formatCurrency(Number(todayAmount._sum.amount) || 0)}
          trend="up" trendText="vs 昨日"
        />
        <StatCard label="今日订单量" value={`${todayOrders} 单`} />
        <StatCard
          label="今日原片"
          value={`${todayOriginals._count} 张`}
          sub={`共 ${formatFileSize(Number(todayOriginals._sum.fileSize) || 0)}`}
        />
        <StatCard
          label="今日成片"
          value={`${todayAiResults._count} 张`}
          sub={`共 ${formatFileSize(Number(todayAiResults._sum.fileSize) || 0)}`}
        />
        <StatCard
          label="今日底片"
          value={`${todayFinals._count} 张`}
          sub={`共 ${formatFileSize(Number(todayFinals._sum.fileSize) || 0)}`}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <PendingAlerts />
        <RecentOrders />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/components/dashboard/
git commit -m "feat: add dashboard overview page with stats and alerts"
```

---

## 阶段四：订单管理

### Task 5: 订单列表（卡片式 + 搜索 + 进度条）

**Files:**
- Create: `src/app/orders/page.tsx`, `src/components/orders/order-card.tsx`, `src/components/orders/progress-bar.tsx`, `src/components/orders/order-search.tsx`

- [ ] **Step 1: 创建进度条组件**

`src/components/orders/progress-bar.tsx`:
```typescript
import { cn } from '@/lib/utils'
import type { ProgressStep } from '@/types'

const STEPS: { step: ProgressStep; label: string }[] = [
  { step: 1, label: '已拍摄原片' },
  { step: 2, label: '后期修片已完成' },
  { step: 3, label: '顾客可下载' },
  { step: 4, label: '订单结束' },
]

function getCurrentStep(status: string): ProgressStep {
  const map: Record<string, ProgressStep> = {
    '已创建': 1,
    '已拍摄': 1,
    '一类修片中': 2,
    '待精修': 2,
    '待客户确认': 3,
    '待发送': 3,
    '已完成': 4,
  }
  return map[status] || 1
}

export function ProgressBar({ status }: { status: string }) {
  const current = getCurrentStep(status)

  return (
    <div className="flex items-center gap-0 mt-4">
      {STEPS.map((s, i) => {
        const isDone = s.step <= current
        const isLast = i === STEPS.length - 1
        return (
          <div key={s.step} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-1.5">
              <div className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                isDone ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-400'
              )}>
                {isDone ? '✓' : s.step}
              </div>
              <span className={cn(
                'text-xs font-semibold whitespace-nowrap',
                isDone ? 'text-indigo-500' : 'text-gray-400'
              )}>
                {s.label}
              </span>
            </div>
            {!isLast && (
              <div className={cn(
                'flex-1 h-0.5 mx-3 rounded',
                s.step < current ? 'bg-indigo-500' : 'bg-gray-200'
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: 创建订单卡片组件**

`src/components/orders/order-card.tsx`:
```typescript
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ProgressBar } from './progress-bar'
import { formatDateTime, maskPhone } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  '已创建': 'bg-indigo-100 text-indigo-700',
  '已拍摄': 'bg-blue-100 text-blue-700',
  '一类修片中': 'bg-amber-100 text-amber-700',
  '待精修': 'bg-orange-100 text-orange-700',
  '待客户确认': 'bg-purple-100 text-purple-700',
  '待发送': 'bg-yellow-100 text-yellow-700',
  '已完成': 'bg-emerald-100 text-emerald-700',
  '已取消': 'bg-red-100 text-red-700',
  '发送失败': 'bg-red-100 text-red-700',
}

interface OrderCardProps {
  order: {
    id: string
    orderNo: string
    status: string
    shootType: string
    appointmentTime: Date | null
    shootTime: Date | null
    createdAt: Date
    customer: { name: string; phone: string }
  }
}

export function OrderCard({ order }: OrderCardProps) {
  return (
    <Link href={`/orders/${order.id}`}
      className="block bg-white rounded-2xl p-6 border border-gray-100 hover:border-indigo-200 hover:shadow-sm transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400">
            创建时间：{formatDateTime(order.createdAt)}
          </span>
          <span className="text-gray-200">|</span>
          <span className="text-xs text-gray-400">
            拍摄时间：{order.shootTime ? formatDateTime(order.shootTime) : '-'}
          </span>
        </div>
        <Badge className={STATUS_COLORS[order.status] || 'bg-gray-100'} variant="secondary">
          {order.status}
        </Badge>
      </div>

      <div className="flex items-center gap-6">
        <div className="min-w-[140px]">
          <p className="text-sm text-gray-400">订单号</p>
          <p className="text-base font-bold text-gray-900">{order.orderNo}</p>
        </div>
        <div className="min-w-[100px]">
          <p className="text-sm text-gray-400">客户</p>
          <p className="text-base font-semibold text-gray-900">{order.customer.name}</p>
        </div>
        <div className="min-w-[140px]">
          <p className="text-sm text-gray-400">手机号</p>
          <p className="text-base text-gray-700">{maskPhone(order.customer.phone)}</p>
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-400">客户服务</p>
          <p className="text-base font-semibold text-indigo-500">📸 {order.shootType}</p>
        </div>
        <span className="text-sm text-indigo-500 font-semibold whitespace-nowrap">查看详情 →</span>
      </div>

      <ProgressBar status={order.status} />
    </Link>
  )
}
```

- [ ] **Step 3: 创建搜索组件**

`src/components/orders/order-search.tsx`:
```typescript
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

export function OrderSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleSearch(formData: FormData) {
    const params = new URLSearchParams()
    const query = formData.get('query') as string
    const type = formData.get('type') as string
    const status = formData.get('status') as string
    if (query) params.set('query', query)
    if (type && type !== '全部类型') params.set('type', type)
    if (status && status !== '全部状态') params.set('status', status)
    router.push(`/orders?${params.toString()}`)
  }

  return (
    <form action={handleSearch} className="flex gap-3 mb-6">
      <div className="flex-1">
        <Input name="query" placeholder="🔍 输入客户手机号或订单号查询"
          defaultValue={searchParams.get('query') || ''} />
      </div>
      <Select name="type" defaultValue={searchParams.get('type') || '全部类型'}>
        <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="全部类型">全部类型</SelectItem>
          <SelectItem value="1寸">1寸</SelectItem>
          <SelectItem value="2寸">2寸</SelectItem>
          <SelectItem value="签证照">签证照</SelectItem>
          <SelectItem value="身份证">身份证</SelectItem>
          <SelectItem value="商务半身照">商务半身照</SelectItem>
          <SelectItem value="婚纱照">婚纱照</SelectItem>
          <SelectItem value="艺术写真">艺术写真</SelectItem>
          <SelectItem value="全家福">全家福</SelectItem>
        </SelectContent>
      </Select>
      <Select name="status" defaultValue={searchParams.get('status') || '全部状态'}>
        <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="全部状态">全部状态</SelectItem>
          <SelectItem value="已创建">已创建</SelectItem>
          <SelectItem value="已拍摄">已拍摄</SelectItem>
          <SelectItem value="一类修片中">一类修片中</SelectItem>
          <SelectItem value="待发送">待发送</SelectItem>
          <SelectItem value="已完成">已完成</SelectItem>
        </SelectContent>
      </Select>
      <Button type="submit" variant="default">搜索</Button>
    </form>
  )
}
```

- [ ] **Step 4: 创建订单列表页**

`src/app/orders/page.tsx`:
```typescript
import { prisma } from '@/lib/db'
import { OrderCard } from '@/components/orders/order-card'
import { OrderSearch } from '@/components/orders/order-search'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; type?: string; status?: string }>
}) {
  const params = await searchParams
  const where: any = {}

  if (params.query) {
    where.OR = [
      { orderNo: { contains: params.query } },
      { customer: { phone: { contains: params.query } } },
      { customer: { name: { contains: params.query } } },
    ]
  }
  if (params.type && params.type !== '全部类型') {
    where.shootType = params.type
  }
  if (params.status && params.status !== '全部状态') {
    where.status = params.status
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { customer: true },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">订单管理</h2>
          <p className="text-sm text-gray-400 mt-1">共 {orders.length} 单</p>
        </div>
        <Link href="/orders/new">
          <Button className="bg-indigo-500 hover:bg-indigo-600 rounded-lg px-6 py-2.5 text-sm font-semibold">
            ➕ 新建订单
          </Button>
        </Link>
      </div>

      <OrderSearch />

      <div className="flex flex-col gap-4">
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} />
        ))}
        {orders.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-2">📭</p>
            <p>暂无订单</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/orders/ src/components/orders/
git commit -m "feat: add order list with card view, search, and progress bar"
```

---

### Task 6: 新建订单

**Files:**
- Create: `src/app/orders/new/page.tsx`

- [ ] **Step 1: 创建新建订单 Server Action + 页面**

`src/app/orders/new/page.tsx`:
```typescript
import { prisma } from '@/lib/db'
import { generateOrderNo } from '@/lib/utils'
import { redirect } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

const SHOOT_TYPES = ['1寸', '2寸', '签证照', '身份证', '商务半身照', '婚纱照', '艺术写真', '全家福']

async function createOrder(formData: FormData) {
  'use server'

  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const email = formData.get('email') as string
  const shootType = formData.get('shootType') as string
  const amount = formData.get('amount') as string
  const appointmentTime = formData.get('appointmentTime') as string

  if (!name || !phone || !email || !shootType) {
    throw new Error('请填写所有必填字段')
  }

  const orderNo = generateOrderNo()

  // Upsert customer
  const customer = await prisma.customer.upsert({
    where: { phone },
    update: { name, email },
    create: { name, phone, email },
  })

  await prisma.order.create({
    data: {
      orderNo,
      customerId: customer.id,
      shootType,
      amount: amount ? parseFloat(amount) : undefined,
      appointmentTime: appointmentTime ? new Date(appointmentTime) : undefined,
    },
  })

  redirect('/orders')
}

export default function NewOrderPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">新建订单</h2>
        <p className="text-sm text-gray-400 mt-1">录入客户信息和拍摄需求</p>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-gray-100 max-w-2xl">
        <form action={createOrder} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">客户姓名 *</Label>
              <Input id="name" name="name" required placeholder="请输入客户姓名" />
            </div>
            <div>
              <Label htmlFor="phone">手机号 *</Label>
              <Input id="phone" name="phone" required placeholder="请输入手机号" />
            </div>
          </div>

          <div>
            <Label htmlFor="email">邮箱 *</Label>
            <Input id="email" name="email" type="email" required placeholder="用于接收成片" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shootType">拍摄类型 *</Label>
              <Select name="shootType" required>
                <SelectTrigger><SelectValue placeholder="请选择拍摄类型" /></SelectTrigger>
                <SelectContent>
                  {SHOOT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">订单金额</Label>
              <Input id="amount" name="amount" type="number" step="0.01" placeholder="选填" />
            </div>
          </div>

          <div>
            <Label htmlFor="appointmentTime">拍摄日期</Label>
            <Input id="appointmentTime" name="appointmentTime" type="datetime-local" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="bg-indigo-500 hover:bg-indigo-600">创建订单</Button>
            <Button type="button" variant="outline" onClick={() => window.history.back()}>取消</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/orders/new/
git commit -m "feat: add new order creation page with server action"
```

---

## 阶段五：订单详情（核心 8 模块）

### Task 7: 订单摘要 + 客户信息

**Files:**
- Create: `src/app/orders/[id]/page.tsx`, `src/app/orders/[id]/layout.tsx`, `src/app/orders/[id]/customer/page.tsx`

- [ ] **Step 1: 创建订单详情布局（含二级导航）**

`src/app/orders/[id]/layout.tsx`:
```typescript
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'

const SUB_NAV = [
  { href: '', label: '① 订单摘要' },
  { href: '/customer', label: '② 客户信息' },
  { href: '/billing', label: '③ 账单/收款' },
  { href: '/upload', label: '④ 原图上传' },
  { href: '/ai-retouch', label: '⑤ 一类修片' },
  { href: '/negatives', label: '⑥ 修图底片' },
  { href: '/finals', label: '⑦ 成片管理' },
  { href: '/email', label: '⑧ 邮件发送' },
]

export default async function OrderDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) notFound()

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <Link href="/orders" className="text-gray-400 text-sm hover:text-gray-600">← 订单管理</Link>
        <span className="text-gray-200">|</span>
        <h2 className="text-lg font-bold">订单详情</h2>
        <span className="text-gray-400 text-sm">{order.orderNo}</span>
      </div>

      <div className="flex gap-5">
        <nav className="w-[180px] flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {SUB_NAV.map((item) => {
              const fullHref = `/orders/${id}${item.href}`
              // Active detection would need client component; simplified here
              return (
                <Link key={item.href} href={fullHref}
                  className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 border-l-3 border-transparent hover:border-indigo-500 transition-colors"
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>

        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 创建订单摘要页**

`src/app/orders/[id]/page.tsx`:
```typescript
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { ProgressBar } from '@/components/orders/progress-bar'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'

export default async function OrderSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: { customer: true },
  })
  if (!order) notFound()

  return (
    <div className="bg-white rounded-2xl p-7 border border-gray-100">
      <h3 className="text-lg font-bold mb-5">订单摘要</h3>

      <div className="bg-gray-50 rounded-xl p-5 mb-6">
        <ProgressBar status={order.status} />
      </div>

      <div className="grid grid-cols-2 gap-5 mb-6">
        <InfoBox label="订单号" value={order.orderNo} />
        <InfoBox label="订单状态" value={<Badge variant="secondary">{order.status}</Badge>} />
        <InfoBox label="创建时间" value={formatDateTime(order.createdAt)} />
        <InfoBox label="拍摄时间" value={order.shootTime ? formatDateTime(order.shootTime) : '-'} />
      </div>

      <h4 className="text-base font-semibold mb-4">客户信息</h4>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <InfoBox label="客户姓名" value={order.customer.name} />
        <InfoBox label="手机号" value={order.customer.phone} />
        <InfoBox label="邮箱" value={order.customer.email || '-'} />
        <InfoBox label="客户服务" value={`📸 ${order.shootType}`} />
      </div>

      <h4 className="text-base font-semibold mb-4">原图与修图概览</h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400 mb-2">原图</p>
          <div className="bg-gray-200 rounded-lg h-[120px] flex items-center justify-center text-sm text-gray-500">
            📷 12 张原图
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400 mb-2">一类修片结果</p>
          <div className="bg-gray-200 rounded-lg h-[120px] flex items-center justify-center text-sm text-gray-500">
            🖼️ 处理中 8/12 张
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoBox({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <div className="text-base font-semibold">{value}</div>
    </div>
  )
}
```

- [ ] **Step 3: 创建客户信息编辑页**

`src/app/orders/[id]/customer/page.tsx`:
```typescript
import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

async function updateCustomer(formData: FormData) {
  'use server'
  const orderId = formData.get('orderId') as string
  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const email = formData.get('email') as string
  const remark = formData.get('remark') as string

  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) notFound()

  await prisma.customer.update({
    where: { id: order.customerId },
    data: { name, phone, email, remark },
  })

  redirect(`/orders/${orderId}/customer`)
}

export default async function CustomerInfoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: { customer: true },
  })
  if (!order) notFound()
  const c = order.customer

  return (
    <div className="bg-white rounded-2xl p-7 border border-gray-100">
      <h3 className="text-lg font-bold mb-5">客户信息</h3>
      <form action={updateCustomer} className="space-y-4 max-w-xl">
        <input type="hidden" name="orderId" value={id} />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">客户姓名</Label>
            <Input id="name" name="name" defaultValue={c.name} required />
          </div>
          <div>
            <Label htmlFor="phone">手机号</Label>
            <Input id="phone" name="phone" defaultValue={c.phone} required />
          </div>
        </div>
        <div>
          <Label htmlFor="email">邮箱</Label>
          <Input id="email" name="email" type="email" defaultValue={c.email} />
        </div>
        <div>
          <Label htmlFor="remark">备注</Label>
          <Textarea id="remark" name="remark" defaultValue={c.remark} rows={3} />
        </div>
        <Button type="submit" className="bg-indigo-500 hover:bg-indigo-600">保存修改</Button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/orders/\[id\]/
git commit -m "feat: add order detail layout, summary, and customer info pages"
```

---

### Task 8: 原图上传

**Files:**
- Create: `src/app/orders/[id]/upload/page.tsx`, `src/lib/r2.ts`

- [ ] **Step 1: 创建 R2 上传工具**

`src/lib/r2.ts`:
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.R2_BUCKET!
const PUBLIC_URL = process.env.R2_PUBLIC_URL!

export async function getUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(r2, command, { expiresIn: 3600 })
}

export function getPublicUrl(key: string): string {
  return `${PUBLIC_URL}/${key}`
}

export { r2, BUCKET }
```

- [ ] **Step 2: 创建原图上传页面**

`src/app/orders/[id]/upload/page.tsx`:
```typescript
import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import { getUploadUrl, getPublicUrl } from '@/lib/r2'

async function uploadOriginal(formData: FormData) {
  'use server'
  const orderId = formData.get('orderId') as string
  const fileKeys = formData.getAll('fileKeys') as string[]
  const fileNames = formData.getAll('fileNames') as string[]
  const fileSizes = formData.getAll('fileSizes') as string[]

  if (fileKeys.length === 0) return

  await prisma.orderFile.createMany({
    data: fileKeys.map((key, i) => ({
      orderId,
      fileName: fileNames[i] || key.split('/').pop()!,
      fileUrl: getPublicUrl(key),
      fileSize: BigInt(fileSizes[i] || '0'),
      fileType: 'ORIGINAL',
    })),
  })

  // Update shoot_time if first upload
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (order && !order.shootTime) {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        shootTime: new Date(),
        status: order.status === '已创建' ? '已拍摄' : undefined,
      },
    })
  }

  redirect(`/orders/${orderId}/upload`)
}

export default async function UploadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [order, files] = await Promise.all([
    prisma.order.findUnique({ where: { id } }),
    prisma.orderFile.findMany({
      where: { orderId: id, fileType: 'ORIGINAL' },
      orderBy: { createdAt: 'desc' },
    }),
  ])
  if (!order) notFound()

  return (
    <div className="bg-white rounded-2xl p-7 border border-gray-100">
      <h3 className="text-lg font-bold mb-5">原图上传</h3>

      <form action={uploadOriginal} className="space-y-4">
        <input type="hidden" name="orderId" value={id} />

        <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-indigo-400 transition-colors cursor-pointer">
          <p className="text-4xl mb-3">📤</p>
          <p className="text-base font-semibold text-gray-700">拖拽照片到此处，或点击上传</p>
          <p className="text-sm text-gray-400 mt-1">支持 JPG / PNG / HEIC / RAW，可批量上传</p>
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            id="file-upload"
            onChange={async (e) => {
              'use client'
              // Client-side upload logic: get presigned URL → upload → submit form with keys
            }}
          />
        </div>

        <input type="hidden" name="fileKeys" value="" />
        <input type="hidden" name="fileNames" value="" />
        <input type="hidden" name="fileSizes" value="" />
      </form>

      {/* File list */}
      <div className="mt-6 grid grid-cols-5 gap-3">
        {files.map((f) => (
          <div key={f.id} className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="h-20 bg-gray-200 rounded flex items-center justify-center text-2xl">🖼️</div>
            <p className="text-xs mt-1 truncate">{f.fileName}</p>
            <p className="text-[10px] text-gray-400">{Number(f.fileSize / 1024n / 1024n)} MB</p>
          </div>
        ))}
      </div>

      {files.length === 0 && (
        <p className="text-center text-gray-400 py-8">暂未上传原图</p>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/orders/\[id\]/upload/ src/lib/r2.ts
git commit -m "feat: add original photo upload with R2 presigned URLs"
```

---

### Task 9: AI 修图（一类修片）

**Files:**
- Create: `src/app/orders/[id]/ai-retouch/page.tsx`, `src/components/ai-retouch/params-panel.tsx`, `src/components/ai-retouch/before-after.tsx`, `src/lib/ai.ts`

- [ ] **Step 1: 创建阿里云 AI 客户端**

`src/lib/ai.ts`:
```typescript
interface AiRetouchParams {
  bgColor: string
  clarity: string
  brightness: string
  skinSmooth: string
}

interface AiRetouchResult {
  success: boolean
  resultUrl?: string
  errorMessage?: string
}

export async function submitAiRetouch(
  originalUrl: string,
  params: AiRetouchParams
): Promise<{ taskId: string }> {
  // 调用阿里云视觉智能 API 提交修图任务
  const response = await fetch('https://vision.aliyuncs.com/api/v1/...', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.ALIYUN_AI_ACCESS_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageUrl: originalUrl,
      actions: [
        params.bgColor !== '保持原背景' && { type: 'changeBackground', color: params.bgColor },
        params.clarity !== '不处理' && { type: 'enhanceFace', level: params.clarity },
        params.brightness !== '保持原亮度' && { type: 'adjustBrightness', level: params.brightness },
        params.skinSmooth !== '不处理' && { type: 'smoothSkin', level: params.skinSmooth },
      ].filter(Boolean),
    }),
  })
  const data = await response.json()
  return { taskId: data.taskId }
}

export async function queryAiResult(taskId: string): Promise<AiRetouchResult> {
  const response = await fetch(`https://vision.aliyuncs.com/api/v1/tasks/${taskId}`, {
    headers: { 'Authorization': `Bearer ${process.env.ALIYUN_AI_ACCESS_KEY}` },
  })
  return response.json()
}
```

- [ ] **Step 2: 创建修图参数面板组件**

`src/components/ai-retouch/params-panel.tsx`:
```typescript
'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface ParamsPanelProps {
  onSubmit: (params: Record<string, string>) => void
  onReset: () => void
  disabled?: boolean
}

export function ParamsPanel({ onSubmit, onReset, disabled }: ParamsPanelProps) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    onSubmit({
      bgColor: form.get('bgColor') as string,
      clarity: form.get('clarity') as string,
      brightness: form.get('brightness') as string,
      skinSmooth: form.get('skinSmooth') as string,
    })
  }

  return (
    <div className="bg-gray-50 rounded-xl p-4 mb-5">
      <h4 className="text-sm font-semibold mb-3">🎛️ 修图参数设置</h4>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div>
            <Label className="text-xs text-gray-500">背景色</Label>
            <Select name="bgColor" defaultValue="#FFFFFF">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="#FFFFFF">白色</SelectItem>
                <SelectItem value="#438EDB">蓝色</SelectItem>
                <SelectItem value="#CC0000">红色</SelectItem>
                <SelectItem value="#D3D3D3">灰色</SelectItem>
                <SelectItem value="keep">保持原背景</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-500">人物清晰度</Label>
            <Select name="clarity" defaultValue="标准增强">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="标准增强">标准增强</SelectItem>
                <SelectItem value="轻度增强">轻度增强</SelectItem>
                <SelectItem value="高度增强">高度增强</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-500">整体亮度</Label>
            <Select name="brightness" defaultValue="自动优化">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="自动优化">自动优化</SelectItem>
                <SelectItem value="调亮+0.5">调亮 +0.5</SelectItem>
                <SelectItem value="调亮+1.0">调亮 +1.0</SelectItem>
                <SelectItem value="keep">保持原亮度</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-500">肤色匀称</Label>
            <Select name="skinSmooth" defaultValue="标准磨皮">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="标准磨皮">标准磨皮</SelectItem>
                <SelectItem value="轻度磨皮">轻度磨皮</SelectItem>
                <SelectItem value="深度磨皮">深度磨皮</SelectItem>
                <SelectItem value="none">不处理</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-3">
          <Button type="submit" disabled={disabled} className="bg-indigo-500 hover:bg-indigo-600 text-sm">
            🚀 提交修图任务
          </Button>
          <Button type="button" variant="outline" onClick={onReset} className="text-sm">重置参数</Button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: 创建左右对比组件 + AI修图页面**

`src/components/ai-retouch/before-after.tsx`:
```typescript
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface BeforeAfterProps {
  original: { name: string; url: string }
  retouched: {
    name: string
    url?: string
    status: '待处理' | '处理中' | '完成' | '失败'
    errorMessage?: string
    processingTime?: number
  }
}

export function BeforeAfter({ original, retouched }: BeforeAfterProps) {
  const statusConfig = {
    '待处理': { color: 'bg-gray-100 text-gray-500', label: '待处理' },
    '处理中': { color: 'bg-amber-100 text-amber-600', label: '处理中' },
    '完成': { color: 'bg-emerald-100 text-emerald-600', label: '完成' },
    '失败': { color: 'bg-red-100 text-red-600', label: '失败' },
  }

  const config = statusConfig[retouched.status]

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-100 px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs font-semibold">原图 · {original.name}</span>
        </div>
        <div className="h-[180px] bg-gray-200 flex items-center justify-center">
          {original.url
            ? <img src={original.url} alt="原图" className="h-full object-cover" />
            : <span className="text-4xl">🌄</span>
          }
        </div>
      </div>

      <div className={`border-2 rounded-xl overflow-hidden ${retouched.status === '完成' ? 'border-indigo-500' : 'border-gray-200'}`}>
        <div className="bg-gray-50 px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs font-semibold">一类修片 · {retouched.name}</span>
          <Badge className={config.color} variant="secondary">{config.label}</Badge>
        </div>
        <div className="h-[180px] flex items-center justify-center"
          style={{ background: retouched.status === '处理中' ? '#fffbeb' : retouched.status === '失败' ? '#fef2f2' : '#fafafe' }}
        >
          {retouched.status === '处理中' && (
            <div className="text-center">
              <div className="w-8 h-8 border-3 border-gray-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-2" />
              <span className="text-xs text-amber-600">AI 处理中...</span>
            </div>
          )}
          {retouched.status === '失败' && (
            <div className="text-center">
              <span className="text-2xl">⚠️</span>
              <p className="text-xs text-red-500 mt-1">{retouched.errorMessage}</p>
              <Button variant="outline" size="sm" className="mt-2 text-xs">重新修图</Button>
            </div>
          )}
          {retouched.status === '完成' && retouched.url && (
            <img src={retouched.url} alt="修图结果" className="h-full object-cover" />
          )}
          {retouched.status === '待处理' && (
            <span className="text-gray-400 text-sm">等待处理</span>
          )}
        </div>
        {retouched.status === '完成' && (
          <div className="px-4 py-2.5 bg-gray-50 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">🕐 处理耗时 {retouched.processingTime}秒</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs">⬇ 下载</Button>
              <Button size="sm" className="bg-indigo-500 hover:bg-indigo-600 text-xs">✅ 确认</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

`src/app/orders/[id]/ai-retouch/page.tsx`:
```typescript
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { AiRetouchClient } from './client'

export default async function AiRetouchPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [order, originalFiles, aiFiles] = await Promise.all([
    prisma.order.findUnique({ where: { id } }),
    prisma.orderFile.findMany({
      where: { orderId: id, fileType: 'ORIGINAL' },
    }),
    prisma.orderFile.findMany({
      where: { orderId: id, fileType: 'AI_RESULT' },
    }),
  ])
  if (!order) notFound()

  return (
    <AiRetouchClient
      orderId={id}
      originalFiles={originalFiles.map(f => ({
        id: f.id,
        name: f.fileName,
        url: f.fileUrl,
      }))}
      aiFiles={aiFiles.map(f => ({
        id: f.id,
        name: f.fileName,
        url: f.fileUrl,
        params: f.aiParams as Record<string, string> | null,
      }))}
    />
  )
}
```

- [ ] **Step 4: 创建客户端组件** (use client for interactive AI retouch)

`src/app/orders/[id]/ai-retouch/client.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { ParamsPanel } from '@/components/ai-retouch/params-panel'
import { BeforeAfter } from '@/components/ai-retouch/before-after'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface FileInfo {
  id: string
  name: string
  url: string
  params?: Record<string, string> | null
}

export function AiRetouchClient({
  orderId,
  originalFiles,
  aiFiles,
}: {
  orderId: string
  originalFiles: FileInfo[]
  aiFiles: FileInfo[]
}) {
  const [processingMap, setProcessingMap] = useState<Record<string, string>>({})
  const router = useRouter()

  async function handleSubmit(params: Record<string, string>) {
    toast.info('修图任务已提交，正在处理...')
    // Call server action to submit AI retouch for each original
    const res = await fetch(`/api/orders/${orderId}/ai-retouch`, {
      method: 'POST',
      body: JSON.stringify({ fileIds: originalFiles.map(f => f.id), params }),
    })
    if (res.ok) {
      toast.success('修图任务提交成功')
      router.refresh()
    } else {
      toast.error('提交失败，请重试')
    }
  }

  return (
    <div className="bg-white rounded-2xl p-7 border border-gray-100">
      <h3 className="text-lg font-bold mb-5">一类修片</h3>

      <ParamsPanel onSubmit={handleSubmit} onReset={() => {}} />

      <h4 className="text-sm font-semibold mb-3">📸 原图 ↔ 一类修片对比</h4>
      <div className="flex flex-col gap-4">
        {originalFiles.map((orig) => {
          const ai = aiFiles.find(f => f.name.replace('_ai', '') === orig.name.replace(/\.[^.]+$/, ''))
          return (
            <BeforeAfter
              key={orig.id}
              original={orig}
              retouched={{
                name: orig.name.replace(/\.[^.]+$/, '_修.jpg'),
                url: ai?.url,
                status: ai ? '完成' : (processingMap[orig.id] ? '处理中' : '待处理'),
              }}
            />
          )
        })}
      </div>

      {originalFiles.length === 0 && (
        <p className="text-center text-gray-400 py-8">暂无原图，请先上传原图</p>
      )}

      {aiFiles.length > 0 && (
        <div className="mt-6 pt-5 border-t border-gray-100 flex justify-between items-center">
          <span className="text-sm text-gray-400">
            共 {originalFiles.length} 张 | 已完成 {aiFiles.length} 张 | 待处理 {originalFiles.length - aiFiles.length} 张
          </span>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">全部重新修图</Button>
            <Button className="bg-indigo-500 hover:bg-indigo-600" size="sm">✅ 确认全部 → 存入修图底片</Button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/orders/\[id\]/ai-retouch/ src/components/ai-retouch/ src/lib/ai.ts
git commit -m "feat: add AI retouch module with before-after comparison"
```

---

### Task 10: 修图底片 + 成片管理

**Files:**
- Create: `src/app/orders/[id]/negatives/page.tsx`, `src/app/orders/[id]/finals/page.tsx`

Due to length constraints, these pages follow the same pattern as the upload page but for `AI_RESULT` and `FINAL` file types respectively. They display file grids with download and delete actions.

- [ ] **Step 1: 修图底片页**

`src/app/orders/[id]/negatives/page.tsx`: Display grid of AI_RESULT files with preview, download, and "再次修图" actions.

- [ ] **Step 2: 成片管理页**

`src/app/orders/[id]/finals/page.tsx`: Upload FINAL files via R2 presigned URLs, display grid with download and preview.

- [ ] **Step 3: Commit**

```bash
git add src/app/orders/\[id\]/negatives/ src/app/orders/\[id\]/finals/
git commit -m "feat: add negative management and final photo management"
```

---

### Task 11: 账单/收款 + 邮件发送

**Files:**
- Create: `src/app/orders/[id]/billing/page.tsx`, `src/app/orders/[id]/email/page.tsx`, `src/lib/email.ts`

- [ ] **Step 1: 账单/收款页** — Product CRUD table + Payment record list + "收尾款" button with method selector. Aggregate cards for total/paid/unpaid.

- [ ] **Step 2: 邮件发送页** — Recipient email input, template selector, live preview with variable substitution, attachment list from FINAL files, send history table, "一键发送" button.

- [ ] **Step 3: 邮件发送库**

`src/lib/email.ts`:
```typescript
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
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
  const result = await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    html,
    attachments,
  })
  return result
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/orders/\[id\]/billing/ src/app/orders/\[id\]/email/ src/lib/email.ts
git commit -m "feat: add billing/payment and email delivery modules"
```

---

## 阶段六：客资 + 照片 + 报表

### Task 12: 客资列表页

**Files:**
- Create: `src/app/customers/page.tsx`

Customer table with columns: name, phone, email, order count, total spent, last shoot date, notes. Search by name/phone. Click to view customer's orders.

- [ ] **Step 1: 创建客资页** — Table with prisma queries, search, pagination.

### Task 13: 照片页

**Files:**
- Create: `src/app/photos/page.tsx`

Tab switcher (今日原片 / 今日成片 / 今日底片). Photo grid with thumbnails, file name, size, order reference. Stats bar at top.

- [ ] **Step 1: 创建照片页** — Grid with R2 URLs, tabs, stats aggregation.

### Task 14: 报表页

**Files:**
- Create: `src/app/reports/page.tsx`

Date range filter (quick: today/yesterday/week/month + custom). Summary cards (total revenue, order count, avg order, unpaid). Bar chart (daily revenue trend). Shooting type breakdown. Daily detail table. Export Excel button.

- [ ] **Step 1: 安装图表库**

```bash
npm install recharts
```

- [ ] **Step 2: 创建报表页** — Server component fetching aggregated data + client chart components.

---

## 阶段七：部署

### Task 15: Railway 部署配置

**Files:**
- Create: `railway.json`, update `.env.example`

- [ ] **Step 1: 创建 Railway 配置**

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npx prisma generate && npm run build"
  },
  "deploy": {
    "startCommand": "npx prisma db push && npm start"
  }
}
```

- [ ] **Step 2: Push 到 GitHub + Railway 关联部署**

```bash
git add -A
git commit -m "feat: complete MVP implementation"
git push origin main
```

---

## 验收清单

完成所有 Task 后，验证以下操作闭环：

- [ ] 创建订单 → 订单出现在列表 → 卡片显示进度条
- [ ] 上传原图 → R2 存储 → 拍摄时间自动记录
- [ ] AI 修图 → 参数提交 → 左右对比 → 确认存入底片
- [ ] 账单添加产品 → 收款记录 → 汇总卡片正确
- [ ] 上传成片 → 成片列表显示
- [ ] 邮件发送 → 模板渲染正确 → 附件包含成片 → 发送记录写入
- [ ] 手机号查询 → 匹配订单显示
- [ ] 概览页数据正确（今日金额/单量/文件统计）
- [ ] 客资页显示所有客户及消费统计
- [ ] 照片页显示今日原片网格
- [ ] 报表筛选日期 → 汇总正确 → 图表渲染
