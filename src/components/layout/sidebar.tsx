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
  { href: '/settings', label: '设置', icon: '⚙️' },
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
