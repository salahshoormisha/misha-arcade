#!/bin/bash
# Commit-only checkpoint loop. Protects agent work against a session limit.
#
# NAMED PATHS ONLY — several Claude sessions work in this repo and `git add -A`
# has already once swept up another session's half-written files. Never push:
# pushing is the human-visible action and stays with the main session.
cd /Users/mishasalahshoor/cbai-ops/misha-arcade || exit 1
PATHS=(core/data core/registry.js core/arcade.js core/ui.js core/style.css games
       _build/checkpoint.sh _build/RESUME.md)
while true; do
  sleep 90
  # _build python sources and small text artefacts, but never the raw binaries
  EXTRA=$(git status --porcelain _build 2>/dev/null \
          | awk '{print $2}' \
          | grep -E '\.(py|tsv|md)$|_build/trivia_parts/' || true)
  if git add -- "${PATHS[@]}" $EXTRA 2>/dev/null; then
    if ! git diff --cached --quiet; then
      n=$(git diff --cached --name-only | wc -l | tr -d ' ')
      git commit -q -m "checkpoint ($n files) [auto]" 2>/dev/null && echo "$(date +%H:%M:%S) committed $n"
    fi
  fi
done
