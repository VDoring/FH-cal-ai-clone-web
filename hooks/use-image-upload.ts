'use client'

import { useState } from 'react'
import { analyzeWithRetry } from '@/lib/webhook'
import { useAuth } from '@/components/auth-provider'
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

  const processImage = async (file: File): Promise<WebhookResponse['data'] | null> => {
    if (!user) {
      setState(prev => ({ ...prev, error: '로그인이 필요합니다.' }))
      return null
    }

    // 파일 검증
    if (!file.type.startsWith('image/')) {
      setState(prev => ({ ...prev, error: '이미지 파일만 업로드 가능합니다.' }))
      return null
    }

    // 파일 크기 검증 (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setState(prev => ({ ...prev, error: '파일 크기는 10MB 이하여야 합니다.' }))
      return null
    }

    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null, 
      progress: 0, 
      stage: 'analyzing' 
    }))

    try {
      // 진행률 업데이트
      setState(prev => ({ ...prev, progress: 20 }))

      // AI 분석 (n8n 웹훅 호출)
      console.log('음식 분석 시작:', file.name)
      setState(prev => ({ ...prev, progress: 50 }))
      
      const analysisResult = await analyzeWithRetry(file, user.id)

      setState(prev => ({ ...prev, progress: 80 }))

      if (!analysisResult.success) {
        throw new Error(analysisResult.error?.message || 'AI 분석 실패')
      }

      // 분석 완료 여부 확인 - n8n에서 즉시 결과를 반환한 경우
      const responseData = analysisResult.data as any
      if (responseData?.status === 'complete') {
        // 즉시 완료된 경우 - 실제 분석 결과 사용
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          progress: 100,
          stage: 'complete',
          result: { 
            items: [], // 실제 데이터는 데이터베이스에서 조회
            summary: { totalCalories: responseData.totalCalories || 0, totalCarbohydrates: { value: 0, unit: 'g' }, totalProtein: { value: 0, unit: 'g' }, totalFat: { value: 0, unit: 'g' } }, 
            mealType: 'snack', 
            imageUrl: '' 
          }
        }))
        
        console.log('음식 분석 즉시 완료됨:', analysisResult)
        return { 
          items: [], 
          summary: { totalCalories: responseData.totalCalories || 0, totalCarbohydrates: { value: 0, unit: 'g' }, totalProtein: { value: 0, unit: 'g' }, totalFat: { value: 0, unit: 'g' } }, 
          mealType: 'snack', 
          imageUrl: '' 
        }
      } else {
        // n8n에서 분석을 완료했으므로 즉시 완료 상태로 설정
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          progress: 100,
          stage: 'complete',
          result: { 
            items: [], 
            summary: { totalCalories: 0, totalCarbohydrates: { value: 0, unit: 'g' }, totalProtein: { value: 0, unit: 'g' }, totalFat: { value: 0, unit: 'g' } }, 
            mealType: 'snack', 
            imageUrl: '' 
          }
        }))

        console.log('음식 분석 완료됨, 결과 표시:', analysisResult)
        return { 
          items: [], 
          summary: { totalCalories: 0, totalCarbohydrates: { value: 0, unit: 'g' }, totalProtein: { value: 0, unit: 'g' }, totalFat: { value: 0, unit: 'g' } }, 
          mealType: 'snack', 
          imageUrl: '' 
        }
      }
    } catch (error) {
      console.error('이미지 처리 오류:', error)
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : '처리 실패',
        stage: 'idle'
      }))
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
  }

  return {
    ...state,
    processImage,
    reset
  }
}
