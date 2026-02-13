# Ailon - AI Learning & Creativity Companion
## Product Requirement Document (PRD)

**문서 버전**: 1.0
**최종 수정일**: 2026-02-12
**작성자**: Product Management Team
**문서 상태**: Draft for Review

---

## 목차
1. [Executive Summary](#1-executive-summary)
2. [문제 정의 및 기회](#2-문제-정의-및-기회)
3. [제품 비전 및 목표](#3-제품-비전-및-목표)
4. [타겟 사용자 및 페르소나](#4-타겟-사용자-및-페르소나)
5. [핵심 기능 요구사항](#5-핵심-기능-요구사항)
6. [사용자 여정 및 경험](#6-사용자-여정-및-경험)
7. [기술 아키텍처](#7-기술-아키텍처)
8. [성공 지표 (KPI)](#8-성공-지표-kpi)
9. [경쟁 분석](#9-경쟁-분석)
10. [비즈니스 모델 및 수익화 전략](#10-비즈니스-모델-및-수익화-전략)
11. [개발 로드맵 및 마일스톤](#11-개발-로드맵-및-마일스톤)
12. [리스크 및 완화 전략](#12-리스크-및-완화-전략)
13. [성장 전략](#13-성장-전략)
14. [부록](#14-부록)

---

## 1. Executive Summary

### 제품 개요
**Ailon**은 AI 시대를 살아가는 학습자와 창의적 사고자를 위한 일일 큐레이션 플랫폼입니다. 최신 AI 기술 동향, 다학제적 지식, 그리고 융합적 아이디어를 매일 제공하여 사용자의 학습 효율성과 창의성을 극대화합니다.

### 핵심 가치 제안
- **시간 절약**: 매일 수백 개의 AI 뉴스 중 가장 중요한 정보만 5분 내로 습득
- **지식 융합**: AI와 타 학문의 교차점에서 새로운 기회 발견
- **실행 가능성**: 단순 정보 전달이 아닌 실무 적용 가이드 제공
- **개인화 학습**: 사용자 피드백 기반 맞춤형 콘텐츠 큐레이션

### 시장 기회
- **TAM (Total Addressable Market)**: 전 세계 AI 학습자 및 종사자 약 500만 명
- **SAM (Serviceable Addressable Market)**: 한국어권 AI 관심 사용자 약 50만 명
- **SOM (Serviceable Obtainable Market)**: 1년 내 목표 DAU 10,000명

### 차별화 요소
1. **AI 에이전트 기반 자동화**: LangGraph 멀티 에이전트가 24/7 정보 수집 및 분석
2. **학제간 융합 접근**: AI + 물리학/경제학/철학 등 독특한 조합 제시
3. **Zero-to-One 실행력**: 아이디어에 대한 기술 스택 및 실행 로드맵 제공
4. **완전 무료 시작**: 프리미엄 기능 없이도 핵심 가치 제공

---

## 2. 문제 정의 및 기회

### 2.1 현재 시장의 문제점

**Problem 1: 정보 과부하 (Information Overload)**
- AI 관련 뉴스가 하루 1,000개 이상 생성됨 (Reddit r/MachineLearning, HackerNews, Twitter/X 등)
- 사용자가 중요한 정보를 선별하는 데 하루 1-2시간 소요
- 결과: 핵심을 놓치거나, 학습 피로도 증가

**Problem 2: 단편적 지식 습득**
- 대부분의 뉴스레터/큐레이션 서비스는 AI 기술만 다룸
- 타 학문과의 연결고리 부재로 창의적 발상 제한
- 결과: 지식의 깊이는 있으나 폭과 융합 능력 부족

**Problem 3: 실행 격차 (Execution Gap)**
- "이런 기술이 있다"는 알지만 "어떻게 쓰는가"는 모름
- 대부분의 콘텐츠가 소개에 그침 (How-to 부재)
- 결과: 학습한 내용의 실무 전환율 10% 이하

### 2.2 기회 요인

**Opportunity 1: AI Agent 기술의 성숙**
- LangGraph, CrewAI 등 멀티 에이전트 프레임워크 안정화
- 큐레이션 자동화 비용이 획기적으로 감소 (월 $50 이하)

**Opportunity 2: 융합 인재 수요 증가**
- 기업들이 AI + Domain Expert 인재를 높은 연봉으로 채용 중
- 단일 분야 전문가보다 융합형 인재의 가치 프리미엄 30-50%

**Opportunity 3: 마이크로러닝 트렌드**
- Z세대/밀레니얼의 85%가 5분 이하 콘텐츠 선호 (Statista 2025)
- 숏폼 학습 콘텐츠 시장 연평균 23% 성장 중

---

## 3. 제품 비전 및 목표

### 3.1 비전 (Vision)
"AI 시대의 레오나르도 다빈치를 만드는 일일 동반자"

### 3.2 미션 (Mission)
매일 5분 투자로 사용자가 AI 기술 최전선과 다학제적 지식을 융합하여, 세상에 없던 아이디어를 창출할 수 있도록 돕는다.

### 3.3 제품 목표 (Product Goals)

**Phase 1 (MVP - 3개월)**: 검증 및 초기 사용자 확보
- 목표: DAU 500명, Retention D7 > 40%
- 핵심: AI 뉴스 큐레이션의 품질 검증

**Phase 2 (Growth - 6개월)**: 기능 확장 및 바이럴 성장
- 목표: DAU 5,000명, Retention D30 > 25%
- 핵심: Academic Snaps 및 개인화 기능 강화

**Phase 3 (Scale - 12개월)**: 수익화 및 커뮤니티
- 목표: DAU 10,000명, 프리미엄 전환율 5%
- 핵심: Synergy Lab 고도화, 커뮤니티 기능 출시

### 3.4 비즈니스 목표

**Year 1**
- 사용자 기반: 누적 30,000명 회원가입, DAU 10,000명
- 수익: 월 $10,000 (프리미엄 구독)
- 브랜드: 한국 AI 학습 플랫폼 Top 3 인지도

**Year 2**
- 사용자 기반: DAU 50,000명
- 수익: 월 $100,000 (구독 + B2B)
- 확장: 영어권 서비스 런칭

---

## 4. 타겟 사용자 및 페르소나

### 4.1 Primary Persona: "학습자 김테크"

**인구통계**
- 나이: 25-35세
- 직업: AI/ML 엔지니어, 데이터 사이언티스트, 대학원생
- 수입: 연 4,000-8,000만원
- 거주지: 서울/수도권

**행동 패턴**
- 하루 출퇴근 시간에 뉴스레터/아티클 5-10개 읽음
- Reddit, HackerNews, Twitter/X를 주 정보원으로 활용
- 주말에 사이드 프로젝트 진행 (GitHub 활발)

**Pain Points**
- "매일 쏟아지는 AI 뉴스를 따라가기 벅차요"
- "트렌드만 쫓다가 깊이 있는 학습은 못하는 것 같아요"
- "배운 걸 실무에 어떻게 적용할지 막막해요"

**Goals**
- 최신 AI 트렌드를 놓치지 않고 효율적으로 학습
- 차별화된 전문성을 갖춰 커리어 성장
- 실무에서 바로 써먹을 수 있는 스킬 습득

**Ailon 사용 시나리오**
- 아침 출근길 지하철에서 Daily AI Curation 3분 완독
- 점심시간에 Academic Snaps 2-3개 읽으며 휴식
- 저녁에 Synergy Lab 아이디어를 사이드 프로젝트에 적용

### 4.2 Secondary Persona: "창업가 박아이디어"

**인구통계**
- 나이: 28-40세
- 직업: 스타트업 창업가, PM, 비즈니스 개발자
- 수입: 변동적 (Pre-seed ~ Series A)
- 거주지: 서울/판교

**행동 패턴**
- 아이디어 노트 상시 작성 (Notion, Obsidian 등)
- Y Combinator, a16z 블로그 등 스타트업 콘텐츠 구독
- 네트워킹 이벤트 적극 참여

**Pain Points**
- "AI 기술을 비즈니스에 어떻게 녹일지 모르겠어요"
- "경쟁사가 너무 많아서 차별화 포인트 찾기 어려워요"
- "기술 검증 없이 아이디어만 난무해요"

**Goals**
- 실현 가능한 AI 비즈니스 아이디어 발굴
- 기술 트렌드를 투자자에게 어필할 수 있는 언어로 전환
- 빠른 시장 검증 및 MVP 구축

**Ailon 사용 시나리오**
- 주 1회 Synergy Lab에서 융합 아이디어를 사업 아이템으로 변환
- Daily AI Curation에서 경쟁 기술 동향 파악
- Technical Roadmap을 개발팀과 공유

### 4.3 Tertiary Persona: "탐구자 이지식"

**인구통계**
- 나이: 22-28세
- 직업: 대학생, 주니어 개발자, 타 분야 전공자
- 수입: 연 2,000-4,000만원
- 거주지: 전국

**Pain Points**
- "AI는 흥미롭지만 어디서부터 시작해야 할지 막막해요"
- "전공 지식과 AI를 어떻게 연결할지 고민이에요"

**Goals**
- AI 기초 지식을 재미있게 습득
- 다양한 학문에 대한 교양 쌓기
- 진로 탐색 및 커리어 전환 준비

---

## 5. 핵심 기능 요구사항

### 5.1 Feature 1: AI Trend Navigator (최신 AI 기술 정보)

#### 5.1.1 기능 개요
매일 아침 전 세계 AI 뉴스를 자동 수집, 분석, 큐레이션하여 카테고리별 핵심 정보를 제공하는 기능

#### 5.1.2 기획 의도
- **문제 해결**: 정보 과부하 해소 및 시간 절약 (하루 1-2시간 → 5분)
- **가치 제공**: 단순 뉴스 나열이 아닌, 중요도/실용성 기반 선별 제공
- **학습 효율**: 카테고리별 구조화로 체계적 지식 축적 가능
- **실행 지원**: How-to Guide로 즉시 적용 가능성 극대화

#### 5.1.3 세부 요구사항

**FR-1.1: 뉴스 자동 수집**
- **설명**: AI 에이전트가 매일 오전 6시 자동으로 뉴스 수집
- **소스**: Reddit (r/MachineLearning, r/LocalLLaMA), HackerNews, GitHub Trending, Arxiv, Twitter/X 주요 AI 계정
- **수집량**: 1일 100-200개 원본 아티클
- **우선순위**: Must-Have
- **Acceptance Criteria**:
  - GIVEN: 매일 오전 6시가 되었을 때
  - WHEN: GitHub Actions Cron Job이 실행되면
  - THEN: 100개 이상의 AI 관련 뉴스/리포지토리가 수집됨
  - AND: 수집 실패 시 Slack/Email로 알림 발송

**FR-1.2: 5개 카테고리 분류**
- **카테고리 정의**:
  1. **모델 & 아키텍처**: 새로운 LLM, SLM, 어텐션 메커니즘, 벤치마크 결과
  2. **에이전틱 리얼리티**: 자율 에이전트, 멀티 에이전트 워크플로우, 실무 사례
  3. **오픈소스 & 코드**: GitHub 트렌딩, 새로운 라이브러리/CLI 도구
  4. **Physical AI**: 로봇공학, 엣지 AI, 임베디드 시스템
  5. **정책 & 안전**: AI 규제, 윤리, 보안, 프라이버시
- **분류 로직**: AnalyzerAgent가 키워드 및 의미 기반 분류
- **우선순위**: Must-Have
- **Acceptance Criteria**:
  - GIVEN: 100개의 원본 뉴스가 수집되었을 때
  - WHEN: AnalyzerAgent가 분석을 완료하면
  - THEN: 각 뉴스가 5개 카테고리 중 하나로 분류됨
  - AND: 분류 정확도 > 85% (수동 검증 기준)

**FR-1.3: 숏폼/롱폼 큐레이션**
- **숏폼**: 카테고리당 1개, 총 5개 (핵심만 50-100자 요약)
- **롱폼**: 카테고리당 3개, 총 15개 (300-500자 상세 요약 + How-to Guide)
- **선정 기준**:
  - 뉴스 중요도 점수 (Source 신뢰도 30% + 소셜 반응 30% + 실용성 40%)
  - 중복 제거 (유사도 > 80% 시 최신 기사 우선)
- **우선순위**: Must-Have
- **Acceptance Criteria**:
  - GIVEN: 카테고리별 20개씩 총 100개 분류된 뉴스가 있을 때
  - WHEN: CuratorAgent가 선별을 완료하면
  - THEN: 숏폼 5개 + 롱폼 15개 = 총 20개 뉴스가 최종 선정됨
  - AND: 각 롱폼 뉴스는 How-to Guide 또는 프롬프트 예시 포함

**FR-1.4: How-to Guide 자동 생성**
- **설명**: 단순 뉴스 요약을 넘어 "바로 써먹는 방법" 제공
- **예시**:
  - Claude Code 업데이트 뉴스 → "새로운 /commit 명령어 사용법: git add . 후 /commit -m '메시지' 입력"
  - LangGraph 새 기능 → "간단한 멀티 에이전트 구현 코드 스니펫"
- **생성 주체**: SummarizerAgent
- **우선순위**: Should-Have
- **Acceptance Criteria**:
  - GIVEN: 롱폼 뉴스 15개가 선정되었을 때
  - WHEN: SummarizerAgent가 요약을 완료하면
  - THEN: 80% 이상의 뉴스에 실행 가능한 How-to Guide가 포함됨
  - AND: 코드 스니펫 또는 프롬프트 예시가 명확하게 제시됨

**FR-1.5: 사용자 피드백 수집 (좋아요/싫어요)**
- **설명**: 각 뉴스 카드에 좋아요/싫어요 버튼 제공
- **학습 활용**:
  - 사용자별 선호 카테고리/토픽 파악
  - 큐레이션 알고리즘 개선 (피드백 점수 반영)
- **우선순위**: Should-Have (MVP 후 추가)
- **Acceptance Criteria**:
  - GIVEN: 사용자가 뉴스를 읽었을 때
  - WHEN: 좋아요 또는 싫어요 버튼을 클릭하면
  - THEN: Firestore에 user_id, article_id, feedback(1/-1) 저장됨
  - AND: 7일 이후부터 개인화된 뉴스 추천에 반영됨

**FR-1.6: 개인화 큐레이션 (향후)**
- **설명**: 사용자 피드백 기반 맞춤형 뉴스 추천
- **우선순위**: Nice-to-Have (Phase 2)

#### 5.1.4 AI 에이전트 설계

**Agent 1: CollectorAgent**
- **역할**: 다양한 소스에서 AI 관련 정보 수집
- **Tool**:
  - Tavily Search API (웹 검색)
  - Reddit API (r/MachineLearning, r/LocalLLaMA)
  - GitHub API (Trending Repositories)
  - RSS Parser (Arxiv, 주요 블로그)
- **Output**: 100-200개 원본 아티클 (제목, URL, 요약, 발행일)

**Agent 2: AnalyzerAgent**
- **역할**: 수집된 뉴스 분석 및 카테고리 분류
- **로직**:
  - 제목/본문 임베딩 후 카테고리별 유사도 계산
  - 중요도 점수 산출 (Source 신뢰도 + 소셜 반응 + 키워드 매칭)
- **Output**: 카테고리별 분류된 뉴스 + 중요도 점수

**Agent 3: CuratorAgent**
- **역할**: 최종 20개 (숏폼 5 + 롱폼 15) 선정
- **로직**:
  - 중복 제거 (TF-IDF 유사도 > 80%)
  - 카테고리별 Top 3 선정 (롱폼)
  - 카테고리별 Top 1 선정 (숏폼)
- **Output**: 최종 큐레이션 리스트

**Agent 4: SummarizerAgent**
- **역할**: 뉴스 요약 및 How-to Guide 생성
- **LLM**: Gemini 2.5 Flash (고속, 저비용)
- **프롬프트 예시**:
  ```
  다음 AI 뉴스를 300-500자로 요약하고, 실무에서 바로 활용할 수 있는
  간단한 가이드(코드 예시 또는 프롬프트)를 제공하세요.

  [뉴스 원문]

  출력 형식:
  ### 요약
  [300-500자 요약]

  ### 실전 가이드
  [How-to 또는 코드 예시]
  ```
- **Output**: 최종 요약본 + How-to Guide

#### 5.1.5 UI/UX 요구사항

**레이아웃**
- 홈 화면 상단에 "오늘의 AI 뉴스" 섹션 배치
- 탭 UI: [전체] [모델] [에이전트] [오픈소스] [Physical] [정책]
- 카드형 디자인: 썸네일(optional) + 제목 + 요약 + 출처 + 좋아요/싫어요

**인터랙션**
- 카드 클릭 시 모달로 상세 내용 표시 (요약 + How-to + 원문 링크)
- 좋아요/싫어요 버튼 클릭 시 시각적 피드백 (하트 애니메이션)
- 스크롤 시 무한 로딩 (롱폼 15개 → 이전 뉴스 20개 → ...)

**성능**
- 초기 로딩 시간 < 2초
- 카드 렌더링 시 Progressive Loading (스켈레톤 UI)

---

### 5.2 Feature 2: Academic Snaps (다양한 학문 스낵)

#### 5.2.1 기능 개요
인문학, 공학, 자연과학, 예술 등 전 분야의 핵심 개념/잡지식을 1분 내외로 읽을 수 있는 짧은 콘텐츠로 제공

#### 5.2.2 기획 의도
- **문제 해결**: 단편적 AI 지식으로 인한 창의성 제한 극복
- **가치 제공**: 다학제적 시야 확장으로 융합적 사고 촉진
- **차별화**: "AI 전문가 = AI만 안다"는 편견 깨기
- **즐거움**: 재미있는 잡지식으로 학습 피로도 감소

#### 5.2.3 세부 요구사항

**FR-2.1: 10개 학문 분야 커버**
- **학문 리스트**:
  - [기초과학] 수학, 물리학, 화학
  - [생명과학] 생물학, 의학/뇌과학
  - [공학] 컴퓨터공학, 전기전자공학
  - [사회과학] 경제학, 심리학/인지과학
  - [인문학] 철학/윤리학
- **우선순위**: Must-Have
- **Acceptance Criteria**:
  - GIVEN: 매일 Academic Snaps이 생성될 때
  - WHEN: 사용자가 콘텐츠를 확인하면
  - THEN: 10개 학문 분야 중 최소 3개 이상이 로테이션으로 제공됨
  - AND: 7일 동안 모든 학문 분야가 최소 1회 이상 노출됨

**FR-2.2: 비전공자 대상 잡지식 선정**
- **콘텐츠 예시**:
  - "전각문자와 반각문자: 개발자가 꼭 알아야 할 문자 인코딩 기초"
  - "bit vs Byte vs KB: 데이터 크기 단위의 모든 것"
  - "양자 얽힘(Entanglement)을 초등학생도 이해할 수 있게"
  - "애덤 스미스의 보이지 않는 손 vs AI의 추천 알고리즘"
- **선정 기준**:
  - 전문 용어 최소화 (또는 쉬운 설명 추가)
  - 일상/실무 연관성 높은 주제 우선
  - 흥미 유발 요소 포함 (Did you know? / 반전 있는 사실)
- **우선순위**: Must-Have
- **Acceptance Criteria**:
  - GIVEN: Academic Snaps 콘텐츠가 생성될 때
  - WHEN: 전문가가 아닌 일반 사용자가 읽었을 때
  - THEN: 80% 이상이 "이해하기 쉽다"고 평가 (설문 기준)
  - AND: 전문 용어는 반드시 각주 또는 툴팁으로 설명 제공

**FR-2.3: 1분 읽기 분량 (300-400자)**
- **설명**: 바쁜 사용자도 부담 없이 소비 가능한 길이
- **구조**:
  - 제목 (호기심 유발형): "당신이 몰랐던 OO의 비밀"
  - 본문 (300-400자): 핵심 개념 + 재미있는 사실 + AI 연관성
  - 더 알아보기 (optional): 관련 Wikipedia/YouTube 링크
- **우선순위**: Must-Have
- **Acceptance Criteria**:
  - GIVEN: Academic Snaps 콘텐츠가 표시될 때
  - WHEN: 사용자가 읽기 시작하면
  - THEN: 평균 읽기 시간 < 90초
  - AND: 본문 길이 300-500자 (공백 포함)

**FR-2.4: 친근한 말투 및 예시 활용**
- **말투**: "~입니다" (격식체) 대신 "~이에요" (친근체)
- **예시 활용**: 추상적 개념을 일상 비유로 설명
  - "양자 중첩 = 고양이가 동시에 살아있으면서 죽어있는 상태" (슈뢰딩거의 고양이)
- **우선순위**: Should-Have
- **Acceptance Criteria**:
  - GIVEN: Academic Snaps 콘텐츠가 생성될 때
  - WHEN: 말투 분석을 실행하면
  - THEN: 90% 이상이 친근체 문장 구조
  - AND: 50% 이상의 콘텐츠에 일상 비유 포함

**FR-2.5: AI 연관성 표시**
- **설명**: 각 학문 개념이 AI와 어떻게 연결되는지 명시
- **예시**:
  - "양자 얽힘 → 양자 컴퓨팅 → 미래 AI 가속기"
  - "행동경제학의 편향 → AI 추천 시스템의 Filter Bubble"
- **우선순위**: Should-Have
- **Acceptance Criteria**:
  - GIVEN: Academic Snaps 콘텐츠가 생성될 때
  - WHEN: 본문을 확인하면
  - THEN: 명확한 AI 연관성 문장이 1개 이상 포함됨
  - AND: "이것이 AI에 중요한 이유" 섹션 존재

#### 5.2.4 AI 에이전트 설계

**Agent 1: DisciplineExpertAgent**
- **역할**: 각 학문 분야의 핵심 개념 선정
- **데이터 소스**:
  - Wikipedia Top 1000 Articles (분야별)
  - Khan Academy, Coursera 인기 강의 목록
  - Reddit r/explainlikeimfive 인기 질문
- **로직**: 비전공자 검색 빈도 + 실용성 점수 기반 선정
- **Output**: 학문별 Top 10 개념 리스트

**Agent 2: ContentGeneratorAgent**
- **역할**: 300-400자 짧은 콘텐츠 생성
- **LLM**: Gemini 2.5 Flash
- **프롬프트 예시**:
  ```
  [학문]: 물리학
  [개념]: 양자 얽힘

  다음 조건을 만족하는 콘텐츠를 작성하세요:
  1. 300-400자 분량
  2. 친근한 말투 (~이에요, ~해요)
  3. 일상 비유 활용
  4. AI와의 연관성 1문장 포함
  5. 제목: "당신이 몰랐던 [개념]의 비밀" 형식
  ```
- **Output**: 완성된 Academic Snap

**Agent 3: AIRelevanceAgent**
- **역할**: 학문 개념과 AI의 연결고리 검증
- **로직**: 해당 개념이 AI 논문/프로젝트에서 언급된 빈도 확인
- **Output**: 연관성 점수 (0-100) + 구체적 연결 사례

**Agent 4: QualityReviewerAgent**
- **역할**: 콘텐츠 품질 검증 (가독성, 정확성, 흥미도)
- **로직**:
  - 가독성: Flesch Reading Ease 점수 > 60
  - 정확성: 전문 용어 오류 검출 (Wikipedia 교차 검증)
  - 흥미도: "Did you know?" / 반전 요소 포함 여부
- **Output**: 통과/수정 필요 판정 + 피드백

#### 5.2.5 UI/UX 요구사항

**레이아웃**
- 홈 화면 중간에 "오늘의 학문 스낵" 섹션
- 카드 디자인: 학문 아이콘 + 제목 + 짧은 미리보기 (50자)
- 하루 3-5개 제공

**인터랙션**
- 카드 클릭 시 전체 내용 표시 (모달 또는 확장)
- "더 알아보기" 버튼 클릭 시 외부 링크 이동
- 북마크 기능 (즐겨찾기)

**개인화 (향후)**
- 사용자가 관심 학문 선택 가능
- 읽은 콘텐츠 기반 추천

---

### 5.3 Feature 3: The Synergy Lab (AI 융합 아이디어)

#### 5.3.1 기능 개요
현재 AI가 해결하지 못하는 문제를 다른 학문과 융합하여 해결하는 혁신적 아이디어 + 실행 로드맵 제공

#### 5.3.2 기획 의도
- **문제 해결**: "아이디어는 있는데 어떻게 실행할지 모르겠다" 해소
- **가치 제공**: 단순 브레인스토밍을 넘어 기술 스택 + 시장성 분석까지 제공
- **차별화**: AI 뉴스레터 대부분이 "정보 전달"에 그치는 반면, Ailon은 "실행 가능한 아이디어"까지 제시
- **창업 촉진**: 스타트업 아이템으로 발전 가능한 고품질 아이디어 제공

#### 5.3.3 세부 요구사항

**FR-3.1: 매일 1개 융합 키워드 제시**
- **예시**:
  - "AI x 물리학: 단백질 폴딩 예측을 넘어 신소재 설계까지"
  - "AI x 언어학: 저자원 언어를 위한 Few-shot Translation"
  - "AI x 행동경제학: Nudge Theory 기반 AI 습관 형성 앱"
- **선정 기준**:
  - AI 한계점 (현재 미해결 문제) + 타 학문의 강점 조합
  - 실현 가능성 (기술 성숙도 > 70%)
  - 시장 크기 (TAM > $100M)
- **우선순위**: Must-Have
- **Acceptance Criteria**:
  - GIVEN: 매일 Synergy Lab이 실행될 때
  - WHEN: 융합 아이디어가 생성되면
  - THEN: "AI x [학문]" 형태의 키워드 1개 제시
  - AND: AI 한계점 + 학문 솔루션이 명확히 설명됨

**FR-3.2: 문제 정의 (Problem Statement)**
- **설명**: 현재 AI가 못하는 것 / 잘 못하는 것 명시
- **예시**:
  - "GPT-4도 장기 기억(Long-term Memory) 유지에 한계"
  - "이미지 생성 AI는 물리 법칙 위배하는 이미지 생성"
- **우선순위**: Must-Have
- **Acceptance Criteria**:
  - GIVEN: 융합 아이디어가 제시될 때
  - WHEN: Problem Statement를 확인하면
  - THEN: 구체적인 AI 한계점이 100-200자로 설명됨
  - AND: 관련 통계 또는 사례 1개 이상 포함

**FR-3.3: 솔루션 아이디어 (Idea Generation)**
- **설명**: 타 학문의 원리를 AI에 적용한 해결 방안
- **예시**:
  - "뇌과학의 Hippocampus 메커니즘을 모방한 Long-term Memory Layer 추가"
  - "물리 엔진(Physics Engine)을 이미지 생성 파이프라인에 통합"
- **우선순위**: Must-Have
- **Acceptance Criteria**:
  - GIVEN: Problem Statement가 정의되었을 때
  - WHEN: Idea Generation이 완료되면
  - THEN: 학문 원리 + AI 적용 방안이 200-300자로 설명됨
  - AND: 기존 연구 또는 유사 사례 1개 이상 인용

**FR-3.4: Technical Roadmap**
- **설명**: 아이디어를 실제로 구현하기 위한 기술 스택 및 단계별 계획
- **구성**:
  - Phase 1 (Research): 필요한 논문/코드 조사 (2-4주)
  - Phase 2 (Prototype): MVP 개발 (4-8주)
  - Phase 3 (Validation): 테스트 및 개선 (4-8주)
- **기술 스택 예시**:
  - Model: LLaMA 3.1 + Custom Memory Layer
  - Framework: LangGraph, PyTorch
  - Infrastructure: AWS EC2 g5.xlarge, Vector DB (Pinecone)
- **우선순위**: Should-Have
- **Acceptance Criteria**:
  - GIVEN: 융합 아이디어가 확정되었을 때
  - WHEN: Technical Roadmap이 생성되면
  - THEN: Phase 1-3 각각의 소요 시간 + 필요 기술 명시
  - AND: 총 구현 기간 < 6개월

**FR-3.5: 시장성 분석 (Market Feasibility)**
- **설명**: 해당 아이디어의 비즈니스 가능성 평가
- **구성**:
  - TAM (Total Addressable Market): 전체 시장 규모
  - 경쟁사: 유사한 시도를 하는 기업/프로젝트
  - 차별화 포인트: 왜 이 아이디어가 특별한가
  - 수익 모델: B2B SaaS? API? 프리미엄?
- **우선순위**: Should-Have
- **Acceptance Criteria**:
  - GIVEN: Technical Roadmap이 작성되었을 때
  - WHEN: Market Feasibility 분석이 완료되면
  - THEN: TAM, 경쟁사, 차별화, 수익 모델 각 1문장 이상 포함
  - AND: 실현 가능성 점수 (0-100) 제시

**FR-3.6: 고도화 - 멀티 에이전트 점수 매기기**
- **설명**: 여러 AI 에이전트가 독립적으로 아이디어를 평가하고, 높은 점수를 받은 아이디어만 사용자에게 제공
- **에이전트 구성**:
  - TechnicalFeasibilityAgent: 기술적 실현 가능성 (0-100)
  - MarketPotentialAgent: 시장 잠재력 (0-100)
  - NoveltyAgent: 참신성 (0-100)
- **선정 기준**: 평균 점수 > 70
- **우선순위**: Nice-to-Have (Phase 2)
- **Acceptance Criteria**:
  - GIVEN: 10개의 후보 아이디어가 생성되었을 때
  - WHEN: 3개 에이전트가 평가를 완료하면
  - THEN: 평균 점수 Top 1만 사용자에게 제공
  - AND: 점수 기준 명확히 표시 (기술 80, 시장 90, 참신성 75 등)

#### 5.3.4 AI 에이전트 설계

**Agent 1: ProblemIdentifierAgent**
- **역할**: AI의 현재 한계점 파악
- **데이터 소스**:
  - Arxiv "Limitations" 섹션 분석
  - Reddit r/MachineLearning "What AI Can't Do" 토론
  - Industry Report (Gartner, a16z 등)
- **Output**: 주요 AI 한계점 Top 10 리스트

**Agent 2: IdeaGeneratorAgent**
- **역할**: AI 한계 + 타 학문 솔루션 매칭
- **로직**:
  - 한계점 키워드 추출 (ex: "long-term memory")
  - 학문별 관련 원리 검색 (ex: 뇌과학 - Hippocampus)
  - 융합 아이디어 생성 (LLM)
- **Output**: 융합 아이디어 10개 (Problem + Solution)

**Agent 3: FeasibilityCheckerAgent**
- **역할**: 기술적/시장적 실현 가능성 평가
- **로직**:
  - 기술 성숙도: 필요 기술이 오픈소스로 존재? (GitHub, Arxiv)
  - 시장 크기: Google Trends, CB Insights 데이터 분석
- **Output**: 실현 가능성 점수 (0-100) + 근거

**Agent 4: RoadmapBuilderAgent (문제해결사)**
- **역할**: Technical Roadmap + Market Feasibility 작성
- **로직**:
  - Phase별 소요 시간 추정 (유사 프로젝트 참조)
  - 기술 스택 추천 (인기도 + 학습 곡선 고려)
  - 시장 분석 (TAM, 경쟁사)
- **Output**: 완성된 Roadmap + Market Report

#### 5.3.5 UI/UX 요구사항

**레이아웃**
- 홈 화면 하단에 "오늘의 융합 아이디어" 배너
- 클릭 시 전용 페이지 이동
- 섹션 구성:
  1. 헤더: "AI x [학문]" 키워드
  2. Problem: AI 한계점
  3. Solution: 융합 아이디어
  4. Roadmap: 단계별 계획 (접이식 아코디언)
  5. Market: 시장성 분석 (차트/그래프)

**인터랙션**
- "이 아이디어로 프로젝트 시작하기" 버튼 → Notion/GitHub 템플릿 자동 생성
- "아이디어 저장" → 사용자 대시보드에 북마크
- 공유하기 → Twitter/LinkedIn 카드 자동 생성

---

## 6. 사용자 여정 및 경험

### 6.1 신규 사용자 온보딩 (First-time User Experience)

**Step 1: 랜딩 페이지**
- 헤드라인: "AI 시대, 5분으로 세상을 읽는 법"
- 서브 카피: "매일 아침, AI 뉴스 + 학문 융합 아이디어를 받아보세요"
- CTA: "무료로 시작하기" (이메일 입력 또는 소셜 로그인)

**Step 2: 관심사 선택 (Optional)**
- "어떤 카테고리에 관심이 있나요?" (복수 선택)
  - 모델 & 아키텍처 / 에이전트 / 오픈소스 / Physical AI / 정책
- "어떤 학문을 더 알고 싶나요?" (복수 선택)
  - 수학 / 물리 / 화학 / 경제 / 심리 / 철학 등
- Skip 가능 (나중에 설정에서 변경 가능)

**Step 3: 첫 콘텐츠 노출**
- 오늘의 AI 뉴스 Top 3 즉시 표시
- 툴팁: "매일 아침 6시에 새로운 뉴스가 업데이트돼요"
- "더 많은 뉴스 보기" 버튼

**Step 4: 핵심 기능 안내 (Guided Tour)**
- 1) AI Trend Navigator 소개 (5초)
- 2) Academic Snaps 소개 (5초)
- 3) Synergy Lab 소개 (5초)
- Skip 가능

### 6.2 일일 사용 시나리오 (Daily Active User Journey)

**아침 (출근길 지하철, 7:00-7:30)**
1. 푸시 알림: "오늘의 AI 뉴스가 도착했어요"
2. 앱 실행 → 홈 화면
3. AI Trend Navigator 숏폼 5개 읽기 (2분)
4. 관심 있는 뉴스 1개 클릭 → 롱폼 + How-to 읽기 (3분)
5. 좋아요 클릭 (개인화 학습)

**점심 (휴식 시간, 12:30-13:00)**
1. Academic Snaps 3개 읽기 (3분)
2. 재미있는 잡지식 북마크
3. "더 알아보기" 링크로 Wikipedia 이동 (5분)

**저녁 (퇴근 후 집, 20:00-21:00)**
1. Synergy Lab 확인
2. 오늘의 융합 아이디어 정독 (10분)
3. Technical Roadmap 확인 → "이건 내가 해볼 만한데?"
4. "프로젝트 시작하기" 클릭 → GitHub Repository 템플릿 복사
5. 주말에 시도해볼 사이드 프로젝트 아이디어로 저장

**주말**
- 일주일 동안 놓친 뉴스 다시 읽기 (아카이브)
- 북마크한 Academic Snaps 복습
- Synergy Lab 아이디어 중 하나 실제 프로토타입 개발 시작

### 6.3 Power User 여정 (Advanced User)

**목표**: 큐레이션 품질 향상 기여 + 커뮤니티 리더
1. 매일 뉴스에 좋아요/싫어요 피드백 제공
2. "이 뉴스가 빠졌어요" 제보 기능 활용
3. Synergy Lab 아이디어를 실제로 구현 후 성과 공유
4. 커뮤니티 포럼에서 다른 사용자와 아이디어 토론

---

## 7. 기술 아키텍처

### 7.1 시스템 아키텍처 다이어그램 (설명)

```
[사용자 디바이스]
    ↓ HTTPS
[Vercel (Next.js Frontend)]
    ↓ REST API
[Firebase (Backend)]
    - Authentication
    - Firestore (Database)
    - Cloud Functions (optional)
    ↑ Data Write
[GitHub Actions (Scheduler)]
    → Python Scripts (collect_news.py, generate_daily.py)
        ↓ LangGraph Multi-Agent
    [Gemini 2.5 Flash API] (Summarization)
    [Tavily Search API] (News Collection)
    [Reddit/GitHub API] (Data Sources)
    ↓ Write to Firestore
[Firebase Firestore]
```

### 7.2 기술 스택

**Frontend**
- Framework: Next.js 14 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS + shadcn/ui
- State Management: React Context (필요 시 Zustand)
- UI Icons: Lucide React
- Hosting: Vercel
- Analytics: Vercel Analytics (무료)

**Backend**
- Database: Firebase Firestore (NoSQL)
- Authentication: Firebase Auth (Google, Email)
- File Storage: Firebase Storage (optional, 이미지 업로드)
- Serverless: Firebase Cloud Functions (optional, 알림)

**AI & Automation**
- Orchestration: LangGraph (Multi-Agent Workflow)
- LLM: Google Gemini 2.5 Flash (요약, 생성)
- Search: Tavily Search API (뉴스 수집)
- Embedding: Gemini Embedding (유사도 계산)
- Cron Scheduler: GitHub Actions (매일 오전 6시 실행)
- Language: Python 3.11

**Data Sources**
- Reddit API (r/MachineLearning, r/LocalLLaMA)
- GitHub API (Trending Repositories)
- Arxiv API (최신 논문)
- RSS Feeds (주요 AI 블로그)

### 7.3 데이터 모델 (Firestore Collections)

**Collection: users**
```json
{
  "uid": "firebase_user_id",
  "email": "user@example.com",
  "displayName": "김테크",
  "preferences": {
    "newsCategories": ["models", "agents", "opensource"],
    "academicFields": ["physics", "economics"]
  },
  "createdAt": "2026-02-12T00:00:00Z",
  "lastLoginAt": "2026-02-12T09:00:00Z"
}
```

**Collection: daily_news**
```json
{
  "date": "2026-02-12",
  "articles": [
    {
      "id": "article_001",
      "category": "models",
      "title": "Llama 4 Turbo 발표",
      "summary": "Meta가 Llama 4 Turbo를 공개...",
      "howToGuide": "Llama 4 Turbo 사용법: pip install llama-4-turbo...",
      "url": "https://example.com/llama-4",
      "source": "Meta AI Blog",
      "publishedAt": "2026-02-12T06:00:00Z",
      "importance": 95,
      "type": "longform"
    }
  ],
  "daily_overview": "오늘은 Meta의 Llama 4 발표가 가장 큰 이슈...",
  "highlight": {
    "title": "오늘의 핵심 뉴스",
    "articleId": "article_001"
  },
  "themes": ["LLM", "Open Source", "Meta"],
  "count": 20,
  "updatedAt": "2026-02-12T06:30:00Z"
}
```

**Collection: academic_snaps**
```json
{
  "date": "2026-02-12",
  "snaps": [
    {
      "id": "snap_001",
      "field": "physics",
      "title": "양자 얽힘의 비밀",
      "content": "양자 얽힘은...",
      "aiRelevance": "양자 컴퓨팅이 AI 가속에 활용될 수 있어요",
      "readTime": 60,
      "learnMoreUrl": "https://wikipedia.org/quantum_entanglement"
    }
  ],
  "count": 5,
  "updatedAt": "2026-02-12T06:30:00Z"
}
```

**Collection: synergy_ideas**
```json
{
  "date": "2026-02-12",
  "keyword": "AI x 뇌과학",
  "problem": "GPT-4는 장기 기억을 유지하지 못함",
  "solution": "Hippocampus 메커니즘을 모방한 Memory Layer 추가",
  "technicalRoadmap": {
    "phase1": { "duration": "2-4주", "tasks": ["논문 조사", "코드 분석"] },
    "phase2": { "duration": "4-8주", "tasks": ["MVP 개발"] },
    "phase3": { "duration": "4-8주", "tasks": ["테스트"] }
  },
  "techStack": ["LLaMA 3.1", "LangGraph", "Pinecone"],
  "marketAnalysis": {
    "tam": "$5B",
    "competitors": ["MemGPT", "LangChain Memory"],
    "differentiation": "생물학적 메커니즘 완전 재현"
  },
  "feasibilityScore": 85,
  "updatedAt": "2026-02-12T06:30:00Z"
}
```

**Collection: user_feedback**
```json
{
  "userId": "firebase_user_id",
  "articleId": "article_001",
  "feedback": 1,  // 1: 좋아요, -1: 싫어요
  "timestamp": "2026-02-12T09:15:00Z"
}
```

### 7.4 성능 요구사항

**응답 시간**
- 홈 페이지 초기 로딩: < 2초 (Lighthouse Performance > 90)
- API 응답 시간: < 500ms (P95)
- 뉴스 수집 파이프라인: < 10분 (100-200개 수집 → 20개 선정)

**확장성**
- 동시 접속자: 1,000명 (Phase 1), 10,000명 (Phase 2)
- Firestore 읽기: 50,000 reads/day (무료 티어 한도)
- Gemini API: 1,500 requests/day (무료 티어)

**가용성**
- Uptime: > 99.5% (Vercel SLA)
- 데이터 백업: Firestore 자동 백업 (일일)

### 7.5 보안 요구사항

**인증 및 권한**
- Firebase Auth 사용 (Google OAuth, Email/Password)
- Firestore Security Rules:
  - 사용자는 본인 데이터만 읽기/쓰기 가능
  - 뉴스/학문 스낵은 모든 인증된 사용자 읽기 가능

**API 키 관리**
- Gemini, Tavily, Reddit API 키는 GitHub Secrets에 저장
- Frontend에서는 절대 노출 금지 (Backend/Scripts만 사용)

**데이터 프라이버시**
- 사용자 피드백 데이터는 익명화 후 학습에 활용
- GDPR 준수: 사용자 요청 시 데이터 삭제 가능

---

## 8. 성공 지표 (KPI)

### 8.1 북극성 지표 (North Star Metric)
**Weekly Active Users (WAU)**
- 정의: 7일 동안 1회 이상 앱에 접속한 사용자 수
- 목표:
  - Phase 1 (3개월): WAU 2,000명
  - Phase 2 (6개월): WAU 20,000명
  - Phase 3 (12개월): WAU 50,000명

### 8.2 핵심 지표 (Core Metrics)

**사용자 획득 (Acquisition)**
- 신규 가입자 수: 월 1,000명 (Phase 1) → 10,000명 (Phase 2)
- 가입 전환율: 랜딩 페이지 방문자의 15% 이상
- 추천 유입률: 전체 가입자의 20% (바이럴 계수 > 1.2)

**활성화 (Activation)**
- 첫 방문 시 뉴스 3개 이상 읽기: 70% 이상
- 온보딩 완료율: 60% 이상
- 첫 날 Academic Snaps 1개 이상 읽기: 50% 이상

**참여도 (Engagement)**
- 일평균 세션 시간: 5분 이상
- 세션당 읽은 콘텐츠 수: 평균 8개 (뉴스 5 + 스낵 3)
- 좋아요/싫어요 피드백 제공 비율: 30% 이상
- 북마크 사용률: 20% 이상

**리텐션 (Retention)**
- D1 (Day 1 Retention): > 50%
- D7 (Day 7 Retention): > 40%
- D30 (Day 30 Retention): > 25%
- 주간 리텐션 커브: 6주 후 20% 유지

**수익화 (Revenue) - Phase 3**
- 프리미엄 구독 전환율: 5% (MAU 기준)
- ARPU (Average Revenue Per User): $3/월
- LTV (Lifetime Value): $50 (12개월 기준)
- CAC (Customer Acquisition Cost): < $10

### 8.3 콘텐츠 품질 지표

**AI Trend Navigator**
- 뉴스 정확도: 95% 이상 (사실 오류 < 5%)
- How-to Guide 실행 성공률: 80% 이상 (사용자 피드백)
- 중복 뉴스 비율: < 5%

**Academic Snaps**
- 가독성 점수 (Flesch Reading Ease): > 60
- 사용자 "유익함" 평가: 4.0/5.0 이상
- AI 연관성 명확도: 90% 이상 (사용자 설문)

**Synergy Lab**
- 아이디어 실현 가능성 점수: 평균 75/100 이상
- 사용자 "시도해보고 싶다" 비율: 30% 이상
- 실제 프로젝트 시작률: 10% 이상

### 8.4 기술 성능 지표

**시스템 안정성**
- API Uptime: > 99.5%
- 에러율: < 0.5%
- 뉴스 수집 성공률: > 95% (매일 실행)

**성능**
- 홈 페이지 LCP (Largest Contentful Paint): < 2.5초
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

---

## 9. 경쟁 분석

### 9.1 직접 경쟁사

**1) TLDR (tldr.tech)**
- **강점**:
  - 일일 뉴스레터로 10만+ 구독자 확보
  - AI, 테크, 스타트업 등 다양한 카테고리
  - 간결한 요약 (3줄 요약)
- **약점**:
  - 뉴스만 제공, 학문 융합 없음
  - How-to Guide 부재
  - 이메일 기반으로 인터랙티브 기능 제한
- **차별화**: Ailon은 뉴스 + 학문 + 아이디어를 하나의 앱에서 제공

**2) The Batch (deeplearning.ai)**
- **강점**:
  - Andrew Ng의 브랜드 파워
  - 주간 뉴스레터로 50만+ 구독자
  - 교육 콘텐츠 연계 (Coursera)
- **약점**:
  - 주 1회 발행 (매일 업데이트 X)
  - 기술 중심, 타 학문 융합 없음
  - 읽기 전용 (피드백 기능 X)
- **차별화**: Ailon은 매일 업데이트 + 개인화 + 융합 아이디어

**3) Papers with Code (paperswithcode.com)**
- **강점**:
  - 최신 AI 논문 + 코드 연계
  - 벤치마크 리더보드 제공
  - 개발자에게 높은 신뢰도
- **약점**:
  - 논문 중심으로 진입장벽 높음
  - 뉴스/실무 적용 가이드 부족
  - UI 복잡, 초보자 비친화적
- **차별화**: Ailon은 쉬운 요약 + 실무 가이드 + 비전공자 대상 콘텐츠

### 9.2 간접 경쟁사

**1) Feedly (RSS 리더)**
- 사용자가 직접 소스 선택 → 큐레이션 부담
- Ailon은 자동 큐레이션으로 시간 절약

**2) Reddit r/MachineLearning**
- 방대한 정보량, 하지만 노이즈 많음
- Ailon은 신뢰도 높은 정보만 선별

**3) ChatGPT / Perplexity (AI 검색)**
- 사용자가 질문해야 답변
- Ailon은 Push 방식으로 자동 제공

### 9.3 경쟁 우위 (Competitive Advantages)

**1) AI 에이전트 자동화**
- 경쟁사는 사람이 직접 큐레이션 → 인건비 높음
- Ailon은 LangGraph 에이전트로 자동화 → 확장 가능

**2) 학제간 융합**
- 경쟁사는 AI만 다룸
- Ailon은 AI + 물리/경제/철학 등 융합 → 창의성 증진

**3) 실행 가능성**
- 경쟁사는 정보 전달에 그침
- Ailon은 How-to + Technical Roadmap 제공 → 즉시 적용 가능

**4) 완전 무료 시작**
- 경쟁사는 프리미엄 기능 제한
- Ailon은 핵심 기능 무료 제공 → 진입장벽 낮음

---

## 10. 비즈니스 모델 및 수익화 전략

### 10.1 수익화 전략 (Phase별)

**Phase 1 (MVP - 3개월): 완전 무료**
- 목표: 사용자 확보 및 제품 검증
- 수익: $0 (비용도 $0 - 무료 티어 활용)
- 전략: 품질에 집중, 입소문 마케팅

**Phase 2 (Growth - 6개월): 프리미엄 구독 출시**
- 목표: 첫 수익 창출 및 지속 가능성 검증
- 수익 목표: 월 $10,000 (1,000명 구독자 x $10/월)
- 전략: 핵심은 무료, 고급 기능은 유료

**Phase 3 (Scale - 12개월): B2B 확장**
- 목표: 기업 고객 확보
- 수익 목표: 월 $100,000 (B2C $30K + B2B $70K)
- 전략: 기업 교육/연구팀 대상 단체 구독

### 10.2 프리미엄 구독 (Ailon Pro)

**가격**
- 월 구독: $10/월
- 연 구독: $99/년 (17% 할인)
- 학생 할인: $5/월 (학생증 인증)

**무료 vs 프리미엄 기능 비교**

| 기능 | 무료 | 프리미엄 |
|------|------|----------|
| AI Trend Navigator (숏폼 5개) | ✅ | ✅ |
| AI Trend Navigator (롱폼 15개) | ✅ | ✅ + 아카이브 무제한 |
| Academic Snaps (3개/일) | ✅ | ✅ + 5개/일 |
| Synergy Lab (1개/일) | ✅ | ✅ + 3개/일 |
| 광고 제거 | ❌ | ✅ |
| 개인화 큐레이션 | 기본 | 고급 (AI 추천) |
| 북마크 | 최대 10개 | 무제한 |
| 아이디어 템플릿 다운로드 | ❌ | ✅ (Notion, GitHub) |
| 프리미엄 커뮤니티 | ❌ | ✅ (Discord) |
| 월간 트렌드 리포트 | ❌ | ✅ (PDF) |

**프리미엄 전환 유도 전략**
- 무료 사용자가 북마크 10개 한도 도달 시 "프리미엄으로 업그레이드하세요" 배너
- 아카이브 기능 체험 (최근 7일만 무료, 이전은 프리미엄)
- 월간 트렌드 리포트 샘플 제공 (첫 달 무료)

### 10.3 B2B 수익 모델

**1) 기업 단체 구독**
- 대상: 스타트업, AI 연구팀, 기업 교육팀
- 가격: $500/월 (10-50명) / $1,500/월 (51-200명)
- 제공:
  - 전 직원 프리미엄 계정
  - 사내 전용 뉴스레터 (회사 관심사 맞춤)
  - 월간 워크숍 (Synergy Lab 아이디어 기반)

