# mychat 코드 검수 결과

검수 대상: `app/`, `components/`, `hooks/`, `lib/`, `types/`, `constants/` 전체 소스 (총 21개 파일, 약 2,900줄)
기준: `CLAUDE.md`, `CONVENTIONS.md`, `HARNESS.md`, `DESIGN.md`

## 심각도 분류
- 🔴 높음: 버그 가능성 또는 즉시 수정 필요
- 🟡 중간: 품질 개선 권장
- 🟢 낮음: 선택적 개선

---

## 전체 요약

| 항목 | 평가 |
|------|------|
| 타입 안전성 | 우수 — `any` 사용 0건, `unknown` + 좁히기 패턴 일관 적용 |
| 린트 | **실패 — ESLint 7 errors** (react-hooks/refs 3, react-hooks/set-state-in-effect 4) |
| 파일 길이 | Sidebar(399), ChatInput(337) 300줄 초과 |
| 커밋 규칙 | 최근 5개 커밋이 CONVENTIONS 형식 미준수 |
| 중복 코드 | dark: 유틸 클래스 · 에러 메시지 객체 반복 |

> ⚠️ `npm run lint`(=`eslint`)가 **에러로 실패**합니다. 하네스상 빌드/검증 통과 조건을 만족하지 못하므로 1순위 대상입니다.

---

## 파일별 이슈

### app/page.tsx (243줄)
- 🔴 **렌더 중 ref 변경 (ESLint `react-hooks/refs`, L41·L44)**
  `conversationsRef.current = conversations;` / `activeConversationIdRef.current = activeConversationId;` 를 렌더 본문에서 실행. React 19 규칙 위반이며 lint 실패 원인.
  → 수정 방향: 해당 값을 ref로 미러링할 필요가 있다면 `useEffect(() => { ref.current = value; })` 안에서 갱신하거나, 애초에 ref 미러링을 제거하고 `useCallback` 의존성에 값을 직접 넣는 방향 검토.
- 🔴 **활성 대화 전환 effect가 방금 보낸 메시지를 덮어쓸 위험 (L76~88)**
  첫 메시지 전송 시 `handleSend` → `createConversation`(내부에서 `setActiveConversationId`) 이 실행되면, `activeConversationId` 변경 effect가 `conversationsRef`에서 방금 만든 **빈 대화**를 찾아 `setMessages([])` 로 되돌릴 수 있음. `updateConversation`의 상태 반영 순서에 의존하는 매우 취약한 흐름.
  → 수정 방향: "대화 전환 시 메시지 로드" 와 "신규 대화 생성" 을 명확히 분리. 신규 생성 경로에서는 로드 effect가 트리거되지 않도록 플래그/조건을 두거나, 메시지 소스를 `activeConversation.messages` 단일 소스로 통일(별도 `messages` state 제거) 검토.
- 🟡 **set-state-in-effect (ESLint, 2건)** — L66~74의 localStorage 읽기 후 `setState`. 초기 하이드레이션 목적이지만 lint가 경고. `useSyncExternalStore` 또는 초기값 lazy initializer로 대체 가능.
- 🟡 **컴포넌트 책임 과다** — 모델 상태 + 웹검색 상태 + 메시지 미러링 + 사이드바 + 스크롤 + 대화 동기화를 한 컴포넌트가 모두 관리. `messages` state가 `useConversations`와 이중 소스가 되어 버그(위 항목)의 근본 원인. 모델/웹검색 persist 로직은 `usePersistedState` 훅으로 추출 권장.
- 🟡 **스트리밍 토큰마다 `scrollIntoView` 호출 (L145~148)** — `messages` 의존이라 토큰 1개마다 smooth 스크롤 실행. 긴 응답에서 성능 부담. throttle 또는 "하단 근처일 때만" 조건 추가 권장.
- 🟢 `handleSend`/`handleResend` 의 `conversationId` 지역변수는 조건 분기 용도로만 쓰이고 이후 사용되지 않음 — 가독성상 의도 주석 또는 정리 권장.

