import { NextRequest, NextResponse } from 'next/server'
import { getDailyCalorySummary } from '@/lib/food-logs'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Date parameter is required' },
        { status: 400 }
      )
    }

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

    // Supabase에서 일일 칼로리 요약 조회
    const result = await getDailyCalorySummary(targetUserId, date)
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error) {
    console.error('일일 칼로리 요약 API 오류:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '서버 오류가 발생했습니다.' 
      },
      { status: 500 }
    )
  }
}