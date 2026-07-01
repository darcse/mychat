# mychat 개발 하네스

## 워크플로우

```
Claude Chat → feature_list → Cursor → Claude Code 검증
```

1. **Claude Chat** — 기능 요구사항 논의, `feature_list/*.json`에 항목 추가·갱신
2. **feature_list** — 구현할 기능의 단계·통과 여부(`passes`)를 추적
3. **Cursor** — `feature_list` 기준으로 코드 구현
4. **Claude Code** — `steps` 항목별 검증, `passes: true`로 마킹

## 터미널 사용

- **dev 서버**: 별도 터미널에서 `npm run dev` 실행 후 유지 (`localhost:3000`)
- **빌드 검증**: dev 서버와 **별도 터미널**에서 `npm run build` 실행

두 명령을 같은 터미널에서 순차 실행하지 않는다. dev 서버가 점유 중인 터미널에서는 build를 돌리지 않는다.
