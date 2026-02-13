# Gemini API 모델 참조

## 현재 시도한 모델들

1. ❌ `gemini-1.5-flash` (v1beta) - NOT_FOUND
2. ❌ `gemini-1.5-flash` (v1) - NOT_FOUND
3. ⏳ `gemini-1.5-flash-latest` (v1beta) - 테스트 중...

## 다음 시도할 모델 (위에서 실패 시)

### Option 1: gemini-pro (가장 안정적)
```typescript
https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
```

### Option 2: gemini-1.5-pro-latest
```typescript
https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent
```

### Option 3: gemini-1.0-pro-latest
```typescript
https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro-latest:generateContent
```

## 모델 변경 방법

파일: `frontend/app/api/generate-idea/route.ts`

48-49번째 줄 수정:
```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/MODEL_NAME:generateContent?key=${apiKey}`,
```

`MODEL_NAME`을 위의 옵션 중 하나로 변경
