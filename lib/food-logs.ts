import { getDatabase, type FoodLog, type FoodItem } from './database'
import { v4 as uuidv4 } from 'uuid'

// 데이터베이스 row 타입 정의
interface FoodLogRow {
  id: string
  user_id: string
  image_url: string | null
  meal_type: string
  food_items: string
  total_calories: number
  total_nutrients: string
  confidence_score: number
  created_at: string
  updated_at: string
}

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
    const db = getDatabase()
    
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

    const logId = uuidv4()
    const currentTime = new Date().toISOString()

    db.prepare(`
      INSERT INTO food_logs (
        id, user_id, image_url, meal_type, food_items, 
        total_calories, total_nutrients, confidence_score, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      logId,
      data.userId,
      data.imageUrl,
      data.mealType,
      JSON.stringify(data.items),
      data.summary.totalCalories,
      JSON.stringify(totalNutrients),
      avgConfidence,
      currentTime,
      currentTime
    )

    // 저장된 데이터 조회
    const savedRow = db.prepare(`
      SELECT * FROM food_logs WHERE id = ?
    `).get(logId) as FoodLogRow | undefined

    if (savedRow) {
      const savedData: FoodLog = {
        id: savedRow.id,
        user_id: savedRow.user_id,
        image_url: savedRow.image_url,
        meal_type: savedRow.meal_type as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        food_items: JSON.parse(savedRow.food_items),
        total_calories: savedRow.total_calories,
        total_nutrients: JSON.parse(savedRow.total_nutrients),
        confidence_score: savedRow.confidence_score,
        created_at: savedRow.created_at,
        updated_at: savedRow.updated_at
      }
      
      return { success: true, data: savedData }
    }

    return { success: false, error: '데이터 저장에 실패했습니다.' }
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
    const db = getDatabase()
    
    let sql = 'SELECT * FROM food_logs WHERE user_id = ?'
    const params: (string | number)[] = [userId]

    // 날짜 필터링
    if (options?.date) {
      const startOfDay = `${options.date}T00:00:00.000Z`
      const endOfDay = `${options.date}T23:59:59.999Z`
      sql += ' AND created_at >= ? AND created_at <= ?'
      params.push(startOfDay, endOfDay)
    }

    // 끼니 필터링
    if (options?.mealType) {
      sql += ' AND meal_type = ?'
      params.push(options.mealType)
    }

    // 정렬
    sql += ' ORDER BY created_at DESC'

    // 개수 제한
    if (options?.limit) {
      sql += ' LIMIT ?'
      params.push(options.limit)
    }

    const rows = db.prepare(sql).all(...params) as FoodLogRow[]

    const foodLogs: FoodLog[] = rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      image_url: row.image_url,
      meal_type: row.meal_type as 'breakfast' | 'lunch' | 'dinner' | 'snack',
      food_items: JSON.parse(row.food_items),
      total_calories: row.total_calories,
      total_nutrients: JSON.parse(row.total_nutrients),
      confidence_score: row.confidence_score,
      created_at: row.created_at,
      updated_at: row.updated_at
    }))

    return { success: true, data: foodLogs }
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
    const db = getDatabase()
    
    const result = db.prepare(`
      DELETE FROM food_logs 
      WHERE id = ? AND user_id = ?
    `).run(logId, userId)

    if (result.changes === 0) {
      return { 
        success: false, 
        error: '삭제할 음식 로그를 찾을 수 없습니다.' 
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
    const db = getDatabase()
    const startOfDay = `${date}T00:00:00.000Z`
    const endOfDay = `${date}T23:59:59.999Z`
    
    const rows = db.prepare(`
      SELECT meal_type, total_calories 
      FROM food_logs 
      WHERE user_id = ? 
        AND created_at >= ? 
        AND created_at <= ?
    `).all(userId, startOfDay, endOfDay) as { meal_type: string; total_calories: number }[]

    const totalCalories = rows.reduce((sum, log) => sum + log.total_calories, 0)
    const mealBreakdown = rows.reduce((acc, log) => {
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
