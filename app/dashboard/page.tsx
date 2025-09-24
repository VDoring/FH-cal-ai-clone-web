'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { MobileLayout } from '@/components/layout/mobile-layout'
import { DatePicker } from '@/components/dashboard/date-picker'
import { CalorieSummary } from '@/components/dashboard/calorie-summary'
import { MealTabs } from '@/components/dashboard/meal-tabs'
import { FoodLogCard } from '@/components/dashboard/food-log-card'
import { NoFoodLogs } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, RefreshCw } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { Loading } from '@/components/ui/loading'

// 임시 데모 데이터
const generateDemoData = (selectedDate: Date) => {
  const today = new Date()
  const isToday = selectedDate.toDateString() === today.toDateString()
  
  // 오늘이 아니면 빈 데이터 반환
  if (!isToday) {
    return {
      logs: [],
      summary: { total: 0, breakfast: 0, lunch: 0, dinner: 0, snack: 0 }
    }
  }

  // 오늘 데이터만 임시로 제공
  const demoLogs = [
    {
      id: 'demo-1',
      image_url: '/api/placeholder/400/300',
      meal_type: 'breakfast',
      food_items: [
        {
          foodName: '토스트',
          confidence: 0.95,
          quantity: '2장',
          calories: 180,
          nutrients: {
            carbohydrates: { value: 30, unit: 'g' },
            protein: { value: 6, unit: 'g' },
            fat: { value: 3, unit: 'g' }
          }
        },
        {
          foodName: '계란후라이',
          confidence: 0.92,
          quantity: '1개',
          calories: 90,
          nutrients: {
            carbohydrates: { value: 1, unit: 'g' },
            protein: { value: 7, unit: 'g' },
            fat: { value: 7, unit: 'g' }
          }
        }
      ],
      total_calories: 270,
      confidence_score: 0.93,
      created_at: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 30).toISOString()
    },
    {
      id: 'demo-2', 
      image_url: '/api/placeholder/400/300',
      meal_type: 'lunch',
      food_items: [
        {
          foodName: '김치찌개',
          confidence: 0.88,
          quantity: '1인분',
          calories: 320,
          nutrients: {
            carbohydrates: { value: 15, unit: 'g' },
            protein: { value: 20, unit: 'g' },
            fat: { value: 18, unit: 'g' }
          }
        },
        {
          foodName: '밥',
          confidence: 0.96,
          quantity: '1공기',
          calories: 300,
          nutrients: {
            carbohydrates: { value: 65, unit: 'g' },
            protein: { value: 6, unit: 'g' },
            fat: { value: 1, unit: 'g' }
          }
        }
      ],
      total_calories: 620,
      confidence_score: 0.92,
      created_at: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 45).toISOString()
    }
  ]

  const summary = {
    total: demoLogs.reduce((sum, log) => sum + log.total_calories, 0),
    breakfast: demoLogs.filter(log => log.meal_type === 'breakfast').reduce((sum, log) => sum + log.total_calories, 0),
    lunch: demoLogs.filter(log => log.meal_type === 'lunch').reduce((sum, log) => sum + log.total_calories, 0), 
    dinner: demoLogs.filter(log => log.meal_type === 'dinner').reduce((sum, log) => sum + log.total_calories, 0),
    snack: demoLogs.filter(log => log.meal_type === 'snack').reduce((sum, log) => sum + log.total_calories, 0)
  }

  return { logs: demoLogs, summary }
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeMeal, setActiveMeal] = useState('all')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ logs: [], summary: { total: 0, breakfast: 0, lunch: 0, dinner: 0, snack: 0 } })

  // 데이터 로드 (임시 구현)
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      // 실제로는 Supabase에서 데이터를 가져올 예정
      await new Promise(resolve => setTimeout(resolve, 1000)) // 로딩 시뮬레이션
      const demoData = generateDemoData(selectedDate)
      setData(demoData)
      setLoading(false)
    }

    loadData()
  }, [selectedDate])

  // 선택된 끼니에 따라 로그 필터링
  const filteredLogs = activeMeal === 'all' 
    ? data.logs 
    : data.logs.filter(log => log.meal_type === activeMeal)

  const handleRefresh = () => {
    window.location.reload()
  }

  if (loading) {
    return (
      <MobileLayout showPadding={false}>
        <Header title="나의 식단" />
        <div className="p-4">
          <Loading size="lg" text="식단 데이터를 불러오는 중..." />
        </div>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout showPadding={false}>
      <Header 
        title="나의 식단" 
        rightContent={
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
        }
      />
      
      <div className="p-4 space-y-6">
        {/* 날짜 선택 */}
        <DatePicker
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />

        {/* 칼로리 요약 */}
        {data.summary && <CalorieSummary summary={data.summary} />}

        {/* 끼니 탭 */}
        {data.summary && (
          <MealTabs
            summary={data.summary}
            onMealChange={setActiveMeal}
            activeMeal={activeMeal}
          />
        )}

        {/* 식단 기록 목록 */}
        <div className="space-y-4">
          {filteredLogs.length === 0 ? (
            <NoFoodLogs onAddClick={() => router.push('/upload')} />
          ) : (
            filteredLogs.map((log) => (
              <FoodLogCard key={log.id} log={log} />
            ))
          )}
        </div>

        {/* 빈 공간 (하단 네비게이션 공간 확보) */}
        <div className="h-20" />
      </div>
    </MobileLayout>
  )
}

