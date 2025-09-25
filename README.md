# CalAI CAM V - AI 음식 분석 앱

Next.js와 Supabase를 사용하여 만든 AI 기반 음식 분석 애플리케이션입니다.

## 🚀 빠른 시작

### 1. 프로젝트 클론 및 의존성 설치

```bash
git clone <repository-url>
cd calaicamv
pnpm install
```

### 2. Supabase 설정

#### 2-1. Supabase 프로젝트 생성
1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. 프로젝트 URL과 anon 키 복사

#### 2-2. 환경변수 설정
`.env.local` 파일을 생성하고 다음 값들을 추가하세요:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Development Environment
NODE_ENV=development
```

#### 2-3. 데이터베이스 스키마 생성
Supabase 대시보드의 SQL Editor에서 `docs/database-schema.sql` 파일의 내용을 실행하세요.

### 3. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 애플리케이션을 확인할 수 있습니다.

## 🏗️ 프로젝트 구조

```
calaicamv/
├── app/                    # Next.js App Router
│   ├── dashboard/         # 대시보드 페이지
│   ├── upload/           # 음식 사진 업로드 페이지
│   └── layout.tsx        # 루트 레이아웃
├── components/           # 재사용 가능한 컴포넌트
│   ├── auth-provider.tsx # 인증 프로바이더
│   ├── dashboard/        # 대시보드 관련 컴포넌트
│   ├── layout/           # 레이아웃 컴포넌트
│   └── ui/              # 기본 UI 컴포넌트
├── lib/                 # 유틸리티 및 라이브러리
│   ├── supabase.ts     # Supabase 클라이언트 설정
│   ├── auth.ts         # 사용자 인증 관련 함수
│   └── food-logs.ts    # 음식 로그 관련 함수
└── docs/               # 프로젝트 문서 및 스키마
```

## 🛠️ 주요 기능

- **사용자 인증**: 간소화된 로컬 사용자 관리
- **음식 사진 분석**: AI를 통한 음식 인식 및 영양 정보 분석 (현재 시뮬레이션 모드)
- **칼로리 추적**: 일일 칼로리 및 영양소 섭취량 추적
- **식단 기록**: 아침, 점심, 저녁, 간식별 식단 기록 관리

## ⚠️ 현재 상태

**AI 분석 시뮬레이션 모드**
- n8n webhook이 현재 비활성화 상태입니다
- 테스트를 위해 시뮬레이션된 음식 분석 결과를 제공합니다
- 실제 이미지 분석은 n8n webhook을 설정한 후 사용 가능합니다

**n8n Webhook 설정이 필요한 경우:**
1. `.env` 파일에서 `N8N_WEBHOOK_URL` 값을 올바른 n8n webhook URL로 설정
2. n8n에서 음식 분석 워크플로우 구성
3. `SUPABASE_SERVICE_ROLE_KEY` 환경변수 추가

## 📱 반응형 디자인

모바일 우선으로 디자인되었으며, 데스크톱에서도 최적화된 경험을 제공합니다.

## 🔧 트러블슈팅

### 환경변수 관련 이슈

환경변수가 올바르게 설정되지 않으면 Supabase 연결에 실패할 수 있습니다:

1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. Supabase URL과 키가 올바른지 확인
3. 환경변수 이름이 정확한지 확인 (`NEXT_PUBLIC_` 접두사 포함)

### 데이터베이스 스키마 이슈

Supabase에서 테이블이 생성되지 않았다면:

1. Supabase 대시보드 → SQL Editor 접속
2. `docs/database-schema.sql` 파일 내용을 복사하여 실행
3. 테이블과 정책이 올바르게 생성되었는지 확인

### 개발 환경에서 Hot Reload 이슈

Turbopack 사용 시 간혹 Hot Reload가 작동하지 않을 수 있습니다:

```bash
# Turbopack 없이 실행
pnpm dev --no-turbopack
```

## 🚀 배포

### Vercel 배포

1. [Vercel](https://vercel.com)에 프로젝트 연결
2. 별도의 환경 변수 설정이 필요하지 않음
3. 배포 완료

**참고**: Supabase를 사용하므로 배포 시에도 데이터가 유지됩니다. Vercel과 Supabase가 자동으로 연동됩니다.

## 📦 사용된 기술 스택

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (현재는 간소화된 프로필 시스템 사용)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **Package Manager**: pnpm

## 🤝 기여하기

1. Fork 생성
2. Feature 브랜치 생성 (`git checkout -b feature/AmazingFeature`)
3. 변경사항 커밋 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 Push (`git push origin feature/AmazingFeature`)
5. Pull Request 생성

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.