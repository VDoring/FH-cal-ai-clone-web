# 🧪 테스트 계정 설정 가이드

## 📝 테스트 계정 정보

**추천 테스트 계정:**
- **이메일**: `admin@gmail.com`
- **비밀번호**: `admin123456`

## 🚀 테스트 계정 생성 방법

### 방법 1: 애플리케이션을 통한 회원가입 (추천)

1. **애플리케이션 실행**:
   ```bash
   npm run dev
   ```

2. **브라우저에서 접속**: http://localhost:3000

3. **회원가입 진행**:
   - "계정이 없으신가요? 회원가입" 클릭
   - 이메일: `admin@gmail.com`
   - 비밀번호: `admin123456`
   - "회원가입" 버튼 클릭

4. **자동 로그인**: 회원가입 완료 후 자동으로 로그인됨

### 방법 2: SQL을 통한 직접 생성 (개발자용)

1. **Supabase 대시보드 접속**: https://supabase.com/dashboard

2. **SQL Editor에서 실행**:
   ```sql
   -- 테스트 사용자 생성
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
     'admin@gmail.com',
     crypt('admin123456', gen_salt('bf')),
     NOW(),
     '{"provider": "email", "providers": ["email"]}',
     '{"full_name": "관리자"}',
     NOW(),
     NOW()
   );
   ```

## 🔐 로그인 방법

1. **애플리케이션 접속**: http://localhost:3000

2. **로그인 정보 입력**:
   - 이메일: `admin@gmail.com`
   - 비밀번호: `admin123456`

3. **"로그인" 버튼 클릭**

## 🧪 테스트 시나리오

### 기본 기능 테스트
1. **로그인/로그아웃**
2. **음식 사진 업로드**
3. **칼로리 분석 결과 확인**
4. **식단 기록 저장**
5. **대시보드에서 기록 확인**
6. **프로필 페이지 확인**

### 데이터 테스트
1. **여러 끼니 기록** (아침, 점심, 저녁, 간식)
2. **다양한 날짜의 기록**
3. **데이터 삭제**
4. **칼로리 요약 확인**

## 🔄 계정 초기화

테스트 데이터를 초기화하려면:

```sql
-- 음식 로그 삭제
DELETE FROM food_logs WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'admin@gmail.com'
);

-- 사용자 삭제 (필요시)
DELETE FROM auth.users WHERE email = 'admin@gmail.com';
```

## 📞 문제 해결

### ❌ "User already registered" 오류
**해결 방법**: 이미 계정이 존재합니다. 로그인을 시도하세요.

### ❌ "Invalid login credentials" 오류
**해결 방법**: 이메일과 비밀번호를 확인하세요.
- 이메일: `admin@gmail.com` (정확히)
- 비밀번호: `admin123456` (정확히)

### ❌ 로그인 후 데이터가 보이지 않음
**해결 방법**: 
1. 브라우저 새로고침
2. 개발자 도구 콘솔에서 오류 확인
3. 네트워크 탭에서 API 호출 확인

---

## ✅ 테스트 완료 체크리스트

- [ ] 테스트 계정 생성 완료
- [ ] 로그인 성공
- [ ] 음식 사진 업로드 테스트
- [ ] 칼로리 분석 결과 확인
- [ ] 식단 기록 저장 확인
- [ ] 대시보드 데이터 표시 확인
- [ ] 로그아웃 기능 확인

**모든 체크박스를 완료하면 기본 기능이 정상 작동하는 것입니다!** 🎉
