"""
공유 도구 모듈 - RSS 수집, 웹 스크래핑, Firestore 저장
"""

import feedparser
import requests
from datetime import datetime, timedelta
from bs4 import BeautifulSoup

# RSS 피드 소스
RSS_FEEDS = [
    "https://news.google.com/rss/search?q=artificial+intelligence&hl=en-US&gl=US&ceid=US:en",
    "https://www.technologyreview.com/feed/",
    "https://techcrunch.com/tag/artificial-intelligence/feed/",
    "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
    "https://venturebeat.com/category/ai/feed/",
]

# AI 관련 키워드
AI_KEYWORDS = [
    "ai", "artificial intelligence", "machine learning", "deep learning",
    "neural network", "llm", "gpt", "chatgpt", "claude", "gemini",
    "computer vision", "nlp", "natural language", "automation",
    "robot", "autonomous", "generative ai", "foundation model",
    "transformer", "diffusion model", "reinforcement learning",
]


def is_ai_related(title: str, description: str) -> bool:
    """뉴스가 AI 관련인지 확인"""
    text = (title + " " + description).lower()
    return any(keyword in text for keyword in AI_KEYWORDS)


def fetch_rss_articles() -> list[dict]:
    """모든 RSS 피드에서 AI 관련 뉴스 수집"""
    all_articles = []
    seen_titles = set()

    for feed_url in RSS_FEEDS:
        try:
            feed = feedparser.parse(feed_url)
            for entry in feed.entries[:10]:
                title = entry.get("title", "")
                description = entry.get("summary", "") or entry.get("description", "")
                link = entry.get("link", "")
                published = entry.get("published_parsed") or entry.get("updated_parsed")

                if title in seen_titles:
                    continue

                if not is_ai_related(title, description):
                    continue

                if published:
                    pub_date = datetime(*published[:6])
                else:
                    pub_date = datetime.now()

                if (datetime.now() - pub_date).days > 3:
                    continue

                article = {
                    "title": title,
                    "description": description,
                    "link": link,
                    "published": pub_date.isoformat(),
                    "source": feed.feed.get("title", "Unknown"),
                }

                all_articles.append(article)
                seen_titles.add(title)

        except Exception as e:
            print(f"  ⚠ Error fetching {feed_url}: {e}")

    return all_articles


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
        print(f"  ⚠ Failed to fetch article content: {e}")
        return ""
