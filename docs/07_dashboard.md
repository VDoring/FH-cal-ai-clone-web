# 📊 대시보드 및 식단 조회 기능

## 📋 작업 개요
사용자 식단 기록을 조회하고 분석하는 대시보드 구현

## ✅ 체크리스트

### 1. 대시보드 데이터 훅
- [ ] `hooks/use-dashboard.ts` 파일 생성
```typescript
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { 
  getFoodLogsByDate, 
  getFoodLogsByMealType,
  getDailyCaloriesSummary 
} from '@/lib/food-log'
import { format } from 'date-fns'

interface DashboardData {
  logs: any[]
  summary: any
  loading: boolean
  error: string | null
}

export function useDashboard(selectedDate: Date = new Date()) {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData>({
    logs: [],
    summary: null,
    loading: true,
    error: null
  })

  const dateString = format(selectedDate, 'yyyy-MM-dd')

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      setData(prev => ({ ...prev, loading: true, error: null }))

      try {
        // 해당 날짜의 모든 식단 기록 조회
        const { data: logs, error: logsError } = await getFoodLogsByDate(
          user.id, 
          dateString
        )

        if (logsError) throw logsError

        // 일일 칼로리 요약 조회
        const { data: summary, error: summaryError } = await getDailyCaloriesSummary(
          user.id, 
          dateString
        )

        if (summaryError) throw summaryError

        setData({
          logs: logs || [],
          summary: summary || { total: 0, breakfast: 0, lunch: 0, dinner: 0, snack: 0 },
          loading: false,
          error: null
        })
      } catch (error) {
        setData(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : '데이터 로드 실패'
        }))
      }
    }

    fetchData()
  }, [user, dateString])

  return data
}

// 끼니별 데이터를 가져오는 훅
export function useMealData(selectedDate: Date, mealType: string) {
  const { user } = useAuth()
  const [data, setData] = useState({
    logs: [],
    loading: true,
    error: null
  })

  const dateString = format(selectedDate, 'yyyy-MM-dd')

  useEffect(() => {
    if (!user) return

    const fetchMealData = async () => {
      setData(prev => ({ ...prev, loading: true }))

      try {
        const { data: logs, error } = await getFoodLogsByMealType(
          user.id,
          dateString,
          mealType
        )

        if (error) throw error

        setData({
          logs: logs || [],
          loading: false,
          error: null
        })
      } catch (error) {
        setData(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : '데이터 로드 실패'
        }))
      }
    }

    fetchMealData()
  }, [user, dateString, mealType])

  return data
}
```

### 2. 날짜 선택 컴포넌트
- [ ] `components/date-picker.tsx` 파일 생성
```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { format, addDays, subDays, isToday, isBefore, startOfDay } from 'date-fns'
import { ko } from 'date-fns/locale'

interface DatePickerProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
}

export function DatePicker({ selectedDate, onDateChange }: DatePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false)

  const handlePrevDay = () => {
    onDateChange(subDays(selectedDate, 1))
  }

  const handleNextDay = () => {
    // 오늘 이후 날짜는 선택 불가
    const nextDay = addDays(selectedDate, 1)
    if (!isBefore(startOfDay(nextDay), startOfDay(new Date()))) {
      return
    }
    onDateChange(nextDay)
  }

  const handleToday = () => {
    onDateChange(new Date())
  }

  const canGoNext = !isBefore(startOfDay(addDays(selectedDate, 1)), startOfDay(new Date()))

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevDay}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="font-medium">
              {format(selectedDate, 'M월 d일 (E)', { locale: ko })}
            </span>
            {isToday(selectedDate) && (
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                오늘
              </span>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextDay}
            disabled={canGoNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {!isToday(selectedDate) && (
          <div className="mt-3 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
            >
              오늘로 이동
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

### 3. 칼로리 요약 컴포넌트
- [ ] `components/calorie-summary.tsx` 파일 생성
```typescript
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { getMealTypeLabel } from '@/lib/meal-classifier'

interface CalorieSummaryProps {
  summary: {
    total: number
    breakfast: number
    lunch: number
    dinner: number
    snack: number
  }
  targetCalories?: number
}

