'use client'

import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { fetchUser, createUser } from '@/lib/api-client'

// 클라이언트용 사용자 타입 정의
interface User {
  id: string
  username: string
  name: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (username: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 컴포넌트 마운트 시 기본 사용자 생성/로그인
  useEffect(() => {
    const initUser = async () => {
      setIsLoading(true)
      try {
        const result = await fetchUser()
        if (result.success && result.data) {
          setUser({
            id: result.data.id,
            username: result.data.username,
            name: result.data.full_name || result.data.username
          })
        }
      } catch (error) {
        console.error('사용자 초기화 오류:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initUser()
  }, [])

  const login = async (username: string) => {
    setIsLoading(true)
    try {
      const result = await createUser(username, username)
      if (result.success && result.data) {
        setUser({
          id: result.data.id,
          username: result.data.username,
          name: result.data.full_name || result.data.username
        })
      }
    } catch (error) {
      console.error('로그인 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
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

