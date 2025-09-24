import { NextRequest, NextResponse } from 'next/server'
import { saveFoodLog, getFoodLogs } from '@/lib/food-logs'

// 음식 로그 저장
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
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
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    const options: any = {}
    if (date) options.date = date
    if (mealType) options.mealType = mealType
    if (limit) options.limit = parseInt(limit)

    const result = await getFoodLogs(userId, options)
    
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