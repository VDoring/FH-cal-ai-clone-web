-- 테스트 사용자 생성 SQL 스크립트
-- Supabase 대시보드의 SQL Editor에서 실행하세요

-- 테스트 사용자 생성 (이메일: admin@gmail.com, 비밀번호: admin123456)
-- 참고: Supabase Auth에서는 유효한 이메일 도메인이 필요하므로 gmail.com을 사용합니다

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@gmail.com',
  crypt('admin123456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "관리자"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- 사용자 이메일 확인 상태로 설정
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'admin@gmail.com';

-- 생성된 사용자 확인
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'admin@gmail.com';
