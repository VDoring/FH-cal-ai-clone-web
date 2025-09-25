-- 데모 사용자를 Supabase auth.users 테이블에 추가
-- Supabase 대시보드 SQL Editor에서 실행하세요

-- 데모 사용자 1: 익명 사용자 스타일 UUID
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
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'demo-anon@demo.local',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"provider": "demo", "providers": ["demo"]}',
    '{"full_name": "Demo Anonymous User"}',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 데모 사용자 2: 일반 데모 사용자
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
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'demo-user@demo.local',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"provider": "demo", "providers": ["demo"]}',
    '{"full_name": "Demo User"}',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 생성된 데모 사용자 확인
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email LIKE '%demo.local%';
