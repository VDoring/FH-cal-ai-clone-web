'use client'

import { useEffect, useRef, useState } from 'react'
import { useDemoAuth as useAuth } from '@/components/demo-auth-provider'

interface SSEMessage {
  type: 'connected' | 'analysis_complete' | 'error'
  data?: any
  message?: string
}

interface UseSSEFoodAnalysisReturn {
  isConnected: boolean
  isAnalysisComplete: boolean
  analysisResult: any | null
  connect: () => void
  disconnect: () => void
  reset: () => void
}

export function useSSEFoodAnalysis(): UseSSEFoodAnalysisReturn {
  const { user } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any | null>(null)
  
  const eventSourceRef = useRef<EventSource | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const maxRetries = 3
  const retryCountRef = useRef(0)

  const connect = () => {
    if (!user || eventSourceRef.current) return

    try {
      const eventSource = new EventSource(`/api/sse/food-analysis?userId=${user.id}`)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log('SSE 연결 성공')
        setIsConnected(true)
        retryCountRef.current = 0
      }

      eventSource.onmessage = (event) => {
        try {
          const message: SSEMessage = JSON.parse(event.data)
          console.log('SSE 메시지 수신:', message)

          switch (message.type) {
            case 'connected':
              setIsConnected(true)
              break
              
            case 'analysis_complete':
              setIsAnalysisComplete(true)
              setAnalysisResult(message.data)
              console.log('분석 완료 알림 수신:', message.data)
              break
              
            case 'error':
              console.error('SSE 오류 메시지:', message.message)
              break
          }
        } catch (error) {
          console.error('SSE 메시지 파싱 오류:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('SSE 연결 오류:', error)
        setIsConnected(false)
        
        // 재연결 시도
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++
          console.log(`SSE 재연결 시도 ${retryCountRef.current}/${maxRetries}`)
          
          retryTimeoutRef.current = setTimeout(() => {
            disconnect()
            connect()
          }, 2000 * retryCountRef.current) // 지수적 백오프
        } else {
          console.log('SSE 재연결 포기')
        }
      }
    } catch (error) {
      console.error('SSE 연결 생성 실패:', error)
    }
  }

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
    
    setIsConnected(false)
  }

  const reset = () => {
    setIsAnalysisComplete(false)
    setAnalysisResult(null)
    retryCountRef.current = 0
  }

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [])

  return {
    isConnected,
    isAnalysisComplete,
    analysisResult,
    connect,
    disconnect,
    reset
  }
}
