'use client'

import { createContext, useContext, ReactNode } from 'react'

// 임시 사용자 타입 정의
interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

// 로그인 bypass를 위한 임시 사용자 데이터
const DEMO_USER: User = {
  id: 'demo-user-123',
  email: 'demo@example.com',
  name: '데모 사용자'
}

export function AuthProvider({ children }: AuthProviderProps) {
  // 로그인 기능 bypass - 항상 로그인된 상태로 처리
  const user = DEMO_USER
  const isLoading = false

  const login = async (email: string, password: string) => {
    // 임시 구현 - 실제로는 아무것도 하지 않음
    console.log('Login bypassed with:', { email, password })
  }

  const logout = () => {
    // 임시 구현 - 실제로는 아무것도 하지 않음
    console.log('Logout bypassed')
  }

  const value = {
    user,
    isLoading,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

