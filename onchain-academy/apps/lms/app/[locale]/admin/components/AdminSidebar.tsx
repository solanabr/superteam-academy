'use client'

import { ADMIN_NAV_ITEMS } from '@/libs/constants/admin.constants'
import {
  Activity,
  BarChart2,
  BookOpen,
  FileEdit,
  LayoutDashboard,
  LogOut,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  BookOpen,
  FileEdit,
  Users,
  BarChart2,
  Activity,
}

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside
      className='w-60 shrink-0 flex flex-col h-full overflow-hidden'
      style={{ background: 'hsl(var(--green-dark))' }}
    >
      {/* Logo */}
      <div className='px-5 py-6 border-b border-white/10'>
        <div className='flex items-center gap-2.5'>
          <div
            className='w-8 h-8 rounded-lg flex items-center justify-center text-base'
            style={{ background: 'hsl(var(--green-primary))' }}
          >
            🏫
          </div>
          <div>
            <div className='font-display text-sm font-black text-cream leading-none'>
              Superteam
            </div>
            <div className='font-ui text-[0.6rem] text-white/50 tracking-wider uppercase'>
              Admin Panel
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className='flex-1 p-3 overflow-y-auto'>
        <div className='mb-2'>
          <span className='font-ui text-[0.6rem] font-bold tracking-[0.15em] uppercase text-white/30 px-3'>
            Management
          </span>
        </div>

        <div className='flex flex-col gap-1'>
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.icon] || LayoutDashboard
            const isActive =
              item.href === '/en/admin'
                ? pathname === '/en/admin' || pathname === '/en/admin/'
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-ui text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-white/15 text-cream shadow-sm'
                    : 'text-white/60 hover:text-white/90 hover:bg-white/8'
                }`}
              >
                <Icon
                  size={16}
                  strokeWidth={isActive ? 2 : 1.5}
                  className={
                    isActive
                      ? 'text-green-mint'
                      : 'text-white/40 group-hover:text-white/70'
                  }
                />
                {item.label}
                {isActive && (
                  <div className='ml-auto w-1 h-4 rounded-full bg-green-mint' />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className='p-3 border-t border-white/10'>
        <Link
          href='/en/dashboard'
          className='flex items-center gap-3 px-3 py-2.5 rounded-xl font-ui text-sm text-white/50 hover:text-white/80 hover:bg-white/8 transition-all group'
        >
          <LogOut
            size={15}
            strokeWidth={1.5}
            className='text-white/30 group-hover:text-white/60'
          />
          Back to Academy
        </Link>
      </div>
    </aside>
  )
}
