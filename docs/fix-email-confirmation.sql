-- 기존 사용자의 이메일 확인 상태를 수동으로 활성화
-- Supabase 대시보드 SQL Editor에서 실행하세요

-- 특정 사용자의 이메일 확인 처리
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'testuser@gmail.com' AND email_confirmed_at IS NULL;

-- 모든 미확인 사용자의 이메일 확인 처리 (개발용)
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- 확인된 사용자 목록 조회
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'testuser@gmail.com';
