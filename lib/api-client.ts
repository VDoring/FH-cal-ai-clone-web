// API 클라이언트 함수들

// 사용자 관련 API
export async function fetchUser() {
  const response = await fetch('/api/auth/user')
  return response.json()
}

export async function createUser(username: string, fullName?: string) {
  const response = await fetch('/api/auth/user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, fullName }),
  })
  return response.json()
}

// 음식 로그 관련 API
export async function saveFoodLogAPI(data: {
  userId: string
  imageUrl: string
  mealType: string
  items: any[]
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
  userId: string,
  options?: {
    date?: string
    mealType?: string
    limit?: number
  }
) {
  const params = new URLSearchParams({ userId })
  
  if (options?.date) params.append('date', options.date)
  if (options?.mealType) params.append('mealType', options.mealType)
  if (options?.limit) params.append('limit', options.limit.toString())

  const response = await fetch(`/api/food-logs?${params}`)
  return response.json()
}

export async function deleteFoodLogAPI(logId: string, userId: string) {
  const response = await fetch(`/api/food-logs/${logId}?userId=${userId}`, {
    method: 'DELETE',
  })
  return response.json()
}

export async function fetchDailyCalorySummary(userId: string, date: string) {
  const params = new URLSearchParams({ userId, date })
  const response = await fetch(`/api/food-logs/summary?${params}`)
  return response.json()
}
