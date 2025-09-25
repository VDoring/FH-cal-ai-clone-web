// 데모 모드용 음식 로그 관리
export interface DemoFoodLog {
  id: string
  user_id: string
  image_url: string | null
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  food_items: FoodItem[]
  total_calories: number
  total_nutrients: {
    carbohydrates: { value: number; unit: string }
    protein: { value: number; unit: string }
    fat: { value: number; unit: string }
    sugars: { value: number; unit: string }
    sodium: { value: number; unit: string }
  }
  confidence_score: number
  created_at: string
  updated_at: string
}

export interface FoodItem {
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

// 로컬 스토리지 키
const FOOD_LOGS_KEY = 'demo_food_logs'

// 음식 로그 저장
export async function saveDemoFoodLog(data: {
  userId: string
  imageUrl: string | null
  mealType: string
  items: FoodItem[]
  summary: {
    totalCalories: number
    totalCarbohydrates: { value: number; unit: string }
    totalProtein: { value: number; unit: string }
    totalFat: { value: number; unit: string }
  }
}): Promise<{ success: boolean; data?: DemoFoodLog; error?: string }> {
  try {
    // 평균 신뢰도 계산
    const avgConfidence = data.items.length > 0 
      ? data.items.reduce((sum, item) => sum + item.confidence, 0) / data.items.length
      : 0

    // 데이터베이스에 저장할 형태로 변환
    const totalNutrients = {
      carbohydrates: data.summary.totalCarbohydrates,
      protein: data.summary.totalProtein,
      fat: data.summary.totalFat,
      sugars: { value: 0, unit: 'g' }, // 기본값
      sodium: { value: 0, unit: 'mg' } // 기본값
    }

    const logId = `log_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const currentTime = new Date().toISOString()

    const newLog: DemoFoodLog = {
      id: logId,
      user_id: data.userId,
      image_url: data.imageUrl,
      meal_type: data.mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
      food_items: data.items,
      total_calories: data.summary.totalCalories,
      total_nutrients: totalNutrients,
      confidence_score: avgConfidence,
      created_at: currentTime,
      updated_at: currentTime
    }

    // 로컬 스토리지에서 기존 로그 가져오기
    const existingLogs = getDemoFoodLogs()
    
    // 새 로그 추가
    existingLogs.push(newLog)
    
    // 로컬 스토리지에 저장
    localStorage.setItem(FOOD_LOGS_KEY, JSON.stringify(existingLogs))

    console.log('데모 음식 로그 저장 성공:', logId)
    return { success: true, data: newLog }
  } catch (error) {
    console.error('데모 음식 로그 저장 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
    }
  }
}

// 음식 로그 조회
export async function getDemoFoodLogsForUser(
  userId: string, 
  options?: {
    date?: string // YYYY-MM-DD 형식
    mealType?: string
    limit?: number
  }
): Promise<{ success: boolean; data?: DemoFoodLog[]; error?: string }> {
  try {
    let logs = getDemoFoodLogs().filter(log => log.user_id === userId)

    // 날짜 필터링
    if (options?.date) {
      const targetDate = options.date
      logs = logs.filter(log => {
        const logDate = new Date(log.created_at).toISOString().split('T')[0]
        return logDate === targetDate
      })
    }

    // 끼니 필터링
    if (options?.mealType) {
      logs = logs.filter(log => log.meal_type === options.mealType)
    }

    // 정렬 (최신순)
    logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // 개수 제한
    if (options?.limit) {
      logs = logs.slice(0, options.limit)
    }

    return { success: true, data: logs }
  } catch (error) {
    console.error('데모 음식 로그 조회 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
    }
  }
}

// 음식 로그 삭제
export async function deleteDemoFoodLog(logId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const logs = getDemoFoodLogs()
    const filteredLogs = logs.filter(log => !(log.id === logId && log.user_id === userId))
    
    if (logs.length === filteredLogs.length) {
      return { 
        success: false, 
        error: '삭제할 음식 로그를 찾을 수 없습니다.' 
      }
    }

    localStorage.setItem(FOOD_LOGS_KEY, JSON.stringify(filteredLogs))
    return { success: true }
  } catch (error) {
    console.error('데모 음식 로그 삭제 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
    }
  }
}

// 날짜별 칼로리 요약 조회
export async function getDemoDailyCalorySummary(
  userId: string,
  date: string // YYYY-MM-DD 형식
): Promise<{ success: boolean; data?: { totalCalories: number; mealBreakdown: Record<string, number> }; error?: string }> {
  try {
    const logs = getDemoFoodLogs().filter(log => {
      const logDate = new Date(log.created_at).toISOString().split('T')[0]
      return log.user_id === userId && logDate === date
    })

    const totalCalories = logs.reduce((sum, log) => sum + log.total_calories, 0)
    const mealBreakdown = logs.reduce((acc, log) => {
      acc[log.meal_type] = (acc[log.meal_type] || 0) + log.total_calories
      return acc
    }, {} as Record<string, number>)

    return { 
      success: true, 
      data: { totalCalories, mealBreakdown } 
    }
  } catch (error) {
    console.error('데모 일일 칼로리 요약 조회 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
    }
  }
}

// 로컬 스토리지에서 모든 음식 로그 가져오기
function getDemoFoodLogs(): DemoFoodLog[] {
  try {
    const stored = localStorage.getItem(FOOD_LOGS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('로컬 스토리지에서 음식 로그 가져오기 오류:', error)
    return []
  }
}
