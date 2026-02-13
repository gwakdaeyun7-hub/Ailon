"""
공유 도구 모듈 - CollectorAgent의 3개 전용 Tool + 유틸리티

Tool A (Academic): arXiv API + Hugging Face Daily Papers (논문 및 SOTA 모델)
Tool B (Developer): GitHub Search API (24h 내 Star 급증 Repo, trending)
Tool C (Market/News): Tavily AI Search (VC 투자 동향, 테크 뉴스, 비즈니스 인사이트)
"""

import os
import feedparser
import requests
from datetime import datetime, timedelta
from bs4 import BeautifulSoup

# AI 관련 키워드
AI_KEYWORDS = [
    "ai", "artificial intelligence", "machine learning", "deep learning",
    "neural network", "llm", "gpt", "chatgpt", "claude", "gemini",
    "computer vision", "nlp", "natural language", "automation",
    "robot", "autonomous", "generative ai", "foundation model",
    "transformer", "diffusion model", "reinforcement learning",
    "agent", "agentic", "multimodal", "rag", "fine-tuning",
    "open source", "hugging face", "langchain", "langgraph",
]

# 소스 신뢰도 점수 (0-10)
SOURCE_RELIABILITY = {
    "arxiv": 9,
    "huggingface": 9,
    "github": 8,
    "tavily": 7,
    "default": 5,
}


def is_ai_related(title: str, description: str) -> bool:
    """뉴스가 AI 관련인지 확인"""
    text = (title + " " + description).lower()
    return any(keyword in text for keyword in AI_KEYWORDS)


def calculate_importance_score(
    source_name: str,
    social_score: int = 0,
    practicality_score: int = 5,
) -> float:
    """
    중요도 점수 계산
    출처 신뢰도 30% + 소셜 반응 30% + 실용성 40%
    각 항목은 0-10 스케일, 최종 점수는 0-100 스케일로 반환
    """
    source_key = source_name.lower().replace(" ", "_")
    reliability = SOURCE_RELIABILITY.get(source_key, SOURCE_RELIABILITY["default"])

    if social_score > 1000:
        social_normalized = 10
    elif social_score > 500:
        social_normalized = 8
    elif social_score > 100:
        social_normalized = 6
    elif social_score > 50:
        social_normalized = 5
    elif social_score > 10:
        social_normalized = 3
    else:
        social_normalized = 1

    practicality = min(max(practicality_score, 0), 10)
    weighted = (reliability * 0.3) + (social_normalized * 0.3) + (practicality * 0.4)
    return round(weighted * 10, 1)


# ═══════════════════════════════════════════════════════════════
# Tool A: Academic — arXiv API + Hugging Face Daily Papers
# ═══════════════════════════════════════════════════════════════

def tool_academic() -> list[dict]:
    """
    [Tool A] 학술 소스에서 AI 논문 및 SOTA 모델 수집
    - arXiv: cs.AI, cs.LG, cs.CL, cs.CV, cs.MA 카테고리
    - Hugging Face Daily Papers: 커뮤니티 인기 논문
    """
    print("  [Tool A: Academic] arXiv + Hugging Face Daily Papers 수집 중...")
    articles = []

    # ── A-1: arXiv API ──
    arxiv_articles = _fetch_arxiv(max_results=30)
    articles.extend(arxiv_articles)

    # ── A-2: Hugging Face Daily Papers ──
    hf_articles = _fetch_huggingface_papers()
    articles.extend(hf_articles)

    print(f"    arXiv: {len(arxiv_articles)}개 | HF Papers: {len(hf_articles)}개 | 합계: {len(articles)}개")
    return articles


