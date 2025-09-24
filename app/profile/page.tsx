'use client'

import { Header } from '@/components/layout/header'
import { MobileLayout } from '@/components/layout/mobile-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Settings, HelpCircle, LogOut } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'

export default function ProfilePage() {
  const { user, logout } = useAuth()

  return (
    <MobileLayout showPadding={false}>
      <Header title="프로필" />
      
      <div className="p-4 space-y-6">
        {/* 사용자 정보 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-100 to-blue-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-emerald-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
                <p className="text-gray-600">{user?.email}</p>
                <div className="mt-2 text-sm text-gray-500">
                  🎯 목표 칼로리: 2,000kcal/일
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 통계 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">이번 주 통계</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">12</div>
                <div className="text-sm text-gray-600">기록된 식단</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">1,850</div>
                <div className="text-sm text-gray-600">평균 칼로리</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 메뉴 */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <Button variant="ghost" className="w-full justify-start h-14">
              <Settings className="w-5 h-5 mr-3" />
              설정
            </Button>
            <Button variant="ghost" className="w-full justify-start h-14">
              <HelpCircle className="w-5 h-5 mr-3" />
              도움말
            </Button>
            <Button variant="ghost" className="w-full justify-start h-14 text-red-600">
              <LogOut className="w-5 h-5 mr-3" />
              로그아웃
            </Button>
          </CardContent>
        </Card>

        {/* 임시 안내 */}
        <Card>
          <CardContent className="p-4">
            <div className="text-center text-sm text-gray-600">
              <div className="mb-2">🚧 <strong>데모 버전</strong></div>
              <p>
                현재 로그인 기능이 bypass되어 있습니다.<br />
                실제 사용자 데이터는 아직 연동되지 않았습니다.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 빈 공간 */}
        <div className="h-20" />
      </div>
    </MobileLayout>
  )
}

