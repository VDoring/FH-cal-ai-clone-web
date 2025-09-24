# 🔄 n8n 웹훅 연동

## 📋 작업 개요
n8n 웹훅을 통한 AI 음식 분석 및 자동 끼니 분류 시스템 구현

## ✅ 체크리스트

### 1. API Route 생성
- [ ] `app/api/webhook/analyze/route.ts` 파일 생성
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase 클라이언트 (서버용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get('image') as File
    const userId = formData.get('userId') as string

    if (!image || !userId) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_DATA', message: '이미지와 사용자 ID가 필요합니다.' } },
        { status: 400 }
      )
    }

    // n8n 웹훅으로 전송할 FormData 생성
    const n8nFormData = new FormData()
    n8nFormData.append('image', image)
    n8nFormData.append('userId', userId)

    // n8n 웹훅 호출
    const webhookUrl = process.env.N8N_WEBHOOK_URL!
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: n8nFormData,
      headers: {
        'Authorization': `Bearer ${process.env.N8N_WEBHOOK_SECRET}`
      }
    })

    if (!response.ok) {
      throw new Error(`n8n 웹훅 오류: ${response.status}`)
    }

    const result = await response.json()
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('웹훅 에러:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'WEBHOOK_ERROR', 
          message: '서버 오류가 발생했습니다.' 
        } 
      },
      { status: 500 }
    )
  }
}
```

### 2. 끼니 자동 판별 로직
- [ ] `lib/meal-classifier.ts` 파일 생성 (참고용)
```typescript
// n8n에서 사용할 끼니 분류 로직 (참고용)
export function getMealTypeByTime(timestamp: Date = new Date()): string {
  const hour = timestamp.getHours()
  
  if (hour >= 4 && hour < 11) {
    return 'breakfast'
  } else if (hour >= 11 && hour < 17) {
    return 'lunch'
  } else if (hour >= 17 && hour < 22) {
    return 'dinner'
  } else {
    return 'snack'
  }
}

// 끼니 타입을 한글로 변환
export function getMealTypeLabel(mealType: string): string {
  const labels = {
    breakfast: '아침',
    lunch: '점심',
    dinner: '저녁',
    snack: '간식'
  }
  return labels[mealType as keyof typeof labels] || '기타'
}
```

### 3. 웹훅 클라이언트 함수
- [ ] `lib/webhook.ts` 파일 생성
```typescript
interface WebhookResponse {
  success: boolean
  data?: {
    items: FoodItem[]
    summary: {
      totalCalories: number
      totalCarbohydrates: { value: number; unit: string }
      totalProtein: { value: number; unit: string }
      totalFat: { value: number; unit: string }
    }
  }
  error?: {
    code: string
    message: string
  }
}

interface FoodItem {
  foodName: string
  confidence: number
  quantity: string
  calories: number
  nutrients: {
    carbohydrates: { value: number; unit: string }
    protein: { value: number; unit: string }
    fat: { value: number; unit: string }
    sugars: { value: number; unit: string }
    sodium: { value: number; unit: string }
  }
}

export async function analyzeFood(file: File, userId: string): Promise<WebhookResponse> {
  try {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('userId', userId)

    const response = await fetch('/api/webhook/analyze', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()
    return result
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: '네트워크 오류가 발생했습니다.'
      }
    }
  }
}
```

### 4. 데이터베이스 저장 로직
- [ ] `lib/food-log.ts` 파일 생성
```typescript
import { supabase } from './supabase'
import { getMealTypeByTime } from './meal-classifier'
import type { Database } from '@/types/database'

type FoodLogInsert = Database['public']['Tables']['food_logs']['Insert']

interface CreateFoodLogParams {
  userId: string
  imageUrl: string
  foodItems: any[]
  totalCalories: number
  totalNutrients: any
  confidenceScore: number
}

export async function createFoodLogFromWebhook(params: CreateFoodLogParams) {
  const {
    userId,
    imageUrl,
    foodItems,
    totalCalories,
    totalNutrients,
    confidenceScore
  } = params

  // 현재 시간 기준으로 끼니 타입 결정
  const mealType = getMealTypeByTime() as 'breakfast' | 'lunch' | 'dinner' | 'snack'

  const foodLog: FoodLogInsert = {
    user_id: userId,
    image_url: imageUrl,
    meal_type: mealType,
    food_items: foodItems,
    total_calories: totalCalories,
    total_nutrients: totalNutrients,
    confidence_score: confidenceScore
  }

  const { data, error } = await supabase
    .from('food_logs')
    .insert(foodLog)
    .select()
    .single()

  return { data, error }
}

