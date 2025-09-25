import { NextRequest, NextResponse } from 'next/server'
import { signInAnonymously, signUpWithEmail, signInWithEmail, getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { action, email, password } = await request.json()
    
    let result
    
    switch (action) {
      case 'signup':
        if (!email || !password) {
          return NextResponse.json(
            { success: false, error: 'Email and password are required' },
            { status: 400 }
          )
        }
        result = await signUpWithEmail(email, password)
        break
        
      case 'signin':
        if (!email || !password) {
          return NextResponse.json(
            { success: false, error: 'Email and password are required' },
            { status: 400 }
          )
        }
        result = await signInWithEmail(email, password)
        break
        
      case 'anonymous':
        result = await signInAnonymously()
        break
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error) {
    console.error('인증 API 오류:', error)
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
    // 현재 사용자 정보 조회
    const result = await getCurrentUser()
    
    if (result.success && result.data) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
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
