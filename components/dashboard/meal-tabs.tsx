'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface MealTabsProps {
  summary: {
    breakfast: number
    lunch: number
    dinner: number
    snack: number
  }
  onMealChange: (mealType: string) => void
  activeMeal: string
}

export function MealTabs({ summary, onMealChange, activeMeal }: MealTabsProps) {
  const meals = [
    { type: 'all', label: '전체', calories: summary.breakfast + summary.lunch + summary.dinner + summary.snack },
    { type: 'breakfast', label: '아침', calories: summary.breakfast },
    { type: 'lunch', label: '점심', calories: summary.lunch },
    { type: 'dinner', label: '저녁', calories: summary.dinner },
    { type: 'snack', label: '간식', calories: summary.snack }
  ]

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex gap-2 overflow-x-auto">
          {meals.map((meal) => (
            <Button
              key={meal.type}
              variant={activeMeal === meal.type ? "default" : "outline"}
              onClick={() => onMealChange(meal.type)}
              className="flex-shrink-0 flex items-center gap-2"
            >
              <span>{meal.label}</span>
              {meal.calories > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {meal.calories}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

