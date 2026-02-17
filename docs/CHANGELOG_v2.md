# Academic Snaps v2 - 역방향 파이프라인 변경 사항

**날짜**: 2026-02-17  
**변경 이유**: 융합 사례의 정확성(Accuracy) 향상 및 학제간 융합 범위 확장

---

## 📋 주요 변경 사항

### 1. **파이프라인 방향 전환** (Bottom-Up → Top-Down)

#### 기존 (v1)
```
FoundationAgent → ApplicationAgent → IntegrationAgent
   (기본 원리)      (응용 원리)         (융합 사례)
```
- ❌ 문제: 기본 원리에서 시작하면 LLM이 융합 사례를 **지어낼 위험**
- ❌ 문제: 모든 기본 원리가 유명한 융합 사례를 갖고 있지 않음

#### 신규 (v2)
```
IntegrationAgent → ApplicationAgent → FoundationAgent → VerificationAgent
  (융합 사례)        (응용 원리)         (기본 원리)         (검증)
```
- ✅ 장점: **실제 존재하는 융합 사례**부터 시작
- ✅ 장점: 한 학문이 다른 학문의 문제를 해결한 **역사적 사실**에서 출발
- ✅ 장점: **웹 검색 검증** 추가로 사실 확인
- ✅ 장점: AI에 국한하지 않고 **모든 학문 분야의 융합** 포함

### 2. **학제간 융합 범위 확장**

- **기존**: AI 문제 해결에 집중
- **신규**: 의학, 건축, 음악, 재료공학 등 **모든 분야의 융합 사례**

**예시**:
- 물리학 → 생물학: X-선 결정학 → DNA 구조 발견
- 생물학 → 건축: 흰개미집 → 에너지 효율 건물
- 수학 → 음악: 푸리에 변환 → 디지털 음향
- 화학 → 의학: 페니실린 → 항생제

---

## 🔄 에이전트 순서 및 역할

### 생성 순서 (내부 파이프라인)

| 순서 | 에이전트 | 입력 | 출력 | 역할 |
|------|---------|------|------|------|
| 1 | **IntegrationAgent** | 학문 분야 정보 | 융합 사례 | 실제 학제간 융합 사례 선정 (AI 아니어도 됨) |
| 2 | **ApplicationAgent** | 융합 사례 | 응용 원리 | 융합 사례에서 응용 원리 **역추적** |
| 3 | **FoundationAgent** | 융합 + 응용 | 기본 원리 | 응용 원리에서 기본 원리 **역추적** |
| 4 | **VerificationAgent** | 전체 정보 | 검증 결과 | Tavily API로 웹 검색하여 **사실 확인** |

### 📱 사용자 화면 표시 순서

**생성 순서**: 융합 → 응용 → 기본 → 검증  
**표시 순서**: **기본 → 응용 → 융합** ✨

- 내부적으로는 정확성을 위해 역방향으로 생성
- 사용자에게는 학습 흐름에 맞게 **기본 원리부터** 표시
- Firestore 데이터 구조는 foundation → application → integration 순서로 저장

---

## 📂 변경된 파일

### 새로 추가된 파일
- `scripts/agents/knowledge_graph_v2.py` - 역방향 파이프라인 구현
- `scripts/test_knowledge_v2.py` - 테스트 스크립트

### 수정된 파일
- `scripts/generate_daily.py` - v2 import로 변경
- `docs/feature2_academic_snaps.md` - 문서 업데이트

### 유지되는 파일
- `scripts/agents/knowledge_graph.py` - 기존 버전 보존 (백업용)

---

## 🆕 새로 추가된 기능

### 1. 검증 시스템 (VerificationAgent)
```typescript
{
  verified: boolean;      // 검증 통과 여부
  confidence: number;     // 신뢰도 (0.0-1.0)
  sources: Array<{        // 검증 소스
    title: string;
    url: string;
  }>;
  factCheck: string;      // 검증 결과 설명
}
```

