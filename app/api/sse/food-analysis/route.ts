import { NextRequest, NextResponse } from 'next/server'

// 활성 SSE 연결을 저장하는 Map
const connections = new Map<string, ReadableStreamDefaultController>()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  
  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    )
  }

  // SSE 스트림 생성
  const stream = new ReadableStream({
    start(controller) {
      // 사용자별 연결 저장
      connections.set(userId, controller)
      
      // 연결 확인 메시지
      controller.enqueue(`data: ${JSON.stringify({ 
        type: 'connected', 
        message: 'SSE connection established' 
      })}\n\n`)
      
      console.log(`SSE 연결 생성됨: userId=${userId}`)
    },
    cancel() {
      // 연결 해제 시 정리
      connections.delete(userId)
      console.log(`SSE 연결 해제됨: userId=${userId}`)
    }
  })

  // SSE 응답 헤더 설정
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
}

// 특정 사용자에게 메시지 전송하는 유틸리티 함수
export function sendSSEMessage(userId: string, data: any) {
  const controller = connections.get(userId)
  console.log(`SSE 메시지 전송 시도: userId=${userId}, 연결됨=${!!controller}`)
  
  if (controller) {
    try {
      controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
      console.log(`SSE 메시지 전송 성공: userId=${userId}`, data)
      return true
    } catch (error) {
      console.error('SSE 메시지 전송 실패:', error)
      connections.delete(userId)
      return false
    }
  } else {
    console.log(`SSE 연결이 없음: userId=${userId}, 총 연결 수=${connections.size}`)
    console.log('활성 연결들:', Array.from(connections.keys()))
    return false
  }
}

// 모든 연결 정리
export function closeAllConnections() {
  for (const [userId, controller] of connections) {
    try {
      controller.close()
    } catch (error) {
      console.error(`SSE 연결 정리 실패: userId=${userId}`, error)
    }
  }
  connections.clear()
}
