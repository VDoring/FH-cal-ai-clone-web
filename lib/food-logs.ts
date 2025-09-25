import { supabaseAdmin, type FoodLog, type FoodItem } from './supabase'

// 음식 분석 결과를 데이터베이스에 저장
export async function saveFoodLog(data: {
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
}): Promise<{ success: boolean; data?: FoodLog; error?: string }> {
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

    // 서버 사이드에서는 RLS를 우회할 수 있는 Admin 클라이언트 사용
    const { data: insertedData, error } = await supabaseAdmin
      .from('food_logs')
      .insert({
        user_id: data.userId,
        image_url: data.imageUrl,
        meal_type: data.mealType,
        food_items: data.items,
        total_calories: data.summary.totalCalories,
        total_nutrients: totalNutrients,
        confidence_score: avgConfidence
      })
      .select()
      .single()

    if (error) {
      console.error('음식 로그 저장 오류:', error)
      return { 
        success: false, 
        error: error.message
      }
    }

    return { success: true, data: insertedData }
  } catch (error) {
    console.error('음식 로그 저장 예외:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
    }
  }
}

// 사용자의 음식 로그 조회
export async function getFoodLogs(
  userId: string, 
  options?: {
    date?: string // YYYY-MM-DD 형식
    mealType?: string
    limit?: number
  }
): Promise<{ success: boolean; data?: FoodLog[]; error?: string }> {
  try {
    // 서버 사이드에서는 Admin 클라이언트 사용 (더 안정적)
    let query = supabaseAdmin
      .from('food_logs')
      .select('*')
      .eq('user_id', userId)

    // 날짜 필터링
    if (options?.date) {
      const startOfDay = `${options.date}T00:00:00.000Z`
      const endOfDay = `${options.date}T23:59:59.999Z`
      query = query
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay)
    }

    // 끼니 필터링
    if (options?.mealType) {
      query = query.eq('meal_type', options.mealType)
    }

    // 정렬
    query = query.order('created_at', { ascending: false })

    // 개수 제한
    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('음식 로그 조회 오류:', error)
      return { 
        success: false, 
        error: error.message
      }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('음식 로그 조회 예외:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
    }
  }
}

// 특정 음식 로그 삭제
export async function deleteFoodLog(logId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('food_logs')
      .delete()
      .eq('id', logId)
      .eq('user_id', userId)

    if (error) {
      console.error('음식 로그 삭제 오류:', error)
      return { 
        success: false, 
        error: error.message
      }
    }

    return { success: true }
  } catch (error) {
    console.error('음식 로그 삭제 예외:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
    }
  }
}

// 날짜별 칼로리 요약 조회
export async function getDailyCalorySummary(
  userId: string,
  date: string // YYYY-MM-DD 형식
): Promise<{ success: boolean; data?: { totalCalories: number; mealBreakdown: Record<string, number> }; error?: string }> {
  try {
    const startOfDay = `${date}T00:00:00.000Z`
    const endOfDay = `${date}T23:59:59.999Z`
    
    const { data, error } = await supabaseAdmin
      .from('food_logs')
      .select('meal_type, total_calories')
      .eq('user_id', userId)
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)

    if (error) {
      console.error('일일 칼로리 요약 조회 오류:', error)
      return { 
        success: false, 
        error: error.message
      }
    }

    const logs = data || []
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
    console.error('일일 칼로리 요약 조회 예외:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
    }
  }
}