def _fetch_arxiv(max_results: int = 30) -> list[dict]:
    """arXiv API로 최신 AI/ML 논문 수집"""
    try:
        import arxiv

        search_queries = [
            "cat:cs.AI",   # Artificial Intelligence
            "cat:cs.LG",   # Machine Learning
            "cat:cs.CL",   # Computation and Language (NLP)
            "cat:cs.CV",   # Computer Vision
            "cat:cs.MA",   # Multi-Agent Systems
        ]

        all_articles = []
        seen_titles = set()

        for query in search_queries:
            try:
                search = arxiv.Search(
                    query=query,
                    max_results=max_results // len(search_queries),
                    sort_by=arxiv.SortCriterion.SubmittedDate,
                    sort_order=arxiv.SortOrder.Descending,
                )

                client = arxiv.Client()
                for result in client.results(search):
                    title = result.title
                    if title in seen_titles:
                        continue

                    pub_date = result.published.replace(tzinfo=None)
                    if (datetime.now() - pub_date).days > 7:
                        continue

                    abstract = result.summary[:500] if result.summary else ""
                    categories = ", ".join(result.categories)

                    article = {
                        "title": f"[arXiv] {title}",
                        "description": abstract,
                        "link": result.entry_id,
                        "published": pub_date.isoformat(),
                        "source": "arXiv",
                        "source_type": "arxiv",
                        "tool": "academic",
                        "social_score": 0,
                        "arxiv_categories": categories,
                        "authors": ", ".join([a.name for a in result.authors[:3]]),
                        "importance_score": calculate_importance_score("arxiv"),
                    }

                    all_articles.append(article)
                    seen_titles.add(title)

            except Exception as e:
                print(f"    [WARNING] arXiv query '{query}' failed: {e}")

        return all_articles

    except ImportError:
        print("    [WARNING] arxiv package not installed, skipping arXiv")
        return []
    except Exception as e:
        print(f"    [WARNING] arXiv fetch failed: {e}")
        return []


def _fetch_huggingface_papers() -> list[dict]:
    """Hugging Face Daily Papers API로 인기 논문 수집"""
    try:
        response = requests.get(
            "https://huggingface.co/api/daily_papers",
            timeout=15,
        )

        if response.status_code != 200:
            print(f"    [WARNING] HF Daily Papers API returned {response.status_code}")
            return []

        papers = response.json()
        articles = []

        for paper in papers[:20]:
            paper_data = paper.get("paper", {})
            title = paper_data.get("title", "")
            if not title:
                continue

            abstract = paper_data.get("summary", "")[:500]
            arxiv_id = paper_data.get("id", "")
            upvotes = paper.get("numUpvotes", 0)
            published = paper.get("publishedAt", datetime.now().isoformat())

            article = {
                "title": f"[HF Paper] {title}",
                "description": abstract,
                "link": f"https://huggingface.co/papers/{arxiv_id}" if arxiv_id else "",
                "published": published[:19] if published else datetime.now().isoformat(),
                "source": "Hugging Face Papers",
                "source_type": "huggingface",
                "tool": "academic",
                "social_score": upvotes,
                "upvotes": upvotes,
                "importance_score": calculate_importance_score(
                    "huggingface", social_score=upvotes
                ),
            }

            articles.append(article)

        return articles

    except Exception as e:
        print(f"    [WARNING] Hugging Face Papers fetch failed: {e}")
        return []


# ═══════════════════════════════════════════════════════════════
# Tool B: Developer — GitHub Search API (Star 급증 Repo)
# ═══════════════════════════════════════════════════════════════

