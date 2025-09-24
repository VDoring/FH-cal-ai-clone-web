# 🎨 UI 컴포넌트 및 디자인 시스템

## 📋 작업 개요
모바일 최적화된 UI 컴포넌트 및 일관된 디자인 시스템 구현

## ✅ 체크리스트

### 1. shadcn/ui 컴포넌트 설치
- [ ] 필요한 shadcn/ui 컴포넌트 설치
```bash
pnpm dlx shadcn-ui@latest add button card input label badge progress
pnpm dlx shadcn-ui@latest add alert alert-dialog dialog sheet
pnpm dlx shadcn-ui@latest add toast sonner
pnpm dlx shadcn-ui@latest add avatar dropdown-menu
```

### 2. 공통 레이아웃 컴포넌트
- [ ] `components/layout/mobile-layout.tsx` 파일 생성
```typescript
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
```

### 3. 헤더/네비게이션 컴포넌트
- [ ] `components/layout/header.tsx` 파일 생성
```typescript
'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft, Menu, Bell } from 'lucide-react'
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
```

### 4. 바텀 네비게이션
- [ ] `components/layout/bottom-nav.tsx` 파일 생성
```typescript
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
```

### 5. 로딩 컴포넌트
- [ ] `components/ui/loading.tsx` 파일 생성
```typescript
'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export function Loading({ size = 'md', text, className }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <Loader2 className={cn(
        "animate-spin text-blue-500",
        sizeClasses[size]
      )} />
      {text && (
        <p className="mt-2 text-sm text-gray-600">{text}</p>
      )}
    </div>
  )
}

// 전체 화면 로딩
export function FullScreenLoading({ text = "로딩 중..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <Loading size="lg" text={text} />
    </div>
  )
}

// 페이지 로딩
export function PageLoading({ text }: { text?: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <Loading size="lg" text={text} />
    </div>
  )
}
```

### 6. 에러 컴포넌트
- [ ] `components/ui/error-display.tsx` 파일 생성
```typescript
'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface ErrorDisplayProps {
  title?: string
  message?: string
  onRetry?: () => void
  retryText?: string
}

export function ErrorDisplay({ 
  title = "오류가 발생했습니다",
  message = "잠시 후 다시 시도해주세요.",
  onRetry,
  retryText = "다시 시도"
}: ErrorDisplayProps) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-gray-600 mb-6">
          {message}
        </p>
        {onRetry && (
          <Button onClick={onRetry} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            {retryText}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// 네트워크 에러용
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorDisplay
      title="네트워크 연결 오류"
      message="인터넷 연결을 확인하고 다시 시도해주세요."
      onRetry={onRetry}
    />
  )
}

// 404 에러용
export function NotFoundError() {
  return (
    <ErrorDisplay
      title="페이지를 찾을 수 없습니다"
      message="요청하신 페이지가 존재하지 않습니다."
    />
  )
}
```

### 7. 빈 상태 컴포넌트
- [ ] `components/ui/empty-state.tsx` 파일 생성
```typescript
'use client'

import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <div className="text-6xl mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        {description && (
          <p className="text-gray-600 mb-6">
            {description}
          </p>
        )}
        {action && (
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// 프리셋 빈 상태들
export function NoFoodLogs({ onAddClick }: { onAddClick: () => void }) {
  return (
    <EmptyState
      icon="🍽️"
      title="아직 기록된 식단이 없습니다"
      description="첫 번째 식단을 기록해보세요!"
      action={{
        label: "식단 기록하기",
        onClick: onAddClick
      }}
    />
  )
}

export function NoSearchResults() {
  return (
    <EmptyState
      icon="🔍"
      title="검색 결과가 없습니다"
      description="다른 검색어로 시도해보세요."
    />
  )
}
```

### 8. 토스트 알림 설정
- [ ] `components/ui/toast-provider.tsx` 파일 생성
```typescript
'use client'

import { Toaster } from 'sonner'

export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: 'white',
          border: '1px solid #e5e7eb',
          color: '#374151'
        }
      }}
    />
  )
}
```

### 9. 입력 컴포넌트
- [ ] `components/ui/form-field.tsx` 파일 생성
```typescript
'use client'

import { forwardRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ className, label, error, hint, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={props.id} className="text-sm font-medium">
            {label}
          </Label>
        )}
        <Input
          ref={ref}
          className={cn(
            error && "border-red-500 focus:border-red-500",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        {hint && !error && (
          <p className="text-sm text-gray-500">{hint}</p>
        )}
      </div>
    )
  }
)

FormField.displayName = "FormField"
```

### 10. 모달 컴포넌트
- [ ] `components/ui/confirm-dialog.tsx` 파일 생성
```typescript
'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  destructive?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "확인",
  cancelText = "취소",
  onConfirm,
  destructive = false
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={destructive ? "bg-red-600 hover:bg-red-700" : ""}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

### 11. 메인 레이아웃 업데이트
- [ ] `app/layout.tsx` 수정
```typescript
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/components/auth-provider'
import { ToastProvider } from '@/components/ui/toast-provider'
import { BottomNav } from '@/components/layout/bottom-nav'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'AI 식단 기록 서비스',
  description: '원클릭으로 간편한 식단 관리',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <AuthProvider>
          <div className="pb-16"> {/* 바텀 네비게이션 공간 확보 */}
            {children}
          </div>
          <BottomNav />
          <ToastProvider />
        </AuthProvider>
      </body>
    </html>
  )
}
```

### 12. 반응형 유틸리티
- [ ] `lib/responsive.ts` 파일 생성
```typescript
'use client'

import { useEffect, useState } from 'react'

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)

    return () => {
      window.removeEventListener('resize', checkDevice)
    }
  }, [])

  return isMobile
}

export function useViewportHeight() {
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const updateHeight = () => {
      setHeight(window.innerHeight)
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)

    return () => {
      window.removeEventListener('resize', updateHeight)
    }
  }, [])

  return height
}
```

### 13. 테마 설정
- [ ] `tailwind.config.js` 최적화
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...require("tailwindcss/defaultTheme").fontFamily.sans],
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### 14. PWA 설정 (선택사항)
- [ ] `public/manifest.json` 파일 생성
```json
{
  "name": "AI 식단 기록 서비스",
  "short_name": "식단기록",
  "description": "원클릭으로 간편한 식단 관리",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## 🧪 테스트 체크리스트

### 반응형 테스트
- [ ] 모바일 (375px - 768px)
- [ ] 태블릿 (768px - 1024px)
- [ ] 데스크톱 (1024px+)
- [ ] 세로/가로 방향 전환

### 접근성 테스트
- [ ] 키보드 네비게이션
- [ ] 스크린 리더 호환성
- [ ] 색상 대비 확인
- [ ] 포커스 표시

### 성능 테스트
- [ ] 번들 크기 최적화
- [ ] 이미지 지연 로딩
- [ ] 코드 스플리팅

### 브라우저 호환성
- [ ] Chrome (최신)
- [ ] Safari (iOS)
- [ ] Samsung Internet
- [ ] Firefox (모바일)

## 🚨 주의사항
- 모바일 터치 인터페이스 최적화
- 다양한 화면 크기 대응
- 오프라인 상태 고려
- 성능 최적화 필수

## 📝 다음 단계
UI 컴포넌트 완료 후 **09_testing-deployment.md**로 진행

---
**예상 소요 시간**: 4-5시간  
**난이도**: ⭐⭐⭐☆☆  
**의존성**: 07_dashboard.md 완료 필요
