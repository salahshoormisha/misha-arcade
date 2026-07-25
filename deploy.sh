#!/usr/bin/env bash
# Deploy the arcade to https://salahshoormisha.github.io/misha-arcade/
#
#   ./deploy.sh "commit message" [paths...]
#   ./deploy.sh                      # just deploy whatever is already committed
#
# Several Claude sessions work in this repo at once, so this script is
# deliberately careful:
#   * it NEVER does `git add -A` — you pass the paths you own, or it commits
#     nothing and simply redeploys. That stops one session from sweeping up
#     another session's half-written files.
#   * it rebases on origin/main before pushing, so concurrent pushes merge
#     instead of rejecting.
#   * it waits for the Pages deployment and, if GitHub leaves a deployment
#     jammed "in progress" (which blocks all later ones), it cancels the stuck
#     one and retries.
set -uo pipefail
cd "$(dirname "$0")" || exit 1

REPO=salahshoormisha/misha-arcade
SITE=https://salahshoormisha.github.io/misha-arcade
MSG=${1:-}
shift 2>/dev/null || true
PATHS=("$@")

say() { printf "\033[35m▸\033[0m %s\n" "$*"; }

# ---- commit only what we were told to ----
if [ -n "$MSG" ]; then
  if [ ${#PATHS[@]} -eq 0 ]; then
    echo "refusing to commit without explicit paths — pass them after the message" >&2
    exit 1
  fi
  git add -- "${PATHS[@]}" || exit 1
  if git diff --cached --quiet; then
    say "nothing staged; skipping commit"
  else
    git commit -qm "$MSG

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>" || exit 1
    say "committed: $(git log --oneline -1)"
  fi
fi

# ---- get on top of whatever the other sessions pushed ----
# Retried: another session can land a commit between our fetch and our push,
# which rejects the push. Re-fetch, re-rebase, try again.
# autostash is essential here: another session almost always has uncommitted
# edits in the tree, and plain `git rebase` refuses to run with those present.
# Autostash sets them aside and puts them back, so their work is preserved.
pushed=0
for try in 1 2 3 4 5; do
  git fetch -q origin main
  if ! git -c rebase.autoStash=true rebase -q origin/main; then
    git rebase --abort 2>/dev/null
    echo "rebase failed against origin/main — likely the same lines changed in two" >&2
    echo "places. Resolve by hand, then re-run. Nothing was pushed." >&2
    exit 1
  fi
  if git push -q origin main 2>/dev/null; then pushed=1; break; fi
  say "push raced with another session (try $try) — rebasing again"
  sleep $((try * 2))
done
[ "$pushed" = 1 ] || { echo "could not push after 5 tries" >&2; exit 1; }
SHA=$(git rev-parse --short HEAD)
say "pushed $SHA"

# ---- wait for Pages, unjamming it if necessary ----
for attempt in $(seq 1 12); do
  sleep 20
  status=$(gh run list --workflow "Deploy arcade to Pages" --limit 1 \
            --json status,conclusion --jq '"\(.[0].status)|\(.[0].conclusion // "-")"' 2>/dev/null)
  state=${status%%|*}; result=${status##*|}
  say "attempt $attempt: run $state $result"

  if [ "$state" = "completed" ] && [ "$result" = "success" ]; then
    sleep 6
    if curl -sf "$SITE/" -o /dev/null; then say "LIVE ✓  $SITE"; exit 0; fi
  fi

  if [ "$state" = "completed" ] && [ "$result" != "success" ]; then
    # the classic jam: an older deployment stuck "in progress" blocks new ones
    say "run did not succeed — clearing any stuck Pages deployment"
    for sha in $(gh api "repos/$REPO/deployments?environment=github-pages&per_page=8" \
                 --jq '.[].sha' 2>/dev/null); do
      st=$(gh api "repos/$REPO/pages/deployments/$sha" --jq '.status' 2>/dev/null)
      if [ "$st" != "deployment_cancelled" ] && [ -n "$st" ]; then
        gh api -X POST "repos/$REPO/pages/deployments/$sha/cancel" >/dev/null 2>&1 \
          && say "cancelled stuck deployment ${sha:0:7}"
      fi
    done
    gh workflow run "Deploy arcade to Pages" >/dev/null 2>&1
  fi
done

echo "deploy did not confirm in time — check: gh run list --workflow 'Deploy arcade to Pages'" >&2
exit 1
