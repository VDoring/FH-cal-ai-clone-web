import { getDatabase, type User } from './database'
import { v4 as uuidv4 } from 'uuid'

// 사용자 생성 또는 조회 (로컬 SQLite 사용)
export async function getOrCreateUser(username: string, fullName?: string): Promise<{ success: boolean; data?: User; error?: string }> {
  try {
    const db = getDatabase()
    
    // 먼저 기존 사용자 찾기
    const existingUser = db.prepare(`
      SELECT * FROM users WHERE username = ?
    `).get(username) as User | undefined
    
    if (existingUser) {
      return { success: true, data: existingUser }
    }

    // 사용자가 없으면 새로 생성
    const userId = uuidv4()
    const newUser = {
      id: userId,
      username,
      full_name: fullName || username,
      avatar_url: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    db.prepare(`
      INSERT INTO users (id, username, full_name, avatar_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      newUser.id,
      newUser.username,
      newUser.full_name,
      newUser.avatar_url || null,
      newUser.created_at,
      newUser.updated_at
    )

    return { success: true, data: newUser }
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
    
    const fields = Object.keys(updates)
    const values = Object.values(updates)
    
    if (fields.length === 0) {
      return { success: true }
    }
    
    const setClause = fields.map(field => `${field} = ?`).join(', ')
    
    db.prepare(`
      UPDATE users 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(...values, userId)

    return { success: true }
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
    
    const users = db.prepare(`
      SELECT * FROM users 
      ORDER BY created_at DESC
    `).all() as User[]

    return { success: true, data: users }
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    }
  }
}
