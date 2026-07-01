# mychat 컨벤션

## 프로젝트

- **프로젝트명**: mychat
- **목적**: 개인용 멀티 AI 챗 앱 (OpenRouter 연동)
- **스택**: Next.js 16 (App Router), TailwindCSS v4, TypeScript

## 구조

- **컴포넌트**: `app/` 하위 App Router 구조
- **API 라우트**: `app/api/` 하위

## 환경변수

- `OPENROUTER_API_KEY` — `.env.local`에 설정, 서버사이드 전용 (`NEXT_PUBLIC_` 접두사 사용 금지)

## 커밋 형식

```
YYMMDD_HHMM (type): description
```

예: `250701_1430 (feat): 채팅 입력 UI 추가`