**2) API 라이선스**
- 대상: AI 뉴스 데이터를 필요로 하는 기업/미디어
- 가격: $1,000/월 (API 호출 10만 회)
- 제공:
  - 일일 뉴스 JSON 데이터
  - 카테고리별 필터링
  - Webhook 알림

**3) 스폰서십 콘텐츠**
- 대상: AI 툴/플랫폼 제공 기업 (OpenAI, Anthropic, Vercel 등)
- 가격: $5,000/월 (주 1회 스폰서 뉴스 포함)
- 조건: 명확한 "Sponsored" 표시, 품질 유지

### 10.4 비용 구조 (Cost Structure)

**Phase 1 (무료 티어 활용)**
- Vercel: $0 (Hobby Plan)
- Firebase: $0 (Spark Plan, 50K reads/day)
- Gemini API: $0 (1,500 requests/day)
- Tavily Search: $0 (1,000 searches/month)
- GitHub Actions: $0 (Public Repo)
- **총 비용: $0/월**

**Phase 2 (DAU 5,000명)**
- Vercel: $20/월 (Pro Plan)
- Firebase: $50/월 (Blaze Plan, 초과 사용량)
- Gemini API: $100/월 (초과 사용량)
- Tavily Search: $50/월
- **총 비용: $220/월**
- **수익: $10,000/월 → 마진: 98%**

