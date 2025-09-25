import { NextRequest, NextResponse } from 'next/server'
import { saveFoodLog } from '@/lib/food-logs'
import { sendSSEMessage } from '@/app/api/sse/food-analysis/route'

export async function POST(request: NextRequest) {
  try {
    console.log('n8n 분석 결과 웹훅 수신')
    
    const body = await request.json()
    console.log('수신된 데이터:', JSON.stringify(body, null, 2))

    // 필수 데이터 검증
    if (!body.userId || !body.analysisResult) {
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

    const { userId, analysisResult: data } = body

    // 분석 결과 데이터 검증
    if (!data.items || !data.summary) {
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

    // userId 처리: n8n에서 전달되는 사용자 ID를 Supabase 브릿지 계정으로 매핑
    let actualUserId = userId
    
    // userId가 UUID 형식이 아닌 경우 (예: user_1758765225587_4kf14)
    // 데모 사용자를 위한 브릿지 Supabase 계정으로 매핑
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
    
    if (!isValidUUID) {
      console.log(`비UUID 형식의 userId 감지: ${userId}`)
      console.log('데모 사용자의 데이터를 Supabase 브릿지 계정으로 매핑합니다.')
      
      // testuser@gmail.com (데모 계정)을 위한 브릿지 Supabase 계정 UUID
      actualUserId = '22222222-2222-2222-2222-222222222222'
      console.log(`브릿지 Supabase userId로 매핑: ${actualUserId}`)
      console.log(`원본 userId: ${userId} → 매핑된 UUID: ${actualUserId}`)
    } else {
      console.log(`유효한 UUID 형식의 userId: ${userId}`)
    }

    // 모든 음식 로그를 Supabase에 저장
    console.log('Supabase에 음식 로그 저장 중...')
    const saveResult = await saveFoodLog({
      userId: actualUserId,
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

    // SSE를 통해 프론트엔드에 완료 알림 (원래 userId로 전송)
    const sseMessage = {
      type: 'analysis_complete',
      data: {
        logId: saveResult.data?.id,
        totalCalories: data.summary.totalCalories,
        itemCount: data.items.length,
        timestamp: new Date().toISOString(),
        // 전체 분석 결과 추가
        analysisResult: {
          items: data.items,
          summary: data.summary,
          mealType,
          imageUrl: data.imageUrl
        }
      }
    }
    
    // SSE는 원래 userId로 전송 (프론트엔드에서 연결된 ID)
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
