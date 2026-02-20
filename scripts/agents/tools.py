"""
뉴스 수집 도구 — 13개 소스 RSS/API 기반 수집 + og:image 추출

[Tier 1] 영어 AI 전문 뉴스 (매일 다수, 고품질 썸네일)
  Wired AI / The Verge AI / TechCrunch AI / MIT Tech Review

[Tier 2] AI 기업 공식 블로그 (1차 소스, 주 2-5회)
  Google DeepMind / NVIDIA / HuggingFace

[Tier 3] 한국 소스
  AI타임스 / GeekNews / ZDNet Korea / 한국경제 IT / 인공지능신문 / 디지털투데이
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
        "max_items": 20,
        "days": 7,
        "lang": "en",
        "rss_image_field": "media_thumbnail",  # RSS에 media:thumbnail 포함
    },
    {
        "key": "the_verge_ai",
        "name": "The Verge AI",
        "rss_url": "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
        "max_items": 20,
        "days": 7,
        "lang": "en",
        "rss_image_field": "content_image",  # RSS content에 <img> 포함
    },
    {
        "key": "techcrunch_ai",
        "name": "TechCrunch AI",
        "rss_url": "https://techcrunch.com/category/artificial-intelligence/feed/",
        "max_items": 20,
        "days": 7,
        "lang": "en",
    },
    {
        "key": "mit_tech_review",
        "name": "MIT Tech Review",
        "rss_url": "https://www.technologyreview.com/topic/artificial-intelligence/feed",
        "max_items": 20,
        "days": 14,
        "lang": "en",
    },
    # Tier 2: AI 기업 공식 블로그
    {
        "key": "deepmind_blog",
        "name": "Google DeepMind",
        "rss_url": "https://deepmind.google/blog/rss.xml",
        "max_items": 20,
        "days": 30,
        "lang": "en",
        "rss_image_field": "media_thumbnail",
    },
    {
        "key": "nvidia_blog",
        "name": "NVIDIA AI",
        "rss_url": "https://blogs.nvidia.com/feed/",
        "max_items": 20,
        "days": 14,
        "lang": "en",
        "ai_filter": True,  # AI 관련 기사만 필터링
    },
    {
        "key": "huggingface_blog",
        "name": "Hugging Face",
        "rss_url": "https://huggingface.co/blog/feed.xml",
        "max_items": 20,
        "days": 30,
        "lang": "en",
    },
    # Tier 3: 한국 소스
    {
        "key": "aitimes",
        "name": "AI타임스",
        "rss_url": "https://www.aitimes.com/rss/allArticle.xml",
        "max_items": 20,
        "days": 7,
        "lang": "ko",
    },
    {
        "key": "geeknews",
        "name": "GeekNews",
        "rss_url": "https://news.hada.io/rss/news",
        "max_items": 20,
        "days": 7,
        "lang": "ko",
        "ai_filter": True,
    },
    {
        "key": "zdnet_korea",
        "name": "ZDNet Korea",
        "rss_url": "https://zdnet.co.kr/feed",
        "max_items": 20,
        "days": 7,
        "lang": "ko",
        "ai_filter": True,
    },
    {
        "key": "hankyung_it",
        "name": "한국경제 IT",
        "rss_url": "https://www.hankyung.com/feed/it",
        "max_items": 20,
        "days": 7,
        "lang": "ko",
        "ai_filter": True,
    },
    {
        "key": "ainews_kr",
        "name": "인공지능신문",
        "rss_url": "https://www.aitimes.kr/rss/allArticle.xml",
        "max_items": 20,
        "days": 7,
        "lang": "ko",
        "ai_filter": True,
    },
    {
        "key": "digitaltoday",
        "name": "디지털투데이",
        "rss_url": "https://www.digitaltoday.co.kr/rss/allArticle.xml",
        "max_items": 20,
        "days": 7,
        "lang": "ko",
        "ai_filter": True,
    },
]

# AI 키워드 (ai_filter=True인 소스에서 사용)
_AI_KEYWORDS = [
    "ai", "artificial intelligence", "machine learning", "deep learning",
    "llm", "gpt", "chatgpt", "claude", "gemini", "neural", "transformer",
    "agent", "agentic", "multimodal", "generative", "diffusion",
    "인공지능", "머신러닝", "딥러닝", "생성형", "언어모델", "챗봇",
    "에이전트", "파인튜닝", "임베딩", "프롬프트",
]

# ─── 소스별 역할 분류 ─────────────────────────────────────────────────────
# 하이라이트 후보 소스 (Tier 1: 에디토리얼 영어 매체)
HIGHLIGHT_SOURCES = {"wired_ai", "the_verge_ai", "techcrunch_ai", "mit_tech_review"}

# 카테고리 분류 대상 소스 (Tier 1 + Tier 2 기업 블로그)
CATEGORY_SOURCES = {
    "wired_ai", "the_verge_ai", "techcrunch_ai", "mit_tech_review",
    "deepmind_blog", "nvidia_blog", "huggingface_blog",
}

# 소스별 섹션 (한국 소스)
SOURCE_SECTION_SOURCES = {
    "aitimes", "geeknews", "zdnet_korea", "hankyung_it",
    "ainews_kr", "digitaltoday",
}

assert CATEGORY_SOURCES.isdisjoint(SOURCE_SECTION_SOURCES), \
    "CATEGORY_SOURCES와 SOURCE_SECTION_SOURCES는 겹치면 안 됩니다"


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
    return any(kw in text for kw in _AI_KEYWORDS)


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


def extract_og_image(url: str) -> str:
    """기사 URL에서 og:image 메타태그 추출 (10KB 스트리밍으로 대역폭 절약)"""
    if not url:
        return ""
    try:
        from bs4 import BeautifulSoup
        headers = {"User-Agent": "Mozilla/5.0 (compatible; AilonBot/1.0)"}
        resp = requests.get(url, headers=headers, timeout=5, allow_redirects=True, stream=True)
        if resp.status_code != 200:
            resp.close()
            return ""
        # og:image는 <head> 안에 있으므로 10KB면 충분
        content = b""
        for chunk in resp.iter_content(chunk_size=2048):
            content += chunk
            if len(content) >= 10000:
                break
        resp.close()
        soup = BeautifulSoup(content, "html.parser")
        for prop, attr in [("og:image", "property"), ("twitter:image", "name")]:
            meta = soup.find("meta", {attr: prop})
            if meta and meta.get("content"):
                img = str(meta["content"])
                if img.startswith("http") and not img.endswith(".svg"):
                    return img
        return ""
    except Exception:
        return ""


# ─── RSS 수집 ────────────────────────────────────────────────────────────
def fetch_source(source_config: dict) -> list[dict]:
    """단일 소스에서 RSS 기사 수집"""
    key = source_config["key"]
    name = source_config["name"]
    rss_url = source_config["rss_url"]
    max_items = source_config.get("max_items", 10)
    days = source_config.get("days", 7)
    lang = source_config.get("lang", "en")
    ai_filter = source_config.get("ai_filter", False)
    rss_image_field = source_config.get("rss_image_field", "")

    articles = []
    try:
        feed = feedparser.parse(rss_url, agent="Mozilla/5.0")
        for entry in feed.entries:
            if len(articles) >= max_items:
                break

            title = entry.get("title", "").strip()
            if not title:
                continue

            published = entry.get("published", "") or entry.get("updated", "")
            if not _within_days(published, days):
                continue

            description = (entry.get("summary", "") or "").strip()
            description = re.sub(r'<[^>]+>', '', description)[:500]

            if ai_filter and not _is_ai_related(title, description):
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


def enrich_images(sources: dict[str, list[dict]]) -> None:
    """
    image_url이 비어있는 기사에 대해 og:image 추출 (병렬, in-place 수정)
    """
    tasks = []
    for articles in sources.values():
        for a in articles:
            if not a.get("image_url"):
                tasks.append(a)

    if not tasks:
        print("  [이미지] 추출 필요 없음 (모든 기사에 이미지 있음)")
        return

    print(f"  [이미지] {len(tasks)}개 기사에서 og:image 추출 중...")
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {
            executor.submit(extract_og_image, a["link"]): a
            for a in tasks
        }
        found = 0
        for future in as_completed(futures):
            article = futures[future]
            try:
                img = future.result()
                if img:
                    article["image_url"] = img
                    found += 1
            except Exception:
                pass

    print(f"  [이미지] {found}/{len(tasks)}개 추가 확보")


def filter_imageless(sources: dict[str, list[dict]]) -> None:
    """
    image_url이 없는 기사를 제거 (in-place)
    각 소스에서 상위 10개만 남김
    한국 소스(SOURCE_SECTION_SOURCES)는 이미지 없어도 유지 (10개 제한만 적용)
    """
    removed = 0
    for key, articles in sources.items():
        before = len(articles)
        if key in SOURCE_SECTION_SOURCES:
            # 한국 소스는 이미지 필터 없이 10개만 제한
            sources[key] = articles[:10]
        else:
            sources[key] = [a for a in articles if a.get("image_url")][:10]
        removed += before - len(sources[key])
    if removed > 0:
        print(f"  [필터] 이미지 없는 기사 {removed}개 제거")
