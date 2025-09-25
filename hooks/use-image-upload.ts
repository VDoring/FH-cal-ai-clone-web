'use client'

import { useState } from 'react'
import { analyzeWithRetry } from '@/lib/webhook'
import { useDemoAuth as useAuth } from '@/components/demo-auth-provider'
import { useSSEFoodAnalysis } from './use-sse-food-analysis'
import type { WebhookResponse } from '@/lib/webhook'

interface UploadState {
  loading: boolean
  error: string | null
  progress: number
  stage: 'idle' | 'compressing' | 'uploading' | 'analyzing' | 'saving' | 'complete'
  result: WebhookResponse['data'] | null
}

export function useImageUpload() {
  const { user } = useAuth()
  const [state, setState] = useState<UploadState>({
    loading: false,
    error: null,
    progress: 0,
    stage: 'idle',
    result: null
  })
  
  const sse = useSSEFoodAnalysis()

  const processImage = async (file: File): Promise<WebhookResponse['data'] | null> => {
    console.log('🔄 processImage 시작 - 파일:', file.name, '사용자:', user?.id)
    
    if (!user) {
      console.error('❌ 사용자 없음')
      setState(prev => ({ ...prev, error: '로그인이 필요합니다.' }))
      return null
    }

    // 파일 검증
    if (!file.type.startsWith('image/')) {
      console.error('❌ 이미지 파일이 아님:', file.type)
      setState(prev => ({ ...prev, error: '이미지 파일만 업로드 가능합니다.' }))
      return null
    }

    // 파일 크기 검증 (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      console.error('❌ 파일 크기 초과:', file.size, 'bytes')
      setState(prev => ({ ...prev, error: '파일 크기는 10MB 이하여야 합니다.' }))
      return null
    }

    console.log('✅ 파일 검증 통과')

    // SSE 연결 시작
    console.log('🔗 SSE 연결 시작')
    sse.connect()
    sse.reset()

    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null, 
      progress: 0, 
      stage: 'analyzing' 
    }))

    try {
      // 진행률 업데이트
      console.log('📊 진행률 20% - 분석 준비 중')
      setState(prev => ({ ...prev, progress: 20 }))

      // AI 분석 시작 (비동기)
      console.log('🤖 음식 분석 시작 (비동기):', file.name)
      setState(prev => ({ ...prev, progress: 30 }))
      
      const analysisResult = await analyzeWithRetry(file, user.id)
      console.log('📋 분석 요청 응답:', analysisResult)

      if (!analysisResult.success) {
        throw new Error(analysisResult.error?.message || 'AI 분석 요청 실패')
      }

      // 비동기 처리 시작 확인
      const responseData = analysisResult.data as any
      if (responseData?.status === 'processing') {
        console.log('✅ 비동기 분석 시작됨 - SSE를 통해 결과 대기 중')
        setState(prev => ({ 
          ...prev, 
          progress: 50,
          stage: 'analyzing'
        }))
        
        // SSE 결과 대기 (최대 3분)
        return new Promise((resolve) => {
          const timeoutId = setTimeout(() => {
            console.log('⏰ 3분 타임아웃 - 분석이 너무 오래 걸립니다')
            setState(prev => ({ 
              ...prev, 
              loading: false, 
              error: '분석 시간이 3분을 초과했습니다. 더 작은 이미지로 다시 시도해주세요.',
              stage: 'idle'
            }))
            sse.disconnect()
            resolve(null)
          }, 180000) // 3분 타임아웃

          // SSE 결과 감지
          const checkResult = () => {
            if (sse.isAnalysisComplete && sse.analysisResult) {
              clearTimeout(timeoutId)
              console.log('🎉 SSE를 통해 분석 완료 알림 수신:', sse.analysisResult)
              
              // SSE에서 받은 완전한 분석 결과 사용
              const analysisData = sse.analysisResult.analysisResult || {
                items: [],
                summary: { 
                  totalCalories: sse.analysisResult.totalCalories || 0, 
                  totalCarbohydrates: { value: 0, unit: 'g' }, 
                  totalProtein: { value: 0, unit: 'g' }, 
                  totalFat: { value: 0, unit: 'g' } 
                }, 
                mealType: 'snack', 
                imageUrl: '' 
              }
              
              console.log('📊 파싱된 분석 데이터:', analysisData)
              
              setState(prev => ({ 
                ...prev, 
                loading: false, 
                progress: 100,
                stage: 'complete',
                result: analysisData
              }))
              
              sse.disconnect()
              resolve(analysisData)
            } else {
              // 100ms마다 결과 확인
              setTimeout(checkResult, 100)
            }
          }
          
          checkResult()
        })
      } else if (responseData?.status === 'complete') {
        // 즉시 완료된 경우 (기존 로직과 동일)
        console.log('⚡ 즉시 분석 완료됨:', analysisResult)
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          progress: 100,
          stage: 'complete',
          result: { 
            items: [],
            summary: { totalCalories: responseData.totalCalories || 0, totalCarbohydrates: { value: 0, unit: 'g' }, totalProtein: { value: 0, unit: 'g' }, totalFat: { value: 0, unit: 'g' } }, 
            mealType: 'snack', 
            imageUrl: '' 
          }
        }))
        
        sse.disconnect()
        return { 
          items: [], 
          summary: { totalCalories: responseData.totalCalories || 0, totalCarbohydrates: { value: 0, unit: 'g' }, totalProtein: { value: 0, unit: 'g' }, totalFat: { value: 0, unit: 'g' } }, 
          mealType: 'snack', 
          imageUrl: '' 
        }
      } else {
        throw new Error('예상하지 못한 응답 형식')
      }
    } catch (error) {
      console.error('이미지 처리 오류:', error)
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : '처리 실패',
        stage: 'idle'
      }))
      sse.disconnect()
      return null
    }
  }

  const reset = () => {
    setState({
      loading: false,
      error: null,
      progress: 0,
      stage: 'idle',
      result: null
    })
    sse.disconnect()
    sse.reset()
  }

  return {
    ...state,
    processImage,
    reset
  }
}