// 특정 날짜의 총 칼로리 조회
export async function getDailyCaloriesSummary(userId: string, date: string) {
  const startDate = `${date}T00:00:00.000Z`
  const endDate = `${date}T23:59:59.999Z`

  const { data, error } = await supabase
    .from('food_logs')
    .select('total_calories, meal_type')
    .eq('user_id', userId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  if (error) return { data: null, error }

  // 끼니별 칼로리 합계 계산
  const summary = data.reduce((acc, log) => {
    acc.total += log.total_calories
    acc[log.meal_type] = (acc[log.meal_type] || 0) + log.total_calories
    return acc
  }, {
    total: 0,
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    snack: 0
  })

  return { data: summary, error: null }
}
```

### 5. 업로드 훅 업데이트
- [ ] `hooks/use-image-upload.ts` 수정 (웹훅 연동 추가)
```typescript
'use client'

import { useState } from 'react'
import { uploadImage, validateImageFile } from '@/lib/storage'
import { compressImage } from '@/lib/image-compression'
import { analyzeFood } from '@/lib/webhook'
import { useAuth } from '@/components/auth-provider'

interface UploadState {
  loading: boolean
  error: string | null
  progress: number
  stage: 'idle' | 'compressing' | 'uploading' | 'analyzing' | 'saving' | 'complete'
  result: any | null
}

export function useImageUpload() {
  const { user } = useAuth()
  const [state, setState] = useState<UploadState>({
    loading: false,
    error: null,
    progress: 0,
    stage: 'idle',
    result: null
  })

  const processImage = async (file: File) => {
    if (!user) {
      setState(prev => ({ ...prev, error: '로그인이 필요합니다.' }))
      return null
    }

    // 파일 검증
    const validation = validateImageFile(file)
    if (!validation.valid) {
      setState(prev => ({ ...prev, error: validation.error || '파일이 유효하지 않습니다.' }))
      return null
    }

    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null, 
      progress: 0, 
      stage: 'compressing' 
    }))

    try {
      // 1. 이미지 압축
      setState(prev => ({ ...prev, progress: 20 }))
      const compressedFile = await compressImage(file)

      // 2. 이미지 업로드
      setState(prev => ({ ...prev, stage: 'uploading', progress: 40 }))
      const uploadResult = await uploadImage(compressedFile, user.id)

      if (uploadResult.error) {
        throw uploadResult.error
      }

      // 3. AI 분석 (n8n 웹훅 호출)
      setState(prev => ({ ...prev, stage: 'analyzing', progress: 60 }))
      const analysisResult = await analyzeFood(compressedFile, user.id)

      if (!analysisResult.success) {
        throw new Error(analysisResult.error?.message || 'AI 분석 실패')
      }

      // 4. 완료
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        progress: 100,
        stage: 'complete',
        result: analysisResult.data
      }))

      return analysisResult.data
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : '처리 실패',
        stage: 'idle'
      }))
      return null
    }
  }

  const reset = () => {
    setState({
      loading: false,
      error: null,
      progress: 0,
      stage: 'idle',
      result: null
    })
  }

  return {
    ...state,
    processImage,
    reset
  }
}
```

### 6. n8n 워크플로우 문서
- [ ] `docs/n8n-workflow.md` 파일 생성
```markdown
# n8n 워크플로우 설정 가이드

## 워크플로우 구조

1. **Webhook Trigger**
   - Method: POST
   - Content-Type: multipart/form-data
   - Authentication: Bearer Token

2. **끼니 분류 노드 (Code Node)**
   ```javascript
   // 현재 시간 기준 끼니 분류
   const now = new Date();
   const hour = now.getHours();
   
   let mealType;
   if (hour >= 4 && hour < 11) {
     mealType = 'breakfast';
   } else if (hour >= 11 && hour < 17) {
     mealType = 'lunch';
   } else if (hour >= 17 && hour < 22) {
     mealType = 'dinner';
   } else {
     mealType = 'snack';
   }
   
   return [{
     json: {
       ...items[0].json,
       mealType: mealType,
       timestamp: now.toISOString()
     }
   }];
   ```

3. **AI 분석 노드 (HTTP Request)**
   - URL: AI 서비스 엔드포인트
   - Method: POST
   - Body: 이미지 파일

4. **Supabase Storage 업로드**
   - Supabase Storage API 호출
   - 사용자별 폴더 구조 유지

5. **데이터베이스 저장**
   - Supabase Database INSERT
   - food_logs 테이블에 결과 저장

