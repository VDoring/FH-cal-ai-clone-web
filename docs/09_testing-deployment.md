# 🚀 테스트 및 배포

## 📋 작업 개요
MVP 애플리케이션의 테스트, 최적화 및 프로덕션 배포

## ✅ 체크리스트

### 1. 기본 테스트 설정
- [ ] 테스트 라이브러리 설치
```bash
pnpm add -D @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
pnpm add -D @types/jest
```

- [ ] `jest.config.js` 파일 생성
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
}

module.exports = createJestConfig(customJestConfig)
```

- [ ] `jest.setup.js` 파일 생성
```javascript
import '@testing-library/jest-dom'
```

### 2. 유틸리티 함수 테스트
- [ ] `__tests__/lib/meal-classifier.test.ts` 파일 생성
```typescript
import { getMealTypeByTime, getMealTypeLabel } from '@/lib/meal-classifier'

describe('Meal Classifier', () => {
  describe('getMealTypeByTime', () => {
    it('should return breakfast for morning hours', () => {
      const morningTime = new Date('2024-01-01T08:00:00')
      expect(getMealTypeByTime(morningTime)).toBe('breakfast')
    })

    it('should return lunch for afternoon hours', () => {
      const afternoonTime = new Date('2024-01-01T13:00:00')
      expect(getMealTypeByTime(afternoonTime)).toBe('lunch')
    })

    it('should return dinner for evening hours', () => {
      const eveningTime = new Date('2024-01-01T19:00:00')
      expect(getMealTypeByTime(eveningTime)).toBe('dinner')
    })

    it('should return snack for late night hours', () => {
      const lateNightTime = new Date('2024-01-01T23:00:00')
      expect(getMealTypeByTime(lateNightTime)).toBe('snack')
    })
  })

  describe('getMealTypeLabel', () => {
    it('should return correct Korean labels', () => {
      expect(getMealTypeLabel('breakfast')).toBe('아침')
      expect(getMealTypeLabel('lunch')).toBe('점심')
      expect(getMealTypeLabel('dinner')).toBe('저녁')
      expect(getMealTypeLabel('snack')).toBe('간식')
    })
  })
})
```

### 3. 컴포넌트 테스트
- [ ] `__tests__/components/image-picker.test.tsx` 파일 생성
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { ImagePicker } from '@/components/image-picker'

// Mock createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url')
global.URL.revokeObjectURL = jest.fn()

describe('ImagePicker', () => {
  const mockOnImageSelect = jest.fn()

  beforeEach(() => {
    mockOnImageSelect.mockClear()
  })

  it('renders camera and gallery buttons', () => {
    render(<ImagePicker onImageSelect={mockOnImageSelect} />)
    
    expect(screen.getByText('카메라')).toBeInTheDocument()
    expect(screen.getByText('갤러리')).toBeInTheDocument()
  })

  it('shows preview when image is selected', () => {
    render(<ImagePicker onImageSelect={mockOnImageSelect} />)
    
    const fileInput = screen.getByDisplayValue('')
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    
    fireEvent.change(fileInput, { target: { files: [file] } })
    
    expect(screen.getByText('이 사진으로 식단 기록하기')).toBeInTheDocument()
  })

  it('displays error message when provided', () => {
    const errorMessage = '테스트 에러 메시지'
    render(
      <ImagePicker 
        onImageSelect={mockOnImageSelect} 
        error={errorMessage} 
      />
    )
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  })
})
```

### 4. API 엔드포인트 테스트
- [ ] `__tests__/api/webhook.test.ts` 파일 생성
```typescript
import { createMocks } from 'node-mocks-http'
import handler from '@/app/api/webhook/analyze/route'

// Mock 환경변수
process.env.N8N_WEBHOOK_URL = 'https://test-webhook.com'
process.env.N8N_WEBHOOK_SECRET = 'test-secret'

describe('/api/webhook/analyze', () => {
  it('should return 400 when image is missing', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: new FormData(), // 빈 FormData
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('MISSING_DATA')
  })

  it('should return 400 when userId is missing', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    })

    const formData = new FormData()
    formData.append('image', new File(['test'], 'test.jpg', { type: 'image/jpeg' }))
    req.body = formData

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
  })
})
```

### 5. E2E 테스트 설정 (Playwright)
- [ ] Playwright 설치
```bash
pnpm create playwright
```

- [ ] `playwright.config.ts` 설정
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### 6. 주요 사용자 플로우 E2E 테스트
- [ ] `e2e/auth.spec.ts` 파일 생성
```typescript
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should allow user to sign up and login', async ({ page }) => {
    // 회원가입 페이지로 이동
    await page.goto('/signup')

    // 회원가입 폼 작성
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'testpassword123')
    await page.fill('input[name="confirmPassword"]', 'testpassword123')
    
    // 회원가입 버튼 클릭
    await page.click('button[type="submit"]')

    // 대시보드로 리다이렉트 확인
    await expect(page).toHaveURL('/dashboard')
  })

  test('should show error for invalid login', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    
    await page.click('button[type="submit"]')

    // 에러 메시지 확인
    await expect(page.locator('text=이메일 또는 비밀번호가 올바르지 않습니다')).toBeVisible()
  })
})
```

- [ ] `e2e/food-logging.spec.ts` 파일 생성
```typescript
import { test, expect } from '@playwright/test'

test.describe('Food Logging Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 상태로 시작
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('should navigate to upload page', async ({ page }) => {
    await page.click('text=식단 기록하기')
    await expect(page).toHaveURL('/upload')
    
    // 이미지 선택 UI 확인
    await expect(page.locator('text=카메라')).toBeVisible()
    await expect(page.locator('text=갤러리')).toBeVisible()
  })

  test('should show dashboard with empty state', async ({ page }) => {
    await expect(page.locator('text=아직 기록된 식단이 없습니다')).toBeVisible()
  })
})
```

