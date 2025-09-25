interface WebhookResponse {
  success: boolean
  data?: {
    items: FoodItem[]
    summary: {
      totalCalories: number
      totalCarbohydrates: { value: number; unit: string }
      totalProtein: { value: number; unit: string }
      totalFat: { value: number; unit: string }
    }
    mealType: string
    imageUrl: string
  }
  error?: {
    code: string
    message: string
  }
}

interface FoodItem {
  foodName: string
  confidence: number
  quantity: string
  calories: number
  nutrients: {
    carbohydrates: { value: number; unit: string }
    protein: { value: number; unit: string }
    fat: { value: number; unit: string }
    sugars: { value: number; unit: string }
    sodium: { value: number; unit: string }
  }
}

export async function analyzeFood(file: File, userId: string): Promise<WebhookResponse> {
  try {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('userId', userId)

    console.log('음식 분석 시작:', file.name, 'User:', userId)

    const response = await fetch('/api/webhook/analyze', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('API 응답 오류:', response.status, errorData)
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    console.log('음식 분석 완료:', result)
    
    return result
  } catch (error) {
    console.error('음식 분석 오류:', error)
    
    if (error instanceof Error && error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: '네트워크 연결을 확인해주세요.'
        }
      }
    }

    // 더 구체적인 에러 메시지 제공
    let errorMessage = '음식 분석 중 오류가 발생했습니다.'
    if (error instanceof Error) {
      if (error.message.includes('404')) {
        errorMessage = 'AI 분석 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.'
      } else if (error.message.includes('timeout')) {
        errorMessage = '분석 시간이 초과되었습니다. 더 작은 이미지로 다시 시도해주세요.'
      } else {
        errorMessage = error.message
      }
    }

    return {
      success: false,
      error: {
        code: 'ANALYSIS_ERROR',
        message: errorMessage
      }
    }
  }
}

// 재시도 로직이 포함된 분석 함수
export async function analyzeWithRetry(file: File, userId: string, maxAttempts = 3): Promise<WebhookResponse> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await analyzeFood(file, userId)
      
      // 성공하면 바로 반환
      if (result.success) {
        return result
      }
      
      // 특정 오류 코드는 재시도하지 않음
      if (result.error?.code === 'MISSING_DATA' || result.error?.code === 'INVALID_FILE') {
        return result
      }
      
      // 마지막 시도라면 결과 반환
      if (attempt === maxAttempts) {
        return result
      }
      
      // 재시도 전 대기 (지수적 백오프)
      const delay = Math.pow(2, attempt - 1) * 1000
      console.log(`재시도 ${attempt}/${maxAttempts} - ${delay}ms 후 재시도`)
      await new Promise(resolve => setTimeout(resolve, delay))
      
    } catch (error) {
      lastError = error as Error
      
      // 마지막 시도라면 오류 반환
      if (attempt === maxAttempts) {
        break
      }
      
      // 재시도 전 대기
      const delay = Math.pow(2, attempt - 1) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  return {
    success: false,
    error: {
      code: 'MAX_RETRIES_EXCEEDED',
      message: lastError?.message || '최대 재시도 횟수를 초과했습니다.'
    }
  }
}

export type { WebhookResponse, FoodItem }