export function CalorieSummary({ summary, targetCalories = 2000 }: CalorieSummaryProps) {
  const progressPercentage = Math.min((summary.total / targetCalories) * 100, 100)
  
  const mealData = [
    { type: 'breakfast', label: '아침', calories: summary.breakfast, color: 'bg-yellow-500' },
    { type: 'lunch', label: '점심', calories: summary.lunch, color: 'bg-orange-500' },
    { type: 'dinner', label: '저녁', calories: summary.dinner, color: 'bg-blue-500' },
    { type: 'snack', label: '간식', calories: summary.snack, color: 'bg-purple-500' }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">일일 칼로리</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 총 칼로리 */}
        <div className="text-center space-y-2">
          <div className="text-3xl font-bold">
            {summary.total.toLocaleString()}
            <span className="text-lg text-gray-500 font-normal">kcal</span>
          </div>
          <div className="text-sm text-gray-600">
            목표: {targetCalories.toLocaleString()}kcal
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="text-xs text-gray-500">
            {progressPercentage.toFixed(1)}% 달성
          </div>
        </div>

        {/* 끼니별 칼로리 */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-700">끼니별 칼로리</h4>
          <div className="grid grid-cols-2 gap-2">
            {mealData.map((meal) => (
              <div
                key={meal.type}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${meal.color}`} />
                  <span className="text-sm font-medium">{meal.label}</span>
                </div>
                <span className="text-sm font-semibold">
                  {meal.calories.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 잔여 칼로리 */}
        <div className="pt-3 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">잔여 칼로리</span>
            <span className={`font-semibold ${
              targetCalories - summary.total >= 0 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {(targetCalories - summary.total).toLocaleString()}kcal
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 4. 식단 기록 카드 컴포넌트
- [ ] `components/food-log-card.tsx` 파일 생성
```typescript
'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Utensils } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { getMealTypeLabel } from '@/lib/meal-classifier'
import Image from 'next/image'

interface FoodLogCardProps {
  log: {
    id: string
    image_url: string
    meal_type: string
    food_items: any[]
    total_calories: number
    confidence_score: number
    created_at: string
  }
}

export function FoodLogCard({ log }: FoodLogCardProps) {
  const mealLabel = getMealTypeLabel(log.meal_type)
  const createdTime = new Date(log.created_at)
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{mealLabel}</Badge>
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(createdTime, 'HH:mm', { locale: ko })}
            </span>
          </div>
          <div className="text-right">
            <div className="font-semibold text-lg">
              {log.total_calories.toLocaleString()}kcal
            </div>
            {log.confidence_score > 0 && (
              <div className="text-xs text-gray-500">
                신뢰도 {(log.confidence_score * 100).toFixed(0)}%
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 이미지 */}
        <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
          <Image
            src={log.image_url}
            alt="식단 이미지"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        {/* 음식 목록 */}
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
            <Utensils className="h-4 w-4" />
            인식된 음식 ({log.food_items.length}개)
          </div>
          
          <div className="space-y-2">
            {log.food_items.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-start p-2 bg-gray-50 rounded"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.foodName}</div>
                  <div className="text-xs text-gray-600">
                    {item.quantity} • 신뢰도 {(item.confidence * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="text-sm font-semibold">
                  {item.calories.toLocaleString()}kcal
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 영양성분 요약 (선택사항) */}
        {log.food_items[0]?.nutrients && (
          <div className="pt-2 border-t">
            <div className="text-xs text-gray-600 mb-2">주요 영양성분</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="font-medium">탄수화물</div>
                <div className="text-gray-600">
                  {log.food_items.reduce((sum, item) => 
                    sum + (item.nutrients?.carbohydrates?.value || 0), 0
                  ).toFixed(1)}g
                </div>
              </div>
              <div className="text-center">
                <div className="font-medium">단백질</div>
                <div className="text-gray-600">
                  {log.food_items.reduce((sum, item) => 
                    sum + (item.nutrients?.protein?.value || 0), 0
                  ).toFixed(1)}g
                </div>
              </div>
              <div className="text-center">
                <div className="font-medium">지방</div>
                <div className="text-gray-600">
                  {log.food_items.reduce((sum, item) => 
                    sum + (item.nutrients?.fat?.value || 0), 0
                  ).toFixed(1)}g
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

### 5. 끼니별 탭 컴포넌트
- [ ] `components/meal-tabs.tsx` 파일 생성
```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface MealTabsProps {
  summary: {
    breakfast: number
    lunch: number
    dinner: number
    snack: number
  }
  onMealChange: (mealType: string) => void
  activeMeal: string
}

export function MealTabs({ summary, onMealChange, activeMeal }: MealTabsProps) {
  const meals = [
    { type: 'all', label: '전체', calories: summary.breakfast + summary.lunch + summary.dinner + summary.snack },
    { type: 'breakfast', label: '아침', calories: summary.breakfast },
    { type: 'lunch', label: '점심', calories: summary.lunch },
    { type: 'dinner', label: '저녁', calories: summary.dinner },
    { type: 'snack', label: '간식', calories: summary.snack }
  ]

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex gap-2 overflow-x-auto">
          {meals.map((meal) => (
            <Button
              key={meal.type}
              variant={activeMeal === meal.type ? "default" : "outline"}
              onClick={() => onMealChange(meal.type)}
              className="flex-shrink-0 flex items-center gap-2"
            >
              <span>{meal.label}</span>
              {meal.calories > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {meal.calories}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

### 6. 메인 대시보드 페이지
- [ ] `app/dashboard/page.tsx` 파일 생성
```typescript
'use client'

import { useState } from 'react'
import { Navbar } from '@/components/navbar'
import { DatePicker } from '@/components/date-picker'
import { CalorieSummary } from '@/components/calorie-summary'
import { MealTabs } from '@/components/meal-tabs'
import { FoodLogCard } from '@/components/food-log-card'
import { useDashboard } from '@/hooks/use-dashboard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeMeal, setActiveMeal] = useState('all')
  
  const { logs, summary, loading, error } = useDashboard(selectedDate)

  // 선택된 끼니에 따라 로그 필터링
  const filteredLogs = activeMeal === 'all' 
    ? logs 
    : logs.filter(log => log.meal_type === activeMeal)

  const handleRefresh = () => {
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto p-4">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">나의 식단</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => router.push('/upload')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              기록하기
            </Button>
          </div>
        </div>

        {/* 날짜 선택 */}
        <DatePicker
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />

        {/* 칼로리 요약 */}
        {summary && <CalorieSummary summary={summary} />}

        {/* 끼니 탭 */}
        {summary && (
          <MealTabs
            summary={summary}
            onMealChange={setActiveMeal}
            activeMeal={activeMeal}
          />
        )}

        {/* 에러 메시지 */}
        {error && (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-red-600 mb-4">❌ {error}</div>
              <Button onClick={handleRefresh}>다시 시도</Button>
            </CardContent>
          </Card>
        )}

        {/* 식단 기록 목록 */}
        <div className="space-y-4">
          {filteredLogs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-gray-500 space-y-2">
                  <div className="text-4xl">🍽️</div>
                  <div className="font-medium">
                    {activeMeal === 'all' 
                      ? '아직 기록된 식단이 없습니다'
                      : `${activeMeal === 'breakfast' ? '아침' : 
                          activeMeal === 'lunch' ? '점심' :
                          activeMeal === 'dinner' ? '저녁' : '간식'} 식단이 없습니다`
                    }
                  </div>
                  <div className="text-sm">첫 번째 식단을 기록해보세요!</div>
                </div>
                <Button
                  onClick={() => router.push('/upload')}
                  className="mt-4"
                >
                  식단 기록하기
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredLogs.map((log) => (
              <FoodLogCard key={log.id} log={log} />
            ))
          )}
        </div>

        {/* 빈 공간 */}
        <div className="h-20" />
      </div>
    </div>
  )
}
```

### 7. 상세 보기 페이지 (선택사항)
- [ ] `app/dashboard/[id]/page.tsx` 파일 생성
```typescript
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth-provider'

export default function FoodLogDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [log, setLog] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !params.id) return

    const fetchLog = async () => {
      const { data, error } = await supabase
        .from('food_logs')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error fetching log:', error)
        router.push('/dashboard')
        return
      }

      setLog(data)
      setLoading(false)
    }

    fetchLog()
  }, [user, params.id, router])

  const handleDelete = async () => {
    if (!window.confirm('이 기록을 삭제하시겠습니까?')) return

    const { error } = await supabase
      .from('food_logs')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user!.id)

    if (error) {
      alert('삭제 실패: ' + error.message)
      return
    }

    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!log) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto p-4 text-center">
          <p>기록을 찾을 수 없습니다.</p>
        </div>
      </div>
    )
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
          >
            <ArrowLeft className="h-4 w-4" />
            뒤로가기
          </Button>
          
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            삭제
          </Button>
        </div>

        {/* 상세 정보는 FoodLogCard 컴포넌트 재사용 */}
        <FoodLogCard log={log} />
      </div>
    </div>
  )
}
```

### 8. 통계 컴포넌트 (선택사항)
- [ ] `components/weekly-stats.tsx` 파일 생성
```typescript
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts'

interface WeeklyStatsProps {
  weeklyData: Array<{
    date: string
    calories: number
  }>
}

export function WeeklyStats({ weeklyData }: WeeklyStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">주간 칼로리 추이</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Bar dataKey="calories" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
```

## 🧪 테스트 체크리스트

### 기능 테스트
- [ ] 날짜별 식단 기록 조회
- [ ] 끼니별 필터링
- [ ] 칼로리 요약 계산
- [ ] 기록 상세 보기
- [ ] 기록 삭제 기능

### UI/UX 테스트
- [ ] 반응형 디자인
- [ ] 로딩 상태 표시
- [ ] 빈 상태 메시지
- [ ] 에러 처리 UI

### 데이터 테스트
- [ ] 데이터베이스 쿼리 성능
- [ ] 이미지 로딩 최적화
- [ ] 캐싱 전략

## 🚨 주의사항
- 이미지 로딩 최적화 필수
- 날짜 범위 제한 (과거 데이터만)
- 사용자별 데이터 격리 확인

## 📝 다음 단계
대시보드 완료 후 **08_ui-components.md**로 진행

---
**예상 소요 시간**: 4-5시간  
**난이도**: ⭐⭐⭐☆☆  
**의존성**: 06_n8n-integration.md 완료 필요
