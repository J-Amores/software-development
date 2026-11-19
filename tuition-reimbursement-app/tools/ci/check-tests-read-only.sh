#!/usr/bin/env bash
# Tests are the specification: during implementation they are read-only (ADR 0008).
# A commit that changes an existing test file and production code together is how a
# failing build gets "fixed" by weakening the test that caught the problem, so CI
# refuses it. Changing a test on its own, with the reason in the message, is fine,
# and so is adding a new test alongside code.
set -euo pipefail

range=${1:-}
if [ -z "$range" ]; then
  echo "usage: $0 <git-range>   (for example origin/main...HEAD)" >&2
  exit 64
fi

is_test() {
  case "$1" in
    */src/test/*|*/e2e/*) return 0 ;;
    *.test.ts|*.test.tsx|*Test.java|*Tests.java|*.spec.ts|*.spec.tsx) return 0 ;;
    *) return 1 ;;
  esac
}

is_production() {
  case "$1" in
    tuition-reimbursement-app/backend/src/main/*|tuition-reimbursement-app/web/src/*) return 0 ;;
    *) return 1 ;;
  esac
}

offences=0
for commit in $(git rev-list --no-merges "$range"); do
  changed_tests=""
  changed_code=""
  while read -r status path; do
    # An added file is a new test, not a changed one.
    [ "$status" = "A" ] && continue
    if is_test "$path"; then
      changed_tests="$changed_tests $path"
    elif is_production "$path"; then
      changed_code="$changed_code $path"
    fi
  done < <(git diff-tree --no-commit-id --name-status -r "$commit")

  if [ -n "$changed_tests" ] && [ -n "$changed_code" ]; then
    offences=$((offences + 1))
    echo "✗ $(git log -1 --format='%h %s' "$commit")"
    echo "    changes existing tests:$changed_tests"
    echo "    and production code:$changed_code"
  fi
done

if [ "$offences" -gt 0 ]; then
  cat >&2 <<'WHY'

A test changes only when its requirement changes or it is shown to be wrong, and
then in its own commit, made before the related code change, with a message
saying why (ADR 0008). Split these commits.
WHY
  exit 1
fi
echo "No commit changes an existing test and production code together."