def tool_developer() -> list[dict]:
    """
    [Tool B] GitHub Search API로 최근 Star 급증한 AI 관련 리포지토리 수집
    - 최근 24h~7d 이내 생성/갱신된 AI/LLM/Agent 관련 인기 리포
    - Star 수 기준 정렬로 trending 효과
    """
    print("  [Tool B: Developer] GitHub Star 급증 Repo 수집 중...")

    token = os.getenv("GITHUB_TOKEN")
    articles = []

    try:
        headers = {"Accept": "application/vnd.github.v3+json"}
        if token:
            headers["Authorization"] = f"token {token}"

        # 다양한 쿼리로 AI 트렌딩 리포 탐색
        since_1d = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        since_7d = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")

        queries = [
            # 24시간 내 Star 급증 (최소 50 stars)
            f"AI OR LLM OR GPT pushed:>{since_1d} stars:>50",
            # 7일 내 생성된 핫 프로젝트 (최소 20 stars)
            f"AI agent OR agentic OR langchain created:>{since_7d} stars:>20",
            # 최근 갱신 ML/AI 프레임워크
            f"machine-learning OR deep-learning pushed:>{since_1d} stars:>100",
            # 오픈소스 모델/도구
            f"open-source LLM OR inference OR fine-tuning created:>{since_7d} stars:>10",
        ]

        seen_repos = set()

        for query in queries:
            try:
                response = requests.get(
                    "https://api.github.com/search/repositories",
                    headers=headers,
                    params={
                        "q": query,
                        "sort": "stars",
                        "order": "desc",
                        "per_page": 10,
                    },
                    timeout=15,
                )

                if response.status_code == 200:
                    data = response.json()
                    for repo in data.get("items", []):
                        repo_name = repo.get("full_name", "")
                        if repo_name in seen_repos:
                            continue

                        stars = repo.get("stargazers_count", 0)
                        desc = repo.get("description", "") or ""
                        language = repo.get("language", "") or ""
                        topics = repo.get("topics", [])

                        article = {
                            "title": f"[GitHub] {repo_name}",
                            "description": f"{desc} (Language: {language}, Stars: {stars:,})",
                            "link": repo.get("html_url", ""),
                            "published": repo.get("pushed_at", datetime.now().isoformat()),
                            "source": "GitHub",
                            "source_type": "github",
                            "tool": "developer",
                            "social_score": stars,
                            "stars": stars,
                            "language": language,
                            "topics": topics[:5],
                            "importance_score": calculate_importance_score(
                                "github", social_score=stars,
                            ),
                        }

                        articles.append(article)
                        seen_repos.add(repo_name)

                elif response.status_code == 403:
                    print("    [WARNING] GitHub API rate limit reached")
                    break

            except Exception as e:
                print(f"    [WARNING] GitHub query failed: {e}")

        print(f"    GitHub: {len(articles)}개 리포지토리 수집")

    except Exception as e:
        print(f"    [WARNING] GitHub fetch failed: {e}")

    return articles


# ═══════════════════════════════════════════════════════════════
# Tool C: Market/News — Tavily AI Search
# ═══════════════════════════════════════════════════════════════

def tool_market_news() -> list[dict]:
    """
    [Tool C] Tavily AI Search로 VC 투자 동향, 테크 뉴스, 비즈니스 인사이트 수집
    - 다양한 쿼리로 시장 관점의 AI 뉴스 확보
    - 투자, 인수합병, 제품 출시, 규제 등 비즈니스 관련 뉴스 포커스
    """
    print("  [Tool C: Market/News] Tavily AI Search 수집 중...")

    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        print("    [WARNING] TAVILY_API_KEY not found, skipping Tavily search")
        return []

    try:
        from tavily import TavilyClient

        client = TavilyClient(api_key=api_key)

        # 시장/비즈니스 관점 쿼리
        queries = [
            "latest AI news today breakthroughs",
            "AI startup funding investment VC 2025 2026",
            "new AI model release launch product",
            "AI agent framework tool developer",
            "AI regulation policy safety alignment",
            "AI open source trending project",
        ]

        all_articles = []
        seen_urls = set()

        for q in queries:
            try:
                results = client.search(
                    query=q,
                    search_depth="advanced",
                    max_results=5,
                    include_answer=False,
                    days=3,
                )

                for result in results.get("results", []):
                    url = result.get("url", "")
                    if url in seen_urls:
                        continue

                    title = result.get("title", "")
                    content = result.get("content", "")

                    if not is_ai_related(title, content):
                        continue

                    relevance_score = result.get("score", 0)

                    article = {
                        "title": title,
                        "description": content[:500],
                        "link": url,
                        "published": datetime.now().isoformat(),
                        "source": "Tavily Search",
                        "source_type": "tavily",
                        "tool": "market_news",
                        "social_score": int(relevance_score * 100),
                        "tavily_score": relevance_score,
                        "importance_score": calculate_importance_score(
                            "tavily",
                            social_score=int(relevance_score * 100),
                        ),
                    }

                    all_articles.append(article)
                    seen_urls.add(url)

            except Exception as e:
                print(f"    [WARNING] Tavily query '{q}' failed: {e}")

        print(f"    Tavily: {len(all_articles)}개 기사 수집")
        return all_articles

    except ImportError:
        print("    [WARNING] tavily-python not installed, skipping Tavily search")
        return []
    except Exception as e:
        print(f"    [WARNING] Tavily search failed: {e}")
        return []


# ═══════════════════════════════════════════════════════════════
# 통합 수집 함수 — 3개 Tool 실행 + 중복 제거 + 정렬
# ═══════════════════════════════════════════════════════════════