**Phase 3 (DAU 50,000명)**
- Vercel: $200/월
- Firebase: $500/월
- Gemini API: $1,000/월
- Tavily Search: $200/월
- 개발자 인건비: $10,000/월 (2명)
- **총 비용: $11,900/월**
- **수익: $100,000/월 → 마진: 88%**

---

## 11. 개발 로드맵 및 마일스톤

### 11.1 Phase 1: MVP (Month 1-3)

**Month 1: 핵심 인프라 구축**
- Week 1-2:
  - Firebase 프로젝트 설정 (Auth, Firestore)
  - Next.js 프론트엔드 초기 구조
  - GitHub Actions 워크플로우 설정
- Week 3-4:
  - AI Trend Navigator 에이전트 팀 구현 (CollectorAgent, AnalyzerAgent)
  - 뉴스 수집 파이프라인 테스트 (일일 100개 수집)
- **Milestone 1**: 첫 뉴스 자동 수집 성공 (2월 말)

**Month 2: 기능 완성**
- Week 1-2:
  - CuratorAgent, SummarizerAgent 구현
  - 숏폼/롱폼 큐레이션 로직 완성
  - How-to Guide 자동 생성 프롬프트 최적화
- Week 3-4:
  - Academic Snaps 에이전트 팀 구현
  - UI 디자인 완성 (Tailwind + shadcn/ui)
  - 반응형 웹 구현 (모바일 최적화)
