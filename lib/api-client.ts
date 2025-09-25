// API 클라이언트 함수들

// 사용자 관련 API
export async function fetchCurrentUser() {
  const response = await fetch('/api/auth/user')
  return response.json()
}

export async function signInWithEmail(email: string, password: string) {
  const response = await fetch('/api/auth/user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'signin', email, password }),
  })
  return response.json()
}

export async function signUpWithEmail(email: string, password: string) {
  const response = await fetch('/api/auth/user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'signup', email, password }),
  })
  return response.json()
}

export async function signInAnonymously() {
  const response = await fetch('/api/auth/user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'anonymous' }),
  })
  return response.json()
}

import { type FoodItem } from './supabase'

// 음식 로그 관련 API
export async function saveFoodLogAPI(data: {
  imageUrl: string | null
  mealType: string
  items: FoodItem[]
  summary: {
    totalCalories: number
    totalCarbohydrates: { value: number; unit: string }
    totalProtein: { value: number; unit: string }
    totalFat: { value: number; unit: string }
  }
}) {
  const response = await fetch('/api/food-logs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  return response.json()
}

export async function fetchFoodLogs(
  userId?: string,
  options?: {
    date?: string
    mealType?: string
    limit?: number
  }
) {
  const params = new URLSearchParams()
  
  // 데모 사용자의 경우 브릿지 계정 UUID를 사용
  if (userId) {
    const bridgeUserId = mapToBridgeUserId(userId)
    params.append('userId', bridgeUserId)
  }
  if (options?.date) params.append('date', options.date)
  if (options?.mealType) params.append('mealType', options.mealType)
  if (options?.limit) params.append('limit', options.limit.toString())

  const response = await fetch(`/api/food-logs?${params}`)
  return response.json()
}

export async function deleteFoodLogAPI(logId: string) {
  const response = await fetch(`/api/food-logs/${logId}`, {
    method: 'DELETE',
  })
  return response.json()
}

export async function fetchDailyCalorySummary(userId: string, date: string) {
  // 데모 사용자의 경우 브릿지 계정 UUID를 사용
  const bridgeUserId = mapToBridgeUserId(userId)
  const params = new URLSearchParams({ userId: bridgeUserId, date })
  const response = await fetch(`/api/food-logs/summary?${params}`)
  return response.json()
}

// 데모 사용자 ID를 브릿지 계정 UUID로 매핑하는 유틸리티 함수
function mapToBridgeUserId(userId: string): string {
  // UUID 형식이 아닌 경우 (데모 사용자) 브릿지 계정 UUID 반환
  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
  
  if (!isValidUUID) {
    // 데모 사용자 testuser@gmail.com을 위한 브릿지 계정 UUID
    return '22222222-2222-2222-2222-222222222222'
  }
  
  // 이미 UUID 형식이면 그대로 사용
  return userId
}
