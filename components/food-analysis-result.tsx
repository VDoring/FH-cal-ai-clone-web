'use client'

import { useState, useEffect } from 'react'
import { useDemoAuth as useAuth } from '@/components/demo-auth-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, RefreshCw, Eye, ChevronDown, ChevronUp } from 'lucide-react'
import Image from 'next/image'
import type { FoodLog } from '@/lib/supabase'
import { useSSEFoodAnalysis } from '@/hooks/use-sse-food-analysis'

interface FoodAnalysisResultProps {
  onComplete?: () => void
  showLatest?: boolean
}

export function FoodAnalysisResult({ onComplete, showLatest = false }: FoodAnalysisResultProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [latestLog, setLatestLog] = useState<FoodLog | null>(null)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  
  // SSE를 통한 실시간 분석 결과 수신
  const { isConnected, isAnalysisComplete, analysisResult, connect, disconnect, reset } = useSSEFoodAnalysis()

  // 최신 분석 결과 조회
  const fetchLatestResult = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      console.log('최신 분석 결과 조회 시작:', user.id)
      const response = await fetch(`/api/food-logs?userId=${user.id}&limit=1`)
      const result = await response.json()
      
      console.log('API 응답:', result)

      if (result.success && result.data.length > 0) {
        const latest = result.data[0]
        console.log('최신 로그:', latest)
        
        // 최근 30분 이내의 결과만 표시 (시간 확장)
        const timeDiff = Date.now() - new Date(latest.created_at).getTime()
        console.log('시간 차이:', timeDiff, '분:', Math.floor(timeDiff / 60000))
        
        if (timeDiff <= 30 * 60 * 1000) {
          console.log('최신 결과 설정:', latest.id)
          setLatestLog(latest)
          if (onComplete) {
            onComplete()
          }
          return true
        } else {
          console.log('결과가 너무 오래됨:', Math.floor(timeDiff / 60000), '분 전')
        }
      } else {
        console.log('결과 없음 또는 API 실패:', result)
      }
    } catch (error) {
      console.error('분석 결과 조회 오류:', error)
    } finally {
      setIsLoading(false)
    }
    return false
  }

  // 컴포넌트 마운트 시 즉시 최신 결과 조회 및 폴링
  useEffect(() => {
    if (!showLatest || !user) return

    let pollInterval: NodeJS.Timeout | null = null
    let pollCount = 0
    const maxPolls = 20 // 최대 20번 폴링 (20초)

    // 즉시 최신 결과 조회
    const poll = async () => {
      const found = await fetchLatestResult()
      
      if (found) {
        if (onComplete) {
          onComplete()
        }
        if (pollInterval) {
          clearInterval(pollInterval)
          pollInterval = null
        }
        return
      }
      
      pollCount++
      if (pollCount >= maxPolls && pollInterval) {
        clearInterval(pollInterval)
        pollInterval = null
        console.log('폴링 종료: 최대 시도 횟수 도달')
      }
    }

    // 즉시 한 번 실행
    poll()
    
    // 1초마다 폴링
    pollInterval = setInterval(poll, 1000)
    
    // SSE 연결은 백업용으로 유지 (필요 시)
    connect()
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval)
      }
      disconnect()
    }
  }, [showLatest, user])

  // 분석 완료 시 최신 결과 조회 (SSE 백업)
  useEffect(() => {
    if (isAnalysisComplete && analysisResult) {
      console.log('SSE로 분석 완료 알림 수신, 최신 결과 조회 중...')
      fetchLatestResult().then(() => {
        if (onComplete) {
          onComplete()
        }
      })
    }
  }, [isAnalysisComplete, analysisResult])

  // 아이템 확장/축소 토글
  const toggleItemExpansion = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  // 끼니 타입 한글 변환
  const getMealTypeKorean = (mealType: string) => {
    const mealTypes: Record<string, string> = {
      breakfast: '아침',
      lunch: '점심',
      dinner: '저녁',
      snack: '간식'
    }
    return mealTypes[mealType] || mealType
  }

  // 신뢰도에 따른 색상
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800'
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  if (showLatest && !latestLog) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Clock className="w-12 h-12 text-green-500 mx-auto mb-4 animate-pulse" />
          <h3 className="font-medium text-gray-900 mb-2">결과를 불러오는 중...</h3>
          <div className="text-sm text-gray-600">
            <p>잠시만 기다려주세요.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!latestLog) {
    return null
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <CardTitle className="text-lg">분석 완료!</CardTitle>
          </div>
          <Badge variant="secondary">
            {getMealTypeKorean(latestLog.meal_type)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 이미지 */}
        {latestLog.image_url && !latestLog.image_url.startsWith('temp://') ? (
          <div className="relative aspect-video rounded-lg overflow-hidden">
            <Image
              src={latestLog.image_url}
              alt="분석된 음식 사진"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        ) : (
          <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                🍽️
              </div>
              <p className="text-sm">이미지 처리 중</p>
            </div>
          </div>
        )}

        {/* 칼로리 요약 */}
        <div className="text-center p-4 bg-white rounded-lg border">
          <div className="text-3xl font-bold text-emerald-600 mb-1">
            {latestLog.total_calories} kcal
          </div>
          <div className="text-sm text-gray-600">총 칼로리</div>
        </div>

        {/* 영양성분 요약 */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-white rounded-lg border">
            <div className="text-lg font-semibold text-blue-600">
              {latestLog.total_nutrients.carbohydrates.value}g
            </div>
            <div className="text-xs text-gray-600">탄수화물</div>
          </div>
          <div className="p-3 bg-white rounded-lg border">
            <div className="text-lg font-semibold text-red-600">
              {latestLog.total_nutrients.protein.value}g
            </div>
            <div className="text-xs text-gray-600">단백질</div>
          </div>
          <div className="p-3 bg-white rounded-lg border">
            <div className="text-lg font-semibold text-yellow-600">
              {latestLog.total_nutrients.fat.value}g
            </div>
            <div className="text-xs text-gray-600">지방</div>
          </div>
        </div>

        {/* 인식된 음식 목록 */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">인식된 음식 ({latestLog.food_items.length}개)</h4>
          
          {latestLog.food_items.map((item, index) => {
            const isExpanded = expandedItems.includes(item.foodName)
            return (
              <div key={`${item.foodName}-${index}`} className="border rounded-lg">
                <button
                  onClick={() => toggleItemExpansion(item.foodName)}
                  className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{item.foodName}</span>
                        <Badge 
                          variant="outline" 
                          className={getConfidenceColor(item.confidence)}
                        >
                          {Math.round(item.confidence * 100)}%
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{item.quantity}</span>
                        <span className="font-medium">{item.calories}kcal</span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="px-3 pb-3 pt-0 border-t bg-gray-50">
                    <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                      <div>
                        <span className="text-gray-600">탄수화물:</span>
                        <span className="ml-1 font-medium">
                          {item.nutrients.carbohydrates.value}{item.nutrients.carbohydrates.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">단백질:</span>
                        <span className="ml-1 font-medium">
                          {item.nutrients.protein.value}{item.nutrients.protein.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">지방:</span>
                        <span className="ml-1 font-medium">
                          {item.nutrients.fat.value}{item.nutrients.fat.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">당류:</span>
                        <span className="ml-1 font-medium">
                          {item.nutrients.sugars.value}{item.nutrients.sugars.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 신뢰도 점수 */}
        <div className="text-center text-sm text-gray-600">
          평균 신뢰도: {Math.round(latestLog.confidence_score * 100)}%
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-2">
          <Button 
            onClick={() => window.location.href = '/dashboard'} 
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            대시보드에서 보기
          </Button>
          <Button 
            variant="outline" 
            onClick={fetchLatestResult}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