- **Milestone 2**: MVP 전체 기능 완성 (3월 말)

**Month 3: 테스트 및 런칭**
- Week 1-2:
  - 베타 테스터 50명 모집 (지인, 커뮤니티)
  - 버그 수정 및 UX 개선
  - 콘텐츠 품질 검증 (사람이 직접 확인)
- Week 3-4:
  - Public Launch (Product Hunt, Reddit, Twitter)
  - 초기 마케팅 (AI 커뮤니티 중심)
- **Milestone 3**: DAU 500명 달성 (4월 말)

**성공 기준 (Phase 1)**
- ✅ DAU 500명
- ✅ D7 Retention > 40%
- ✅ 일일 뉴스 수집 성공률 > 95%
- ✅ 사용자 "유익함" 평가 > 4.0/5.0

### 11.2 Phase 2: Growth (Month 4-9)

**Month 4-5: 개인화 기능**
- 사용자 피드백 수집 (좋아요/싫어요)
- 개인화 추천 알고리즘 구현
- 북마크 및 아카이브 기능
- **Milestone 4**: 개인화 기능 출시 (5월 말)

**Month 6-7: Synergy Lab 고도화**
- 멀티 에이전트 점수 매기기 구현
- Technical Roadmap 자동 생성 개선
- 아이디어 템플릿 다운로드 (Notion, GitHub)
- **Milestone 5**: Synergy Lab 2.0 출시 (7월 말)