### components/Sidebar.tsx (399줄) — 300줄 초과
- 🟡 **파일 분리 필요** — `ThemeToggle`, `ConversationItem`, `ConversationSection`, `Sidebar` 4개 컴포넌트가 한 파일에. `ThemeToggle`, `ConversationItem`는 별도 파일로 분리 권장.
- 🟡 **props drilling** — `Sidebar → ConversationSection → ConversationItem` 로 `onUpdateTitle/onDelete/onTogglePin/onMenuOpen...` 등 8개 콜백이 2단계 전달(`sectionProps` 스프레드). 대화 액션은 context 또는 `useConversations` 훅 직접 구독으로 완화 가능.
- 🟢 `saveTitle` 내 `editValue` 재설정 로직이 `cancelEdit`와 유사 — 소폭 중복.

### components/ChatInput.tsx (337줄) — 300줄 초과
- 🔴 **렌더 중 ref 변경 (ESLint `react-hooks/refs`, L176)** — `modelsRef.current = models;` 렌더 본문 실행. page.tsx와 동일 위반.
  → effect 내부 갱신 또는 `useModels` 반환값을 effect 의존성에 직접 사용하도록 수정.
- 🟡 **파일 분리 필요** — `ModelBadge/ModelCard/ModelPopoverSpinner/ModelPopover`(모델 선택 UI)를 `ModelPopover.tsx`로 분리하면 본체가 절반으로 축소.
- 🟢 L178 `selectedModel` 은 `models.find` 로 매 렌더 계산 — 목록이 커지면 `useMemo` 고려(현재 규모에선 무해).

### hooks/useTheme.ts (35줄)
- 🟡 **set-state-in-effect (ESLint)** — 초기 stored 값 읽기 후 `setThemeState`.
- 🟡 **마운트 시 localStorage 덮어쓰기 레이스** — effect1(읽기)이 상태 갱신을 큐잉하기 전에 effect2(쓰기)가 `theme='system'` 상태로 `localStorage.setItem('mychat-theme','system')` 실행 → 저장값을 순간 덮어씀(직후 재렌더로 교정되나 불필요한 쓰기·깜빡임). 초기값을 lazy initializer로 읽어 해결 권장.
- 🟢 `setTheme` 는 단순 래퍼이므로 `setThemeState`를 그대로 반환해도 무방.

### hooks/useConversations.ts (169줄)
- 🟡 **set-state-in-effect (ESLint, L45~48)** — 하이드레이션 목적. 의도적이나 lint 경고 대상.
- 🟢 **매 변경마다 전체 배열 localStorage 저장** — 개인용 규모에선 허용 가능하나, `sortConversations`가 모든 뮤테이션마다 전체 재정렬 + `saveConversations` 동기 직렬화. 대화 수 증가 시 debounce 고려.
- 🟢 `updateConversation/updateTitle/togglePin/deleteConversation` 의 `setConversations(prev => sort(map(...)) + save)` 패턴이 4회 반복 — `mutateAndSave(mutator)` 헬퍼로 통합 가능.

### hooks/useChat.ts (279줄)
- 🟡 **에러 메시지 객체 생성 중복 (4회)** — `{ id: assistantId, role: "assistant" as const, content, isError: true, createdAt: Date.now() }` 형태가 비-스트림 실패/스트림 에러/빈 응답/catch 4곳에 반복. `makeAssistantError(content)` 헬퍼로 추출 권장.
- 🟢 `streamError`를 클로저 변수로 두고 콜백에서 대입 — 동작하나, `readSseStream`이 에러 문자열을 반환값으로 돌려주는 편이 흐름 추적에 유리.
- 🟢 타입 안전성 양호(`unknown` 파싱, `as const` 사용). 이슈 없음.

### app/api/chat/route.ts (203줄)
- 🟢 검증 로직(키/JSON/role/content) 견고. `extractMessageContent` 재사용 적절.
- 🟢 SSE 파싱 루프가 클라이언트 `readSseStream`과 구조 유사하나 실행 환경(서버 upstream vs 클라이언트)이 달라 통합 실익 낮음 — 현행 유지 무방.

### lib/openrouter-chat.ts (250줄)
- 🟢 `buildToolResultMessage`가 실제 검색 결과 대신 고정 문자열 `"Web search completed."` 반환 — 도구 호출 라운드 처리를 위한 플레이스홀더로 보이나, 실제 검색 컨텍스트가 모델에 전달되지 않는 구조인지 확인 필요(기능적 리스크).
- 🟢 나머지 타입 정의·에러 처리 견고.

