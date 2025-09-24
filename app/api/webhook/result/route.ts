import { NextRequest, NextResponse } from 'next/server'
import { saveFoodLog } from '@/lib/food-logs'
import { sendSSEMessage } from '@/app/api/sse/food-analysis/route'

export async function POST(request: NextRequest) {
  try {
    console.log('n8n 분석 결과 웹훅 수신')
    
    const body = await request.json()
    console.log('수신된 데이터:', JSON.stringify(body, null, 2))

    // 필수 데이터 검증
    if (!body.userId || !body.data) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'MISSING_DATA', 
            message: '사용자 ID와 분석 결과가 필요합니다.' 
          } 
        },
        { status: 400 }
      )
    }

    const { userId, data } = body

    // 분석 결과 데이터 검증
    if (!data.items || !data.summary || !data.imageUrl) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_DATA', 
            message: '분석 결과 데이터가 올바르지 않습니다.' 
          } 
        },
        { status: 400 }
      )
    }

    // 끼니 타입 결정 (현재 시간 기준)
    const now = new Date()
    const hour = now.getHours()
    let mealType = data.mealType || 'snack'
    
    if (!data.mealType) {
      if (hour >= 6 && hour < 11) mealType = 'breakfast'
      else if (hour >= 11 && hour < 17) mealType = 'lunch'
      else if (hour >= 17 && hour < 22) mealType = 'dinner'
      else mealType = 'snack'
    }

    // 데이터베이스에 저장
    const saveResult = await saveFoodLog({
      userId,
      imageUrl: data.imageUrl,
      mealType,
      items: data.items,
      summary: data.summary
    })

    if (!saveResult.success) {
      console.error('데이터베이스 저장 실패:', saveResult.error)
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'DATABASE_ERROR', 
            message: saveResult.error || '데이터베이스 저장에 실패했습니다.' 
          } 
        },
        { status: 500 }
      )
    }

    console.log('분석 결과 저장 완료:', saveResult.data?.id)

    // SSE를 통해 프론트엔드에 완료 알림
    const sseMessage = {
      type: 'analysis_complete',
      data: {
        logId: saveResult.data?.id,
        totalCalories: data.summary.totalCalories,
        itemCount: data.items.length,
        timestamp: new Date().toISOString()
      }
    }
    
    const sseSent = sendSSEMessage(userId, sseMessage)
    console.log(`SSE 알림 전송: userId=${userId}, 성공=${sseSent}`)

    return NextResponse.json({
      success: true,
      message: '분석 결과가 성공적으로 저장되었습니다.',
      data: {
        logId: saveResult.data?.id,
        totalCalories: data.summary.totalCalories,
        itemCount: data.items.length
      }
    })

  } catch (error) {
    console.error('결과 웹훅 처리 오류:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'WEBHOOK_ERROR', 
          message: error instanceof Error ? error.message : '서버 오류가 발생했습니다.' 
        } 
      },
      { status: 500 }
    )
  }
}