**Month 8-9: 커뮤니티 및 수익화**
- 프리미엄 구독 기능 출시
- Discord 커뮤니티 오픈
- 사용자 간 아이디어 공유 기능
- **Milestone 6**: 첫 유료 구독자 100명 (9월 말)

**성공 기준 (Phase 2)**
- ✅ DAU 5,000명
- ✅ D30 Retention > 25%
- ✅ 프리미엄 전환율 > 2%
- ✅ 월 수익 $10,000

### 11.3 Phase 3: Scale (Month 10-12)

**Month 10-11: B2B 확장**
- 기업 단체 구독 기능
- API 라이선스 출시
- 월간 트렌드 리포트 자동 생성
- **Milestone 7**: 첫 B2B 고객 확보 (11월 말)

**Month 12: 글로벌 확장**
- 영어 버전 출시 (번역 자동화)
- 해외 마케팅 (Product Hunt Global, HackerNews)
- **Milestone 8**: DAU 10,000명 + 월 $100,000 수익 (12월 말)

**성공 기준 (Phase 3)**
- ✅ DAU 10,000명
- ✅ 프리미엄 구독자 500명
- ✅ B2B 고객 5개 기업
- ✅ 월 수익 $100,000

### 11.4 개발 리소스 (Team)

**Phase 1 (MVP)**
- 1명 풀타임 개발자 (Full-stack + AI)
- 파트타임 디자이너 (UI/UX)

