---
name: sync-harness
description: 현재 세션의 코드 변경사항을 분석하여 CLAUDE.md, agents, hooks, skills 등 하네스 파일을 동기화하고 GitHub에 커밋+푸시합니다.
user-invocable: true
---

# Sync Harness — 하네스 파일 동기화 + GitHub 푸시

현재 세션에서 수정된 코드 변경사항을 분석하여, 관련 하네스 파일(CLAUDE.md, agents, hooks, skills, memory)을 업데이트하고 GitHub에 커밋+푸시합니다.

## 사용법

- `/sync-harness` — 전체 변경사항 분석 → 하네스 업데이트 → 커밋+푸시
- `/sync-harness dry` — 변경사항만 분석하고 수정 계획만 출력 (실제 수정/커밋 안 함)
- `/sync-harness push-only` — 이미 수정된 하네스 파일만 커밋+푸시 (분석+수정 스킵)

## 실행 절차

### Phase 1: 변경사항 수집

1. `git diff HEAD` (unstaged + staged 변경) 실행
2. `git diff --cached` (staged만) 실행
3. `git log --oneline -10` 실행하여 최근 커밋 메시지 확인
4. 변경된 파일 목록을 영역별로 분류:
   - `scripts/` 변경 → `scripts/CLAUDE.md` 업데이트 후보
   - `mobile/` 변경 → `mobile/CLAUDE.md` 업데이트 후보
   - `.claude/agents/` 변경 → 루트 `CLAUDE.md` Hooks 테이블 확인
   - `.claude/hooks/` 변경 → 루트 `CLAUDE.md` Hooks 테이블 업데이트
   - `.claude/skills/` 변경 → 루트 `CLAUDE.md`에 스킬 목록 추가 검토
   - `functions/`, `backend/` 변경 → 루트 `CLAUDE.md` Architecture 섹션 확인
   - `.github/workflows/` 변경 → `scripts/CLAUDE.md` CI 섹션 확인

### Phase 2: 하네스 파일 영향 분석

변경사항별로 다음을 판단:

| 변경 유형 | 영향받는 하네스 파일 | 업데이트 기준 |
|-----------|---------------------|-------------|
| 새 파이프라인 노드 추가/삭제 | `scripts/CLAUDE.md` Pipeline Architecture | 노드 목록, 플로우 다이어그램 |
| 새 컴포넌트/화면 추가 | `mobile/CLAUDE.md` Features, Components | 탭/컴포넌트 목록, 라인 수 |
| 새 훅 추가 | `mobile/CLAUDE.md` Hooks | 훅 목록 |
| 새 에이전트 정의 | 루트 `CLAUDE.md` | 에이전트 설명 테이블 (있으면) |
| 훅 스크립트 추가/수정 | 루트 `CLAUDE.md` Hooks 테이블 | Hook, Trigger, Mode, Scope |
| 새 스킬 추가 | 해당 없음 (스킬은 자체 SKILL.md로 자립) | — |
| Firestore 규칙 변경 | `scripts/CLAUDE.md` Firestore Collections | 컬렉션/필드 스키마 |
| CI 워크플로우 변경 | `scripts/CLAUDE.md` GitHub Actions | 스케줄, 스텝 |
| 뉴스 소스 추가/삭제 | `scripts/CLAUDE.md` News Sources | 소스 목록, 티어 |
| 환경 변수 추가 | 루트 `CLAUDE.md` Environment Variables | 변수 이름, 용도 |
| 패키지 의존성 변경 | 해당 없음 (package.json/requirements.txt에서 확인 가능) | — |
| Known Issue 해결/발생 | 해당 CLAUDE.md Known Issues | 이슈 추가/제거 |

**업데이트 하지 않는 것:**
- 단순 버그 수정, 스타일 변경, 리팩토링 → 하네스 변경 불필요
- 코드에서 직접 확인할 수 있는 정보 (파일 경로, 함수명 등) → CLAUDE.md에 이미 있으면 업데이트, 없으면 추가 안 함
- 하네스 파일에 기술되지 않은 세부 구현 → 추가 안 함

### Phase 3: claude-code-harness-engineer 에이전트 호출

영향 분석 결과 업데이트가 필요한 경우, `claude-code-harness-engineer` 에이전트를 호출하여 수정을 위임합니다.

**에이전트 호출 프롬프트 템플릿:**

