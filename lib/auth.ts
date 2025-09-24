import { getDatabase, type User } from './database'
import { v4 as uuidv4 } from 'uuid'

// 사용자 생성 또는 조회
export async function getOrCreateUser(username: string, fullName?: string): Promise<{ success: boolean; data?: User; error?: string }> {
  try {
    const db = getDatabase()
    
    // 먼저 기존 사용자 찾기
    const selectStmt = db.prepare('SELECT * FROM users WHERE username = ?')
    let user = selectStmt.get(username) as User | undefined
    
    if (!user) {
      // 사용자가 없으면 새로 생성
      const id = uuidv4()
      const insertStmt = db.prepare(`
        INSERT INTO users (id, username, full_name)
        VALUES (?, ?, ?)
      `)
      
      const result = insertStmt.run(id, username, fullName || username)
      
      if (result.changes > 0) {
        user = selectStmt.get(username) as User
      }
    }
    
    if (user) {
      return { success: true, data: user }
    } else {
      return { success: false, error: '사용자 생성에 실패했습니다.' }
    }
  } catch (error) {
    console.error('사용자 조회/생성 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    }
  }
}

// 사용자 정보 업데이트
export async function updateUser(userId: string, updates: Partial<Pick<User, 'username' | 'full_name' | 'avatar_url'>>): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDatabase()
    
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ')
    const values = Object.values(updates)
    
    const stmt = db.prepare(`UPDATE users SET ${fields} WHERE id = ?`)
    const result = stmt.run(...values, userId)
    
    if (result.changes > 0) {
      return { success: true }
    } else {
      return { success: false, error: '사용자를 찾을 수 없습니다.' }
    }
  } catch (error) {
    console.error('사용자 업데이트 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    }
  }
}

// 모든 사용자 조회 (개발용)
export async function getAllUsers(): Promise<{ success: boolean; data?: User[]; error?: string }> {
  try {
    const db = getDatabase()
    
    const stmt = db.prepare('SELECT * FROM users ORDER BY created_at DESC')
    const users = stmt.all() as User[]
    
    return { success: true, data: users }
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    }
  }
}