**Phase 2 (Growth)**
- 2명 풀타임 개발자 (Frontend 1 + Backend/AI 1)
- 파트타임 마케터

**Phase 3 (Scale)**
- 4명 풀타임 (Frontend 1 + Backend 1 + AI 1 + PM/마케팅 1)
- 파트타임 콘텐츠 검수자

---

## 12. 리스크 및 완화 전략

### 12.1 기술적 리스크

**Risk 1: AI 요약 품질 저하**
- 설명: Gemini API가 잘못된 요약 생성 (사실 왜곡, 환각)
- 영향: 사용자 신뢰 하락, 이탈
- 확률: Medium
- 완화 전략:
  - QualityReviewerAgent로 사실 검증 (Wikipedia 교차 확인)
  - 사용자 "오류 신고" 기능 제공
  - 주간 사람 검수 (초기에는 전체, 이후 샘플링)

**Risk 2: API 비용 초과**
- 설명: DAU 급증 시 Gemini/Tavily API 비용 폭증
- 영향: 운영 적자
- 확률: Medium
- 완화 전략:
  - 무료 티어 한도 모니터링 (알림 설정)
  - 캐싱 전략 (동일 뉴스 중복 요약 방지)
  - 필요 시 Groq API (무료) 또는 로컬 LLM 전환

