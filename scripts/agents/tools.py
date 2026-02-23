"""
뉴스 수집 도구 — 17개 소스 RSS/스크래핑 기반 수집

[Tier 1] 영어 AI 전문 뉴스 — Wired AI / The Verge AI / TechCrunch AI / MIT Tech Review / VentureBeat
[Tier 2] AI 기업 공식 블로그 — Google DeepMind / NVIDIA / HuggingFace
[Tier 3] 한국 소스 — AI타임스 / GeekNews / ZDNet AI 에디터 / 요즘IT AI
[Tier 4] 영어 섹션 소스 — The Decoder / MarkTechPost / OpenAI Blog / Ars Technica AI / The Rundown AI
"""

import os
import re
import feedparser
import requests
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed


# ─── 소스 설정 ───────────────────────────────────────────────────────────
SOURCES = [
    # Tier 1: 영어 AI 전문 뉴스
    {
        "key": "wired_ai",
        "name": "Wired AI",
        "rss_url": "https://www.wired.com/feed/tag/ai/latest/rss",
        "max_items": 40,

        "lang": "en",
        "rss_image_field": "media_thumbnail",  # RSS에 media:thumbnail 포함
    },
    {
        "key": "the_verge_ai",
        "name": "The Verge AI",
        "rss_url": "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
        "max_items": 40,

        "lang": "en",
        "rss_image_field": "content_image",  # RSS content에 <img> 포함
    },
    {
        "key": "techcrunch_ai",
        "name": "TechCrunch AI",
        "rss_url": "https://techcrunch.com/category/artificial-intelligence/feed/",
        "max_items": 40,

        "lang": "en",
    },
    {
        "key": "mit_tech_review",
        "name": "MIT Tech Review",
        "rss_url": "https://www.technologyreview.com/topic/artificial-intelligence/feed",
        "max_items": 40,

        "lang": "en",
    },
    {
        "key": "venturebeat",
        "name": "VentureBeat",
        "rss_url": "https://venturebeat.com/feed/",
        "max_items": 40,

        "lang": "en",
    },
    # Tier 2: AI 기업 공식 블로그
    {
        "key": "deepmind_blog",
        "name": "Google DeepMind",
        "rss_url": "https://deepmind.google/blog/rss.xml",
        "max_items": 40,

        "lang": "en",
        "rss_image_field": "media_thumbnail",
    },
    {
        "key": "nvidia_blog",
        "name": "NVIDIA AI",
        "rss_url": "https://blogs.nvidia.com/feed/",
        "max_items": 40,

        "lang": "en",
    },
    {
        "key": "huggingface_blog",
        "name": "Hugging Face",
        "rss_url": "https://huggingface.co/blog/feed.xml",
        "max_items": 40,

        "lang": "en",
    },
    # Tier 3: 한국 소스
    {
        "key": "aitimes",
        "name": "AI타임스",
        "rss_url": "https://www.aitimes.com/rss/allArticle.xml",
        "max_items": 30,
        "ai_filter": False,
        "lang": "ko",
    },
    {
        "key": "geeknews",
        "name": "GeekNews",
        "rss_url": "https://news.hada.io/rss/news",
        "max_items": 30,
        "ai_filter": False,
        "lang": "ko",
    },
    {
        "key": "zdnet_ai_editor",
        "name": "ZDNet AI 에디터",
        "scrape_url": "https://zdnet.co.kr/reporter/?lstcode=media",
        "max_items": 30,
        "ai_filter": False,
        "lang": "ko",
    },
    {
        "key": "yozm_ai",
        "name": "요즘IT AI",
        "rss_url": "https://yozm.wishket.com/magazine/ai/feed/",
        "max_items": 30,
        "ai_filter": False,
        "lang": "ko",
        "rss_image_field": "content_image",
    },
    # Tier 4: 영어 섹션 소스 (개별 가로스크롤 섹션으로 표시)
    {
        "key": "the_decoder",
        "name": "The Decoder",
        "rss_url": "https://the-decoder.com/feed/",
        "max_items": 30,
        "lang": "en",
        "rss_image_field": "content_image",
    },
    {
        "key": "marktechpost",
        "name": "MarkTechPost",
        "rss_url": "https://www.marktechpost.com/feed/",
        "max_items": 30,
        "lang": "en",
        "rss_image_field": "media_thumbnail",
    },
    {
        "key": "openai_blog",
        "name": "OpenAI Blog",
        "rss_url": "https://openai.com/news/rss.xml",
        "max_items": 30,
        "lang": "en",
    },
    {
        "key": "arstechnica_ai",
        "name": "Ars Technica AI",
        "rss_url": "https://arstechnica.com/ai/feed/",
        "max_items": 30,
        "lang": "en",
    },
    {
        "key": "the_rundown_ai",
        "name": "The Rundown AI",
        "rss_url": "https://rss.beehiiv.com/feeds/2R3C6Bt5wj.xml",
        "max_items": 30,
        "lang": "en",
    },
]