def fetch_all_sources() -> list[dict]:
    """
    CollectorAgent가 3개 전용 Tool을 순차 실행하여 수집
    Tool A (Academic) + Tool B (Developer) + Tool C (Market/News)
    목표: 100-200개 기사 수집 후 중복 제거
    """
    print("\n  ╔═══ CollectorAgent: 3개 Tool 실행 ═══╗")

    # Tool A: Academic
    academic_articles = tool_academic()

    # Tool B: Developer
    developer_articles = tool_developer()

    # Tool C: Market/News
    market_articles = tool_market_news()

    print("  ╚═══════════════════════════════════════╝")

    # 모든 소스 병합
    all_articles = academic_articles + developer_articles + market_articles

    # 중복 제거 (제목 기반, 접두사 제거 후 비교)
    seen_titles = set()
    deduplicated = []
    for article in all_articles:
        clean_title = article["title"]
        for prefix in ["[arXiv] ", "[HF Paper] ", "[GitHub] "]:
            clean_title = clean_title.replace(prefix, "")
        clean_title_lower = clean_title.lower().strip()

        if clean_title_lower not in seen_titles:
            deduplicated.append(article)
            seen_titles.add(clean_title_lower)

    # 중요도 점수로 정렬
    deduplicated.sort(key=lambda x: x.get("importance_score", 0), reverse=True)

    print(f"\n  ═══ 전체 수집 결과 ═══")
    print(f"  Tool A (Academic):    {len(academic_articles)}개")
    print(f"  Tool B (Developer):   {len(developer_articles)}개")
    print(f"  Tool C (Market/News): {len(market_articles)}개")
    print(f"  합계: {len(all_articles)}개 → 중복 제거 후: {len(deduplicated)}개")

    return deduplicated


# ═══════════════════════════════════════════════════════════════
# PainPoint Tool A: Community Voice — Reddit
# ═══════════════════════════════════════════════════════════════

def tool_community_voice() -> list[dict]:
    """
    [PainPoint Tool A] Reddit RSS로 AI 커뮤니티 고충/불만 게시글 수집 (API 키 불필요)
    - r/LocalLLaMA, r/ChatGPT, r/OpenAI, r/singularity, r/MachineLearning
    - "help", "issue", "sucks", "problem", "broken" 등 부정적 키워드
    - feedparser RSS 피드 파싱
    """
    print("  [PainPoint Tool A: Community Voice] Reddit RSS 피드 수집 중...")
    articles = []

    REDDIT_RSS_FEEDS = [
        "https://www.reddit.com/r/LocalLLaMA/hot.rss?limit=50",
        "https://www.reddit.com/r/ChatGPT/hot.rss?limit=50",
        "https://www.reddit.com/r/OpenAI/hot.rss?limit=50",
        "https://www.reddit.com/r/MachineLearning/hot.rss?limit=50",
        "https://www.reddit.com/r/singularity/hot.rss?limit=50",
    ]
    pain_keywords = [
        "help", "issue", "sucks", "problem", "broken",
        "limitation", "can't", "not working", "useless", "hate",
        "frustrated", "disappointed", "fails", "expensive", "why doesn't",
    ]

    seen_titles = set()
    for feed_url in REDDIT_RSS_FEEDS:
        try:
            subreddit = feed_url.split("/r/")[1].split("/")[0]
            feed = feedparser.parse(feed_url)

            for entry in feed.entries:
                title = entry.get("title", "")
                if not title or title in seen_titles:
                    continue
                if not any(kw in title.lower() for kw in pain_keywords):
                    continue

                link = entry.get("link", "")
                description = entry.get("summary", "")[:500]
                published = entry.get("published", datetime.now().isoformat())

                articles.append({
                    "title": title,
                    "description": description,
                    "link": link,
                    "published": published,
                    "source": f"Reddit r/{subreddit}",
                    "source_type": "reddit",
                    "tool": "community_voice",
                    "social_score": 10,
                    "subreddit": subreddit,
                    "pain_type": "community",
                    "importance_score": calculate_importance_score("default", social_score=10),
                })
                seen_titles.add(title)

        except Exception as e:
            print(f"    [WARNING] Reddit RSS {feed_url} failed: {e}")

    print(f"    Reddit RSS: {len(articles)}개 고충 게시글 수집")
    return articles


# ═══════════════════════════════════════════════════════════════
# PainPoint Tool B: Dev Roadblock — StackExchange + GitHub Issues
# ═══════════════════════════════════════════════════════════════

