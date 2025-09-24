'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Utensils } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Image from 'next/image'

// 끼니 타입에 따른 라벨 반환
function getMealTypeLabel(mealType: string) {
  const labels: { [key: string]: string } = {
    breakfast: '아침',
    lunch: '점심', 
    dinner: '저녁',
    snack: '간식'
  }
  return labels[mealType] || mealType
}

interface FoodLogCardProps {
  log: {
    id: string
    image_url: string
    meal_type: string
    food_items: any[]
    total_calories: number
    confidence_score: number
    created_at: string
  }
}

export function FoodLogCard({ log }: FoodLogCardProps) {
  const mealLabel = getMealTypeLabel(log.meal_type)
  const createdTime = new Date(log.created_at)
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{mealLabel}</Badge>
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(createdTime, 'HH:mm', { locale: ko })}
            </span>
          </div>
          <div className="text-right">
            <div className="font-semibold text-lg">
              {log.total_calories.toLocaleString()}kcal
            </div>
            {log.confidence_score > 0 && (
              <div className="text-xs text-gray-500">
                신뢰도 {(log.confidence_score * 100).toFixed(0)}%
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 이미지 */}
        <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
          <Image
            src={log.image_url}
            alt="식단 이미지"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        {/* 음식 목록 */}
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
            <Utensils className="h-4 w-4" />
            인식된 음식 ({log.food_items.length}개)
          </div>
          
          <div className="space-y-2">
            {log.food_items.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-start p-2 bg-gray-50 rounded"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.foodName}</div>
                  <div className="text-xs text-gray-600">
                    {item.quantity} • 신뢰도 {(item.confidence * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="text-sm font-semibold">
                  {item.calories.toLocaleString()}kcal
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 영양성분 요약 (선택사항) */}
        {log.food_items[0]?.nutrients && (
          <div className="pt-2 border-t">
            <div className="text-xs text-gray-600 mb-2">주요 영양성분</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="font-medium">탄수화물</div>
                <div className="text-gray-600">
                  {log.food_items.reduce((sum, item) => 
                    sum + (item.nutrients?.carbohydrates?.value || 0), 0
                  ).toFixed(1)}g
                </div>
              </div>
              <div className="text-center">
                <div className="font-medium">단백질</div>
                <div className="text-gray-600">
                  {log.food_items.reduce((sum, item) => 
                    sum + (item.nutrients?.protein?.value || 0), 0
                  ).toFixed(1)}g
                </div>
              </div>
              <div className="text-center">
                <div className="font-medium">지방</div>
                <div className="text-gray-600">
                  {log.food_items.reduce((sum, item) => 
                    sum + (item.nutrients?.fat?.value || 0), 0
                  ).toFixed(1)}g
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

