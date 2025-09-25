import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

// 현재 사용자 정보 가져오기
export async function getCurrentUser(): Promise<{ success: boolean; data?: User; error?: string }> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true, data: user }
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    }
  }
}

// 익명 로그인
export async function signInAnonymously(): Promise<{ success: boolean; data?: User; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signInAnonymously()
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true, data: data.user }
  } catch (error) {
    console.error('익명 로그인 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    }
  }
}

// 이메일/비밀번호로 회원가입
export async function signUpWithEmail(email: string, password: string): Promise<{ success: boolean; data?: User; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true, data: data.user }
  } catch (error) {
    console.error('회원가입 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    }
  }
}

// 이메일/비밀번호로 로그인
export async function signInWithEmail(email: string, password: string): Promise<{ success: boolean; data?: User; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true, data: data.user }
  } catch (error) {
    console.error('로그인 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    }
  }
}

// 로그아웃
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    console.error('로그아웃 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    }
  }
}

// 사용자 메타데이터 업데이트
export async function updateUserMetadata(updates: { 
  full_name?: string 
  avatar_url?: string 
  [key: string]: any 
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.updateUser({
      data: updates
    })
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    console.error('사용자 메타데이터 업데이트 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    }
  }
}
