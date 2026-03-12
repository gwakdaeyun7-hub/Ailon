"""
Simulated Annealing 시드로 실제 파이프라인 프롬프트를 테스트하는 스크립트.
실제 앱과 동일한 Gemini 모델(gemini-2.5-flash, temp 0.4, json_mode)을 사용합니다.
"""
import json
import sys
import os
from dotenv import load_dotenv

# scripts/ 디렉토리를 path에 추가
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
load_dotenv()

# GEMINI_API_KEY -> GOOGLE_API_KEY 매핑
if not os.getenv("GOOGLE_API_KEY") and os.getenv("GEMINI_API_KEY"):
    os.environ["GOOGLE_API_KEY"] = os.getenv("GEMINI_API_KEY")

from agents.config import get_llm
from langchain_core.messages import HumanMessage

# Simulated Annealing 시드
SEED = {
    "id": "opt_simulated_annealing",
    "discipline": "optimization",
    "discipline_name": "최적화공학",
    "super_category": "공학",
    "principle_name": "담금질 기법",
    "principle_name_en": "Simulated Annealing",
    "ai_connection": "조합 최적화 / 하이퍼파라미터 탐색",
    "ai_connection_en": "Combinatorial Optimization / Hyperparameter Search",
    "problem_solved": "지역 최적해 탈출을 위한 온도 기반 확률적 탐색 전략",
}

# principle_team.py에서 실제 프롬프트 가져오기
from agents.principle_team import _CONTENT_PROMPT

prompt = _CONTENT_PROMPT.format(
    discipline_name=SEED["discipline_name"],
    principle_name=SEED["principle_name"],
    principle_name_en=SEED["principle_name_en"],
    ai_connection=SEED["ai_connection"],
    ai_connection_en=SEED["ai_connection_en"],
    problem_solved=SEED["problem_solved"],
)

print("=" * 80)
print("Simulated Annealing 시드 테스트 — Gemini 2.5 Flash")
print("=" * 80)
print(f"시드: {SEED['principle_name']} ({SEED['principle_name_en']})")
print(f"AI 연결: {SEED['ai_connection']}")
print(f"모델: gemini-2.5-flash, temp=0.4, json_mode=True")
print("=" * 80)
print("\nLLM 호출 중...")

llm = get_llm(temperature=0.4, max_tokens=12288, thinking=False, json_mode=True)
response = llm.invoke([HumanMessage(content=prompt)])

raw = response.content
print(f"\n응답 길이: {len(raw)}자")
print("=" * 80)

# JSON 파싱
try:
    content = json.loads(raw, strict=False)
except json.JSONDecodeError:
    # 코드펜스 제거 시도
    import re
    m = re.search(r'```(?:json)?\s*([\s\S]*?)```', raw)
    if m:
        content = json.loads(m.group(1), strict=False)
    else:
        print("JSON 파싱 실패!")
        print(raw[:2000])
        sys.exit(1)

# 보기 좋게 출력
def section_print(title, data, indent=0):
    prefix = "  " * indent
    if isinstance(data, dict):
        print(f"{prefix}📌 {title}:")
        for k, v in data.items():
            if isinstance(v, dict):
                section_print(k, v, indent + 1)
            elif isinstance(v, list):
                print(f"{prefix}  {k}: {v}")
            else:
                val_str = str(v)
                print(f"{prefix}  {k} ({len(val_str)}자): {val_str}")
    else:
        print(f"{prefix}{title}: {data}")

print("\n📋 TITLE")
print(f"  title ({len(content.get('title',''))}자): {content.get('title')}")
print(f"  title_en: {content.get('title_en')}")

print(f"\n  difficulty: {content.get('difficulty')}")
print(f"  connectionType: {content.get('connectionType')}")
print(f"  readTime: {content.get('readTime')}")
print(f"  keywords: {content.get('keywords')}")
print(f"  keywords_en: {content.get('keywords_en')}")

print("\n" + "─" * 60)
print("🔍 INSIGHT TAB")
print("─" * 60)

# Foundation
f = content.get("foundation", {})
print(f"\n📖 STEP 1: Foundation (원리 발견)")
print(f"  headline ({len(f.get('headline',''))}자): {f.get('headline')}")
print(f"  headline_en: {f.get('headline_en')}")
print(f"  body ({len(f.get('body',''))}자): {f.get('body')}")
print(f"  body_en: {f.get('body_en')}")
print(f"  analogy ({len(f.get('analogy',''))}자): {f.get('analogy')}")
print(f"  analogy_en: {f.get('analogy_en')}")

