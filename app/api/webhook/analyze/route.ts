import { NextRequest, NextResponse } from 'next/server'

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

    // n8n 웹훅 호출
    const webhookUrl = process.env.N8N_WEBHOOK_URL!
    
    if (!webhookUrl) {
      throw new Error('N8N_WEBHOOK_URL 환경변수가 설정되지 않았습니다.')
    }

    console.log('n8n 웹훅 호출 시작:', webhookUrl)
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: n8nFormData,
      // 타임아웃 설정 (30초)
      signal: AbortSignal.timeout(30000)
    })

    if (!response.ok) {
      console.error('n8n 웹훅 응답 오류:', response.status, response.statusText)
      throw new Error(`n8n 웹훅 오류: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    console.log('n8n 웹훅 응답:', result)
    
    // n8n에서 성공 응답이 오지 않은 경우
    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('웹훅 API 오류:', error)
    
    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'TIMEOUT', 
            message: '분석 시간이 너무 오래 걸립니다. 다시 시도해주세요.' 
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
