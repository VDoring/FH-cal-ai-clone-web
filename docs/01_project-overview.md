# 📋 프로젝트 개요 및 MVP 개발 계획

## 🎯 프로젝트 목표
원클릭 AI 식단 기록 서비스 프로토타입 개발
- **핵심 철학**: "마찰 없는 기록(Frictionless Logging)"
- **목표**: 사진 선택만으로 완전 자동화된 식단 기록 시스템 구현

## 🏗️ 기술 스택
- **Frontend**: Next.js (App Router) + TypeScript
- **Backend**: Next.js API Routes
- **Database & Auth**: Supabase
- **Automation**: n8n
- **Deployment**: Vercel (추천)

## 📁 프로젝트 구조
```
calaicamv/
├── app/                    # Next.js App Router
│   ├── auth/              # 인증 관련 페이지
│   ├── dashboard/         # 대시보드 페이지
│   ├── upload/            # 업로드 페이지
│   └── api/               # API Routes
├── components/            # 재사용 가능한 컴포넌트
├── lib/                   # 유틸리티 및 설정
├── types/                 # TypeScript 타입 정의
├── public/                # 정적 파일
└── docs/                  # 개발 문서
```

## 🚀 MVP 개발 단계

### Phase 1: 기본 설정 및 인증 (1-2일)
- [ ] Next.js 프로젝트 설정
- [ ] Supabase 프로젝트 생성 및 설정
- [ ] 기본 UI 컴포넌트 라이브러리 설정
- [ ] 인증 시스템 구현

### Phase 2: 데이터베이스 및 스토리지 (1일)
- [ ] Supabase 데이터베이스 스키마 설계
- [ ] Supabase Storage 버킷 설정
- [ ] 기본 CRUD 함수 구현

### Phase 3: 이미지 업로드 및 n8n 연동 (2-3일)
- [ ] 이미지 업로드 UI 구현
- [ ] n8n 웹훅 연동 API 구현
- [ ] 업로드 상태 관리 및 피드백

### Phase 4: 대시보드 및 데이터 조회 (2-3일)
- [ ] 식단 기록 조회 페이지
- [ ] 끼니별/날짜별 필터링
- [ ] 칼로리 및 영양성분 요약

### Phase 5: 최적화 및 테스트 (1-2일)
- [ ] 반응형 디자인 최적화
- [ ] 에러 처리 개선
- [ ] 기본적인 테스트 케이스

## 📝 개발 순서 및 의존성

1. **01_project-setup.md** - 프로젝트 기본 설정
2. **02_authentication.md** - 사용자 인증 시스템
3. **03_database-design.md** - 데이터베이스 스키마 설계
4. **04_image-upload.md** - 이미지 업로드 기능
5. **05_n8n-integration.md** - n8n 웹훅 연동
6. **06_dashboard.md** - 대시보드 및 조회 기능
7. **07_ui-components.md** - UI 컴포넌트 구현
8. **08_testing-deployment.md** - 테스트 및 배포

## ⚠️ 주요 고려사항

### 기술적 제약사항
- 모바일 웹 최적화 필수
- 이미지 파일 크기 제한 (10MB 이하)
- API 호출 타임아웃 처리
- 오프라인 상태 대응

### 보안 고려사항
- 사용자별 이미지 접근 권한 관리
- API 요청 속도 제한 (Rate Limiting)
- 파일 업로드 검증 (이미지 파일만 허용)

### 성능 최적화
- 이미지 압축 및 리사이징
- 데이터베이스 쿼리 최적화
- 적절한 캐싱 전략

## 📊 성공 지표
- [ ] 사진 선택부터 기록 완료까지 3번 이하의 사용자 액션
- [ ] 이미지 업로드 및 분석 완료 시간 30초 이하
- [ ] AI 분석 정확도 80% 이상
- [ ] 모바일 디바이스에서 원활한 사용 경험

---
*이 문서는 MVP 개발 진행에 따라 지속적으로 업데이트됩니다.*
