import Database from 'better-sqlite3'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

// 데이터베이스 파일 경로
const dbPath = join(process.cwd(), 'data', 'app.db')

// 데이터베이스 인스턴스
let db: Database.Database | null = null

// 데이터베이스 연결 함수 (서버 사이드 전용)
export function getDatabase(): Database.Database {
  if (typeof window !== 'undefined') {
    throw new Error('Database can only be used on the server side')
  }

  if (!db) {
    // 데이터 디렉토리가 없으면 생성
    const dataDir = join(process.cwd(), 'data')
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true })
    }

    db = new Database(dbPath)
    
    // WAL 모드 활성화 (성능 향상)
    db.pragma('journal_mode = WAL')
    
    // 데이터베이스 스키마 초기화
    initializeDatabase(db)
  }
  
  return db
}

// 데이터베이스 스키마 초기화
function initializeDatabase(database: Database.Database) {
  // users 테이블
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      full_name TEXT,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // food_logs 테이블 강제 재생성 (image_url nullable로 변경)
  console.log('food_logs 테이블 재생성 시작...')
  
  try {
    // 백업 테이블 생성
    database.exec(`
      CREATE TABLE IF NOT EXISTS food_logs_backup (
        id TEXT,
        user_id TEXT,
        image_url TEXT,
        meal_type TEXT,
        food_items TEXT,
        total_calories INTEGER,
        total_nutrients TEXT,
        confidence_score REAL,
        created_at DATETIME,
        updated_at DATETIME
      )
    `)
    
    // 기존 데이터가 있다면 백업
    try {
      database.exec(`
        INSERT OR IGNORE INTO food_logs_backup 
        SELECT * FROM food_logs
      `)
    } catch {
      // 테이블이 없으면 무시
    }
    
    // 기존 테이블 삭제 (있다면)
    database.exec(`DROP TABLE IF EXISTS food_logs`)
    
    // 새로운 테이블 생성 (image_url nullable)
    database.exec(`
      CREATE TABLE food_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        image_url TEXT,
        meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
        food_items TEXT NOT NULL DEFAULT '[]',
        total_calories INTEGER NOT NULL DEFAULT 0,
        total_nutrients TEXT NOT NULL DEFAULT '{}',
        confidence_score REAL NOT NULL DEFAULT 0.0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `)
    
    // 백업 데이터 복원 (유효한 데이터만)
    try {
      database.exec(`
        INSERT INTO food_logs 
        SELECT * FROM food_logs_backup 
        WHERE id IS NOT NULL AND user_id IS NOT NULL
      `)
    } catch {
      // 백업 데이터가 없거나 복원 실패 시 무시
    }
    
    // 백업 테이블 삭제
    database.exec(`DROP TABLE IF EXISTS food_logs_backup`)
    
    console.log('food_logs 테이블 재생성 완료')
  } catch (error) {
    console.error('테이블 재생성 중 오류:', error)
    // 오류가 발생해도 새로운 테이블 생성 시도
    database.exec(`
      CREATE TABLE IF NOT EXISTS food_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        image_url TEXT,
        meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
        food_items TEXT NOT NULL DEFAULT '[]',
        total_calories INTEGER NOT NULL DEFAULT 0,
        total_nutrients TEXT NOT NULL DEFAULT '{}',
        confidence_score REAL NOT NULL DEFAULT 0.0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `)
  }

  // 인덱스 생성
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_food_logs_user_id ON food_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_food_logs_created_at ON food_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_food_logs_meal_type ON food_logs(meal_type);
    CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON food_logs(user_id, created_at);
  `)

  // updated_at 트리거
  database.exec(`
    CREATE TRIGGER IF NOT EXISTS update_users_updated_at 
    AFTER UPDATE ON users 
    FOR EACH ROW 
    BEGIN
      UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `)

  database.exec(`
    CREATE TRIGGER IF NOT EXISTS update_food_logs_updated_at 
    AFTER UPDATE ON food_logs 
    FOR EACH ROW 
    BEGIN
      UPDATE food_logs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `)

  console.log('데이터베이스 스키마가 초기화되었습니다.')
}

// 데이터베이스 연결 종료
export function closeDatabase() {
  if (db) {
    db.close()
    db = null
  }
}

// 데이터베이스 타입 정의
export interface User {
  id: string
  username: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface FoodLog {
  id: string
  user_id: string
  image_url: string | null
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  food_items: FoodItem[]
  total_calories: number
  total_nutrients: {
    carbohydrates: { value: number; unit: string }
    protein: { value: number; unit: string }
    fat: { value: number; unit: string }
    sugars: { value: number; unit: string }
    sodium: { value: number; unit: string }
  }
  confidence_score: number
  created_at: string
  updated_at: string
}

export interface FoodItem {
  foodName: string
  confidence: number
  quantity: string
  calories: number
  nutrients: {
    carbohydrates: { value: number; unit: string }
    protein: { value: number; unit: string }
    fat: { value: number; unit: string }
    sugars: { value: number; unit: string }
    sodium: { value: number; unit: string }
  }
}