6. **응답 반환**
   - 성공/실패 결과 포맷팅
   - Next.js로 JSON 응답
```

### 7. 환경변수 추가
- [ ] `.env.local`에 추가:
```env
# n8n 설정
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/food-analysis
N8N_WEBHOOK_SECRET=your-webhook-secret-key

# Supabase Service Role Key (서버 전용)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 8. 에러 처리 및 재시도 로직
- [ ] `lib/retry.ts` 파일 생성
```typescript
interface RetryOptions {
  maxAttempts: number
  delay: number
  backoff: boolean
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = { maxAttempts: 3, delay: 1000, backoff: true }
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === options.maxAttempts) {
        break
      }
      
      const delay = options.backoff 
        ? options.delay * Math.pow(2, attempt - 1)
        : options.delay
        
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

// 웹훅 호출에 재시도 로직 적용
export async function analyzeWithRetry(file: File, userId: string) {
  return withRetry(() => analyzeFood(file, userId), {
    maxAttempts: 3,
    delay: 2000,
    backoff: true
  })
}
```

### 9. 타임아웃 처리
- [ ] `lib/webhook.ts`에 타임아웃 추가
```typescript
export async function analyzeFood(file: File, userId: string, timeout = 30000): Promise<WebhookResponse> {
  try {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('userId', userId)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch('/api/webhook/analyze', {
      method: 'POST',
      body: formData,
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: {
          code: 'TIMEOUT',
          message: '분석 시간이 너무 오래 걸립니다. 다시 시도해주세요.'
        }
      }
    }

    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: '네트워크 오류가 발생했습니다.'
      }
    }
  }
}
```

### 10. 업로드 페이지 최종 업데이트
- [ ] `app/upload/page.tsx` n8n 연동 적용
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePicker } from '@/components/image-picker'
import { UploadProgress } from '@/components/upload-progress'
import { Navbar } from '@/components/navbar'
import { useImageUpload } from '@/hooks/use-image-upload'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { getMealTypeLabel } from '@/lib/meal-classifier'

export default function UploadPage() {
  const router = useRouter()
  const { loading, error, progress, stage, result, processImage, reset } = useImageUpload()

  const handleImageSelect = async (file: File) => {
    const analysisResult = await processImage(file)
    
    if (analysisResult) {
      // 2초 후 대시보드로 이동
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    }
  }

  const handleRetry = () => {
    reset()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2"
            disabled={loading}
          >
            <ArrowLeft className="h-4 w-4" />
            뒤로가기
          </Button>
          
          <h1 className="text-xl font-bold">식단 기록하기</h1>
          <div className="w-20" />
        </div>

        {stage === 'idle' && (
          <ImagePicker
            onImageSelect={handleImageSelect}
            loading={loading}
            error={error}
          />
        )}

        {(loading || stage === 'complete') && (
          <UploadProgress
            progress={progress}
            loading={loading}
            stage={stage}
          />
        )}

        {stage === 'complete' && result && (
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-green-600">
                식단 기록 완료!
              </h2>
              <div className="text-gray-600 space-y-1">
                <p>총 {result.summary.totalCalories}kcal</p>
                <p>{result.items.length}개 음식 인식</p>
                <p>자동으로 대시보드로 이동합니다...</p>
              </div>
            </div>
          </div>
        )}

        {error && stage === 'idle' && (
          <div className="text-center space-y-4">
            <div className="text-red-600 text-lg">
              ❌ {error}
            </div>
            <Button onClick={handleRetry}>
              다시 시도
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
```

## 🧪 테스트 체크리스트

### API 테스트
- [ ] 웹훅 API 엔드포인트 응답
- [ ] n8n 워크플로우 실행
- [ ] 끼니 자동 분류 로직
- [ ] 데이터베이스 저장 확인

### 에러 처리 테스트
- [ ] n8n 서버 다운 시나리오
- [ ] AI 분석 실패 시나리오
- [ ] 타임아웃 처리
- [ ] 재시도 로직

### 성능 테스트
- [ ] 응답 시간 측정
- [ ] 동시 요청 처리
- [ ] 메모리 사용량 확인

## 🚨 주의사항
- n8n 워크플로우는 별도 설정 필요
- AI 분석 서비스는 외부 API 연동 필요
- 타임아웃과 재시도 로직 필수
- 에러 로깅 및 모니터링 설정

## 📝 다음 단계
n8n 연동 완료 후 **07_dashboard.md**로 진행

---
**예상 소요 시간**: 5-6시간  
**난이도**: ⭐⭐⭐⭐⭐  
**의존성**: 05_image-upload.md 완료 필요
