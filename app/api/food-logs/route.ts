import { NextRequest, NextResponse } from 'next/server'
import { saveFoodLog, getFoodLogs } from '@/lib/food-logs'
import { getCurrentUser } from '@/lib/auth'

// 음식 로그 저장
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // 사용자 ID가 제공되었으면 그대로 사용, 아니면 인증된 사용자 ID 사용
    if (!data.userId) {
      const userResult = await getCurrentUser()
      if (!userResult.success || !userResult.data) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        )
      }
      data.userId = userResult.data.id
    }
    
    // 모든 음식 로그를 Supabase에 저장
    const result = await saveFoodLog(data)
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error) {
    console.error('음식 로그 저장 API 오류:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '서버 오류가 발생했습니다.' 
      },
      { status: 500 }
    )
  }
}

// 음식 로그 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const date = searchParams.get('date')
    const mealType = searchParams.get('mealType')
    const limit = searchParams.get('limit')

    const options: {
      date?: string
      mealType?: string
      limit?: number
    } = {}
    if (date) options.date = date
    if (mealType) options.mealType = mealType
    if (limit) options.limit = parseInt(limit)

    // 사용자 ID가 제공되었으면 그것을 사용, 아니면 인증된 사용자 ID 사용
    let targetUserId = userId
    if (!targetUserId) {
      const userResult = await getCurrentUser()
      if (!userResult.success || !userResult.data) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        )
      }
      targetUserId = userResult.data.id
    }

    // 모든 음식 로그를 Supabase에서 조회
    const result = await getFoodLogs(targetUserId, options)
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error) {
    console.error('음식 로그 조회 API 오류:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '서버 오류가 발생했습니다.' 
      },
      { status: 500 }
    )
  }
}