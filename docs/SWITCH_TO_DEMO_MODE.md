# 🔄 데모 인증 모드로 전환하기

## 📋 언제 사용하나요?
- Supabase Auth 설정 문제가 지속될 때
- 빠른 개발/테스트가 필요할 때
- 네트워크 연결 없이 개발할 때

## 🚀 전환 방법

### 1️⃣ app/layout.tsx 수정

**현재 코드:**
```typescript
import { AuthProvider } from '@/components/auth-provider'
```

**변경 후:**
```typescript
import { DemoAuthProvider as AuthProvider } from '@/components/demo-auth-provider'
```

### 2️⃣ 애플리케이션 재시작

```bash
npm run dev
```

## 🎯 데모 모드 기능

### ✅ 지원되는 기능
- 이메일/비밀번호 회원가입
- 이메일/비밀번호 로그인
- 익명 로그인 ("게스트로 시작하기")
- 로그아웃
- 사용자 세션 유지 (로컬 스토리지)

### ⚠️ 제한사항
- 실제 Supabase 데이터베이스 연결 안됨
- 음식 로그 저장 기능 제한됨
- 사용자 데이터는 브라우저에만 저장

## 🧪 테스트 계정

데모 모드에서는 어떤 이메일/비밀번호든 사용 가능:
- **이메일**: `admin@test.com`
- **비밀번호**: `admin123`

또는 원하는 아무 이메일/비밀번호도 가능합니다.

## 🔄 원래 모드로 복원

Supabase 문제 해결 후 원래대로 돌리기:

**app/layout.tsx에서:**
```typescript
import { AuthProvider } from '@/components/auth-provider'
```

---

**데모 모드는 개발용 임시 해결책입니다. 프로덕션에서는 반드시 Supabase Auth를 사용하세요!** ⚠️