### components/MarkdownContent.tsx (125줄)
- 🟡 **`dark:text-[var(--text-primary)]` 클래스가 거의 모든 노드에 중복** — p/strong/em/li/h1~h3/table/thead/tbody/tr/th/td 등에 반복 삽입. 최상위 래퍼에 다크 텍스트 색을 두고 자식은 상속받게 하면 대량 제거 가능(현재 래퍼 L10에 이미 존재하므로 상당수는 불필요한 중복).
- 🟢 L50 `code` 블록 판정을 `Boolean(className)`으로만 함 — 언어 클래스 없는 fenced 블록은 인라인으로 렌더될 수 있음. 실사용상 대개 무해.

### components/MessageList.tsx (249줄)
- 🟢 `showTypingIndicator` 계산과 `visibleMessages` 필터가 "빈 스트리밍 메시지"를 각각 판정 — 로직 자체는 정합하나 의도를 주석으로 명시하면 유지보수 용이.
- 🟢 스트리밍 중 `MarkdownContent`가 토큰마다 전체 재파싱 — 규모상 허용, 필요 시 `React.memo` 고려.

### app/api/models/route.ts (86줄)
- 🟡 **정적 핸들러에 `export const revalidate = 3600`** — 외부 `fetch` 없이 하드코딩 배열만 반환하므로 revalidate가 실질 무의미. 오해 소지 있어 제거 또는 실제 원격 조회로 전환.
- 🟢 모델 ID(`anthropic/claude-opus-4.7`, `deepseek/deepseek-v4-pro` 등)가 실존 여부 불명 — OpenRouter에 없는 ID면 채팅 요청이 400/404로 실패. 실제 카탈로그와 대조 필요(제품 데이터 이슈).

### app/layout.tsx (63줄)
- 🟢 인라인 `dangerouslySetInnerHTML` 로 FOUC 방지 테마 스크립트 주입 — 적절한 패턴. `useTheme`의 localStorage 키(`mychat-theme`)와 하드코딩 문자열이 이중 관리되므로 상수화 권장.

### 규칙 준수 (CONVENTIONS.md / HARNESS.md)
- 🟡 **커밋 형식 미준수** — CONVENTIONS 규정은 `YYMMDD_HHMM (type): description`. 초기 커밋 `260701_HHMM (setup): ...`만 형식을 따르고(그마저 `HHMM` 미치환), 이후 5개 커밋(`Update Sidebar...`, `Implement...` 등)은 형식·언어 모두 이탈. 이후 커밋부터 규칙 적용 필요.
- 🟢 환경변수 규칙 준수 — `OPENROUTER_API_KEY` 서버사이드 전용, `NEXT_PUBLIC_` 미사용, `.gitignore`에 `.env*` 포함되어 `.env.local` 미추적 확인됨. 양호.
- 🟢 폴더 구조(`app/`, `app/api/`) 준수.

---

## 수정 우선순위

**1순위 (🔴 / 린트 실패 — 즉시)**
1. ESLint 7 errors 해소: `react-hooks/refs`(page.tsx L41·L44, ChatInput L176) — 렌더 중 ref 대입을 effect로 이동. `npm run lint` 통과가 하네스 검증 전제.
2. page.tsx 대화 전환 effect의 메시지 덮어쓰기 위험 제거 — `messages` 이중 소스 정리(신규 대화 생성 경로와 로드 경로 분리).

**2순위 (🟡 — 품질/구조)**
1. Sidebar(399) · ChatInput(337) 파일 분리 → 300줄 이하로.
2. page.tsx 책임 분리 — 모델/웹검색 persist를 `usePersistedState` 훅으로 추출.
3. useChat 에러 객체 · useConversations 뮤테이션 패턴 헬퍼로 중복 제거.
4. MarkdownContent 중복 `dark:` 클래스 정리.
5. 스트리밍 스크롤 throttle.
6. 커밋 형식 CONVENTIONS 준수.

**3순위 (🟢 — 선택)**
1. useTheme 초기값 lazy initializer 전환(레이스·불필요 쓰기 제거).
2. models route `revalidate` 정리 및 모델 ID 실존성 검증.
3. localStorage 키 상수화(layout ↔ useTheme).
4. openrouter-chat 웹검색 도구 결과 플레이스홀더 구조 확인.

---

## 주의사항
- 본 문서는 **검수 결과만** 담으며 코드는 수정하지 않았습니다.
- 🔴 1순위 2건은 실제 동작/빌드에 영향을 주는 항목이므로 우선 처리 권장.
- 타입 안전성(`any` 0건)과 API 라우트 입력 검증은 전반적으로 양호합니다.
