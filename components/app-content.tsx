'use client'

import { ReactNode } from 'react'
import { useDemoAuth as useAuth } from './demo-auth-provider'
import { LoginForm } from './login-form'
import { BottomNav } from './layout/bottom-nav'
import { Loading } from './ui/loading'

interface AppContentProps {
  children: ReactNode
}

export function AppContent({ children }: AppContentProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return (
    <>
      <div className="pb-16"> {/* 바텀 네비게이션 공간 확보 */}
        {children}
      </div>
      <BottomNav />
    </>
  )
}
