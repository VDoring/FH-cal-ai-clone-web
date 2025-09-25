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
import { Plus, RefreshCw } from 'lucide-react'
import { useDemoAuth as useAuth } from '@/components/demo-auth-provider'
import { Loading } from '@/components/ui/loading'
import { fetchFoodLogs, fetchDailyCalorySummary } from '@/lib/api-client'
import { type FoodLog } from '@/lib/database'

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeMeal, setActiveMeal] = useState('all')
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<FoodLog[]>([])
  const [summary, setSummary] = useState({ total: 0, breakfast: 0, lunch: 0, dinner: 0, snack: 0 })

  // 날짜를 YYYY-MM-DD 형식으로 변환
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      if (!user) return

      setLoading(true)
      try {
        const dateStr = formatDate(selectedDate)
        
        // 음식 로그와 칼로리 요약을 병렬로 조회
        const [logsResult, summaryResult] = await Promise.all([
          fetchFoodLogs(user.id, { date: dateStr }),
          fetchDailyCalorySummary(user.id, dateStr)
        ])

        if (logsResult.success) {
          setLogs(logsResult.data || [])
        } else {
          console.error('음식 로그 조회 실패:', logsResult.error)
          setLogs([])
        }

        if (summaryResult.success && summaryResult.data) {
          setSummary({
            total: summaryResult.data.totalCalories,
            breakfast: summaryResult.data.mealBreakdown.breakfast || 0,
            lunch: summaryResult.data.mealBreakdown.lunch || 0,
            dinner: summaryResult.data.mealBreakdown.dinner || 0,
            snack: summaryResult.data.mealBreakdown.snack || 0
          })
        } else {
          setSummary({ total: 0, breakfast: 0, lunch: 0, dinner: 0, snack: 0 })
        }
      } catch (error) {
        console.error('데이터 로드 오류:', error)
        setLogs([])
        setSummary({ total: 0, breakfast: 0, lunch: 0, dinner: 0, snack: 0 })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [selectedDate, user])

  // 선택된 끼니에 따라 로그 필터링
  const filteredLogs = activeMeal === 'all' 
    ? logs 
    : logs.filter(log => log.meal_type === activeMeal)

  // 데이터 새로고침
  const handleRefresh = async () => {
    if (!user) return

    setLoading(true)
    try {
      const dateStr = formatDate(selectedDate)
      
      const [logsResult, summaryResult] = await Promise.all([
        fetchFoodLogs(user.id, { date: dateStr }),
        fetchDailyCalorySummary(user.id, dateStr)
      ])

      if (logsResult.success) {
        setLogs(logsResult.data || [])
      }

      if (summaryResult.success && summaryResult.data) {
        setSummary({
          total: summaryResult.data.totalCalories,
          breakfast: summaryResult.data.mealBreakdown.breakfast || 0,
          lunch: summaryResult.data.mealBreakdown.lunch || 0,
          dinner: summaryResult.data.mealBreakdown.dinner || 0,
          snack: summaryResult.data.mealBreakdown.snack || 0
        })
      }
    } catch (error) {
      console.error('새로고침 오류:', error)
    } finally {
      setLoading(false)
    }
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
        <CalorieSummary summary={summary} />

        {/* 끼니 탭 */}
        <MealTabs
          summary={summary}
          onMealChange={setActiveMeal}
          activeMeal={activeMeal}
        />

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

