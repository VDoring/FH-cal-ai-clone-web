-- ============================================
-- Supabase 데이터베이스 설정 SQL 스크립트
-- ============================================
-- 
-- 이 스크립트를 Supabase 대시보드의 SQL Editor에서 실행하세요
-- 
-- 실행 방법:
-- 1. https://supabase.com/dashboard 접속
-- 2. 프로젝트 선택
-- 3. 왼쪽 메뉴에서 "SQL Editor" 클릭
-- 4. "New query" 버튼 클릭
-- 5. 아래 전체 코드를 복사하여 붙여넣기
-- 6. "Run" 버튼 클릭
-- 
-- ============================================

-- Step 1: food_logs 테이블 생성
CREATE TABLE food_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_items JSONB NOT NULL DEFAULT '[]',
  total_calories INTEGER NOT NULL DEFAULT 0,
  total_nutrients JSONB NOT NULL DEFAULT '{}',
  confidence_score DECIMAL(5,4) NOT NULL DEFAULT 0.0000 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: 성능 최적화를 위한 인덱스 생성
CREATE INDEX idx_food_logs_user_id ON food_logs(user_id);
CREATE INDEX idx_food_logs_created_at ON food_logs(created_at);
CREATE INDEX idx_food_logs_meal_type ON food_logs(meal_type);
-- DATE() 함수 대신 날짜 범위 검색에 최적화된 인덱스 생성
CREATE INDEX idx_food_logs_user_created ON food_logs(user_id, created_at);

-- Step 3: RLS (Row Level Security) 정책 활성화
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;

-- Step 4: 보안 정책 생성
-- 사용자는 자신의 음식 로그만 조회 가능
CREATE POLICY "Users can view own food logs" ON food_logs
  FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 음식 로그만 추가 가능
CREATE POLICY "Users can insert own food logs" ON food_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 음식 로그만 수정 가능
CREATE POLICY "Users can update own food logs" ON food_logs
  FOR UPDATE USING (auth.uid() = user_id);

-- 사용자는 자신의 음식 로그만 삭제 가능
CREATE POLICY "Users can delete own food logs" ON food_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Step 5: updated_at 자동 업데이트 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 6: updated_at 자동 업데이트 트리거 생성
CREATE TRIGGER update_food_logs_updated_at BEFORE UPDATE
    ON food_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 설정 완료!
-- ============================================
-- 
-- 이제 다음을 확인하세요:
-- 1. "Tables" 메뉴에서 food_logs 테이블이 생성되었는지 확인
-- 2. 터미널에서 `npm run test:supabase` 실행하여 연결 테스트
-- 
-- ============================================