# AI 키워드 — 정규식 단어 경계 매칭 (ai_filter=True인 소스에서 사용)
# _WORD_BOUNDARY_KEYWORDS: \bkw\b 로 매칭 (부분 문자열 오탐 방지)
_WORD_BOUNDARY_KEYWORDS = [
    "ai", "llm", "gpt", "nlp", "rag", "gpu", "tpu",
]
# _PLAIN_KEYWORDS: 단순 부분 문자열 매칭 (충분히 길어서 오탐 없음)
_PLAIN_KEYWORDS = [
    # Core AI terms (English)
    "artificial intelligence", "machine learning", "deep learning",
    "chatgpt", "claude", "gemini", "neural", "transformer",
    "agentic", "multimodal", "generative", "diffusion",
    "natural language", "computer vision", "robotics", "autonomous",
    "chatbot", "foundation model", "large language model",
    # AI-adjacent: companies, products, techniques
    "openai", "anthropic", "deepmind", "hugging face", "huggingface",
    "midjourney", "stable diffusion", "copilot", "sora", "dall-e",
    "nvidia", "tensor", "fine-tun", "embedding",
    "reinforcement learning", "supervised learning", "unsupervised",
    "prompt engineer", "synthetic data",
    # Korean equivalents
    "인공지능", "머신러닝", "딥러닝", "생성형", "언어모델", "챗봇",
    "파인튜닝", "임베딩", "프롬프트", "신경망", "자율주행",
    "컴퓨터 비전", "자연어 처리", "강화학습", "초거대",
]

# ─── 소스별 역할 분류 ─────────────────────────────────────────────────────
# 하이라이트 후보 소스 (Tier 1: 에디토리얼 영어 매체)
HIGHLIGHT_SOURCES = {"wired_ai", "the_verge_ai", "techcrunch_ai", "mit_tech_review", "venturebeat"}

# 카테고리 분류 대상 소스 (Tier 1 + Tier 2 기업 블로그)
CATEGORY_SOURCES = {
    "wired_ai", "the_verge_ai", "techcrunch_ai", "mit_tech_review",
    "venturebeat", "deepmind_blog", "nvidia_blog", "huggingface_blog",
}

# 소스별 섹션 (한국 소스)
SOURCE_SECTION_SOURCES = {
    "aitimes", "geeknews", "zdnet_ai_editor", "yozm_ai",
}

# 영어 소스별 섹션 (Tier 4: 개별 가로스크롤로 표시, 카테고리 분류 안 함)
EN_SECTION_SOURCES = {
    "the_decoder", "marktechpost", "openai_blog", "arstechnica_ai", "the_rundown_ai",
}

assert CATEGORY_SOURCES.isdisjoint(SOURCE_SECTION_SOURCES), \
    "CATEGORY_SOURCES와 SOURCE_SECTION_SOURCES는 겹치면 안 됩니다"
assert CATEGORY_SOURCES.isdisjoint(EN_SECTION_SOURCES), \
    "CATEGORY_SOURCES와 EN_SECTION_SOURCES는 겹치면 안 됩니다"


# ─── 날짜 유틸 ───────────────────────────────────────────────────────────
def _parse_date(date_str: str):
    if not date_str:
        return None
    try:
        from email.utils import parsedate_to_datetime
        return parsedate_to_datetime(date_str).replace(tzinfo=None)
    except Exception:
        pass
    try:
        return datetime.fromisoformat(date_str.replace('Z', '+00:00')).replace(tzinfo=None)
    except Exception:
        return None


def _within_days(date_str: str, days: int) -> bool:
    dt = _parse_date(date_str)
    if dt is None:
        return True
    return (datetime.now() - dt).days <= days


def _is_ai_related(title: str, description: str) -> bool:
    text = (title + " " + description).lower()
    # 짧은 키워드는 단어 경계로 매칭 (ai→said 오탐 방지)
    for kw in _WORD_BOUNDARY_KEYWORDS:
        if re.search(r'\b' + kw + r'\b', text):
            return True
    # 긴 키워드는 부분 문자열 매칭
    return any(kw in text for kw in _PLAIN_KEYWORDS)


