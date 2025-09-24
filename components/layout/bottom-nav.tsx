'use client'

import { Home, BarChart3, Camera, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', icon: Home, label: '홈' },
  { href: '/dashboard', icon: BarChart3, label: '식단' },
  { href: '/upload', icon: Camera, label: '기록' },
  { href: '/profile', icon: User, label: '프로필' }
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center p-2 min-w-0 flex-1",
                  "transition-colors duration-200",
                  isActive 
                    ? "text-blue-600" 
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 mb-1",
                  isActive && "text-blue-600"
                )} />
                <span className={cn(
                  "text-xs font-medium",
                  isActive && "text-blue-600"
                )}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

