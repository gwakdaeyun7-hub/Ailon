#!/bin/bash
# pipeline-post-check.sh — PostToolUse hook for Bash
# After running generate_daily.py, scans output for known failure patterns
# and surfaces them as warnings so Claude doesn't need to be told.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# Only trigger on pipeline execution commands
case "$COMMAND" in
  *generate_daily.py*|*news_team.py*|*principle_team.py*|*generate_features.py*)
    ;;
  *)
    exit 0
    ;;
esac

STDOUT=$(echo "$INPUT" | jq -r '.stdout // ""')
STDERR=$(echo "$INPUT" | jq -r '.stderr // ""')
OUTPUT="$STDOUT $STDERR"

WARNINGS=""

# 1. JSON truncation (ranker token_budget issue)
if echo "$OUTPUT" | grep -qi "json.*truncat\|JSONDecodeError\|Expecting.*delimiter\|_parse_llm_json.*recovery"; then
  WARNINGS="$WARNINGS\n[RANKER JSON TRUNCATION] Detected JSON parsing recovery. Check ranker token_budget (currently max(6144, count*150)). If article count grew, budget may need increase."
fi

# 2. Zero articles collected
if echo "$OUTPUT" | grep -qi "0 articles\|no articles\|articles_count.*0\|collected 0"; then
  WARNINGS="$WARNINGS\n[ZERO ARTICLES] Pipeline produced 0 articles. Likely causes: API quota exceeded, network error, or all sources failed scraping."
fi

# 3. Scraping failures
SCRAPE_FAILS=$(echo "$OUTPUT" | grep -ci "scrape.*fail\|scraping.*error\|trafilatura.*error\|fetch.*fail" || true)
if [ "$SCRAPE_FAILS" -gt 3 ]; then
  WARNINGS="$WARNINGS\n[SCRAPING] $SCRAPE_FAILS scraping failures detected. Check source availability and trafilatura config."
fi

# 4. Category bias — industry_business dominance
if echo "$OUTPUT" | grep -oP 'industry_business[:\s]*\d+' | grep -oP '\d+' | while read count; do
  # This is informational, not blocking
  if [ "$count" -gt 70 ]; then
    echo "HIGH_BIAS"
  fi
done | grep -q "HIGH_BIAS"; then
  WARNINGS="$WARNINGS\n[CATEGORY BIAS] industry_business appears >70%. Check if mega-event or prompt drift. (Normal range: 50-65%, warning at 60%+)"
fi

# 5. AI filter anomalies
if echo "$OUTPUT" | grep -qi "ai_filter.*removed.*0\|filter.*passed.*100%"; then
  WARNINGS="$WARNINGS\n[AI FILTER] Filter removed 0 articles or passed 100%. Tom's Hardware filter may be misconfigured."
fi

# 6. Principle pipeline fallback triggered
if echo "$OUTPUT" | grep -qi "curated.*pool.*exhaust\|llm.*fallback\|no.*curated.*file"; then
  WARNINGS="$WARNINGS\n[PRINCIPLE FALLBACK] Curated pool may be exhausted. LLM fallback triggered or no curated file found. Add more curated .md files to scripts/curated_principles/."
fi

# 7. Gemini API errors
if echo "$OUTPUT" | grep -qi "429.*quota\|resource.*exhaust\|rate.*limit\|gemini.*error"; then
  WARNINGS="$WARNINGS\n[API QUOTA] Gemini API quota/rate limit hit. Check usage dashboard."
fi

if [ -n "$WARNINGS" ]; then
  echo "=== Pipeline QA Warnings ==="
  echo -e "$WARNINGS"
  echo ""
  echo "Review these issues before proceeding. See scripts/CLAUDE.md for known issue details."
fi

exit 0
