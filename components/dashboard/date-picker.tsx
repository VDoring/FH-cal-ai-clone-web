'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { format, addDays, subDays, isToday, isBefore, startOfDay } from 'date-fns'
import { ko } from 'date-fns/locale'

interface DatePickerProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
}

export function DatePicker({ selectedDate, onDateChange }: DatePickerProps) {
  const handlePrevDay = () => {
    onDateChange(subDays(selectedDate, 1))
  }

  const handleNextDay = () => {
    // 오늘 이후 날짜는 선택 불가
    const nextDay = addDays(selectedDate, 1)
    if (!isBefore(startOfDay(nextDay), startOfDay(new Date()))) {
      return
    }
    onDateChange(nextDay)
  }

  const handleToday = () => {
    onDateChange(new Date())
  }

  const canGoNext = !isBefore(startOfDay(addDays(selectedDate, 1)), startOfDay(new Date()))

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevDay}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="font-medium">
              {format(selectedDate, 'M월 d일 (E)', { locale: ko })}
            </span>
            {isToday(selectedDate) && (
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                오늘
              </span>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextDay}
            disabled={canGoNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {!isToday(selectedDate) && (
          <div className="mt-3 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
            >
              오늘로 이동
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