### 7. 성능 테스트
- [ ] Lighthouse 설정
```bash
pnpm add -D lighthouse
```

- [ ] `scripts/lighthouse.js` 파일 생성
```javascript
const lighthouse = require('lighthouse')
const chromeLauncher = require('chrome-launcher')

async function runLighthouse() {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] })
  const options = {
    logLevel: 'info',
    output: 'html',
    onlyCategories: ['performance', 'accessibility', 'best-practices'],
    port: chrome.port,
  }

  const runnerResult = await lighthouse('http://localhost:3000', options)
  
  // 결과 출력
  console.log('Performance score:', runnerResult.lhr.categories.performance.score * 100)
  console.log('Accessibility score:', runnerResult.lhr.categories.accessibility.score * 100)
  console.log('Best Practices score:', runnerResult.lhr.categories['best-practices'].score * 100)

  await chrome.kill()
}

runLighthouse()
```

### 8. 환경별 설정
- [ ] `.env.production` 파일 생성
```env
# Production 환경 변수
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

N8N_WEBHOOK_URL=your_production_n8n_webhook_url
N8N_WEBHOOK_SECRET=your_production_webhook_secret

NEXT_PUBLIC_APP_URL=https://your-domain.com
```

- [ ] `.env.staging` 파일 생성 (스테이징 환경용)

### 9. Vercel 배포 설정
- [ ] `vercel.json` 파일 생성
```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

### 10. CI/CD 파이프라인
- [ ] `.github/workflows/ci.yml` 파일 생성
```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'pnpm'

    - name: Install pnpm
      run: npm install -g pnpm

    - name: Install dependencies
      run: pnpm install

    - name: Run linter
      run: pnpm lint

    - name: Run type check
      run: pnpm type-check

    - name: Run tests
      run: pnpm test

    - name: Build application
      run: pnpm build

  e2e:
    runs-on: ubuntu-latest
    needs: test

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'pnpm'

    - name: Install pnpm
      run: npm install -g pnpm

    - name: Install dependencies
      run: pnpm install

    - name: Install Playwright browsers
      run: pnpm playwright install

    - name: Run E2E tests
      run: pnpm e2e

    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: playwright-report
        path: playwright-report/
```

### 11. 프로덕션 최적화
- [ ] `next.config.js` 최적화
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['your-supabase-storage-url'],
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    serverActions: true,
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  httpAgentOptions: {
    keepAlive: true,
  },
}

module.exports = nextConfig
```

### 12. 모니터링 설정
- [ ] Sentry 설정 (선택사항)
```bash
pnpm add @sentry/nextjs
```

- [ ] `sentry.client.config.js` 파일 생성
```javascript
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
})
```

### 13. 보안 체크리스트
- [ ] 환경 변수 보안 확인
  - [ ] API 키 노출 방지
  - [ ] 프로덕션/개발 환경 분리
  - [ ] CORS 설정 확인

- [ ] API 보안 확인
  - [ ] Rate limiting 설정
  - [ ] 인증 토큰 검증
  - [ ] 파일 업로드 검증

- [ ] 데이터베이스 보안 확인
  - [ ] RLS 정책 테스트
  - [ ] SQL 인젝션 방지
  - [ ] 사용자별 데이터 격리

### 14. 배포 체크리스트
- [ ] 로컬 빌드 테스트
```bash
pnpm build
pnpm start
```

- [ ] 환경변수 설정 확인
- [ ] Supabase 프로덕션 설정
- [ ] n8n 웹훅 URL 업데이트
- [ ] 도메인 설정 (선택사항)
- [ ] SSL 인증서 확인

### 15. 배포 후 확인사항
- [ ] 홈페이지 로딩 확인
- [ ] 회원가입/로그인 기능
- [ ] 이미지 업로드 기능
- [ ] 대시보드 데이터 표시
- [ ] 모바일 반응형 확인
- [ ] 성능 지표 확인 (Lighthouse)

## 🧪 테스트 명령어

### 개발 중 테스트
```bash
# 단위 테스트
pnpm test

# 테스트 커버리지
pnpm test:coverage

# E2E 테스트
pnpm e2e

# Lighthouse 성능 테스트
pnpm lighthouse
```

### 배포 전 체크
```bash
# 전체 테스트 실행
pnpm test:all

# 빌드 테스트
pnpm build

# 타입 체크
pnpm type-check

# Lint 체크
pnpm lint
```

## 🚨 주의사항

### 보안
- API 키는 절대 클라이언트에 노출하지 않기
- 환경변수 파일을 Git에 커밋하지 않기
- 프로덕션과 개발 환경 분리

### 성능
- 이미지 최적화 필수
- 번들 크기 모니터링
- 캐싱 전략 적용

### 사용자 경험
- 오프라인 상태 처리
- 로딩 상태 표시
- 에러 메시지 사용자 친화적으로

## 📝 완료 후 다음 단계

### 추가 기능 개발
- 영양성분 상세 분석
- 식단 목표 설정
- 통계 및 리포트
- 소셜 공유 기능

### 운영 및 모니터링
- 사용자 피드백 수집
- 성능 모니터링
- 에러 트래킹
- A/B 테스트

---
**예상 소요 시간**: 3-4시간  
**난이도**: ⭐⭐⭐⭐☆  
**의존성**: 08_ui-components.md 완료 필요
