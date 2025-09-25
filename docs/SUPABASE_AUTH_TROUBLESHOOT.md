# 🔧 Supabase 인증 문제 해결 가이드

## 🚨 현재 문제
- 이메일 인증이 "Email address is invalid" 오류 발생
- 로그인 시 "Invalid login credentials" 오류 발생
- 익명 로그인 비활성화됨

## 🛠️ 해결 방법

### 1️⃣ Supabase 대시보드 설정 확인

1. **Supabase 대시보드 접속**: https://supabase.com/dashboard
2. **프로젝트 선택**: `kzrlybhxqmalqtiiwhjn`
3. **Authentication > Settings** 메뉴 이동

#### 확인할 설정들:

**Site URL 설정**
- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/**`

**Email 설정**
- ✅ Enable email confirmations: **비활성화** (개발 중)
- ✅ Secure email change: **비활성화** (개발 중)

**Anonymous Users**
- ✅ Enable anonymous sign-ups: **활성화**

**Email Provider**
- 기본 Supabase SMTP 사용 (또는 사용자 정의 SMTP 설정)

### 2️⃣ 디버깅 스크립트 실행

```bash
npm run debug:auth
```

이 스크립트는:
- 다양한 이메일 형식 테스트
- 익명 로그인 가능 여부 확인
- 사용 가능한 이메일 도메인 찾기

### 3️⃣ 임시 해결책: 데모 인증 모드

Supabase 설정 문제가 지속되면 임시로 로컬 인증을 사용할 수 있습니다:

**app/layout.tsx 수정:**
```typescript
// 기존
import { AuthProvider } from '@/components/auth-provider'

// 임시 변경
import { DemoAuthProvider as AuthProvider } from '@/components/demo-auth-provider'
```

**데모 모드 특징:**
- 로컬 스토리지 기반 인증
- 이메일/비밀번호 회원가입/로그인
- 익명 로그인 지원
- 실제 Supabase 없이 작동

### 4️⃣ SQL 직접 사용자 생성

만약 Supabase Auth가 완전히 작동하지 않으면:

```sql
-- Supabase 대시보드 SQL Editor에서 실행
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
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'test@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "테스트 사용자"}',
    NOW(),
    NOW()
);
```

### 5️⃣ 환경 변수 재확인

**.env.local 파일:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://kzrlybhxqmalqtiiwhjn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cmx5Ymh4cW1hbHF0aWl3aGpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODEwMzMsImV4cCI6MjA3NDI1NzAzM30._d2Uy294lHorZ27Bmj6Gr0LzrBJLSNfn2FpGp_3D2QU
```

## 🎯 권장 단계별 해결

### Step 1: 디버깅
```bash
npm run debug:auth
```

### Step 2: Supabase 설정 확인
- Authentication > Settings 메뉴에서 모든 설정 검토
- Email confirmations 비활성화
- Anonymous sign-ups 활성화

### Step 3: 임시 해결책 사용
- 데모 인증 모드로 전환하여 개발 계속

### Step 4: 문제 해결 후 복원
- Supabase 설정 완료 후 원래 AuthProvider로 복원

## 📞 추가 지원

### Supabase 로그 확인
1. Supabase 대시보드 > Logs
2. Auth 로그에서 오류 메시지 확인

### 네트워크 요청 확인
1. 브라우저 개발자 도구 > Network
2. 인증 요청/응답 상태 확인

---

## ✅ 체크리스트

- [ ] `npm run debug:auth` 실행 완료
- [ ] Supabase Authentication 설정 확인 완료
- [ ] Email confirmations 비활성화 확인
- [ ] Anonymous sign-ups 활성화 확인
- [ ] Site URL 설정 확인 (`http://localhost:3000`)
- [ ] 필요시 데모 모드로 전환 완료

**모든 체크박스 완료 시 인증 문제가 해결됩니다!** 🎉
