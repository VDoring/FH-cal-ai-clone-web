'use client'

import { createContext, useContext, ReactNode, useState, useEffect } from 'react'

// 데모용 사용자 타입
interface DemoUser {
  id: string
  email: string
  created_at: string
}

interface DemoAuthContextType {
  user: DemoUser | null
  isLoading: boolean
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  signInAnonymously: () => Promise<void>
  signOut: () => Promise<void>
}

const DemoAuthContext = createContext<DemoAuthContextType | undefined>(undefined)

interface DemoAuthProviderProps {
  children: ReactNode
}

export function DemoAuthProvider({ children }: DemoAuthProviderProps) {
  const [user, setUser] = useState<DemoUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 로컬 스토리지에서 사용자 정보 복원
  useEffect(() => {
    const savedUser = localStorage.getItem('demo_user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem('demo_user')
      }
    }
    setIsLoading(false)
  }, [])

  const signInAnonymously = async () => {
    setIsLoading(true)
    try {
      // 고정된 익명 사용자 UUID (Supabase에 미리 등록됨)
      const anonymousUser: DemoUser = {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'anonymous@demo.com',
        created_at: new Date().toISOString()
      }
      
      setUser(anonymousUser)
      localStorage.setItem('demo_user', JSON.stringify(anonymousUser))
      console.log('데모 익명 로그인 성공:', anonymousUser.id)
    } catch (error) {
      console.error('데모 익명 로그인 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // 간단한 검증
      if (!email || !password) {
        throw new Error('이메일과 비밀번호를 입력해주세요.')
      }

      // 저장된 사용자 확인
      const savedUsers = JSON.parse(localStorage.getItem('demo_users') || '{}')
      const userKey = email.toLowerCase()
      
      if (savedUsers[userKey] && savedUsers[userKey].password === password) {
        const loginUser = savedUsers[userKey]
        delete loginUser.password // 비밀번호 제거
        
        setUser(loginUser)
        localStorage.setItem('demo_user', JSON.stringify(loginUser))
        console.log('데모 로그인 성공:', loginUser.id)
      } else {
        throw new Error('잘못된 로그인 정보입니다.')
      }
    } catch (error) {
      console.error('데모 로그인 오류:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signUpWithEmail = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // 간단한 검증
      if (!email || !password) {
        throw new Error('이메일과 비밀번호를 입력해주세요.')
      }

      if (password.length < 6) {
        throw new Error('비밀번호는 최소 6자 이상이어야 합니다.')
      }

      // 특정 테스트 계정들은 고정 UUID 사용, 나머지는 랜덤 UUID
      let uuid: string
      const lowerEmail = email.toLowerCase()
      
      if (lowerEmail === 'admin@test.com' || lowerEmail === 'testuser@gmail.com') {
        uuid = '22222222-2222-2222-2222-222222222222'
      } else {
        uuid = crypto.randomUUID()
      }
      
      const newUser: DemoUser = {
        id: uuid,
        email: lowerEmail,
        created_at: new Date().toISOString()
      }

      // 사용자 목록에 저장 (비밀번호 포함)
      const savedUsers = JSON.parse(localStorage.getItem('demo_users') || '{}')
      const userKey = email.toLowerCase()
      
      if (savedUsers[userKey]) {
        throw new Error('이미 존재하는 이메일입니다.')
      }

      savedUsers[userKey] = { ...newUser, password }
      localStorage.setItem('demo_users', JSON.stringify(savedUsers))

      // 현재 사용자로 설정
      setUser(newUser)
      localStorage.setItem('demo_user', JSON.stringify(newUser))
      console.log('데모 회원가입 성공:', newUser.id)
    } catch (error) {
      console.error('데모 회원가입 오류:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    setIsLoading(true)
    try {
      setUser(null)
      localStorage.removeItem('demo_user')
      console.log('데모 로그아웃 성공')
    } catch (error) {
      console.error('데모 로그아웃 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    user,
    isLoading,
    signInAnonymously,
    signInWithEmail,
    signUpWithEmail,
    signOut
  }

  return (
    <DemoAuthContext.Provider value={value}>
      {children}
    </DemoAuthContext.Provider>
  )
}

export function useDemoAuth() {
  const context = useContext(DemoAuthContext)
  if (context === undefined) {
    throw new Error('useDemoAuth must be used within a DemoAuthProvider')
  }
  return context
}
