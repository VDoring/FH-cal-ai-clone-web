# 🌉 브릿지 계정 설정 가이드

데모 사용자 `testuser@gmail.com`의 데이터를 Supabase에 저장하기 위한 브릿지 계정 설정 방법입니다.

## 📋 설정 단계

### 1. 환경변수 설정

`.env.local` 파일에 Supabase Service Role Key 추가:

```bash
# 기존 환경변수들
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# 추가 필요 (서버 사이드 RLS 우회용)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Service Role Key 찾는 방법:**
1. Supabase 대시보드 → Settings → API
2. "Service Role" 섹션에서 키 복사
3. ⚠️ 주의: 이 키는 모든 권한을 가지므로 절대 클라이언트에 노출하지 마세요!

### 2. 브릿지 계정 생성

Supabase 대시보드의 SQL Editor에서 `docs/create-testuser-account.sql` 실행:

```sql
-- 브릿지 계정 생성 및 RLS 정책 수정
-- 파일 내용 참조
```

### 3. 설정 확인

**3-1. 브릿지 계정 확인:**
```sql
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE id = '22222222-2222-2222-2222-222222222222';
```

**3-2. RLS 정책 확인:**
```sql
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'food_logs';
```

## 🔄 데이터 흐름

```
testuser@gmail.com (데모 로그인)
         ↓
음식 사진 업로드 → n8n 웹훅
         ↓
userId: user_1758765225587_4kf14
         ↓
매핑: 22222222-2222-2222-2222-222222222222
         ↓
Supabase food_logs 테이블 저장 (Service Key 사용)
         ↓
대시보드에서 데이터 조회
```

## 🧪 테스트 방법

1. **로그인**: `testuser@gmail.com` / `admin#123456`
2. **업로드**: 음식 사진 업로드
3. **확인**: 콘솔에서 다음 로그 확인:
   ```
   비UUID 형식의 userId 감지: user_xxxxx
   브릿지 Supabase userId로 매핑: 22222222-2222-2222-2222-222222222222
   Supabase에 음식 로그 저장 중...
   분석 결과 저장 완료: [log_id]
   ```

4. **데이터 확인**:
   ```sql
   SELECT * FROM food_logs 
   WHERE user_id = '22222222-2222-2222-2222-222222222222'
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

## ❌ 문제 해결

### "new row violates row-level security policy" 오류
**원인**: RLS 정책이 서버 사이드 삽입을 차단
**해결**: SQL 스크립트의 RLS 정책 수정 부분 실행

### "SUPABASE_SERVICE_ROLE_KEY is not defined" 오류
**원인**: 환경변수 미설정
**해결**: `.env.local`에 Service Role Key 추가 후 서버 재시작

### 데이터가 대시보드에 표시되지 않음
**원인**: 브릿지 계정 매핑 문제
**해결**: 
1. API 클라이언트의 `mapToBridgeUserId()` 함수 확인
2. 콘솔 로그에서 userId 매핑 과정 확인

## 🔒 보안 주의사항

1. **Service Role Key 보호**: 절대 클라이언트 사이드에 노출 금지
2. **RLS 정책**: `auth.uid() IS NULL` 조건은 서버 사이드 전용
3. **브릿지 계정**: 실제 로그인 불가능하도록 설정됨

## ✅ 성공 확인

- [ ] 환경변수 설정 완료
- [ ] 브릿지 계정 생성 완료
- [ ] RLS 정책 수정 완료
- [ ] 음식 업로드 테스트 성공
- [ ] Supabase에 데이터 저장 확인
- [ ] 대시보드에서 데이터 조회 확인

모든 체크박스가 완료되면 데모 로그인 + Supabase 저장 하이브리드 시스템이 완성됩니다! 🎉
