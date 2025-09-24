# CalAI CAM V - AI 음식 분석 앱

Next.js와 SQLite를 사용하여 만든 AI 기반 음식 분석 애플리케이션입니다.

## 🚀 빠른 시작

### 1. 프로젝트 클론 및 의존성 설치

```bash
git clone <repository-url>
cd calaicamv
pnpm install
```

### 2. 개발 서버 실행

별도의 환경 변수 설정이나 데이터베이스 설정이 필요하지 않습니다. 
SQLite 데이터베이스는 애플리케이션 실행 시 자동으로 생성됩니다.

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
│   ├── database.ts     # SQLite 데이터베이스 설정
│   ├── auth.ts         # 사용자 인증 관련 함수
│   └── food-logs.ts    # 음식 로그 관련 함수
└── data/               # SQLite 데이터베이스 파일 (자동 생성)
```

## 🛠️ 주요 기능

- **사용자 인증**: 간소화된 로컬 사용자 관리
- **음식 사진 분석**: AI를 통한 음식 인식 및 영양 정보 분석
- **칼로리 추적**: 일일 칼로리 및 영양소 섭취량 추적
- **식단 기록**: 아침, 점심, 저녁, 간식별 식단 기록 관리

## 📱 반응형 디자인

모바일 우선으로 디자인되었으며, 데스크톱에서도 최적화된 경험을 제공합니다.

## 🔧 트러블슈팅

### 데이터베이스 관련 이슈

로컬 SQLite 데이터베이스는 애플리케이션 실행 시 자동으로 생성됩니다. 
만약 데이터베이스 이슈가 발생하면 `data/` 폴더를 삭제하고 다시 실행하세요.

```bash
rm -rf data/
npm run dev
```

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

**참고**: 현재 구성은 로컬 SQLite 데이터베이스를 사용하므로 프로덕션 배포 시에는 데이터베이스가 초기화됩니다. 실제 배포 시에는 PostgreSQL 등의 클라우드 데이터베이스로 변경하는 것을 권장합니다.

## 📦 사용된 기술 스택

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Database**: SQLite (better-sqlite3)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **Package Manager**: npm

## 🤝 기여하기

1. Fork 생성
2. Feature 브랜치 생성 (`git checkout -b feature/AmazingFeature`)
3. 변경사항 커밋 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 Push (`git push origin feature/AmazingFeature`)
5. Pull Request 생성

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.