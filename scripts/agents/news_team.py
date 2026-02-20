"""
뉴스 수집 파이프라인 — LangGraph 없이 단순 수집 + 번역

1. 14개 소스에서 RSS 수집 (각 10개)
2. og:image 추출 (병렬)
3. 영어 기사 한국어 번역 (display_title + summary)
4. 결과 반환
"""

import json
from langchain_core.messages import HumanMessage
from agents.config import get_llm
from agents.tools import SOURCES, fetch_all_sources, enrich_images


# ─── 한국어 감지 ───
def _is_korean(text: str) -> bool:
    if not text:
        return False
    return sum(1 for ch in text if '\uac00' <= ch <= '\ud7a3') >= 2


# ─── JSON 파싱 유틸리티 ───
def _parse_llm_json(text: str):
    import re
    text = text.strip()
    text = re.sub(r'^```(?:json)?\s*\n?', '', text)
    text = re.sub(r'\n?```\s*$', '', text)
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    for start_char, end_char in [('[', ']'), ('{', '}')]:
        start_idx = text.find(start_char)
        if start_idx == -1:
            continue
        depth = 0
        in_string = False
        escape_next = False
        for i, ch in enumerate(text[start_idx:], start=start_idx):
            if escape_next:
                escape_next = False
                continue
            if ch == '\\' and in_string:
                escape_next = True
                continue
            if ch == '"':
                in_string = not in_string
            if not in_string:
                if ch == start_char:
                    depth += 1
                elif ch == end_char:
                    depth -= 1
                    if depth == 0:
                        try:
                            return json.loads(text[start_idx:i + 1])
                        except json.JSONDecodeError:
                            break

    raise json.JSONDecodeError("No valid JSON found", text, 0)


# ─── 번역 ───
def translate_articles(sources: dict[str, list[dict]]) -> None:
    """영어 기사의 title/description을 한국어로 번역 (in-place)"""
    # 한국어 소스는 그대로, 영어 소스만 번역
    to_translate: list[dict] = []
    for articles in sources.values():
        for a in articles:
            if a.get("lang") == "ko":
                # 한국어: display_title = title, summary = description
                a["display_title"] = a["title"]
                a["summary"] = a["description"][:300] if a["description"] else ""
            else:
                to_translate.append(a)

    if not to_translate:
        print("  [번역] 영어 기사 없음, 번역 스킵")
        return

    print(f"  [번역] 영어 기사 {len(to_translate)}개 한국어 번역 중...")
    llm = get_llm(temperature=0.3, max_tokens=4096)

    batch_size = 10
    for batch_start in range(0, len(to_translate), batch_size):
        batch = to_translate[batch_start:batch_start + batch_size]

        batch_text = ""
        for i, a in enumerate(batch):
            batch_text += (
                f"\n[{i+1}] 제목: {a['title']}\n"
                f"     설명: {a['description'][:200]}\n"
            )

        prompt = f"""다음 {len(batch)}개의 영어 AI 뉴스를 한국어로 번역해주세요.

## 규칙
- display_title: 한국어 제목 (30자 이내, 핵심을 전달하되 클릭 유도)
- summary: 한국어 요약 (100-200자)

OUTPUT ONLY VALID JSON ARRAY (no markdown):
[{{"index": 1, "display_title": "...", "summary": "..."}}]

{batch_text}"""

        try:
            response = llm.invoke([HumanMessage(content=prompt)])
            results = _parse_llm_json(response.content)
            if isinstance(results, dict):
                results = next((v for v in results.values() if isinstance(v, list)), [])
            if isinstance(results, list):
                for r in results:
                    if not isinstance(r, dict):
                        continue
                    idx = r.get("index", 1) - 1
                    if 0 <= idx < len(batch):
                        if r.get("display_title"):
                            batch[idx]["display_title"] = r["display_title"]
                        if r.get("summary"):
                            batch[idx]["summary"] = r["summary"]
            translated = len([a for a in batch if a.get("display_title")])
            print(f"    배치 {batch_start//batch_size + 1}: {translated}/{len(batch)}개 번역 완료")
        except Exception as e:
            print(f"    [WARNING] 번역 배치 실패: {e}")

    # 번역 안전망: display_title이 비어있으면 원문 title 사용
    for a in to_translate:
        if not a.get("display_title"):
            a["display_title"] = a["title"]
        if not a.get("summary"):
            a["summary"] = a["description"][:300] if a["description"] else ""


# ─── 메인 파이프라인 ───
def run_news_pipeline() -> dict:
    """
    뉴스 수집 파이프라인 실행
    반환: { sources: {key: [articles]}, source_order: [...], total_count: N }
    """
    print("=" * 60)
    print("[START] 뉴스 수집 파이프라인 (14개 소스)")
    print("=" * 60)

    # 1. 수집
    sources = fetch_all_sources()

    # 2. 이미지 보강
    enrich_images(sources)

    # 3. 번역
    translate_articles(sources)

    # 4. 결과 정리
    source_order = [s["key"] for s in SOURCES]
    total = sum(len(v) for v in sources.values())
    img_count = sum(
        1 for arts in sources.values() for a in arts if a.get("image_url")
    )

    print(f"\n[DONE] 뉴스 수집 파이프라인 완료")
    print(f"  총 기사: {total}개 | 이미지: {img_count}개")
    for s in SOURCES:
        arts = sources.get(s["key"], [])
        imgs = len([a for a in arts if a.get("image_url")])
        print(f"  {s['name']}: {len(arts)}개 (이미지 {imgs}개)")

    return {
        "sources": sources,
        "source_order": source_order,
        "total_count": total,
    }
