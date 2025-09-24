'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft, Menu } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  title: string
  showBack?: boolean
  showMenu?: boolean
  onMenuClick?: () => void
  rightContent?: React.ReactNode
}

export function Header({ 
  title, 
  showBack = false, 
  showMenu = false,
  onMenuClick,
  rightContent 
}: HeaderProps) {
  const router = useRouter()

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between h-16 px-4">
          {/* 왼쪽 */}
          <div className="flex items-center">
            {showBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="mr-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            {showMenu && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onMenuClick}
                className="mr-2"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <h1 className="text-lg font-semibold truncate">{title}</h1>
          </div>

          {/* 오른쪽 */}
          <div className="flex items-center gap-2">
            {rightContent}
          </div>
        </div>
      </div>
    </header>
  )
}

