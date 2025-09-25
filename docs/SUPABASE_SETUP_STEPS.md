# 🚀 Supabase 설정 단계별 가이드

## 📋 현재 상황
- Supabase 프로젝트는 생성되어 있음
- 환경 변수는 설정됨
- **⚠️ 데이터베이스 테이블이 아직 생성되지 않음**

## 🔧 설정 단계

### 1️⃣ Supabase 대시보드 접속

1. **웹 브라우저에서 접속**: https://supabase.com/dashboard
2. **프로젝트 선택**: `kzrlybhxqmalqtiiwhjn` 프로젝트 클릭

### 2️⃣ SQL Editor로 테이블 생성

1. **왼쪽 메뉴에서 "SQL Editor" 클릭**
   
2. **"New query" 버튼 클릭**

3. **SQL 스크립트 복사 & 붙여넹기**
   - `docs/supabase-migration.sql` 파일을 열어서
   - 전체 내용을 복사
   - SQL Editor에 붙여넣기

4. **"Run" 버튼 클릭**
   - 스크립트가 성공적으로 실행되어야 함
   - 오류가 있으면 콘솔에 표시됨

### 3️⃣ 테이블 생성 확인

1. **왼쪽 메뉴에서 "Table Editor" 클릭**
2. **`food_logs` 테이블이 생성되었는지 확인**
3. **테이블 구조 확인**:
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, Foreign Key)
   - `image_url` (TEXT, Nullable)
   - `meal_type` (TEXT, Not Null)
   - `food_items` (JSONB)
   - `total_calories` (INTEGER)
   - `total_nutrients` (JSONB)
   - `confidence_score` (DECIMAL)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

### 4️⃣ 연결 테스트

터미널에서 다음 명령어 실행:

```bash
npm run test:supabase
```

**성공 시 출력 예시**:
```
🔄 Supabase 연결을 테스트합니다...
📍 Supabase URL: https://kzrlybhxqmalqtiiwhjn.supabase.co
🔑 Anon Key: eyJhbGciOiJIUzI1NiIsInR5...

📋 테이블 존재 확인...
✅ food_logs 테이블이 존재합니다.

🔐 익명 인증 테스트...
✅ 익명 인증 성공
👤 사용자 ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

💾 데이터 삽입/조회 테스트...
✅ 테스트 데이터 삽입 성공
📄 삽입된 데이터 ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
✅ 데이터 조회 성공
🗑️ 테스트 데이터 삭제 완료

🎉 모든 테스트가 성공했습니다!
✅ Supabase 연결이 정상적으로 작동합니다.

🚀 애플리케이션을 실행할 준비가 되었습니다!
```

### 5️⃣ 애플리케이션 실행

모든 테스트가 성공하면:

```bash
npm run dev
```

## 🐛 문제 해결

### ❌ "food_logs 테이블이 존재하지 않습니다"

**원인**: 2단계에서 SQL 스크립트가 제대로 실행되지 않음

**해결 방법**:
1. Supabase 대시보드 → SQL Editor로 이동
2. `docs/supabase-migration.sql` 내용을 다시 복사
3. 새로운 쿼리에서 실행
4. 오류 메시지가 있으면 확인 후 수정

### ❌ "익명 인증 실패"

**원인**: Supabase Auth 설정 문제

**해결 방법**:
1. Supabase 대시보드 → Authentication → Settings
2. "Enable anonymous sign ins" 옵션 확인
3. 옵션이 비활성화되어 있으면 활성화

### ❌ "데이터 삽입 실패"

**원인**: RLS (Row Level Security) 정책 문제

**해결 방법**:
1. SQL Editor에서 정책 확인:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'food_logs';
   ```
2. 정책이 없으면 2단계 SQL 스크립트 재실행

### ❌ "환경 변수 오류"

**원인**: `.env.local` 파일 설정 문제

**해결 방법**:
1. 프로젝트 루트에 `.env.local` 파일 생성
2. 다음 내용 추가:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://kzrlybhxqmalqtiiwhjn.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cmx5Ymh4cW1hbHF0aWl3aGpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODEwMzMsImV4cCI6MjA3NDI1NzAzM30._d2Uy294lHorZ27Bmj6Gr0LzrBJLSNfn2FpGp_3D2QU
   ```

## 📞 추가 지원

모든 단계를 완료했는데도 문제가 있다면:

1. **브라우저 콘솔 확인** (F12)
2. **Supabase 대시보드 → Logs 확인**
3. **터미널 에러 메시지 확인**

---

## ✅ 완료 체크리스트

- [ ] Supabase 대시보드 접속 완료
- [ ] SQL Editor에서 스크립트 실행 완료
- [ ] `food_logs` 테이블 생성 확인
- [ ] `npm run test:supabase` 테스트 성공
- [ ] 애플리케이션 정상 실행

모든 체크박스를 완료하면 Supabase 설정이 완료됩니다! 🎉
