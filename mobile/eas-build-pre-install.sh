#!/bin/bash
echo "=== DEBUG: Current directory ==="
pwd
echo "=== DEBUG: ls of workdir/build ==="
ls -la /home/expo/workingdir/build/ || true
echo "=== DEBUG: ls of workdir/build/mobile ==="
ls -la /home/expo/workingdir/build/mobile/ || true
echo "=== DEBUG: find package.json ==="
find /home/expo/workingdir/build -name "package.json" -maxdepth 3 2>/dev/null || true
echo "=== DEBUG END ==="
