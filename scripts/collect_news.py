"""
AI 뉴스 수집 및 요약 스크립트
매일 실행되어 AI 관련 뉴스를 수집하고 Gemini API로 요약한 후 Firestore에 저장
"""

import os
import sys
import json
import feedparser
import requests
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
import google.generativeai as genai
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

# RSS 피드 소스 목록 (AI 관련 뉴스)
RSS_FEEDS = [
    "https://news.google.com/rss/search?q=artificial+intelligence&hl=en-US&gl=US&ceid=US:en",
    "https://www.technologyreview.com/feed/",
    "https://techcrunch.com/tag/artificial-intelligence/feed/",
    "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
    "https://venturebeat.com/category/ai/feed/",
]

# AI 관련 키워드 (필터링용)
AI_KEYWORDS = [
    "ai", "artificial intelligence", "machine learning", "deep learning",
    "neural network", "llm", "gpt", "chatgpt", "claude", "gemini",
    "computer vision", "nlp", "natural language", "automation",
    "robot", "autonomous", "generative ai", "foundation model",
    "transformer", "diffusion model", "reinforcement learning"
]


def initialize_firebase():
    """Firebase 초기화"""
    try:
        # 이미 초기화되어 있으면 skip
        firebase_admin.get_app()
        print("✓ Firebase already initialized")
    except ValueError:
        # 환경 변수에서 credentials JSON 읽기
        cred_json = os.getenv('FIREBASE_CREDENTIALS')
        if cred_json:
            # JSON 문자열을 dict로 파싱
            cred_dict = json.loads(cred_json)
            cred = credentials.Certificate(cred_dict)
        else:
            # 로컬 파일에서 읽기 (개발 환경)
            cred_path = os.path.join(os.path.dirname(__file__), '..', 'firebase-credentials.json')
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
            else:
                print("❌ Firebase credentials not found")
                sys.exit(1)

        firebase_admin.initialize_app(cred)
        print("✓ Firebase initialized")


def initialize_gemini():
    """Gemini API 초기화"""
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("❌ GEMINI_API_KEY not found in environment variables")
        sys.exit(1)

    genai.configure(api_key=api_key)
    print("✓ Gemini API configured")


def is_ai_related(title, description):
    """뉴스가 AI 관련인지 확인"""
    text = (title + " " + description).lower()
    return any(keyword in text for keyword in AI_KEYWORDS)


def fetch_article_content(url):
    """기사 본문 추출 (간단한 버전)"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')

        # 일반적인 article 태그나 main content 찾기
        article = soup.find('article') or soup.find('main') or soup.find('div', class_='content')

        if article:
            # 모든 paragraph 추출
            paragraphs = article.find_all('p')
            content = ' '.join([p.get_text().strip() for p in paragraphs[:10]])  # 처음 10개 단락만
            return content[:2000]  # 최대 2000자

        return ""
    except Exception as e:
        print(f"  ⚠ Failed to fetch article content: {e}")
        return ""


def summarize_with_gemini(article):
    """Gemini API로 뉴스 요약"""
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')

        prompt = f"""
다음 AI 뉴스를 한국어로 요약해주세요. 3-4문장으로 핵심 내용만 간결하게 정리해주세요.

제목: {article['title']}
설명: {article['description']}
본문: {article.get('content', '')}

요약:
"""

        response = model.generate_content(prompt)
        summary = response.text.strip()

        return summary
    except Exception as e:
        print(f"  ⚠ Gemini API error: {e}")
        # Fallback: description 사용
        return article['description'][:300] + "..."


def collect_news():
    """RSS 피드에서 뉴스 수집"""
    print("\n📰 Collecting AI news from RSS feeds...")

    all_articles = []
    seen_titles = set()

    for feed_url in RSS_FEEDS:
        try:
            print(f"\n  Fetching from: {feed_url}")
            feed = feedparser.parse(feed_url)

            for entry in feed.entries[:10]:  # 각 피드에서 최대 10개
                title = entry.get('title', '')
                description = entry.get('summary', '') or entry.get('description', '')
                link = entry.get('link', '')
                published = entry.get('published_parsed') or entry.get('updated_parsed')

                # 중복 체크
                if title in seen_titles:
                    continue

                # AI 관련 뉴스인지 확인
                if not is_ai_related(title, description):
                    continue

                # 날짜 파싱
                if published:
                    pub_date = datetime(*published[:6])
                else:
                    pub_date = datetime.now()

                # 최근 3일 이내 뉴스만
                if (datetime.now() - pub_date).days > 3:
                    continue

                article = {
                    'title': title,
                    'description': description,
                    'link': link,
                    'published': pub_date.isoformat(),
                    'source': feed.feed.get('title', 'Unknown'),
                }

                all_articles.append(article)
                seen_titles.add(title)
                print(f"    ✓ {title[:60]}...")

        except Exception as e:
            print(f"  ❌ Error fetching {feed_url}: {e}")

    print(f"\n✓ Collected {len(all_articles)} unique AI-related articles")
    return all_articles


def summarize_articles(articles):
    """모든 기사 요약"""
    print("\n🤖 Summarizing articles with Gemini...")

    summarized = []

    for i, article in enumerate(articles[:15], 1):  # 최대 15개만 처리
        print(f"  [{i}/{min(15, len(articles))}] Summarizing: {article['title'][:50]}...")

        # 기사 본문 가져오기 (선택적)
        # content = fetch_article_content(article['link'])
        # article['content'] = content

        # Gemini로 요약
        summary = summarize_with_gemini(article)
        article['summary'] = summary

        summarized.append(article)

    print(f"\n✓ Summarized {len(summarized)} articles")
    return summarized


def save_to_firestore(articles):
    """Firestore에 저장"""
    print("\n💾 Saving to Firestore...")

    db = firestore.client()
    today = datetime.now().strftime('%Y-%m-%d')

    # daily_news 컬렉션에 저장
    doc_ref = db.collection('daily_news').document(today)

    doc_data = {
        'date': today,
        'articles': articles,
        'count': len(articles),
        'updated_at': firestore.SERVER_TIMESTAMP
    }

    doc_ref.set(doc_data)
    print(f"✓ Saved {len(articles)} articles for {today}")


def main():
    """메인 실행 함수"""
    print("=" * 60)
    print("🚀 AI News Collection & Summarization Script")
    print("=" * 60)

    # 초기화
    initialize_firebase()
    initialize_gemini()

    # 뉴스 수집
    articles = collect_news()

    if not articles:
        print("\n⚠ No articles collected. Exiting.")
        return

    # 요약
    summarized_articles = summarize_articles(articles)

    if not summarized_articles:
        print("\n⚠ No articles summarized. Exiting.")
        return

    # Firestore 저장
    save_to_firestore(summarized_articles)

    print("\n" + "=" * 60)
    print("✅ News collection completed successfully!")
    print("=" * 60)


if __name__ == "__main__":
    main()