```
현재 세션에서 다음 코드 변경이 발생했습니다:

[변경 요약 — 어떤 파일이 어떻게 변경되었는지]

이 변경으로 인해 다음 하네스 파일들을 업데이트해야 합니다:

1. {파일 경로}: {업데이트 이유} — {구체적 수정 내용}
2. {파일 경로}: {업데이트 이유} — {구체적 수정 내용}

수정 원칙:
- 변경된 부분만 최소한으로 수정 (하네스 파일 전체 재작성 금지)
- 기존 포맷/스타일 유지
- 코드에서 직접 확인 가능한 정보는 정확히 반영
- 추측이나 미래 계획은 포함하지 않음

각 파일을 읽고, 해당 섹션만 Edit으로 수정하세요.
```

**에이전트 수정 범위 제한:**
- 루트 `CLAUDE.md`: Architecture, Hooks 테이블, Environment Variables, Known Issues
- `scripts/CLAUDE.md`: Pipeline Architecture, News Sources, Key Constants, Firestore Collections, GitHub Actions, Known Issues
- `mobile/CLAUDE.md`: Features (탭별), Components, Hooks, Contexts, Known Issues, Build

### Phase 4: 커밋 + 푸시

현재 세션에서 변경된 **모든 파일** (코드 + 하네스)을 커밋하고 푸시합니다.

1. **변경 파일 확인**: `git status --short`로 현재 세션의 변경 파일 목록 확인
2. **코드 변경 커밋** (하네스 외 변경이 있는 경우):
   - 현재 세션에서 변경된 코드 파일만 staging (`.env`, credentials 등 민감 파일 제외)
   - 커밋 메시지 형식:
     ```
     {type}: {변경 내용 요약}

     {상세 설명 (필요시)}

     Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
     ```
   - `{type}`은 변경 성격에 맞게: feat, fix, refactor, chore 등

3. **하네스 변경 커밋** (Phase 3에서 수정이 발생한 경우):
   - 수정된 하네스 파일만 staging:
     ```
     git add CLAUDE.md scripts/CLAUDE.md mobile/CLAUDE.md .claude/agents/*.md .claude/hooks/*.sh .claude/skills/*/SKILL.md
     ```
     (실제 변경된 파일만 add)
   - 커밋 메시지 형식:
     ```
     chore: sync harness files with session changes

     Updated:
     - {파일1}: {변경 요약}
     - {파일2}: {변경 요약}

     Triggered by changes to: {변경된 코드 영역 요약}

     Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
     ```

4. **푸시**: `git pull --rebase` 후 `git push origin main` 실행

**범위 제한**: `git diff HEAD`와 `git status`에 나타나는 현재 세션 변경사항만 대상. 이미 커밋된 이전 세션의 변경은 건드리지 않음.

### Phase 5: 결과 보고

```
## Harness Sync 완료

### 변경 분석
- 코드 변경: {N}개 파일 ({영역 요약})
- 하네스 영향: {M}개 파일 업데이트 필요

### 수정 내역
| 하네스 파일 | 수정 섹션 | 변경 내용 |
|-------------|----------|----------|
| CLAUDE.md | Hooks 테이블 | 새 hook 추가: {hook name} |
| scripts/CLAUDE.md | Pipeline | en_process 노드 설정 변경 반영 |

### Git
- Code commit: {hash} — {message} ({N}개 파일)
- Harness commit: {hash} — {message} ({M}개 파일)
- Pushed to: origin/main
```

## dry 모드

`/sync-harness dry` 실행 시:
- Phase 1~2만 실행 (변경사항 수집 + 영향 분석)
- Phase 3~5 스킵 (수정/커밋/푸시 안 함)
- 어떤 하네스 파일에 어떤 수정이 필요한지 계획만 출력

## push-only 모드

`/sync-harness push-only` 실행 시:
- Phase 1~3 스킵 (변경 분석 + 하네스 수정 안 함)
- 현재 세션의 모든 변경 파일 (코드 + 하네스) 커밋+푸시
- Phase 4~5 실행

## 주의사항

- **하네스 파일 외 코드는 절대 수정하지 않는다** — 이 스킬은 하네스 동기화 전용
- 변경사항이 하네스에 영향을 주지 않으면 "업데이트 불필요" 보고 후 종료
- 충돌 방지: 푸시 전 `git pull --rebase` 실행
- 커밋 메시지에 실제 변경 내용을 구체적으로 기술 (제네릭한 메시지 금지)
