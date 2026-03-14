---
name: Principle content specificity feedback
description: "[DORMANT — curated 전용 모드 전환으로 LLM 생성 비활성화 (2026-03-14)] User (SA expert) found Gemini outputs too abstract. Prompt was strengthened but is now unused."
type: feedback
---

**STATUS: DORMANT** — 2026-03-14부터 학문스낵이 curated 전용 모드로 전환되어 LLM 생성이 비활성화됨. 아래 내용은 LLM 생성 폴백이 재활성화될 때만 적용됨.

Gemini 2.5 Flash generates principle content that is too abstract even when guided to include "physical/mathematical mechanism." The root cause is that directives like "include the mechanism" are ignored unless accompanied by **structural checklists with numbered mandatory elements**.

**Why:** An SA expert pointed out that foundation.body described SA purely from optimization perspective without physical metallurgy content. Similarly coreIntuition lacked Metropolis criterion variables.

**How to apply (LLM 폴백 재활성화 시):** When modifying principle pipeline prompts, always add numbered checklist items that are verifiable by the verifier.