# ─── 이미지 추출 ─────────────────────────────────────────────────────────
def _extract_rss_image(entry: dict, rss_image_field: str = "") -> str:
    """RSS 엔트리에서 이미지 URL 추출 (media:thumbnail, content img 등)"""
    # media:thumbnail (Wired, DeepMind)
    if rss_image_field == "media_thumbnail":
        thumbs = entry.get("media_thumbnail", [])
        if thumbs and isinstance(thumbs, list) and thumbs[0].get("url"):
            return thumbs[0]["url"]
        # media:content fallback
        media = entry.get("media_content", [])
        if media and isinstance(media, list):
            for m in media:
                if m.get("url") and m.get("medium") == "image":
                    return m["url"]

    # content에서 <img src="..."> 추출 (The Verge)
    if rss_image_field == "content_image":
        content = ""
        if entry.get("content"):
            content = entry["content"][0].get("value", "")
        elif entry.get("summary"):
            content = entry["summary"]
        if content:
            match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', content)
            if match:
                url = match.group(1)
                if url.startswith("http") and not url.endswith(".svg"):
                    return url

    # enclosure (일부 RSS)
    for enc in entry.get("enclosures", []):
        if enc.get("type", "").startswith("image/") and enc.get("href"):
            return enc["href"]

    return ""


# ─── HTML 스크래핑 수집 ──────────────────────────────────────────────────
def _fetch_scrape_source(source_config: dict) -> list[dict]:
    """HTML 페이지 스크래핑으로 기사 수집 (ZDNet AI 에디터 등)"""
    from bs4 import BeautifulSoup

    key = source_config["key"]
    name = source_config["name"]
    url = source_config["scrape_url"]
    max_items = source_config.get("max_items", 20)
    days = source_config.get("days", 14)
    lang = source_config.get("lang", "ko")
    ai_filter = source_config.get("ai_filter", False)

    articles = []
    date_filtered = 0
    keyword_filtered = 0
    try:
        headers = {"User-Agent": "Mozilla/5.0 (compatible; AilonBot/1.0)"}
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code != 200:
            print(f"  [WARNING] {name} 스크래핑 실패: HTTP {resp.status_code}")
            return []

        soup = BeautifulSoup(resp.text, "html.parser")
        for h3 in soup.find_all("h3"):
            if len(articles) >= max_items:
                break
            a_tag = h3.find_parent("a")
            if not a_tag or not a_tag.get("href"):
                continue

            title = h3.get_text(strip=True)
            if not title:
                continue

            href = a_tag["href"]
            link = href if href.startswith("http") else "https://zdnet.co.kr" + href

            # 날짜 추출: <span>2026.02.19 PM 08:20</span>
            published = ""
            parent = a_tag.find_parent()
            if parent:
                spans = parent.find_all("span")
                for span in spans:
                    txt = span.get_text(strip=True)
                    if re.match(r'\d{4}\.\d{2}\.\d{2}', txt):
                        published = txt
                        break

            # 최근 N일 이내 기사만 수집
            if published and not _within_days_ymd(published, days):
                date_filtered += 1
                continue

            # 키워드 AI 필터
            if ai_filter and not _is_ai_related(title, ""):
                keyword_filtered += 1
                continue

            articles.append({
                "title": title,
                "display_title": "",
                "description": "",
                "summary": "",
                "link": link,
                "published": published or datetime.now().isoformat(),
                "source": name,
                "source_key": key,
                "lang": lang,
                "image_url": "",
            })

    except Exception as e:
        print(f"  [WARNING] {name} 스크래핑 실패: {e}")

    if date_filtered > 0:
        print(f"  [{name}] 날짜 필터: {date_filtered}개 ({days}일 초과) 제거")
    if keyword_filtered > 0:
        print(f"  [{name}] AI 키워드 필터: {keyword_filtered}개 비AI 기사 제거")

    return articles


def _within_days_ymd(date_str: str, days: int) -> bool:
    """'2026.02.19 PM 08:20' 형식 날짜가 days일 이내인지 확인"""
    match = re.match(r'(\d{4})\.(\d{2})\.(\d{2})', date_str)
    if not match:
        return True
    try:
        dt = datetime(int(match.group(1)), int(match.group(2)), int(match.group(3)))
        return (datetime.now() - dt).days <= days
    except Exception:
        return True