**Risk 3: 뉴스 수집 실패**
- 설명: Reddit/GitHub API 장애 또는 Rate Limit
- 영향: 당일 뉴스 업데이트 누락
- 확률: Low
- 완화 전략:
  - 다중 소스 활용 (하나 실패해도 다른 소스에서 수집)
  - 실패 시 이전 날 데이터 재활용 + 사용자 공지
  - Slack 알림으로 즉시 인지

### 12.2 시장 리스크

**Risk 4: 경쟁사 모방**
- 설명: TLDR, The Batch 등이 유사 기능 추가
- 영향: 차별화 약화, 성장 둔화
- 확률: High
- 완화 전략:
  - 핵심 차별화 (학제간 융합)에 집중
  - 커뮤니티 네트워크 효과 강화 (먼저 자리잡기)
  - 빠른 기능 업데이트로 선도 유지

**Risk 5: 사용자 획득 실패**
- 설명: 마케팅 부족으로 초기 사용자 확보 실패
- 영향: Phase 1 목표 미달 (DAU 500명)
- 확률: Medium
- 완화 전략:
  - Product Hunt 런칭 (강력한 첫인상)
  - AI 커뮤니티 직접 참여 (Reddit, Discord)
  - 추천 프로그램 (친구 초대 시 프리미엄 1개월 무료)

### 12.3 운영 리스크

**Risk 6: 콘텐츠 저작권 문제**
- 설명: 뉴스 요약이 원본 저작권 침해로 간주
- 영향: 법적 분쟁, 서비스 중단
- 확률: Low
- 완화 전략:
  - Fair Use 원칙 준수 (짧은 요약 + 출처 명시)
  - 원문 링크 반드시 제공 (트래픽 기여)
  - 문제 발생 시 즉시 삭제 정책

**Risk 7: 핵심 개발자 이탈**
- 설명: 1인 또는 소수 개발팀에서 이탈 발생
- 영향: 개발 중단, 서비스 장애
- 확률: Medium
- 완화 전략:
  - 코드 문서화 철저 (주석, README)
  - GitHub에 모든 코드 백업
  - 초기부터 협업 문화 구축 (페어 프로그래밍)

### 12.4 제품 리스크

**Risk 8: 사용자 이탈 (낮은 리텐션)**
- 설명: 초기 호기심으로 가입 후 이탈
- 영향: Phase 1 성공 기준 미달 (D7 < 40%)
- 확률: High
- 완화 전략:
  - 온보딩 최적화 (첫 경험 중요)
  - 푸시 알림 (매일 아침 뉴스 알림)
  - 게이미피케이션 (연속 방문 스트릭 배지)

**Risk 9: 콘텐츠 피로도**
- 설명: 매일 비슷한 패턴으로 사용자 지루함
- 영향: 장기 리텐션 하락
- 확률: Medium
- 완화 전략:
  - 콘텐츠 다양성 확보 (주간 특집, 인터뷰 등)
  - 사용자 생성 콘텐츠 (커뮤니티 아이디어 공유)
  - A/B 테스트로 최적 형식 탐색

---

## 13. 성장 전략

### 13.1 초기 사용자 획득 (0 → 500 DAU)

**전략 1: Product Hunt 런칭**
- 시기: Phase 1 완성 직후 (Month 3)
- 목표: #1 Product of the Day
- 준비:
  - 매력적인 썸네일 (Demo GIF)
  - 명확한 헤드라인: "AI 시대의 5분 뉴스레터 + 학습 동반자"
  - 초기 Upvote 확보 (지인, 베타 테스터)
- 기대 효과: 500-1,000명 첫날 유입

**전략 2: AI 커뮤니티 직접 참여**
- 타겟 커뮤니티:
  - Reddit: r/MachineLearning, r/LocalLLaMA, r/learnmachinelearning
  - Discord: LangChain, Hugging Face, OpenAI
  - Twitter/X: AI 인플루언서 멘션
- 방법:
  - "유용한 도구 발견" 형태로 공유 (광고 아님)
  - 직접 가치 제공 (무료 샘플 콘텐츠)
- 기대 효과: 커뮤니티당 50-100명 유입

**전략 3: SEO 및 콘텐츠 마케팅**
- 블로그 작성:
  - "2026년 AI 뉴스레터 Top 10"
  - "LangGraph 멀티 에이전트로 자동 큐레이션 만들기"
- 검색 키워드:
  - "AI 뉴스", "AI 학습 사이트", "AI 트렌드"
- 기대 효과: 월 100-200명 오가닉 유입

### 13.2 바이럴 성장 (500 → 5,000 DAU)

**전략 4: 추천 프로그램 (Referral)**
- 메커니즘:
  - 친구 초대 시 양쪽에 프리미엄 1개월 무료
  - 초대 링크 공유 (Twitter, LinkedIn)
- 목표 바이럴 계수 (K-factor): 1.2 (20% 추가 유입)
- 기대 효과: 월 50% 성장률

**전략 5: 소셜 미디어 콘텐츠**
- 형태:
  - 오늘의 핵심 뉴스를 이미지 카드로 제작
  - "Did you know?" 형식의 Academic Snaps 공유
- 플랫폼: Twitter/X, LinkedIn, Instagram
- 빈도: 주 3회
- 기대 효과: 주 50-100명 유입

