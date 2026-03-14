#!/bin/bash
# python-syntax-check.sh — PostToolUse hook for Edit|Write
# Runs python -m py_compile after any .py file is modified
# Instant syntax validation — catches indent errors, missing colons, etc.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.filePath // ""')

# Only check Python files
case "$FILE_PATH" in
  *.py)
    ;;
  *)
    exit 0
    ;;
esac

# Normalize path
FILE_PATH=$(echo "$FILE_PATH" | sed 's|\\|/|g')

if [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

# Syntax check (near-instant)
COMPILE_OUTPUT=$(python -m py_compile "$FILE_PATH" 2>&1)
COMPILE_EXIT=$?

if [ $COMPILE_EXIT -ne 0 ]; then
  echo "=== Python Syntax Error ==="
  echo "$COMPILE_OUTPUT"
  exit 2  # Block — syntax errors must be fixed
fi

exit 0
