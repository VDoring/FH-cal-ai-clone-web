# 🔐 사용자 인증 시스템

## 📋 작업 개요
Supabase Auth를 이용한 이메일 기반 회원가입 및 로그인 시스템 구현

## ✅ 체크리스트

### 1. Supabase 프로젝트 설정
- [ ] Supabase 대시보드에서 새 프로젝트 생성
- [ ] 프로젝트 URL 및 anon key 복사
- [ ] `.env.local`에 환경 변수 추가

### 2. Supabase Auth 설정
- [ ] Authentication > Settings 이동
- [ ] 이메일 확인 비활성화 (프로토타입용)
  ```
  Settings > Auth > Email Confirm: Disabled
  ```
- [ ] 허용 도메인 설정 (개발용)
  ```
  Site URL: http://localhost:3000
  Redirect URLs: http://localhost:3000/auth/callback
  ```

### 3. 인증 유틸리티 함수 구현
- [ ] `lib/auth.ts` 파일 생성
  ```typescript
  import { supabase } from './supabase'
  
  export async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  }
  
  export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }
  
  export async function signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  }
  
  export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }
  ```

### 4. Auth Provider 컨텍스트 생성
- [ ] `components/auth-provider.tsx` 파일 생성
  ```typescript
  'use client'
  
  import { createContext, useContext, useEffect, useState } from 'react'
  import { User } from '@supabase/supabase-js'
  import { supabase } from '@/lib/supabase'
  
  interface AuthContextType {
    user: User | null
    loading: boolean
  }
  
  const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
  })
  
  export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
  
    useEffect(() => {
      // 현재 세션 확인
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null)
        setLoading(false)
      })
  
      // 인증 상태 변경 감지
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          setUser(session?.user ?? null)
          setLoading(false)
        }
      )
  
      return () => subscription.unsubscribe()
    }, [])
  
    return (
      <AuthContext.Provider value={{ user, loading }}>
        {children}
      </AuthContext.Provider>
    )
  }
  
  export const useAuth = () => useContext(AuthContext)
  ```

### 5. 로그인 페이지 구현
- [ ] `app/(auth)/login/page.tsx` 파일 생성
  ```typescript
  'use client'
  
  import { useState } from 'react'
  import { useRouter } from 'next/navigation'
  import { signIn } from '@/lib/auth'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
  
  export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)
      setError('')
  
      const { error } = await signIn(email, password)
      
      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
      }
      
      setLoading(false)
    }
  
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>로그인</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '로그인 중...' : '로그인'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }
  ```

### 6. 회원가입 페이지 구현
- [ ] `app/(auth)/signup/page.tsx` 파일 생성
  ```typescript
  'use client'
  
  import { useState } from 'react'
  import { useRouter } from 'next/navigation'
  import { signUp } from '@/lib/auth'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
  
  export default function SignupPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      
      if (password !== confirmPassword) {
        setError('비밀번호가 일치하지 않습니다.')
        return
      }
      
      setLoading(true)
      setError('')
  
      const { error } = await signUp(email, password)
      
      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
      }
      
      setLoading(false)
    }
  
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>회원가입</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="비밀번호 확인"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '가입 중...' : '회원가입'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }
  ```

### 7. 인증 콜백 처리
- [ ] `app/auth/callback/route.ts` 파일 생성
  ```typescript
  import { NextRequest, NextResponse } from 'next/server'
  import { supabase } from '@/lib/supabase'
  
  export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
  
    if (code) {
      await supabase.auth.exchangeCodeForSession(code)
    }
  
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
  }
  ```

### 8. 보호된 라우트 미들웨어
- [ ] `middleware.ts` 파일 생성 (프로젝트 루트)
  ```typescript
  import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
  import { NextResponse } from 'next/server'
  import type { NextRequest } from 'next/server'
  
  export async function middleware(req: NextRequest) {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })
    
    const { data: { session } } = await supabase.auth.getSession()
    
    // 인증이 필요한 페이지
    if (req.nextUrl.pathname.startsWith('/dashboard') || 
        req.nextUrl.pathname.startsWith('/upload')) {
      if (!session) {
        return NextResponse.redirect(new URL('/login', req.url))
      }
    }
    
    // 인증된 사용자가 로그인/회원가입 페이지 접근 시
    if ((req.nextUrl.pathname === '/login' || 
         req.nextUrl.pathname === '/signup') && session) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    
    return res
  }
  
  export const config = {
    matcher: ['/dashboard/:path*', '/upload/:path*', '/login', '/signup']
  }
  ```

### 9. 루트 레이아웃 AuthProvider 적용
- [ ] `app/layout.tsx` 수정
  ```typescript
  import { AuthProvider } from '@/components/auth-provider'
  
  export default function RootLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <html lang="ko">
        <body>
          <AuthProvider>
            {children}
          </AuthProvider>
        </body>
      </html>
    )
  }
  ```

### 10. 기본 네비게이션 컴포넌트
- [ ] `components/navbar.tsx` 파일 생성
  ```typescript
  'use client'
  
  import { useAuth } from './auth-provider'
  import { signOut } from '@/lib/auth'
  import { Button } from './ui/button'
  import { useRouter } from 'next/navigation'
  
  export function Navbar() {
    const { user } = useAuth()
    const router = useRouter()
  
    const handleSignOut = async () => {
      await signOut()
      router.push('/login')
    }
  
    if (!user) return null
  
    return (
      <nav className="border-b p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">식단 기록 서비스</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <Button variant="outline" onClick={handleSignOut}>
              로그아웃
            </Button>
          </div>
        </div>
      </nav>
    )
  }
  ```

## 🧪 테스트 체크리스트

### 기능 테스트
- [ ] 회원가입 정상 동작
- [ ] 로그인 정상 동작
- [ ] 로그아웃 정상 동작
- [ ] 인증 상태 유지 (새로고침 후)
- [ ] 보호된 라우트 리다이렉션

### UI/UX 테스트
- [ ] 모바일에서 폼 사용성
- [ ] 에러 메시지 표시
- [ ] 로딩 상태 표시
- [ ] 반응형 디자인

### 에러 처리 테스트
- [ ] 잘못된 이메일/비밀번호
- [ ] 네트워크 오류 처리
- [ ] 중복 이메일 가입 시도

## 🚨 주의사항
- 프로토타입 단계에서는 이메일 확인 비활성화
- 비밀번호 강도 검증은 기본값 사용
- 소셜 로그인은 MVP에서 제외

## 📝 다음 단계
인증 시스템 완료 후 **04_database-design.md**로 진행

---
**예상 소요 시간**: 3-4시간  
**난이도**: ⭐⭐⭐☆☆  
**의존성**: 02_project-setup.md 완료 필요
