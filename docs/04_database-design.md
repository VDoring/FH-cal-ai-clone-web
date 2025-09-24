# 🗄️ 데이터베이스 설계 및 구현

## 📋 작업 개요
Supabase 데이터베이스 스키마 설계 및 Storage 설정

## ✅ 체크리스트

### 1. 데이터베이스 스키마 설계
- [ ] `food_logs` 테이블 생성
- [ ] RLS (Row Level Security) 정책 설정
- [ ] 인덱스 최적화
- [ ] 스토리지 버킷 생성

### 2. food_logs 테이블 생성
- [ ] Supabase 대시보드 > Table Editor 이동
- [ ] 새 테이블 생성: `food_logs`
- [ ] 다음 컬럼 구조로 생성:

```sql
-- SQL로 테이블 생성
CREATE TABLE food_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_items JSONB NOT NULL DEFAULT '[]',
  total_calories INTEGER DEFAULT 0,
  total_nutrients JSONB DEFAULT '{}',
  confidence_score DECIMAL(3,2) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. 테이블 컬럼 상세 정의
- [ ] `id`: UUID, Primary Key, 자동 생성
- [ ] `user_id`: UUID, Foreign Key (auth.users), CASCADE 삭제
- [ ] `image_url`: TEXT, NOT NULL (Supabase Storage URL)
- [ ] `meal_type`: TEXT, CHECK 제약 (breakfast/lunch/dinner/snack)
- [ ] `food_items`: JSONB, n8n에서 분석한 음식 목록
- [ ] `total_calories`: INTEGER, 총 칼로리
- [ ] `total_nutrients`: JSONB, 영양성분 요약
- [ ] `confidence_score`: DECIMAL, AI 분석 신뢰도 평균
- [ ] `created_at`: TIMESTAMP, 생성 시간
- [ ] `updated_at`: TIMESTAMP, 수정 시간

### 4. JSONB 스키마 정의
- [ ] `food_items` JSONB 구조:
```json
[
  {
    "foodName": "현미밥",
    "confidence": 0.98,
    "quantity": "1 공기 (210g)",
    "calories": 310,
    "nutrients": {
      "carbohydrates": { "value": 68.5, "unit": "g" },
      "protein": { "value": 6.2, "unit": "g" },
      "fat": { "value": 1.5, "unit": "g" },
      "sugars": { "value": 0.5, "unit": "g" },
      "sodium": { "value": 8.0, "unit": "mg" }
    }
  }
]
```

- [ ] `total_nutrients` JSONB 구조:
```json
{
  "carbohydrates": { "value": 86.8, "unit": "g" },
  "protein": { "value": 51.8, "unit": "g" },
  "fat": { "value": 49.9, "unit": "g" },
  "sugars": { "value": 9.8, "unit": "g" },
  "sodium": { "value": 2258.0, "unit": "mg" }
}
```

### 5. 인덱스 생성
- [ ] 성능 최적화를 위한 인덱스 추가:
```sql
-- 사용자별 조회 최적화
CREATE INDEX idx_food_logs_user_id ON food_logs(user_id);

-- 날짜별 조회 최적화
CREATE INDEX idx_food_logs_created_at ON food_logs(created_at DESC);

-- 사용자 + 날짜 복합 인덱스
CREATE INDEX idx_food_logs_user_date ON food_logs(user_id, created_at DESC);

-- 끼니별 조회 최적화
CREATE INDEX idx_food_logs_meal_type ON food_logs(meal_type);
```

### 6. RLS (Row Level Security) 정책 설정
- [ ] RLS 활성화:
```sql
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
```

- [ ] 사용자별 접근 정책 생성:
```sql
-- 사용자는 자신의 기록만 조회 가능
CREATE POLICY "Users can view own food logs" ON food_logs
FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 기록만 생성 가능
CREATE POLICY "Users can insert own food logs" ON food_logs
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 기록만 수정 가능
CREATE POLICY "Users can update own food logs" ON food_logs
FOR UPDATE USING (auth.uid() = user_id);