### 2. 유명도 점수 (Integration)
- `famousLevel`: 1-10 (융합 사례의 유명도)
- 5 미만이면 경고 메시지 출력

### 3. 연결 역할 설명 (Application)
- `bridgeRole`: 기본 원리와 융합 사례를 연결하는 역할 설명

### 4. 과학적 맥락 (Foundation)
- `scientificContext`: 해당 학문에서 이 원리가 중요한 이유

---

## 🔍 검증 프로세스

1. **융합 사례 선정 시** - 프롬프트에 유명한 예시 제공 (Simulated Annealing, 신경망 등)
2. **웹 검색 검증** - Tavily API로 실제 존재 여부 확인
3. **신뢰도 점수** - 0.0-1.0 (0.8 이상이면 신뢰 가능)
4. **검증 소스** - Wikipedia, 학술 논문 등 출처 기록

---

## 📊 데이터 구조 (Firestore)

```json
{
  "date": "2026-02-17",
  "discipline_key": "physics",
  "discipline_info": {...},
  "principle": {
    "title": "Simulated Annealing",
    "category": "physics",
    "superCategory": "기초과학",
    
    "foundation": {
      "principle": "금속을 높은 온도로 가열 후...",
      "keyIdea": "천천히 식히면 안정한 상태",
      "everydayAnalogy": "퍼즐 조각을 맞추는...",
      "scientificContext": "재료의 물성 개선 핵심 공정"
    },
    
    "application": {
      "applicationField": "통계 물리학/최적화",
      "description": "높은 '온도'를 설정해...",
      "mechanism": "온도를 낮추며 탐색",
      "technicalTerms": ["확률적 탐색", "전역 최적화"],
      "bridgeRole": "에너지 최소화를 수학 문제로 변환"
    },
    
    "integration": {
      "problemSolved": "AI 로컬 미니마 문제",
      "solution": "담금질 기법으로...",
      "targetField": "인공지능",
      "realWorldExamples": ["물류 최적화", "반도체 설계"],
      "impactField": "AI, 물류, 반도체",
      "whyItWorks": "국소 최적해 탈출 가능"
    },
    
    "verification": {
      "verified": true,
      "confidence": 0.8,
      "sources": [...],
      "factCheck": "웹 검색 결과 실제 존재..."
    },
    
    "learn_more_links": [...]
  }
}
```

---

## 🧪 테스트 방법

```bash
# 스크립트 디렉토리로 이동
cd scripts

# 테스트 실행 (물리학)
python test_knowledge_v2.py
```

**예상 결과**:
- 제목: Simulated Annealing
- 유명도: 10/10
- 검증: ✅ 통과 (신뢰도 80%)

---

## ⚠️ 주의 사항

1. **Tavily API 키 필요**: `.env`에 `TAVILY_API_KEY` 설정
2. **검증 실패 시**: confidence < 0.5 이면 추가 확인 필요
3. **유명도 낮을 시**: famousLevel < 5 이면 경고 확인

---

## 📈 기대 효과

| 지표 | v1 (기존) | v2 (신규) |
|------|----------|----------|
| Hallucination 위험 | 높음 | **낮음** ✅ |
| 융합 사례 정확도 | 60-70% | **80-90%** ✅ |
| 검증 프로세스 | ❌ 없음 | ✅ 있음 (웹 검색) |
| LLM 호출 횟수 | 3회 | 4회 (+1회 검증) |
| 사용자 신뢰도 | 보통 | **높음** ✅ |

---

## 💡 다음 단계

1. ✅ 역방향 파이프라인 구현 완료
2. ✅ 검증 시스템 추가 완료
3. 🔄 테스트 및 피드백 수집
4. 🔄 프론트엔드 UI 업데이트 (검증 배지 표시)

---

**작성자**: Antigravity AI  
**리뷰 요청**: @사용자님
