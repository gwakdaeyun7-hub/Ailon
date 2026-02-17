# 기능3: Synergy Lab (AI 융합 아이디어 생성) - 구현 완료

## 📋 개요

기능1(AI 뉴스)과 기능2(학문 원리)를 융합하여 혁신적인 AI 아이디어를 자동 생성합니다.

## 🔄 파이프라인 구조

```
[기능1 뉴스] + [기능2 원리]
        ↓
┌───────────────────────────────────────────┐
│  기능3: AI Synergy Lab (5-Node Pipeline) │
└───────────────────────────────────────────┘

Node 1: mechanism_extractor
  ├─ 입력: 기능2의 원리 (foundation + application + integration)
  └─ 출력: 핵심 메커니즘 (추상적 패턴)

Node 2: ai_problem_scout ⭐
  ├─ 입력: 기능1의 뉴스 100-200개 + 핵심 메커니즘
  ├─ 처리: LLM으로 뉴스에서 AI 문제/한계점 추출
  └─ 출력: 메커니즘으로 해결 가능한 문제 3개

Node 3: cross_pollinator
  ├─ 입력: 메커니즘 + 문제 3개
  ├─ 처리: 원리를 AI 문제에 적용하는 아이디어 생성
  └─ 출력: 융합 아이디어 3개

Node 4: blueprint_architect
  ├─ 입력: 융합 아이디어 3개
  ├─ 처리: 기술 로드맵 + 시장 분석 + 평가 점수 추가
  └─ 출력: 평가된 아이디어 3개

Node 5: idea_verifier
  ├─ 입력: 평가된 아이디어 3개
  ├─ 처리: Tavily로 유사 선행 사례 검증
  └─ 출력: 최종 아이디어 3개 (검증 완료)
```

## 📁 주요 파일

### 1. `agents/idea_graph_v2.py` (핵심 로직)
```python
# 5개 노드 함수:
- mechanism_extractor_node()    # 메커니즘 추출
- ai_problem_scout_node()        # 문제 탐색 (기능1 뉴스 활용)
- cross_pollinator_node()        # 아이디어 생성
- blueprint_architect_node()     # 로드맵 작성
- idea_verifier_node()           # 검증

# Entry point:
run_idea_graph(news_articles, today_principle, discipline_info)
```

### 2. `generate_daily.py` (실행 스크립트)
```python
# 매일 오전 6시 GitHub Actions에서 실행
def main():
    # Step 1: 뉴스 수집
    news_result = run_news_team()
    
    # Step 2: 학문 원리 생성
    knowledge_result = run_knowledge_team()
    
    # Step 3: 융합 아이디어 생성
    idea_result = run_idea_team(
        news_articles=news_result["final_articles"],
        today_principle=knowledge_result["today_principle"],
        discipline_info=knowledge_result["discipline_info"]
    )
    
    # Firestore 저장
    save_ideas_to_firestore(idea_result, news_result, knowledge_result)
    save_synergy_ideas_to_firestore(...)
```

## 📊 데이터 흐름

### 입력
```json
{
  "news_articles": [
    {
      "title": "[arXiv] GPT-5 하이퍼파라미터 튜닝 72시간 소요",
      "description": "...",
      "source": "arXiv",
      "importance_score": 85
    }
  ],
  "today_principle": {
    "title": "시뮬레이티드 어닐링",
    "category": "최적화 이론",
    "foundation": {...},
    "application": {...},
    "integration": {...}
  },
  "discipline_info": {
    "name": "물리학",
    "superCategory": "기초과학"
  }
}
```

