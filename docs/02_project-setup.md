# 🚀 프로젝트 기본 설정

## 📋 작업 개요
Next.js 프로젝트 초기 설정 및 개발 환경 구성

## ✅ 체크리스트

### 1. Next.js 프로젝트 생성
- [ ] Next.js 프로젝트 생성 (App Router 사용)
  ```bash
  pnpm create next-app@latest calaicamv --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
  ```
- [ ] 프로젝트 디렉토리로 이동
  ```bash
  cd calaicamv
  ```

### 2. 필수 패키지 설치
- [ ] Supabase 클라이언트 설치
  ```bash
  pnpm add @supabase/supabase-js
  ```
- [ ] UI 라이브러리 설치 (shadcn/ui)
  ```bash
  pnpm dlx shadcn-ui@latest init
  ```
- [ ] 추가 유틸리티 패키지
  ```bash
  pnpm add react-hook-form @hookform/resolvers zod lucide-react date-fns
  ```
- [ ] 개발 의존성 패키지
  ```bash
  pnpm add -D @types/node
  ```

### 3. 환경 변수 설정
- [ ] `.env.local` 파일 생성
  ```env
  # Supabase
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
  
  # n8n Webhook
  N8N_WEBHOOK_URL=your_n8n_webhook_url
  N8N_WEBHOOK_SECRET=your_webhook_secret
  
  # App Configuration
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  ```
- [ ] `.env.example` 파일 생성 (Git에 포함)

### 4. 프로젝트 구조 생성
- [ ] 디렉토리 구조 생성
  ```
  app/
  ├── (auth)/
  │   ├── login/
  │   └── signup/
  ├── dashboard/
  ├── upload/
  └── api/
      └── webhook/
  ```
- [ ] `components/` 디렉토리 생성
- [ ] `lib/` 디렉토리 생성
- [ ] `types/` 디렉토리 생성

### 5. 설정 파일 구성
- [ ] `tailwind.config.js` 최적화
- [ ] `next.config.js` 설정
  ```javascript
  /** @type {import('next').NextConfig} */
  const nextConfig = {
    images: {
      domains: ['your-supabase-storage-url'],
    },
    experimental: {
      serverActions: true,
    },
  }
  
  module.exports = nextConfig
  ```
- [ ] `tsconfig.json` 경로 별칭 확인

### 6. Supabase 클라이언트 설정
- [ ] `lib/supabase.ts` 파일 생성
  ```typescript
  import { createClient } from '@supabase/supabase-js'
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  export const supabase = createClient(supabaseUrl, supabaseAnonKey)
  ```

### 7. 기본 유틸리티 함수
- [ ] `lib/utils.ts` 파일 생성 (shadcn/ui 기본)
- [ ] `lib/validations.ts` 파일 생성 (Zod 스키마)

### 8. TypeScript 타입 정의
- [ ] `types/index.ts` 파일 생성
  ```typescript
  export interface User {
    id: string;
    email: string;
    created_at: string;
  }
  
  export interface FoodLog {
    id: string;
    user_id: string;
    image_url: string;
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    food_items: FoodItem[];
    total_calories: number;
    created_at: string;
  }
  
  export interface FoodItem {
    foodName: string;
    confidence: number;
    quantity: string;
    calories: number;
    nutrients: Nutrients;
  }
  
  export interface Nutrients {
    carbohydrates: { value: number; unit: string };
    protein: { value: number; unit: string };
    fat: { value: number; unit: string };
    sugars: { value: number; unit: string };
    sodium: { value: number; unit: string };
  }
  ```

### 9. Git 설정
- [ ] `.gitignore` 확인 및 수정
  ```
  # 추가할 항목들
  .env.local
  .vercel
  *.log
  ```
- [ ] 초기 커밋
  ```bash
  git add .
  git commit -m "feat: initial project setup with Next.js and Supabase"
  ```

### 10. 개발 서버 실행 테스트
- [ ] 개발 서버 시작
  ```bash
  pnpm dev
  ```
- [ ] http://localhost:3000 접속 확인
- [ ] 기본 페이지 렌더링 확인

## 🔍 확인 사항

### 필수 확인 항목
- [ ] TypeScript 컴파일 에러 없음
- [ ] ESLint 에러 없음
- [ ] 환경 변수 정상 로드
- [ ] Tailwind CSS 스타일 적용
- [ ] shadcn/ui 설치 정상 완료

### 선택적 확인 항목
- [ ] VS Code 확장 프로그램 설치 (ES7+ React/Redux/React-Native snippets, Tailwind CSS IntelliSense)
- [ ] Prettier 설정
- [ ] Husky/lint-staged 설정 (선택사항)

## 🚨 주의사항
- Supabase URL과 키는 실제 프로젝트 생성 후 설정
- 환경 변수는 절대 Git에 커밋하지 않도록 주의
- 개발 초기에는 localhost에서만 테스트

## 📝 다음 단계
프로젝트 설정 완료 후 **03_authentication.md**로 진행

---
**예상 소요 시간**: 1-2시간  
**난이도**: ⭐⭐☆☆☆  
**의존성**: 없음