# Application
a = content.get("application", {})
print(f"\n🧩 STEP 2: Application (AI의 난제)")
print(f"  headline ({len(a.get('headline',''))}자): {a.get('headline')}")
print(f"  headline_en: {a.get('headline_en')}")
print(f"  problem ({len(a.get('problem',''))}자): {a.get('problem')}")
print(f"  problem_en: {a.get('problem_en')}")
print(f"  body ({len(a.get('body',''))}자): {a.get('body')}")
print(f"  body_en: {a.get('body_en')}")
print(f"  mechanism ({len(a.get('mechanism',''))}자): {a.get('mechanism')}")
print(f"  mechanism_en: {a.get('mechanism_en')}")

# Integration
i = content.get("integration", {})
print(f"\n⚡ STEP 3: Integration (현실 임팩트)")
print(f"  headline ({len(i.get('headline',''))}자): {i.get('headline')}")
print(f"  headline_en: {i.get('headline_en')}")
print(f"  body ({len(i.get('body',''))}자): {i.get('body')}")
print(f"  body_en: {i.get('body_en')}")
print(f"  impact ({len(i.get('impact',''))}자): {i.get('impact')}")
print(f"  impact_en: {i.get('impact_en')}")

print("\n" + "─" * 60)
print("📚 DEEP DIVE TAB")
print("─" * 60)

d = content.get("deepDive", {})
print(f"\n🕰️ Original Problem ({len(d.get('originalProblem',''))}자):")
print(f"  {d.get('originalProblem')}")
print(f"  EN: {d.get('originalProblem_en')}")

print(f"\n🌉 Bridge ({len(d.get('bridge',''))}자):")
print(f"  {d.get('bridge')}")
print(f"  EN: {d.get('bridge_en')}")

print(f"\n💡 Core Intuition ({len(d.get('coreIntuition',''))}자):")
print(f"  {d.get('coreIntuition')}")
print(f"  EN: {d.get('coreIntuition_en')}")

print(f"\n📐 Formula:")
print(f"  KO: {d.get('formula')}")
print(f"  EN: {d.get('formula_en')}")

print(f"\n⚠️ Limits ({len(d.get('limits',''))}자):")
print(f"  {d.get('limits')}")
print(f"  EN: {d.get('limits_en')}")

print("\n" + "=" * 80)
print("✅ 테스트 완료")

# 품질 체크
print("\n" + "─" * 60)
print("📊 자동 품질 체크")
print("─" * 60)
issues = []
# headline 길이
for sec in ("foundation", "application", "integration"):
    hl = content.get(sec, {}).get("headline", "")
    if len(hl) > 25:
        issues.append(f"⚠️ {sec}.headline 너무 김 ({len(hl)}자): {hl}")
    if len(hl) < 10:
        issues.append(f"⚠️ {sec}.headline 너무 짧음 ({len(hl)}자): {hl}")
# body 길이
for sec in ("foundation", "application", "integration"):
    bd = content.get(sec, {}).get("body", "")
    if len(bd) > 150:
        issues.append(f"⚠️ {sec}.body 너무 김 ({len(bd)}자)")
    if len(bd) < 50:
        issues.append(f"⚠️ {sec}.body 너무 짧음 ({len(bd)}자)")
# formula 확인 (최적화 = math prefix)
if not d.get("formula"):
    issues.append("❌ formula 없음 (최적화공학은 수식 필수)")
# analogy 메커니즘 체크
analogy = f.get("analogy", "")
if len(analogy) < 20:
    issues.append(f"⚠️ analogy 너무 짧음 ({len(analogy)}자)")
# _en 필드 확인
for sec in ("foundation", "application", "integration"):
    for field in ("headline_en", "body_en"):
        if not content.get(sec, {}).get(field):
            issues.append(f"❌ {sec}.{field} 누락")
# bridge 키워드
bridge = d.get("bridge", "")
if "보존" not in bridge and "변형" not in bridge and "추상" not in bridge and "preserved" not in bridge.lower() and "transform" not in bridge.lower() and "abstract" not in bridge.lower():
    issues.append("⚠️ bridge에 보존/변형/추상화 구분 없음")

if issues:
    for issue in issues:
        print(f"  {issue}")
else:
    print("  ✅ 모든 품질 체크 통과!")
