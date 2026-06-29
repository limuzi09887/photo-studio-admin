import Link from 'next/link'

const SUB_NAV = [
  { href: '/settings/shoot-types', label: '📸 拍摄类型' },
  { href: '/settings/email-templates', label: '📧 邮件模板' },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">设置</h2>
        <p className="text-sm text-gray-400 mt-1">系统配置管理</p>
      </div>

      <div className="flex gap-5">
        <nav className="w-[180px] flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden sticky top-4">
            {SUB_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 border-l-3 border-transparent hover:border-indigo-500 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  )
}
