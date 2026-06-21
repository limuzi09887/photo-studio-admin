import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Sidebar } from '@/components/layout/sidebar'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

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
      <body className={`${inter.variable} ${inter.className}`}>
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
