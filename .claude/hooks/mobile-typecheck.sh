#!/bin/bash
# mobile-typecheck.sh — PostToolUse hook for Edit|Write
# Runs tsc --noEmit on mobile/ after any .ts/.tsx file is modified
# Fast (<5s) incremental check, only on mobile source files

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.filePath // ""')

# Only check mobile TypeScript files
case "$FILE_PATH" in
  *mobile/*.ts|*mobile/*.tsx)
    ;;
  *)
    exit 0
    ;;
esac

# Find the mobile directory from the file path
MOBILE_DIR=$(echo "$FILE_PATH" | sed 's|/mobile/.*|/mobile|')

# Normalize Windows paths for bash
MOBILE_DIR=$(echo "$MOBILE_DIR" | sed 's|\\|/|g')

# Check if tsconfig exists
if [ ! -f "$MOBILE_DIR/tsconfig.json" ]; then
  exit 0
fi

# Run type check (timeout 15s to avoid blocking)
cd "$MOBILE_DIR" 2>/dev/null || exit 0
TSC_OUTPUT=$(timeout 15 npx tsc --noEmit 2>&1)
TSC_EXIT=$?

if [ $TSC_EXIT -ne 0 ]; then
  # Count errors
  ERROR_COUNT=$(echo "$TSC_OUTPUT" | grep -c "error TS" || true)

  # Show only errors related to the edited file (not pre-existing ones)
  BASENAME=$(basename "$FILE_PATH")
  RELEVANT=$(echo "$TSC_OUTPUT" | grep -A1 "$BASENAME" || true)

  if [ -n "$RELEVANT" ]; then
    echo "=== TypeScript Errors in $BASENAME ==="
    echo "$RELEVANT"
    echo ""
    echo "($ERROR_COUNT total errors in project — showing only relevant ones)"
  fi
fi

exit 0