# ─── RSS 수집 ────────────────────────────────────────────────────────────
def fetch_source(source_config: dict) -> list[dict]:
    """단일 소스에서 기사 수집 (RSS 또는 HTML 스크래핑)"""
    if source_config.get("scrape_url"):
        return _fetch_scrape_source(source_config)

    key = source_config["key"]
    name = source_config["name"]
    rss_url = source_config["rss_url"]
    max_items = source_config.get("max_items", 10)
    days = source_config.get("days", 14)
    lang = source_config.get("lang", "en")
    ai_filter = source_config.get("ai_filter", False)
    rss_image_field = source_config.get("rss_image_field", "")

    articles = []
    filtered_out = 0
    date_filtered = 0
    try:
        feed = feedparser.parse(rss_url, agent="Mozilla/5.0")
        for entry in feed.entries:
            if len(articles) >= max_items:
                break

            title = entry.get("title", "").strip()
            if not title:
                continue

            published = entry.get("published", "") or entry.get("updated", "")

            # 최근 N일 이내 기사만 수집
            if published and not _within_days(published, days):
                date_filtered += 1
                continue

            description = (entry.get("summary", "") or "").strip()
            description = re.sub(r'<[^>]+>', '', description)[:500]

            if ai_filter and not _is_ai_related(title, description):
                filtered_out += 1
                continue

            link = entry.get("link", "")
            image_url = _extract_rss_image(entry, rss_image_field)

            articles.append({
                "title": title,
                "display_title": "",  # 번역 후 채워짐
                "description": description,
                "summary": "",  # 번역 후 채워짐
                "link": link,
                "published": published or datetime.now().isoformat(),
                "source": name,
                "source_key": key,
                "lang": lang,
                "image_url": image_url,
            })

    except Exception as e:
        print(f"  [WARNING] {name} RSS 수집 실패: {e}")

    if date_filtered > 0:
        print(f"  [{name}] 날짜 필터: {date_filtered}개 ({days}일 초과) 제거")
    if filtered_out > 0:
        print(f"  [{name}] AI 필터: {filtered_out}개 비AI 기사 제거")

    return articles


def fetch_all_sources() -> dict[str, list[dict]]:
    """
    모든 소스에서 병렬 수집
    반환: { source_key: [articles...], ... }
    """
    print("\n  ═══ 소스 수집 시작 ═══")
    result: dict[str, list[dict]] = {}

    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {
            executor.submit(fetch_source, src): src
            for src in SOURCES
        }
        for future in as_completed(futures):
            src = futures[future]
            try:
                articles = future.result()
                result[src["key"]] = articles
                print(f"  [{src['name']}] {len(articles)}개 수집")
            except Exception as e:
                print(f"  [{src['name']}] 수집 실패: {e}")
                result[src["key"]] = []

    total = sum(len(v) for v in result.values())
    print(f"  ═══ 수집 완료: 총 {total}개 ═══\n")
    return result


def filter_imageless(sources: dict[str, list[dict]]) -> None:
    """모든 소스에서 image_url 없는 기사 제거"""
    removed = 0
    for key, articles in sources.items():
        before = len(articles)
        sources[key] = [a for a in articles if a.get("image_url")]
        removed += before - len(sources[key])
    if removed > 0:
        print(f"  [필터] 이미지 없는 기사 {removed}개 제거")


# ─── 본문 + og:image 통합 스크래핑 ─────────────────────────────────────
def _scrape_body_and_image(url: str) -> tuple[str, str]:
    """기사 URL에서 본문 텍스트 + og:image를 한 번의 HTTP로 추출"""
    if not url:
        return "", ""
    try:
        import trafilatura
        downloaded = trafilatura.fetch_url(url)
        if not downloaded:
            return "", ""

        # og:image 추출 (HTML 앞부분에서)
        image_url = ""
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(downloaded[:10000], "html.parser")
        for prop, attr in [("og:image", "property"), ("twitter:image", "name")]:
            meta = soup.find("meta", {attr: prop})
            if meta and meta.get("content"):
                img = str(meta["content"])
                if img.startswith("http") and not img.endswith(".svg"):
                    image_url = img
                    break

        text = trafilatura.extract(downloaded)
        return (text[:3000] if text else ""), image_url
    except Exception:
        return "", ""


def enrich_and_scrape(sources: dict[str, list[dict]]) -> None:
    """og:image + 본문을 단일 HTTP 요청으로 병렬 추출 (in-place)"""
    tasks = []
    for articles in sources.values():
        for a in articles:
            tasks.append(a)

    if not tasks:
        return

    print(f"  [fetch] {len(tasks)}개 기사: og:image + 본문 통합 스크래핑...")
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {
            executor.submit(_scrape_body_and_image, a["link"]): a
            for a in tasks
        }
        body_found = 0
        img_enriched = 0
        for future in as_completed(futures):
            article = futures[future]
            try:
                body, img = future.result()
                article["body"] = body
                if body:
                    body_found += 1
                if img and not article.get("image_url"):
                    article["image_url"] = img
                    img_enriched += 1
            except Exception:
                article["body"] = ""

    print(f"  [fetch] 본문 {body_found}/{len(tasks)}개, 이미지 보강 {img_enriched}개")