**전략 6: 파트너십**
- 대상:
  - AI 유튜버/블로거 (리뷰 콘텐츠)
  - AI 교육 플랫폼 (패스트캠퍼스, 인프런)
- 제공: 프리미엄 무료 제공 + 제휴 할인 코드
- 기대 효과: 파트너당 200-500명 유입

### 13.3 확장 및 글로벌화 (5,000 → 50,000 DAU)

**전략 7: 영어 버전 출시**
- 시장: 미국, 유럽, 동남아
- 현지화:
  - 뉴스 소스 추가 (TechCrunch, VentureBeat 등)
  - UI 번역 (자동 + 원어민 검수)
- 기대 효과: TAM 10배 증가

**전략 8: B2B 영업**
- 대상: AI 스타트업, 대기업 AI 연구팀
- 접근:
  - LinkedIn Sales Navigator로 의사결정자 타겟팅
  - 무료 체험 (팀 전체 1개월)
- 기대 효과: 기업당 평균 20명 → 월 5개 기업 = 100명

**전략 9: PR 및 미디어 노출**
- 목표 매체: TechCrunch, The Verge, 한국경제
- 앵글: "AI 에이전트가 만드는 일일 뉴스레터"
- 기대 효과: 주요 매체 1회 노출 시 1,000-5,000명 유입

### 13.4 리텐션 최적화

**전략 10: 푸시 알림 최적화**
- 타이밍: 매일 아침 7시 (출근 시간대)
- 메시지: "오늘의 AI 뉴스 3가지 - Llama 4 발표!"
- A/B 테스트: 시간대, 메시지 톤 실험

**전략 11: 게이미피케이션**
- 연속 방문 스트릭: 7일 연속 → 배지 획득
- 레벨 시스템: 누적 읽은 뉴스 100개 → "AI Enthusiast"
- 리더보드: 주간 가장 많이 피드백 제공한 사용자

**전략 12: 커뮤니티 강화**
- Discord 채널 운영:
  - #daily-news: 뉴스 토론
  - #idea-showcase: Synergy Lab 아이디어 실행 성과 공유
- 월간 밋업 (온라인): 인기 아이디어 발표 및 Q&A

---

## 14. 부록

### 14.1 용어 정의

- **DAU (Daily Active Users)**: 하루 동안 1회 이상 접속한 순수 사용자 수
- **WAU (Weekly Active Users)**: 7일 동안 1회 이상 접속한 순수 사용자 수
- **MAU (Monthly Active Users)**: 30일 동안 1회 이상 접속한 순수 사용자 수
- **Retention (리텐션)**: 특정 기간 후에도 재방문하는 사용자 비율
- **LTV (Lifetime Value)**: 사용자 1명이 생애 동안 창출하는 평균 수익
- **CAC (Customer Acquisition Cost)**: 사용자 1명을 확보하는 데 드는 평균 비용
- **North Star Metric**: 제품 성공을 나타내는 가장 중요한 단일 지표
- **LangGraph**: LangChain 기반 멀티 에이전트 워크플로우 프레임워크
- **Gemini 2.5 Flash**: Google의 고속 LLM (요약, 생성 작업에 최적)

### 14.2 참고 자료

**AI 에이전트 프레임워크**
- LangGraph 문서: https://langchain-ai.github.io/langgraph/
- LangChain 가이드: https://python.langchain.com/docs/

**데이터 소스**
- Reddit API: https://www.reddit.com/dev/api/
- GitHub API: https://docs.github.com/en/rest
- Tavily Search: https://tavily.com/

**기술 스택**
- Next.js 14: https://nextjs.org/
- Firebase: https://firebase.google.com/
- Tailwind CSS: https://tailwindcss.com/
- shadcn/ui: https://ui.shadcn.com/

### 14.3 오픈 이슈 (Open Questions)

**기술 관련**
1. Gemini API 무료 티어 한도 초과 시 Groq 전환? vs 유료 플랜?
   - 결정 기한: Phase 1 종료 전
   - 담당자: Tech Lead

2. 모바일 앱 개발 필요성?
   - PWA로 충분? vs 네이티브 앱 필요?
   - 결정 기한: Phase 2 시작 전
   - 담당자: PM + UX Designer

**비즈니스 관련**
3. 프리미엄 가격 $10/월이 적정한가?
   - A/B 테스트: $5, $10, $15 비교
   - 결정 기한: Phase 2 Month 1
   - 담당자: PM + Growth Lead

4. 스폰서십 콘텐츠 허용 여부?
   - 사용자 신뢰 vs 수익
   - 결정 기한: Phase 2 종료 전
   - 담당자: PM + 커뮤니티 매니저

### 14.4 승인 및 다음 단계

**승인 프로세스**
- [ ] PM 최종 리뷰
- [ ] Tech Lead 기술 검토
- [ ] 이해관계자 승인 (투자자, 공동 창업자 등)

**다음 단계**
1. 이 PRD 기반 상세 개발 계획 수립 (Epic, User Story)
2. 디자인 시스템 구축 (Figma)
3. Sprint 1 킥오프 (2주 스프린트)

---

## 부록: 전문 PM 관점 개선 제안

### 원본 기획서의 문제점 및 개선 사항

#### 1. 비어있던 "기획 의도" 섹션 완성
- **Feature 1 (AI Trend Navigator)**: 정보 과부하 해소, 시간 절약, 실행 지원
- **Feature 2 (Academic Snaps)**: 단편적 지식 극복, 창의성 증진, 학습 피로도 감소
- **Feature 3 (Synergy Lab)**: 실행 격차 해소, 창업 촉진, 차별화

#### 2. 추가된 필수 섹션
- **Executive Summary**: 투자자/이해관계자를 위한 1페이지 요약
- **문제 정의 및 기회**: 시장 Pain Point 구체화
- **제품 비전 및 목표**: 명확한 방향성 제시
- **타겟 페르소나**: 3개 페르소나 (학습자, 창업가, 탐구자) 상세 정의
- **사용자 여정**: 온보딩부터 일일 사용까지 시나리오화
- **성공 지표 (KPI)**: 북극성 지표 + 단계별 정량 목표
- **경쟁 분석**: 직접/간접 경쟁사 및 차별화 전략
- **비즈니스 모델**: 수익화 전략 (프리미엄, B2B, API)
- **개발 로드맵**: Phase별 마일스톤 및 리소스 계획
- **리스크 관리**: 기술/시장/운영 리스크 + 완화 전략
- **성장 전략**: 사용자 획득 및 바이럴 전략

#### 3. 기존 내용 개선
- **기능 요구사항**: "Must/Should/Nice-to-Have" 우선순위 명시
- **Acceptance Criteria**: Given-When-Then 형식으로 명확한 검증 기준 추가
- **AI 에이전트 설계**: 각 에이전트의 Tool, 로직, Output 구체화
- **UI/UX 요구사항**: 레이아웃, 인터랙션, 성능 기준 추가

#### 4. 대박 앱을 위한 전략적 제안

**핵심 차별화 포인트 강화**
1. **AI 에이전트 자동화**: 사람 큐레이션 대비 100배 저렴 → 확장성 확보
2. **학제간 융합**: 경쟁사가 쉽게 모방할 수 없는 고유 콘텐츠
3. **실행 가능성**: 정보 전달을 넘어 "바로 써먹는" 가이드 제공

**빠른 검증 및 피봇**
- Phase 1에서 핵심 가정 검증:
  - 사용자가 실제로 매일 방문하는가? (D7 > 40%)
  - How-to Guide가 정말 유용한가? (피드백 > 80%)
- 검증 실패 시 즉시 피봇 (예: 주간 뉴스레터로 전환)

**네트워크 효과 구축**
- 커뮤니티 기능 (Discord, 포럼)으로 사용자 간 상호작용 촉진
- 사용자 생성 콘텐츠 (Synergy Lab 아이디어 실행 성과 공유)
- 추천 프로그램으로 바이럴 계수 > 1.2 달성

**데이터 기반 의사결정**
- 모든 기능에 분석 코드 심기 (Google Analytics, Mixpanel)
- A/B 테스트 문화 (프리미엄 가격, 푸시 알림 시간 등)
- 주간 데이터 리뷰 (KPI 대시보드)

**브랜드 및 커뮤니티**
- "Ailon = AI 학습의 필수 도구" 포지셔닝
- Twitter/X에서 AI 인플루언서와 협업
- 월간 밋업/웨비나로 충성 사용자 육성

---

**다음 액션 아이템**
1. ✅ 완성된 PRD 검토 및 피드백 수렴
2. ⬜ 디자인 시스템 구축 (Figma 프로토타입)
3. ⬜ Sprint 1 계획 (AI Trend Navigator MVP)
4. ⬜ 베타 테스터 50명 모집 계획 수립
5. ⬜ Product Hunt 런칭 준비 (썸네일, 카피)

**이 PRD에 대한 질문이나 추가 설명이 필요한 부분이 있으면 언제든지 문의하세요.**
