-- Supabase 데이터베이스 스키마
-- 이 스키마를 Supabase 대시보드의 SQL Editor에서 실행하세요

-- food_logs 테이블 생성 (image_url nullable로 변경)
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

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_food_logs_user_id ON food_logs(user_id);
CREATE INDEX idx_food_logs_created_at ON food_logs(created_at);
CREATE INDEX idx_food_logs_meal_type ON food_logs(meal_type);
CREATE INDEX idx_food_logs_user_date ON food_logs(user_id, DATE(created_at));

-- RLS (Row Level Security) 정책 활성화
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;

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

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_food_logs_updated_at BEFORE UPDATE
    ON food_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 예시 JSONB 스키마 (참고용)
/*
food_items JSONB 구조:
[
  {
    "foodName": "현미밥",
    "confidence": 0.98,
    "quantity": "1공기",
    "calories": 300,
    "nutrients": {
      "carbohydrates": { "value": 65, "unit": "g" },
      "protein": { "value": 6, "unit": "g" },
      "fat": { "value": 1, "unit": "g" },
      "sugars": { "value": 0.5, "unit": "g" },
      "sodium": { "value": 5, "unit": "mg" }
    }
  }
]

total_nutrients JSONB 구조:
{
  "carbohydrates": { "value": 65, "unit": "g" },
  "protein": { "value": 6, "unit": "g" },
  "fat": { "value": 1, "unit": "g" },
  "sugars": { "value": 0.5, "unit": "g" },
  "sodium": { "value": 5, "unit": "mg" }
}
*/
