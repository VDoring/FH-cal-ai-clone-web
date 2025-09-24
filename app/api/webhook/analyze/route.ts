import { NextRequest, NextResponse } from 'next/server'
import { saveFoodLog } from '@/lib/food-logs'
import { sendSSEMessage } from '@/app/api/sse/food-analysis/route'

// Route Handler의 최대 실행 시간을 150초로 설정 (2분 timeout + 여유시간)
export const maxDuration = 150

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get('image') as File
    const userId = formData.get('userId') as string

    if (!image || !userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'MISSING_DATA', 
            message: '이미지와 사용자 ID가 필요합니다.' 
          } 
        },
        { status: 400 }
      )
    }

    // n8n 웹훅으로 전송할 FormData 생성
    const n8nFormData = new FormData()
    n8nFormData.append('image', image)
    n8nFormData.append('userId', userId)
    n8nFormData.append('timestamp', new Date().toISOString())
    
    // 결과 수신을 위한 콜백 URL 추가
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhook/result`
    n8nFormData.append('callbackUrl', callbackUrl)

    // n8n 웹훅 호출
    const webhookUrl = process.env.N8N_WEBHOOK_URL || 'https://vdoring.app.n8n.cloud/webhook-test/ea867a96-272a-451f-bf3a-3235052b195c'
    
    console.log('환경변수 N8N_WEBHOOK_URL:', process.env.N8N_WEBHOOK_URL)
    console.log('n8n 웹훅 호출 시작:', webhookUrl)
    console.log('콜백 URL:', callbackUrl)
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: n8nFormData,
      // 타임아웃 설정 (2분 - 이미지 분석 완료까지 대기)
      signal: AbortSignal.timeout(120000)
    })

    if (!response.ok) {
      console.error('n8n 웹훅 응답 오류:', response.status, response.statusText)
      throw new Error(`n8n 웹훅 오류: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    console.log('n8n 웹훅 응답:', JSON.stringify(result, null, 2))
    
    // n8n에서 분석 결과가 바로 반환된 경우 즉시 처리
    if (result.success && result.data) {
      console.log('n8n에서 분석 결과 즉시 반환됨, 데이터베이스 저장 중...')
      console.log('분석 결과 데이터 구조:', JSON.stringify(result.data, null, 2))
      console.log('imageUrl 확인:', result.data.imageUrl)
      console.log('items 확인:', result.data.items)
      console.log('summary 확인:', result.data.summary)
      
      // 끼니 타입 결정 (현재 시간 기준)
      const now = new Date()
      const hour = now.getHours()
      let mealType = result.data.mealType || 'snack'
      
      if (!result.data.mealType) {
        if (hour >= 6 && hour < 11) mealType = 'breakfast'
        else if (hour >= 11 && hour < 17) mealType = 'lunch'
        else if (hour >= 17 && hour < 22) mealType = 'dinner'
        else mealType = 'snack'
      }

      // imageUrl이 없는 경우 null로 설정 (임시 URL 대신)
      const imageUrl = result.data.imageUrl || null
      console.log('최종 imageUrl:', imageUrl, '(원본:', result.data.imageUrl, ')')
      
      // 데이터베이스에 저장
      const saveResult = await saveFoodLog({
        userId,
        imageUrl,
        mealType,
        items: result.data.items,
        summary: result.data.summary
      })

      if (saveResult.success) {
        console.log('분석 결과 저장 완료:', saveResult.data?.id)

        // SSE를 통해 프론트엔드에 완료 알림
        const sseMessage = {
          type: 'analysis_complete',
          data: {
            logId: saveResult.data?.id,
            totalCalories: result.data.summary.totalCalories,
            itemCount: result.data.items.length,
            timestamp: new Date().toISOString()
          }
        }
        
        const sseSent = sendSSEMessage(userId, sseMessage)
        console.log(`SSE 알림 전송: userId=${userId}, 성공=${sseSent}`)

        return NextResponse.json({
          success: true,
          message: '이미지 분석 및 저장이 완료되었습니다.',
          data: {
            status: 'complete',
            logId: saveResult.data?.id,
            totalCalories: result.data.summary.totalCalories,
            itemCount: result.data.items.length,
            userId,
            timestamp: new Date().toISOString()
          }
        })
      } else {
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
    }
    
    // n8n에서 비동기 처리를 위한 응답인 경우
    return NextResponse.json({
      success: true,
      message: '이미지 분석이 시작되었습니다.',
      data: {
        status: 'processing',
        userId,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('웹훅 API 오류:', error)
    
    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'TIMEOUT', 
            message: '이미지 분석 시간이 2분을 초과했습니다. 더 작은 이미지로 다시 시도해주세요.' 
          } 
        },
        { status: 408 }
      )
    }

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
