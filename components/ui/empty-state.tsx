'use client'

import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <div className="text-6xl mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        {description && (
          <p className="text-gray-600 mb-6">
            {description}
          </p>
        )}
        {action && (
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// 프리셋 빈 상태들
export function NoFoodLogs({ onAddClick }: { onAddClick: () => void }) {
  return (
    <EmptyState
      icon="🍽️"
      title="아직 기록된 식단이 없습니다"
      description="첫 번째 식단을 기록해보세요!"
      action={{
        label: "식단 기록하기",
        onClick: onAddClick
      }}
    />
  )
}

export function NoSearchResults() {
  return (
    <EmptyState
      icon="🔍"
      title="검색 결과가 없습니다"
      description="다른 검색어로 시도해보세요."
    />
  )
}

