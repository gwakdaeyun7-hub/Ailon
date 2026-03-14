#!/bin/bash
# guard-index-bloat.sh — PreToolUse hook for Edit|Write
# Blocks adding new component definitions to index.tsx (already 1500+ lines)
# Reads tool input from stdin JSON

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.filePath // ""')

# Only check index.tsx
case "$FILE_PATH" in
  *mobile/app/\(tabs\)/index.tsx|*mobile/app/%28tabs%29/index.tsx|*mobile/app/\(tabs\)/index.tsx)
    ;;
  *)
    exit 0
    ;;
esac

# Get the new content being written or the new_string being edited
NEW_CONTENT=$(echo "$INPUT" | jq -r '.tool_input.new_string // .tool_input.content // ""')

if [ -z "$NEW_CONTENT" ]; then
  exit 0
fi

# Detect new component/function definitions (const XxxComponent, function XxxComponent, etc.)
# Look for patterns like "const SomeName = (" or "function SomeName(" that indicate new components
if echo "$NEW_CONTENT" | grep -qE '^\s*(const|function|export\s+(const|function))\s+[A-Z][a-zA-Z]+\s*[:=]\s*(\(|React\.|memo|forwardRef)'; then
  echo "BLOCK: index.tsx is 1500+ lines. Do NOT add inline components here."
  echo "Extract new components to mobile/components/feed/ instead."
  echo "See: mobile/CLAUDE.md rule — 'index.tsx ~1500 lines: inline component 추가 금지'"
  exit 2
fi

exit 0
