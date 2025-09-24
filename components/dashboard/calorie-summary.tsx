'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface CalorieSummaryProps {
  summary: {
    total: number
    breakfast: number
    lunch: number
    dinner: number
    snack: number
  }
  targetCalories?: number
}

export function CalorieSummary({ summary, targetCalories = 2000 }: CalorieSummaryProps) {
  const progressPercentage = Math.min((summary.total / targetCalories) * 100, 100)
  
  const mealData = [
    { type: 'breakfast', label: '아침', calories: summary.breakfast, color: 'bg-yellow-500' },
    { type: 'lunch', label: '점심', calories: summary.lunch, color: 'bg-orange-500' },
    { type: 'dinner', label: '저녁', calories: summary.dinner, color: 'bg-blue-500' },
    { type: 'snack', label: '간식', calories: summary.snack, color: 'bg-purple-500' }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">일일 칼로리</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 총 칼로리 */}
        <div className="text-center space-y-2">
          <div className="text-3xl font-bold">
            {summary.total.toLocaleString()}
            <span className="text-lg text-gray-500 font-normal">kcal</span>
          </div>
          <div className="text-sm text-gray-600">
            목표: {targetCalories.toLocaleString()}kcal
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="text-xs text-gray-500">
            {progressPercentage.toFixed(1)}% 달성
          </div>
        </div>

        {/* 끼니별 칼로리 */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-700">끼니별 칼로리</h4>
          <div className="grid grid-cols-2 gap-2">
            {mealData.map((meal) => (
              <div
                key={meal.type}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${meal.color}`} />
                  <span className="text-sm font-medium">{meal.label}</span>
                </div>
                <span className="text-sm font-semibold">
                  {meal.calories.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 잔여 칼로리 */}
        <div className="pt-3 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">잔여 칼로리</span>
            <span className={`font-semibold ${
              targetCalories - summary.total >= 0 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {(targetCalories - summary.total).toLocaleString()}kcal
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