### 출력 (Firestore)
```json
{
  "date": "2026-02-17",
  "ideas": [
    {
      "concept_name": "SA-AutoML: 시뮬레이티드 어닐링 기반 하이퍼파라미터 최적화",
      "problem_addressed": "LLM 하이퍼파라미터 튜닝 시간/비용 문제",
      "principle_applied": "시뮬레이티드 어닐링",
      "how_it_connects": "점진적 온도 하강처럼...",
      "description": "...",
      "narrative": "...",
      "feasibility_score": 8,
      "novelty_score": 7,
      "impact_score": 9,
      "total_score": 24,
      "technical_roadmap": {
        "phases": [...],
        "totalDuration": "3개월",
        "techStack": ["Python", "Ray Tune", "PyTorch"]
      },
      "market_feasibility": {
        "tam": "MLOps 시장 $10B",
        "competitors": ["Optuna", "WandB"],
        "differentiation": "물리 기반 최적화"
      },
      "verification": {
        "verified": true,
        "priorArt": [...],
        "noveltyCheck": "유사 접근 존재하지만 구현은 새로울 수 있음",
        "confidence": 0.7
      }
    }
  ],
  "count": 3,
  "source_news_count": 150,
  "source_discipline": "physics",
  "source_principle": "시뮬레이티드 어닐링"
}
```

## 🎯 핵심 개선 사항

### ✅ 완료된 수정
1. **소스 통합**: 기능1 뉴스만 사용 (PainPoint 전용 수집 제거)
2. **효율성**: API 호출 감소 (Reddit 중복 제거)
3. **일관성**: 같은 시간에 수집된 데이터 활용
4. **비용 절감**: 불필요한 StackOverflow, YouTube 제거

### 🔑 주요 로직 (ai_problem_scout_node)

```python
def ai_problem_scout_node(state: IdeaGraphState) -> dict:
    # 1. 기능1에서 수집한 뉴스 활용
    news_articles = state.get("news_articles", [])
    
    # 2. 상위 30개 뉴스만 처리 (중요도 기준)
    top_news = sorted(
        news_articles, 
        key=lambda x: x.get("importance_score", 0), 
        reverse=True
    )[:30]
    
    # 3. LLM에게 질문
    prompt = """
    다음 AI 뉴스에서 **현재 AI가 해결하지 못하는 문제/한계점**을 찾아주세요.
    그 중 {메커니즘}으로 해결 가능한 것 3개를 골라주세요.
    """
    
    # 4. 결과 반환
    return {"matched_problems": [problem1, problem2, problem3]}
```

## 🧪 테스트 방법

### 빠른 테스트
```bash
cd scripts
python test_idea_v2.py
```

### 전체 파이프라인 테스트
```bash
cd scripts
python generate_daily.py
```

## 📦 필요 패키지

```txt
langchain-google-genai
langgraph
tavily-python
firebase-admin
arxiv
feedparser
requests
beautifulsoup4
```

## 🔗 Firestore 컬렉션

1. **daily_ideas**: 일일 아이디어 (간단 버전)
2. **synergy_ideas**: 시너지 아이디어 (확장 버전, 프론트엔드에서 사용)

## 📈 예상 결과

- **입력**: 150개 뉴스 + 1개 원리
- **처리**: 5단계 파이프라인 (~2-3분)
- **출력**: 3개 검증된 AI 융합 아이디어

## ✨ 특징

1. **자동화**: GitHub Actions로 매일 오전 6시 실행
2. **품질**: LLM 기반 의미론적 분석
3. **실용성**: 기술 로드맵 + 시장 분석 포함
4. **검증**: Tavily로 선행 사례 확인
5. **확장성**: 노드 추가/수정 용이

## 🎨 프론트엔드 연동

```typescript
// frontend/hooks/useSynergyIdeas.ts
const ideas = useSynergyIdeas(); // synergy_ideas 컬렉션 읽기

// 각 아이디어는 다음을 포함:
- concept_name, description, narrative
- technical_roadmap (phases, techStack)
- market_feasibility (tam, competitors)
- verification (priorArt, noveltyCheck)
```

## 🚀 다음 단계 (선택사항)

1. [ ] 사용자 투표 기능 (인기 문제 우선 처리)
2. [ ] 아이디어 히스토리 (일주일 아이디어 모음)
3. [ ] GitHub 템플릿 자동 생성
4. [ ] Discord/Slack 알림 연동
