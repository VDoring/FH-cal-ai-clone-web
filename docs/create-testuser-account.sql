-- 데모 사용자 testuser@gmail.com을 위한 브릿지 Supabase 계정 생성
-- 이 계정은 웹사이트 로그인용이 아니라 데이터 저장용입니다
-- Supabase 대시보드의 SQL Editor에서 실행하세요

-- 중요: 환경변수 설정도 확인하세요!
-- .env.local 파일에 SUPABASE_SERVICE_ROLE_KEY를 추가해야 합니다:
-- SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

-- 1. 기존 브릿지 계정이 있는지 확인
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE id = '22222222-2222-2222-2222-222222222222';

-- 2. 브릿지 계정 생성 (데이터 저장 전용)
-- 주의: 이 계정은 실제 로그인용이 아니라 데이터 연결용입니다
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222', -- 고정 UUID (데모 사용자와 매핑)
    'authenticated',
    'authenticated',
    'testuser-bridge@internal.demo', -- 내부 전용 이메일 (실제 이메일 아님)
    crypt('bridge-account-not-for-login', gen_salt('bf')), -- 로그인 불가능한 비밀번호
    NOW(),
    '{"provider": "demo-bridge", "providers": ["demo-bridge"]}',
    '{"full_name": "Demo Bridge User", "demo_user": "testuser@gmail.com"}',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = NOW();

-- 3. 생성된 브릿지 계정 확인
SELECT id, email, raw_user_meta_data, created_at 
FROM auth.users 
WHERE id = '22222222-2222-2222-2222-222222222222';

-- 4. 기존 food_logs 데이터 확인 (있다면)
SELECT COUNT(*) as log_count 
FROM food_logs 
WHERE user_id = '22222222-2222-2222-2222-222222222222';

-- 5. 테스트용 food_logs 데이터 삭제 (필요시)
-- DELETE FROM food_logs WHERE user_id = '22222222-2222-2222-2222-222222222222';

-- 6. 서버 사이드 삽입을 위한 RLS 정책 수정
-- 기존 INSERT 정책을 삭제하고 서버 사이드 접근을 허용하는 정책으로 교체

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can insert own food logs" ON food_logs;

-- 새로운 정책: 사용자 인증 또는 서버 사이드 접근 허용
CREATE POLICY "Allow insert for authenticated users or service" ON food_logs
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id OR 
    auth.uid() IS NULL  -- 서버 사이드 접근 허용
  );

-- 다른 정책들도 서버 사이드 접근을 허용하도록 수정
DROP POLICY IF EXISTS "Users can view own food logs" ON food_logs;
CREATE POLICY "Allow select for authenticated users or service" ON food_logs
  FOR SELECT 
  USING (
    auth.uid() = user_id OR 
    auth.uid() IS NULL  -- 서버 사이드 접근 허용
  );

DROP POLICY IF EXISTS "Users can update own food logs" ON food_logs;
CREATE POLICY "Allow update for authenticated users or service" ON food_logs
  FOR UPDATE 
  USING (
    auth.uid() = user_id OR 
    auth.uid() IS NULL  -- 서버 사이드 접근 허용
  );

DROP POLICY IF EXISTS "Users can delete own food logs" ON food_logs;
CREATE POLICY "Allow delete for authenticated users or service" ON food_logs
  FOR DELETE 
  USING (
    auth.uid() = user_id OR 
    auth.uid() IS NULL  -- 서버 사이드 접근 허용
  );
