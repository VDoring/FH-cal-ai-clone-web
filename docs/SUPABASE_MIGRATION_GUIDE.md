# Supabase 마이그레이션 가이드

## 📋 개요

로컬 SQLite 데이터베이스에서 Supabase PostgreSQL로의 마이그레이션이 완료되었습니다.

## 🚀 설정 단계

### 1. 환경 변수 설정

`.env.local` 파일에 다음 환경 변수들이 설정되어야 합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=https://kzrlybhxqmalqtiiwhjn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cmx5Ymh4cW1hbHF0aWl3aGpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODEwMzMsImV4cCI6MjA3NDI1NzAzM30._d2Uy294lHorZ27Bmj6Gr0LzrBJLSNfn2FpGp_3D2QU
```

### 2. 데이터베이스 스키마 생성

Supabase 대시보드의 SQL Editor에서 `docs/supabase-migration.sql` 파일의 내용을 실행하세요:

1. [Supabase 대시보드](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. SQL Editor 메뉴 클릭
4. `docs/supabase-migration.sql` 파일 내용 복사 & 실행

### 3. 연결 테스트

다음 명령어로 Supabase 연결을 테스트할 수 있습니다:

```bash
npm run test:supabase
```

## 🔄 주요 변경사항

### 인증 시스템

- **이전**: 사용자명 기반 로컬 인증
- **현재**: Supabase Auth (익명 로그인, 이메일/비밀번호)

### 데이터베이스

- **이전**: SQLite (로컬 파일)
- **현재**: PostgreSQL (Supabase 클라우드)

### 보안

- **Row Level Security (RLS)** 활성화
- 사용자는 자신의 데이터만 접근 가능
- 자동 인증 상태 관리

## 📁 수정된 파일들

### 라이브러리 파일
- `lib/supabase.ts` - Supabase 클라이언트 설정
- `lib/auth.ts` - Supabase Auth 함수들
- `lib/food-logs.ts` - Supabase 데이터베이스 함수들
- `lib/api-client.ts` - API 클라이언트 업데이트

### 컴포넌트
- `components/auth-provider.tsx` - Supabase Auth 상태 관리

### API 라우트
- `app/api/auth/user/route.ts` - 인증 API
- `app/api/food-logs/route.ts` - 음식 로그 API

### 스크립트 & 문서
- `scripts/test-supabase-connection.js` - 연결 테스트 스크립트
- `docs/supabase-migration.sql` - 데이터베이스 스키마
- `package.json` - 테스트 스크립트 추가

## 🔧 사용 방법

### 익명 사용자로 시작

애플리케이션 시작 시 자동으로 익명 로그인이 수행됩니다.

### 이메일 회원가입/로그인

```javascript
import { useAuth } from '@/components/auth-provider'

function LoginComponent() {
  const { signUpWithEmail, signInWithEmail } = useAuth()
  
  // 회원가입
  await signUpWithEmail('user@example.com', 'password')
  
  // 로그인
  await signInWithEmail('user@example.com', 'password')
}
```

### 음식 로그 저장

```javascript
import { saveFoodLogAPI } from '@/lib/api-client'

await saveFoodLogAPI({
  imageUrl: null,
  mealType: 'breakfast',
  items: [...],
  summary: {...}
})
```

## 🛡️ 보안 특징

1. **RLS (Row Level Security)**
   - 사용자는 자신의 데이터만 접근
   - SQL 레벨에서 보안 정책 적용

2. **자동 인증**
   - 세션 만료 시 자동 갱신
   - 익명 로그인으로 seamless UX

3. **API 보안**
   - 모든 API 요청에 인증 확인
   - 사용자 ID 자동 설정

## 🚨 주의사항

1. **기존 SQLite 데이터**
   - 로컬 SQLite 데이터는 자동 마이그레이션되지 않음
   - 필요시 수동으로 데이터 이전 필요

2. **환경 변수**
   - 프로덕션 환경에서는 환경 변수를 안전하게 관리
   - `.env.local` 파일을 Git에 커밋하지 마세요

3. **익명 사용자**
   - 익명 사용자 데이터는 세션 종료 시 접근 불가능할 수 있음
   - 중요한 데이터는 회원가입 후 사용 권장

## 🐛 문제 해결

### 연결 실패 시
1. 환경 변수 확인
2. Supabase 프로젝트 상태 확인
3. 네트워크 연결 확인

### 데이터베이스 오류 시
1. `docs/supabase-migration.sql` 재실행
2. RLS 정책 확인
3. 사용자 권한 확인

### 인증 오류 시
1. 익명 로그인 설정 확인
2. Supabase Auth 설정 확인
3. 브라우저 콘솔 로그 확인

## 📞 지원

문제가 발생하면:
1. 브라우저 개발자 도구 콘솔 확인
2. `npm run test:supabase` 실행
3. Supabase 대시보드에서 로그 확인