def tool_dev_roadblock() -> list[dict]:
    """
    [PainPoint Tool B] 개발자 기술 장벽 수집
    - StackOverflow: 조회수 높은데 채택 답변 없는 AI/ML 질문
    - GitHub Issues: LangChain, PyTorch, HuggingFace 미해결 핵심 이슈
    """
    print("  [PainPoint Tool B: Dev Roadblock] StackExchange + GitHub Issues 수집 중...")
    articles = []

    # B-1: StackExchange API
    try:
        tags = ["langchain", "pytorch", "huggingface-transformers", "large-language-model", "openai-api"]
        for tag in tags[:3]:
            try:
                response = requests.get(
                    "https://api.stackexchange.com/2.3/questions",
                    params={
                        "site": "stackoverflow",
                        "tagged": tag,
                        "sort": "votes",
                        "order": "desc",
                        "pagesize": 10,
                        "min": 3,
                        "filter": "default",
                    },
                    timeout=10,
                )
                if response.status_code == 200:
                    for q in response.json().get("items", []):
                        if q.get("is_answered") and q.get("accepted_answer_id"):
                            continue
                        if q.get("view_count", 0) < 500:
                            continue
                        articles.append({
                            "title": q["title"],
                            "description": f"[StackOverflow:{tag}] 조회수 {q.get('view_count',0):,}, 답변 {q.get('answer_count',0)}개 (미해결)",
                            "link": q["link"],
                            "published": datetime.fromtimestamp(q["creation_date"]).isoformat(),
                            "source": "StackOverflow",
                            "source_type": "stackoverflow",
                            "tool": "dev_roadblock",
                            "social_score": q.get("score", 0) * 10,
                            "view_count": q.get("view_count", 0),
                            "answer_count": q.get("answer_count", 0),
                            "tag": tag,
                            "pain_type": "developer",
                            "importance_score": calculate_importance_score("default", social_score=q.get("score", 0) * 10),
                        })
            except Exception as e:
                print(f"    [WARNING] StackOverflow '{tag}' failed: {e}")
    except Exception as e:
        print(f"    [WARNING] StackExchange fetch failed: {e}")

    # B-2: GitHub Issues
    token = os.getenv("GITHUB_TOKEN")
    headers = {"Accept": "application/vnd.github.v3+json"}
    if token:
        headers["Authorization"] = f"token {token}"

    repos = ["langchain-ai/langchain", "huggingface/transformers", "pytorch/pytorch"]
    for repo in repos:
        for label in ["bug", "enhancement"]:
            try:
                resp = requests.get(
                    f"https://api.github.com/repos/{repo}/issues",
                    headers=headers,
                    params={"state": "open", "labels": label, "sort": "comments", "direction": "desc", "per_page": 5},
                    timeout=10,
                )
                if resp.status_code == 200:
                    for issue in resp.json():
                        if issue.get("pull_request"):
                            continue
                        if issue.get("comments", 0) < 3:
                            continue
                        articles.append({
                            "title": f"[GitHub Issue] {issue['title']}",
                            "description": f"{repo} [{label}]: {(issue.get('body') or '')[:300]}",
                            "link": issue["html_url"],
                            "published": issue["created_at"],
                            "source": f"GitHub Issues ({repo})",
                            "source_type": "github_issues",
                            "tool": "dev_roadblock",
                            "social_score": issue.get("comments", 0) * 5,
                            "num_comments": issue.get("comments", 0),
                            "label": label,
                            "repo": repo,
                            "pain_type": "developer",
                            "importance_score": calculate_importance_score("github", social_score=issue.get("comments", 0) * 5),
                        })
            except Exception as e:
                print(f"    [WARNING] GitHub Issues {repo}/{label} failed: {e}")

    print(f"    Dev Roadblock: {len(articles)}개 개발자 이슈 수집")
    return articles


# ═══════════════════════════════════════════════════════════════
# PainPoint Tool C: User Reaction — YouTube Comment API
# ═══════════════════════════════════════════════════════════════

