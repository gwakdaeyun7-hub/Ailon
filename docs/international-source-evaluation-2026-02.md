# Ailon 외국 소스 RSS 피드 종합 평가 보고서
**작성일: 2026-02-23**

---

## 목차
1. [현재 소스 8개 정밀 평가](#part-1)
2. [신규 소스 추천 (검증 완료)](#part-2)
3. [최종 권장 사항 및 구현 가이드](#part-3)

---

<a id="part-1"></a>
## Part 1: 현재 소스 8개 정밀 평가

각 소스를 직접 RSS 피드 fetch, 웹 리서치, XML 구조 분석으로 검증했습니다.

---

### 1-1. Wired AI

| 항목 | 상태 |
|------|------|
| RSS URL | `https://www.wired.com/feed/tag/ai/latest/rss` |
| 활성 상태 | **활성** -- 2026년 2월 기준 정상 발행 |
| 발행 빈도 | 일 5~15개 (AI 태그 기준) |
| RSS 썸네일 | **media:thumbnail 포함** (직접 확인 불가하나 feedparser 커뮤니티 + 기존 코드에서 `media_thumbnail`로 확인됨) |
| 현재 코드 설정 | `rss_image_field: "media_thumbnail"` -- 올바르게 설정됨 |
| 콘텐츠 품질 | **우수** -- AI 정책, 문화, 기업 동향을 폭넓게 다룸. 에디토리얼 품질 높음 |
| 특이사항 | 없음. 안정적으로 동작 중 |

**판정: 유지 (변경 불필요)**

---

### 1-2. The Verge AI

| 항목 | 상태 |
|------|------|
| RSS URL | `https://www.theverge.com/rss/ai-artificial-intelligence/index.xml` |
| 활성 상태 | **활성** -- 일 30~50개 전체, AI 섹션 일 5~15개 |
| RSS 썸네일 | **content 내 `<img>` 태그** -- media:thumbnail/media:content는 없음. description/content:encoded 안에 HTML img가 포함됨 |
| 현재 코드 설정 | `rss_image_field: "content_image"` -- 올바르게 설정됨 |
| 콘텐츠 품질 | **우수** -- 빅테크 AI 동향, 정책, 제품 리뷰 강점 |
| 주의사항 | 2025년 WordPress 마이그레이션 이후 무료 피드는 excerpt만 제공 (full-text는 $7/월). 하지만 img 태그와 og:image 폴백으로 이미지 확보에 문제 없음 |

**판정: 유지 (변경 불필요)**

---

### 1-3. TechCrunch AI

| 항목 | 상태 |
|------|------|
| RSS URL | `https://techcrunch.com/category/artificial-intelligence/feed/` |
| 활성 상태 | **활성** -- 일 20~40개 전체, AI 카테고리 일 5~15개 |
| RSS 썸네일 | **과거에는 media:thumbnail + media:content 포함** (GitHub 아카이브에서 확인: `<media:thumbnail url="...?w=210&h=158&crop=1" />`와 `<media:content url="..." type="image/jpeg" medium="image">` 모두 존재). **현재 상태는 직접 fetch 차단으로 최종 확인 불가** |
| 현재 코드 설정 | `rss_image_field` 미설정 -- og:image 폴백에 의존 |
| 콘텐츠 품질 | **우수** -- AI 스타트업, 투자, 제품 출시에 강점. Full-text RSS 제공 |
| 개선 가능 | 과거 구조가 유지된다면 `rss_image_field: "media_thumbnail"` 추가하면 og:image 스크래핑 없이도 이미지 확보 가능. 확인 후 설정 권장 |

**판정: 유지. rss_image_field 설정 테스트 권장**

---

### 1-4. MIT Technology Review

| 항목 | 상태 |
|------|------|
| RSS URL | `https://www.technologyreview.com/topic/artificial-intelligence/feed` |
| 활성 상태 | **활성** -- 2026년 2월 19일 최신 기사 확인 |
| 발행 빈도 | 일 2~5개 (AI 토픽 기준, 전체는 더 많음) |
| RSS 썸네일 | **거의 없음** (직접 확인 완료). 3개 아이템 중 2개는 이미지 요소 전혀 없음. 1개만 content:encoded 내부에 `<img>` srcset 포함 (책 리뷰 기사의 표지 이미지). media:thumbnail, media:content, enclosure 모두 없음 |
| 현재 코드 설정 | `rss_image_field` 미설정 -- og:image 폴백에 완전 의존. **올바른 설정** |
| 콘텐츠 품질 | **최상** -- 연구 중심의 깊이 있는 AI 분석, 정책/윤리 커버리지. "Making AI Work" 뉴스레터 신설 |
| 특이사항 | RSS 이미지 지원은 최하이지만 콘텐츠 품질이 너무 높아서 이미지 부재를 감수할 가치가 충분함. og:image 폴백이 이를 보완 |

**판정: 유지 (변경 불필요)**

---

### 1-5. VentureBeat

| 항목 | 상태 |
|------|------|
| RSS URL (현재) | `https://venturebeat.com/feed/` (전체 피드) |
| AI 전용 피드 | `https://venturebeat.com/category/ai/feed/` (존재 확인됨) |
| 활성 상태 | **활성** -- 2026년 2월 기준 일간 활발히 발행 |
| RSS 썸네일 | **content 내 이미지 포함** (직접 확인 완료). Contentful CDN 이미지 (`images.ctfassets.net/...?w=300&q=30`). 모든 아이템에 이미지 URL 존재 |
| 현재 코드 설정 | `rss_image_field` 미설정 |
| 콘텐츠 품질 | **우수** -- 엔터프라이즈 AI, 개발 도구, 산업 동향 강점 |
| 개선 포인트 2가지 | (1) RSS URL을 AI 전용 피드로 변경하면 비AI 기사 수집/필터링 부담 대폭 감소. (2) `rss_image_field: "content_image"` 추가하면 RSS에서 직접 이미지 추출 가능 |

**판정: 유지, 2가지 개선 권장**
- RSS URL: `venturebeat.com/feed/` --> `venturebeat.com/category/ai/feed/`
- 이미지: `rss_image_field: "content_image"` 추가

---

### 1-6. Google DeepMind Blog

| 항목 | 상태 |
|------|------|
| RSS URL | `https://deepmind.google/blog/rss.xml` |
| 활성 상태 | **활성** -- 2026년 2월 Gemini 3.1 Pro 등 신규 포스트 확인 |
| 발행 빈도 | 주 1~3개 (불규칙, 발표 기반) |
| RSS 썸네일 | **media:thumbnail + media:content 모두 포함** (직접 확인 완료). Google CDN `lh3.googleusercontent.com` 경로, 528x297 사이즈. 모든 아이템에 이미지 존재 |
| 현재 코드 설정 | `rss_image_field: "media_thumbnail"` -- **완벽하게 올바른 설정** |
| 콘텐츠 품질 | **최상** -- Gemini, AlphaFold 등 최첨단 연구 발표. 업계 최대 임팩트 |

**판정: 유지 (완벽하게 작동 중, 변경 불필요)**

---

### 1-7. NVIDIA AI Blog

| 항목 | 상태 |
|------|------|
| RSS URL | `https://blogs.nvidia.com/feed/` |
| 활성 상태 | **활성** -- 2026년 2월에도 지속 발행 |
| 발행 빈도 | 주 5~10개 |
| RSS 썸네일 | **media:content + media:thumbnail 모두 포함** (직접 확인 완료). 원본 1280x680 + 썸네일 842x450 모두 제공. 모든 아이템에 이미지 존재 |
| 현재 코드 설정 | `rss_image_field` 미설정 |
| 콘텐츠 품질 | **좋음** -- AI 인프라, GPU, 기업 AI 활용 사례 중심. 다만 마케팅/홍보성 콘텐츠 비중 높음 (예: "GeForce NOW 4,500개 게임 지원" 같은 비AI 기사 혼재) |
| 개선 포인트 | `rss_image_field: "media_thumbnail"` 추가하면 og:image 스크래핑 불필요. 현재 LLM AI 필터가 비AI 기사를 제거하고 있으므로 실질적 문제 없음 |

**판정: 유지. `rss_image_field: "media_thumbnail"` 추가 권장**

---

### 1-8. Hugging Face Blog

| 항목 | 상태 |
|------|------|
| RSS URL | `https://huggingface.co/blog/feed.xml` |
| 활성 상태 | **활성** -- 2026년 2월 20일 최신 포스트 확인 ("GGML and llama.cpp join HF") |
| 발행 빈도 | 주 3~7개 |
| RSS 썸네일 | **이미지 요소 전혀 없음** (직접 확인 완료). RSS 아이템 구조가 극도로 최소: `<title>`, `<pubDate>`, `<link>`, `<guid>`만 존재. description/summary조차 없음. media:thumbnail, media:content, enclosure, content:encoded 모두 없음 |
| 현재 코드 설정 | `rss_image_field` 미설정 -- **올바름** (설정할 대상 자체가 없음) |
| 콘텐츠 품질 | **우수** -- 오픈소스 AI 커뮤니티 핵심. 모델 릴리즈, 기술 튜토리얼, 커뮤니티 뉴스 |
| 특이사항 | RSS 품질 자체는 현재 소스 중 **최하**. 제목과 링크만 제공되어 og:image 폴백에 100% 의존. 2025년 GitHub 이슈에서 `<link>` 태그 누락 문제도 보고됨. Hugging Face가 RSS를 우선순위로 관리하지 않는 것으로 보임 |

**판정: 유지 (콘텐츠 가치가 높으므로), 그러나 RSS 품질 리스크 인지 필요**

---

### 현재 소스 종합 요약

| # | 소스 | 활성 | RSS 이미지 방식 | 이미지 품질 | 콘텐츠 품질 | 변경 필요 |
|---|------|------|----------------|------------|------------|----------|
| 1 | Wired AI | O | media:thumbnail | 상 | 우수 | 없음 |
| 2 | The Verge AI | O | content img | 상 | 우수 | 없음 |
| 3 | TechCrunch AI | O | media:thumbnail (추정) | 중 (og:image 의존) | 우수 | 테스트 후 필드 추가 |
| 4 | MIT Tech Review | O | 거의 없음 | 하 (og:image 의존) | 최상 | 없음 |
| 5 | VentureBeat | O | content img | 상 | 우수 | URL + 필드 변경 |
| 6 | Google DeepMind | O | media:thumbnail + content | 최상 | 최상 | 없음 |
| 7 | NVIDIA AI | O | media:thumbnail + content | 최상 | 좋음 | 필드 추가 |
| 8 | Hugging Face | O | 전혀 없음 | 최하 (og:image 의존) | 우수 | 없음 |

**결론: 8개 소스 모두 활성 상태이며 제거 대상은 없습니다.** og:image 폴백 시스템(`enrich_and_scrape`)이 이미지 부재를 잘 보완하고 있습니다. 소규모 설정 개선으로 og:image 스크래핑 의존도를 줄일 수 있습니다.

---

<a id="part-2"></a>
## Part 2: 신규 소스 추천

200개 이상의 AI/테크 RSS 소스를 리서치한 후, 직접 RSS 피드를 fetch하여 XML 구조를 검증하고 아래 소스들을 선별했습니다. 선정 기준: (1) RSS 이미지 지원, (2) AI 콘텐츠 밀도, (3) 콘텐츠 품질, (4) 페이월 없음, (5) 기존 소스와의 차별성.

---

### 강력 추천 A: The Decoder

| 항목 | 내용 |
|------|------|
| 사이트 | https://the-decoder.com/ |
| RSS URL | `https://the-decoder.com/feed/` |
| 발행 빈도 | 일 5~10개 |
| 페이월 | 없음 (완전 무료) |
| 언어 | 영어 (독일 기반이지만 영문 전용 사이트) |

**RSS 이미지 검증 결과 (직접 확인 완료):**
- media:thumbnail: 없음
- media:content: 없음 (media 네임스페이스 미선언)
- enclosure: 일부 (동영상 enclosure만, video/mp4)
- **content 내 `<img>` 태그: 모든 아이템에 존재** (WordPress `wp-content/uploads/` 경로의 고화질 PNG/JPEG)
- 이미지 추출 방식: `rss_image_field: "content_image"` 사용

실제 확인된 이미지 예시:
```
https://the-decoder.com/wp-content/uploads/2026/02/voice_clone_person-1.png
https://the-decoder.com/wp-content/uploads/2026/02/nvidia_sim_robot_training.png
https://the-decoder.com/wp-content/uploads/2026/02/anthropic_logo_wall.png
```

**콘텐츠 품질 평가:**
The Decoder는 AI 전문 뉴스 사이트로, 범용 테크 매체(Wired, Verge)와 달리 거의 모든 기사가 AI 관련입니다. 모델 릴리즈, 연구 브레이킹 뉴스, 기업 AI에 집중하며, 기사 품질이 높고 독자적 분석이 포함됩니다. 범용 매체에서 AI 기사만 필터링하는 현재 방식의 비효율을 줄여줍니다.

**기존 소스와의 차별성:**
- Wired/Verge: 문화/정책 중심 vs The Decoder: 기술 뉴스 속보 중심
- TechCrunch: 스타트업/투자 중심 vs The Decoder: 모델/연구 속보 중심
- MIT Tech Review: 깊은 분석 vs The Decoder: 빠른 보도

**추천 설정:**
```python
{
    "key": "the_decoder",
    "name": "The Decoder",
    "rss_url": "https://the-decoder.com/feed/",
    "max_items": 40,
    "lang": "en",
    "rss_image_field": "content_image",
}
```

---

### 강력 추천 B: MarkTechPost

| 항목 | 내용 |
|------|------|
| 사이트 | https://www.marktechpost.com/ |
| RSS URL | `https://www.marktechpost.com/feed` |
| 발행 빈도 | 일 5~15개 |
| 페이월 | 없음 |
| 언어 | 영어 |

**RSS 이미지 검증 결과 (직접 확인 완료):**
- **media:thumbnail: 있음** (`xmlns:media="http://search.yahoo.com/mrss/"` 네임스페이스 선언 확인). 150x150 크롭 이미지
- **media:content: 있음** -- 풀사이즈 이미지. 일부 아이템에는 2개의 media:content (풀사이즈 + 썸네일)
- enclosure: 없음
- **content:encoded 내 `<img>` srcset: 있음** -- 반응형 이미지 다수 포함
- **주의: 모든 아이템이 이미지를 포함하지는 않음** (5개 중 3개는 media:thumbnail 있음, 2개는 없음 -- 코딩 가이드/튜토리얼 기사)

실제 확인된 이미지 예시:
```
media:thumbnail - https://www.marktechpost.com/wp-content/uploads/2026/02/Screenshot-2026-02-22-at-8.00.29-PM-1-150x150.png
media:content   - https://www.marktechpost.com/wp-content/uploads/2026/02/Screenshot-2026-02-22-at-8.00.29-PM-1.png
```

**콘텐츠 품질 평가:**
MarkTechPost는 AI/ML 연구 논문 요약에 특화된 매체입니다. 최신 논문을 빠르게 소개하고, 핵심 기여/결과를 요약하는 데 강점이 있습니다. "바이트 사이즈" 포맷으로 빠른 스캔에 적합합니다. 다만 일부 기사는 깊이가 부족할 수 있고, 스크린샷 기반 이미지 품질이 다소 낮습니다.

**기존 소스와의 차별성:**
현재 소스 중 연구 논문 전문 매체가 없습니다. MIT Tech Review는 에디토리얼 분석에 가깝고, DeepMind은 자사 연구만 다룹니다. MarkTechPost는 학계 전반의 최신 논문을 광범위하게 커버합니다.

**추천 설정:**
```python
{
    "key": "marktechpost",
    "name": "MarkTechPost",
    "rss_url": "https://www.marktechpost.com/feed",
    "max_items": 40,
    "lang": "en",
    "rss_image_field": "media_thumbnail",
}
```

---

### 강력 추천 C: OpenAI Blog

| 항목 | 내용 |
|------|------|
| 사이트 | https://openai.com/news/ |
| RSS URL | `https://openai.com/news/rss.xml` |
| 발행 빈도 | 주 2~5개 (불규칙, 발표 기반) |
| 페이월 | 없음 |
| 언어 | 영어 |

**RSS 이미지 검증 결과 (직접 확인 완료):**
- media:thumbnail: **없음**
- media:content: **없음**
- enclosure: **없음**
- content/description 내 img: **없음**
- RSS 구조가 극도로 최소: `title`, `description`, `link`, `guid`, `category`, `pubDate`만 존재
- **og:image 폴백에 100% 의존 필요** -- OpenAI 사이트는 og:image를 잘 제공하므로 실질적 문제 없음

실제 확인된 아이템:
```
"Our First Proof submissions" (2026-02-20)
"Advancing independent research on AI alignment" (2026-02-19)
"Introducing OpenAI for India" (2026-02-18)
"GPT-5.2 derives a new result in theoretical physics" (2026-02-13)
```

**콘텐츠 품질 평가:**
이것은 단순히 "좋은 소스"가 아니라 **필수 소스**입니다. OpenAI는 ChatGPT, GPT-5, o-시리즈, Sora 등 AI 업계에서 가장 큰 임팩트를 만드는 회사입니다. 현재 Ailon에 DeepMind(Google), NVIDIA는 있는데 OpenAI가 빠져 있는 것은 심각한 커버리지 공백입니다. GPT-5.2 물리학 연구 결과 같은 뉴스는 다른 매체보다 OpenAI 블로그에서 먼저 나옵니다.

**기존 소스와의 차별성:**
다른 Tier 1 매체가 OpenAI 뉴스를 보도하긴 하지만, 공식 블로그는 1차 소스로서의 가치가 있습니다. 특히 기술 디테일(벤치마크 수치, API 사양 등)은 공식 블로그에서만 정확하게 확인 가능합니다.

**추천 설정:**
```python
{
    "key": "openai_blog",
    "name": "OpenAI",
    "rss_url": "https://openai.com/news/rss.xml",
    "max_items": 20,
    "lang": "en",
}
```

---

### 추천 D: Ars Technica AI

| 항목 | 내용 |
|------|------|
| 사이트 | https://arstechnica.com/ai/ |
| RSS URL | `https://arstechnica.com/ai/feed/` |
| 대안 RSS | `https://feeds.arstechnica.com/arstechnica/index` (전체 피드) |
| 발행 빈도 | 일 15~25개 전체, AI 섹션 일 3~8개 |
| 페이월 | 무료 excerpt, 유료 full-text ($7/월) |
| 언어 | 영어 |

**RSS 이미지 검증 결과:**
직접 fetch가 차단되어 XML 구조를 확인하지 못했습니다. 다만:
- Ars Technica는 전통적으로 RSS에 media:content 이미지를 포함하는 매체로 알려져 있음 (Feedburner 기반)
- Feedspot, Feeder, Inoreader 등 RSS 리더에서 이미지가 표시되는 것으로 보아 이미지 요소가 존재할 가능성 높음
- **추가 전 실제 feedparser 테스트 필수**

**콘텐츠 품질 평가:**
Ars Technica는 기술 심층 분석에서 타의 추종을 불허합니다. AI 연구 논문을 기술적 세부사항까지 파고드는 기사, 보안 관점의 AI 분석, 과학 분야와 AI의 교차점 보도 등이 강점입니다. 현재 Tier 1에서 이 수준의 기술적 깊이를 제공하는 소스가 부족합니다.

**기존 소스와의 차별성:**
- MIT Tech Review: 연구 + 정책 분석 vs Ars Technica: 기술 실무 + 보안 분석
- TechCrunch: 비즈니스/스타트업 vs Ars Technica: 기술 심층
- Wired: 문화/에세이 vs Ars Technica: 팩트 기반 기술 보도

**추천 설정 (이미지 확인 후):**
```python
{
    "key": "arstechnica_ai",
    "name": "Ars Technica AI",
    "rss_url": "https://arstechnica.com/ai/feed/",
    "max_items": 40,
    "lang": "en",
    # rss_image_field는 실제 피드 테스트 후 설정
}
```

---

### 추천 E: The Rundown AI

| 항목 | 내용 |
|------|------|
| 사이트 | https://www.therundown.ai/ |
| RSS URL | `https://rss.beehiiv.com/feeds/2R3C6Bt5wj.xml` |
| 발행 빈도 | 일 1회 (뉴스레터) |
| 페이월 | 없음 |
| 언어 | 영어 |
| 구독자 | 175만명 (AI 뉴스레터 최대 규모) |

**RSS 이미지 검증 결과 (직접 확인 완료):**
- media:thumbnail: 없음
- media:content: 없음
- **enclosure: 있음** -- `type="image/png"` 또는 `type="image/jpeg"`. 모든 아이템에 커버 이미지 존재
- **content:encoded 내 `<img>` 태그: 다수 존재** -- beehiiv CDN 이미지, 고화질

실제 확인된 이미지:
```
enclosure - https://media.beehiiv.com/cdn-cgi/image/.../2026_Cisco_cover.png (type="image/png")
enclosure - https://media.beehiiv.com/cdn-cgi/image/.../samdario1.jpg (type="image/jpeg")
enclosure - https://media.beehiiv.com/cdn-cgi/image/.../lyria3.jpg (type="image/jpeg")
```

**콘텐츠 품질 평가:**
The Rundown AI는 AI 뉴스 큐레이션 뉴스레터로, 주요 AI 뉴스를 요약 형태로 제공합니다. 빠른 트렌드 파악에 유용하며, 구독자 175만명이 검증하는 신뢰도가 있습니다.

**중요 주의사항:**
뉴스레터 특성상 하나의 RSS 아이템(=하나의 뉴스레터 에디션) 안에 여러 뉴스가 묶여 있습니다. Ailon의 현재 파이프라인은 각 RSS 아이템을 하나의 기사로 처리하므로, "여러 뉴스의 종합 요약"이 하나의 기사로 들어가게 됩니다. 이것이 앱 UX에 적합한지 판단이 필요합니다.

**추천 설정 (사용 시):**
```python
{
    "key": "rundown_ai",
    "name": "The Rundown AI",
    "rss_url": "https://rss.beehiiv.com/feeds/2R3C6Bt5wj.xml",
    "max_items": 10,
    "lang": "en",
    # enclosure에서 이미지 추출: 현재 _extract_rss_image가 enclosures 처리 지원
}
```

---

### 검토했으나 추천하지 않는 소스들

#### artificialintelligence-news.com (AI News)

**탈락 사유 (직접 확인 완료):**
- RSS 이미지: media:thumbnail, media:content, enclosure 모두 없음
- content:encoded 내 유일한 이미지가 **728x90 광고 배너** (예: "Banner for AI & Big Data Expo by TechEx events"). 기사 자체의 커버 이미지는 없음
- 콘텐츠 품질: 기업 PR/이벤트 홍보 기사 비중이 높음. 편집 독립성 의문

#### 404 Media

**보류 사유 (직접 확인 완료):**
- RSS 이미지: media:content (medium="image") 모든 아이템에 존재. 이미지 품질 우수
- 문제: 10개 아이템 중 AI 관련은 약 5개 (50%). 나머지는 과학, 정치, 미디어 비평 등. AI 전문 매체가 아님
- 탐사 저널리즘 스타일의 AI 윤리/사회적 영향 보도는 독보적 가치가 있으나, LLM 필터 부담이 큼
- **결론:** 이미 The Decoder, MarkTechPost 등 AI 전문 소스를 추가하면 우선순위가 낮아짐

#### Anthropic Blog

**보류 사유:**
- **공식 RSS 피드가 없음**. 커뮤니티에서 GitHub Actions로 스크래핑 기반 RSS를 유지보수하고 있으나 (https://github.com/conoro/anthropic-engineering-rss-feed), 안정성 보장이 어려움
- RSSHub 이슈 #18943에서 RSS 추가 요청이 올라왔으나 아직 미해결
- **결론:** 공식 RSS가 생길 때까지 보류. 대신 Wired/Verge/TechCrunch 등이 Anthropic 뉴스를 커버

#### Meta AI Blog

**보류 사유:**
- **공식 RSS 피드가 없음** (확인됨). RSSHub 이슈 #16938에서 요청됐으나 미해결
- LLaMA, Segment Anything 등 중요 발표가 많지만 RSS 없이는 수집 불가
- **결론:** 공식 RSS가 생길 때까지 보류

#### Last Week in AI

**보류 사유:**
- 주간 발행이라 일간 수집 파이프라인에 부적합
- 하나의 뉴스레터에 10~20개 뉴스가 묶여 있어 개별 기사 분리 불가

#### Simon Willison's Blog

**보류 사유:**
- 우수한 AI/Python 실무 블로그이지만, 개인 블로그 특성상 발행 빈도가 불규칙
- 뉴스 앱보다는 큐레이션/추천 섹션에 적합
- Atom 피드로 이미지 요소 확인 필요 (직접 fetch 시 별도 에러 발생)

---

<a id="part-3"></a>
## Part 3: 최종 권장 사항

### 즉시 실행 (리스크 없음)

#### 1. 기존 소스 설정 최적화

**VentureBeat RSS URL 변경 + 이미지 필드 추가:**
```python
# 변경 전
{
    "key": "venturebeat",
    "name": "VentureBeat",
    "rss_url": "https://venturebeat.com/feed/",
    "max_items": 40,
    "lang": "en",
},

# 변경 후
{
    "key": "venturebeat",
    "name": "VentureBeat",
    "rss_url": "https://venturebeat.com/category/ai/feed/",
    "max_items": 40,
    "lang": "en",
    "rss_image_field": "content_image",
},
```

**NVIDIA AI Blog 이미지 필드 추가:**
```python
# 변경 전
{
    "key": "nvidia_blog",
    "name": "NVIDIA AI",
    "rss_url": "https://blogs.nvidia.com/feed/",
    "max_items": 40,
    "lang": "en",
},

# 변경 후
{
    "key": "nvidia_blog",
    "name": "NVIDIA AI",
    "rss_url": "https://blogs.nvidia.com/feed/",
    "max_items": 40,
    "lang": "en",
    "rss_image_field": "media_thumbnail",
},
```

#### 2. 신규 소스 3개 추가 (최우선)

**The Decoder + MarkTechPost + OpenAI** 3개를 추가합니다:

```python
# Tier 1 끝에 추가:
{
    "key": "the_decoder",
    "name": "The Decoder",
    "rss_url": "https://the-decoder.com/feed/",
    "max_items": 40,
    "lang": "en",
    "rss_image_field": "content_image",
},
{
    "key": "marktechpost",
    "name": "MarkTechPost",
    "rss_url": "https://www.marktechpost.com/feed",
    "max_items": 40,
    "lang": "en",
    "rss_image_field": "media_thumbnail",
},

# Tier 2 끝에 추가:
{
    "key": "openai_blog",
    "name": "OpenAI",
    "rss_url": "https://openai.com/news/rss.xml",
    "max_items": 20,
    "lang": "en",
},
```

#### 3. HIGHLIGHT_SOURCES / CATEGORY_SOURCES 업데이트

```python
# tools.py에서 업데이트:
HIGHLIGHT_SOURCES = {
    "wired_ai", "the_verge_ai", "techcrunch_ai", "mit_tech_review",
    "venturebeat", "the_decoder", "marktechpost",
}

CATEGORY_SOURCES = {
    "wired_ai", "the_verge_ai", "techcrunch_ai", "mit_tech_review",
    "venturebeat", "the_decoder", "marktechpost",
    "deepmind_blog", "nvidia_blog", "huggingface_blog", "openai_blog",
}
```

---

### 추후 검토 (테스트 필요)

#### 4. Ars Technica AI 추가 (이미지 확인 후)

로컬 환경에서 feedparser로 실제 피드를 파싱하여 이미지 태그 존재 여부를 확인한 후 추가:
```python
import feedparser
feed = feedparser.parse("https://arstechnica.com/ai/feed/")
for entry in feed.entries[:3]:
    print(entry.get("media_thumbnail", "없음"))
    print(entry.get("media_content", "없음"))
```

#### 5. The Rundown AI 추가 (UX 검토 후)

뉴스레터 형태(1 아이템 = 여러 뉴스 종합)가 앱 UX에 적합한지 판단 필요. enclosure 이미지는 우수하게 지원됨.

---

### 추가 후 최종 소스 구성 (영문)

```
[Tier 1: 에디토리얼 영어 매체 -- 하이라이트 + 카테고리 분류 대상]
1.  Wired AI          -- 문화/정책       -- media:thumbnail
2.  The Verge AI      -- 빅테크/제품     -- content img
3.  TechCrunch AI     -- 스타트업/투자   -- media:thumbnail(추정)
4.  MIT Tech Review   -- 연구/분석       -- og:image 폴백
5.  VentureBeat AI    -- 엔터프라이즈    -- content img        (URL 변경)
6.  The Decoder [NEW] -- AI 전문 속보    -- content img
7.  MarkTechPost [NEW]-- 연구 논문 요약  -- media:thumbnail

[Tier 2: AI 기업 공식 블로그 -- 카테고리 분류 대상]
8.  Google DeepMind   -- Google AI 공식  -- media:thumbnail
9.  NVIDIA AI         -- 하드웨어/인프라 -- media:thumbnail    (필드 추가)
10. Hugging Face      -- 오픈소스 AI     -- og:image 폴백
11. OpenAI [NEW]      -- OpenAI 공식     -- og:image 폴백
```

**변경 규모: 영문 소스 8개 --> 11개 (3개 추가)**

이를 통해 해소되는 커버리지 공백:
- AI 전문 뉴스 속보 (The Decoder)
- 학계 연구 논문 커버리지 (MarkTechPost)
- OpenAI 공식 발표 1차 소스 (OpenAI Blog)

---

### 수정 필요 파일 요약

| 파일 | 수정 내용 |
|------|----------|
| `scripts/agents/tools.py` | SOURCES 배열에 3개 추가, VentureBeat/NVIDIA 설정 변경, HIGHLIGHT_SOURCES/CATEGORY_SOURCES 업데이트 |
| `scripts/agents/news_team.py` | 주석의 소스 개수 업데이트 (12개 --> 15개) |
