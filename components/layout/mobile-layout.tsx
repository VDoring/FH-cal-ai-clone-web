'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MobileLayoutProps {
  children: ReactNode
  className?: string
  showPadding?: boolean
}

export function MobileLayout({ 
  children, 
  className, 
  showPadding = true 
}: MobileLayoutProps) {
  return (
    <div className={cn(
      "min-h-screen bg-gray-50",
      className
    )}>
      <div className={cn(
        "max-w-2xl mx-auto",
        showPadding && "p-4"
      )}>
        {children}
      </div>
    </div>
  )
}