def tool_user_reaction() -> list[dict]:
    """
    [PainPoint Tool C] YouTube Data API로 AI 유튜버 영상 댓글 수집
    - AI tech YouTubers의 최신 리뷰 영상
    - 좋아요 많은 상위 50개 댓글 중 부정적 반응 탐지
    """
    print("  [PainPoint Tool C: User Reaction] YouTube 댓글 수집 중...")

    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        print("    [WARNING] YOUTUBE_API_KEY not found, skipping YouTube")
        return []

    articles = []

    try:
        # AI 유튜브 채널 검색 쿼리
        search_queries = ["AI tools review 2026", "LLM comparison review", "AI agent tutorial"]
        negative_keywords = [
            "doesn't work", "not working", "broken", "useless", "disappointing",
            "hate", "problem", "issue", "can't", "impossible", "expensive",
            "too slow", "hallucinate", "wrong", "fail", "sucks", "terrible",
        ]

        base_url = "https://www.googleapis.com/youtube/v3"
        seen_video_ids = set()

        for query in search_queries[:2]:
            try:
                search_resp = requests.get(
                    f"{base_url}/search",
                    params={"key": api_key, "q": query, "part": "snippet", "order": "date", "maxResults": 3, "type": "video", "publishedAfter": (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%dT00:00:00Z")},
                    timeout=10,
                )
                if search_resp.status_code != 200:
                    continue

                for video in search_resp.json().get("items", []):
                    video_id = video["id"]["videoId"]
                    if video_id in seen_video_ids:
                        continue
                    seen_video_ids.add(video_id)
                    video_title = video["snippet"]["title"]

                    comments_resp = requests.get(
                        f"{base_url}/commentThreads",
                        params={"key": api_key, "videoId": video_id, "part": "snippet", "order": "relevance", "maxResults": 50},
                        timeout=10,
                    )
                    if comments_resp.status_code != 200:
                        continue

                    pain_comments = []
                    for comment in comments_resp.json().get("items", []):
                        snippet = comment["snippet"]["topLevelComment"]["snippet"]
                        text = snippet["textDisplay"]
                        likes = snippet.get("likeCount", 0)
                        if likes < 2:
                            continue
                        if any(kw in text.lower() for kw in negative_keywords):
                            pain_comments.append({"text": text[:300], "likes": likes})

                    if pain_comments:
                        pain_comments.sort(key=lambda x: x["likes"], reverse=True)
                        top = pain_comments[:5]
                        articles.append({
                            "title": f"[YouTube 반응] {video_title}",
                            "description": " | ".join([c["text"] for c in top])[:500],
                            "link": f"https://youtube.com/watch?v={video_id}",
                            "published": video["snippet"]["publishedAt"],
                            "source": "YouTube Comments",
                            "source_type": "youtube",
                            "tool": "user_reaction",
                            "social_score": sum(c["likes"] for c in top),
                            "pain_comments": top,
                            "pain_type": "user",
                            "importance_score": calculate_importance_score("default", social_score=sum(c["likes"] for c in top)),
                        })
            except Exception as e:
                print(f"    [WARNING] YouTube query '{query}' failed: {e}")

        print(f"    YouTube: {len(articles)}개 영상 반응 수집")
    except Exception as e:
        print(f"    [WARNING] YouTube collection failed: {e}")

    return articles


def fetch_pain_points() -> list[dict]:
    """PainPointHunter: 3개 Tool로 사용자/개발자 고충 수집"""
    print("\n  ╔═══ PainPointHunter: 3개 Tool 실행 ═══╗")
    community = tool_community_voice()
    dev = tool_dev_roadblock()
    reaction = tool_user_reaction()
    print("  ╚════════════════════════════════════════╝")
    all_pain = community + dev + reaction
    print(f"\n  ═══ PainPoint 수집 결과 ═══")
    print(f"  Community Voice (Reddit): {len(community)}개")
    print(f"  Dev Roadblock (SO+GH):   {len(dev)}개")
    print(f"  User Reaction (YouTube): {len(reaction)}개")
    print(f"  합계: {len(all_pain)}개")
    return all_pain


# ═══════════════════════════════════════════════════════════════
# 유틸리티
# ═══════════════════════════════════════════════════════════════

def fetch_article_content(url: str) -> str:
    """기사 본문 추출"""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, "html.parser")
        article = soup.find("article") or soup.find("main") or soup.find("div", class_="content")

        if article:
            paragraphs = article.find_all("p")
            content = " ".join([p.get_text().strip() for p in paragraphs[:10]])
            return content[:2000]

        return ""
    except Exception as e:
        print(f"  [WARNING] Failed to fetch article content: {e}")
        return ""