-- 사용자는 자신의 기록만 삭제 가능
CREATE POLICY "Users can delete own food logs" ON food_logs
FOR DELETE USING (auth.uid() = user_id);
```

### 7. Supabase Storage 설정
- [ ] 새 Storage 버킷 생성
  - 버킷명: `food-images`
  - Public 설정: `false` (인증된 사용자만 접근)
  - 파일 크기 제한: 10MB
  - 허용 파일 타입: image/*

- [ ] Storage 정책 설정:
```sql
-- 사용자는 자신의 이미지만 업로드 가능
CREATE POLICY "Users can upload own images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'food-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 사용자는 자신의 이미지만 조회 가능
CREATE POLICY "Users can view own images" ON storage.objects
FOR SELECT USING (bucket_id = 'food-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 사용자는 자신의 이미지만 삭제 가능
CREATE POLICY "Users can delete own images" ON storage.objects
FOR DELETE USING (bucket_id = 'food-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 8. 데이터베이스 함수 생성
- [ ] 날짜별 칼로리 합계 함수:
```sql
CREATE OR REPLACE FUNCTION get_daily_calories(
  target_user_id UUID,
  target_date DATE
)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(total_calories), 0)
    FROM food_logs
    WHERE user_id = target_user_id
    AND DATE(created_at) = target_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

- [ ] 끼니별 기록 조회 함수:
```sql
CREATE OR REPLACE FUNCTION get_meals_by_date(
  target_user_id UUID,
  target_date DATE
)
RETURNS TABLE(
  meal_type TEXT,
  food_count BIGINT,
  total_calories_sum INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fl.meal_type,
    COUNT(*) as food_count,
    COALESCE(SUM(fl.total_calories), 0)::INTEGER as total_calories_sum
  FROM food_logs fl
  WHERE fl.user_id = target_user_id
  AND DATE(fl.created_at) = target_date
  GROUP BY fl.meal_type
  ORDER BY fl.meal_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 9. 타입 정의 업데이트
- [ ] `types/database.ts` 파일 생성:
```typescript
export interface Database {
  public: {
    Tables: {
      food_logs: {
        Row: {
          id: string
          user_id: string
          image_url: string
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          food_items: FoodItem[]
          total_calories: number
          total_nutrients: TotalNutrients
          confidence_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          image_url: string
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          food_items: FoodItem[]
          total_calories?: number
          total_nutrients?: TotalNutrients
          confidence_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          image_url?: string
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          food_items?: FoodItem[]
          total_calories?: number
          total_nutrients?: TotalNutrients
          confidence_score?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export interface FoodItem {
  foodName: string
  confidence: number
  quantity: string
  calories: number
  nutrients: Nutrients
}

export interface Nutrients {
  carbohydrates: { value: number; unit: string }
  protein: { value: number; unit: string }
  fat: { value: number; unit: string }
  sugars: { value: number; unit: string }
  sodium: { value: number; unit: string }
}

export interface TotalNutrients {
  carbohydrates: { value: number; unit: string }
  protein: { value: number; unit: string }
  fat: { value: number; unit: string }
  sugars: { value: number; unit: string }
  sodium: { value: number; unit: string }
}
```

### 10. 데이터베이스 유틸리티 함수
- [ ] `lib/database.ts` 파일 생성:
```typescript
import { supabase } from './supabase'
import type { Database } from '@/types/database'

type FoodLog = Database['public']['Tables']['food_logs']['Row']
type FoodLogInsert = Database['public']['Tables']['food_logs']['Insert']

export async function createFoodLog(foodLog: FoodLogInsert) {
  const { data, error } = await supabase
    .from('food_logs')
    .insert(foodLog)
    .select()
    .single()
  
  return { data, error }
}

export async function getFoodLogsByDate(userId: string, date: string) {
  const { data, error } = await supabase
    .from('food_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', `${date}T00:00:00.000Z`)
    .lt('created_at', `${date}T23:59:59.999Z`)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export async function getFoodLogsByMealType(
  userId: string, 
  date: string, 
  mealType: string
) {
  const { data, error } = await supabase
    .from('food_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('meal_type', mealType)
    .gte('created_at', `${date}T00:00:00.000Z`)
    .lt('created_at', `${date}T23:59:59.999Z`)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export async function getDailyCalories(userId: string, date: string) {
  const { data, error } = await supabase
    .rpc('get_daily_calories', {
      target_user_id: userId,
      target_date: date
    })
  
  return { data, error }
}
```

## 🧪 테스트 체크리스트

### 데이터베이스 테스트
- [ ] 테이블 생성 확인
- [ ] 인덱스 생성 확인
- [ ] RLS 정책 동작 확인
- [ ] 함수 실행 테스트

### Storage 테스트
- [ ] 버킷 생성 확인
- [ ] 파일 업로드 권한 확인
- [ ] 파일 접근 권한 확인

### 성능 테스트
- [ ] 쿼리 실행 계획 확인
- [ ] 인덱스 사용 확인

## 🚨 주의사항
- RLS 정책을 반드시 설정하여 데이터 보안 확보
- JSONB 필드는 적절한 검증 로직 필요
- Storage 정책은 사용자별 폴더 구조 유지

## 📝 다음 단계
데이터베이스 설계 완료 후 **05_image-upload.md**로 진행

---
**예상 소요 시간**: 2-3시간  
**난이도**: ⭐⭐⭐⭐☆  
**의존성**: 03_authentication.md 완료 필요
