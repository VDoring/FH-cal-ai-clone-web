import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { username, fullName } = await request.json()
    
    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username is required' },
        { status: 400 }
      )
    }

    const result = await getOrCreateUser(username, fullName)
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error) {
    console.error('사용자 생성/조회 API 오류:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '서버 오류가 발생했습니다.' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // 기본 사용자 조회/생성
    const result = await getOrCreateUser('demo-user', '데모 사용자')
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error) {
    console.error('사용자 조회 API 오류:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '서버 오류가 발생했습니다.' 
      },
      { status: 500 }
    )
  }
}
