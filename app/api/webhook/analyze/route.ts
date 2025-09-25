import { NextRequest, NextResponse } from 'next/server'
import { sendSSEMessage } from '@/app/api/sse/food-analysis/route'

// Route Handler의 최대 실행 시간을 30초로 설정 (즉시 응답용)
export const maxDuration = 30

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
    const webhookUrl = process.env.N8N_WEBHOOK_URL
    
    console.log('환경변수 N8N_WEBHOOK_URL:', webhookUrl)
    console.log('콜백 URL:', callbackUrl)
    
    if (!webhookUrl || webhookUrl === '') {
      // n8n이 설정되지 않은 경우 비동기 시뮬레이션
      console.log('n8n webhook이 설정되지 않음. 비동기 분석 시뮬레이션 시작...')
      
      // 비동기로 분석 시뮬레이션 실행 (긴 처리 시간 시뮬레이션)
      setTimeout(async () => {
        try {
          // 2~5초 랜덤 대기 (테스트용으로 짧게 설정)
          const simulationDelay = Math.random() * 3000 + 2000 // 2~5초
          console.log(`분석 시뮬레이션 시작 - ${Math.round(simulationDelay/1000)}초 후 완료 예정`)
          
          await new Promise(resolve => setTimeout(resolve, simulationDelay))
          
          // 시뮬레이션용 음식 데이터
          const sampleFoods = [
            {
              foodName: "불고기덮밥",
              confidence: 0.89,
              quantity: "1그릇",
              calories: 520,
              nutrients: {
                carbohydrates: { value: 65, unit: "g" },
                protein: { value: 28, unit: "g" },
                fat: { value: 18, unit: "g" },
                sugars: { value: 12, unit: "g" },
                sodium: { value: 880, unit: "mg" }
              }
            },
            {
              foodName: "김치찌개",
              confidence: 0.92,
              quantity: "1인분",
              calories: 280,
              nutrients: {
                carbohydrates: { value: 15, unit: "g" },
                protein: { value: 22, unit: "g" },
                fat: { value: 18, unit: "g" },
                sugars: { value: 8, unit: "g" },
                sodium: { value: 1200, unit: "mg" }
              }
            },
            {
              foodName: "치킨샐러드",
              confidence: 0.85,
              quantity: "1접시",
              calories: 320,
              nutrients: {
                carbohydrates: { value: 12, unit: "g" },
                protein: { value: 35, unit: "g" },
                fat: { value: 15, unit: "g" },
                sugars: { value: 8, unit: "g" },
                sodium: { value: 650, unit: "mg" }
              }
            }
          ]
          
          // 랜덤하게 음식 선택
          const randomFood = sampleFoods[Math.floor(Math.random() * sampleFoods.length)]
          
          const analysisResult = {
            success: true,
            data: {
              items: [randomFood],
              summary: {
                totalCalories: randomFood.calories,
                totalCarbohydrates: randomFood.nutrients.carbohydrates,
                totalProtein: randomFood.nutrients.protein,
                totalFat: randomFood.nutrients.fat
              },
              imageUrl: null,
              mealType: null
            }
          }
          
          console.log('시뮬레이션된 분석 결과:', JSON.stringify(analysisResult, null, 2))
          
          // 결과를 콜백 API로 전송하여 실제 n8n 플로우 시뮬레이션
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhook/result`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              analysisResult: analysisResult.data,
              timestamp: new Date().toISOString()
            })
          })
          
          console.log('시뮬레이션 결과 콜백 전송 완료')
        } catch (error) {
          console.error('시뮬레이션 처리 중 오류:', error)
          
          // 오류 발생 시 SSE로 오류 알림
          sendSSEMessage(userId, {
            type: 'error',
            message: '분석 중 오류가 발생했습니다.'
          })
        }
      }, 100) // 100ms 후 비동기 실행
      
      // 즉시 처리 시작 응답 반환
      return NextResponse.json({
        success: true,
        message: '이미지 분석이 시작되었습니다. 완료까지 최대 3분 정도 소요될 수 있습니다.',
        data: {
          status: 'processing',
          userId,
          timestamp: new Date().toISOString()
        }
      })
    } else {
      // n8n이 설정된 경우 실제 웹훅 호출 (비동기)
      console.log('n8n 웹훅 비동기 호출 시작:', webhookUrl)
      
      // 비동기로 n8n 웹훅 호출
      setTimeout(async () => {
        try {
          const response = await fetch(webhookUrl, {
            method: 'POST',
            body: n8nFormData,
            // 타임아웃 설정 (3분)
            signal: AbortSignal.timeout(180000)
          })

          if (!response.ok) {
            console.error('n8n 웹훅 응답 오류:', response.status, response.statusText)
            
            // 오류 발생 시 SSE로 알림
            sendSSEMessage(userId, {
              type: 'error',
              message: 'AI 분석 서비스에 일시적인 문제가 발생했습니다.'
            })
          } else {
            const result = await response.json()
            console.log('n8n 웹훅 응답:', JSON.stringify(result, null, 2))
            
            // n8n이 즉시 결과를 반환한 경우 콜백으로 처리
            if (result.success && result.data) {
              await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhook/result`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId,
                  analysisResult: result.data,
                  timestamp: new Date().toISOString()
                })
              })
            }
          }
        } catch (error) {
          console.error('n8n 웹훅 호출 오류:', error)
          
          if (error instanceof Error && error.name === 'TimeoutError') {
            sendSSEMessage(userId, {
              type: 'error',
              message: '분석 시간이 3분을 초과했습니다. 더 작은 이미지로 다시 시도해주세요.'
            })
          } else {
            sendSSEMessage(userId, {
              type: 'error',
              message: '분석 중 오류가 발생했습니다.'
            })
          }
        }
      }, 100) // 100ms 후 비동기 실행
      
      // 즉시 처리 시작 응답 반환
      return NextResponse.json({
        success: true,
        message: '이미지 분석이 시작되었습니다. 완료까지 최대 3분 정도 소요될 수 있습니다.',
        data: {
          status: 'processing',
          userId,
          timestamp: new Date().toISOString()
        }
      })
    }
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
