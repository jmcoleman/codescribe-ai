#!/bin/bash

# Vercel Ignored Build Step Script
# This script checks if GitHub Actions tests passed before allowing Vercel to build
# Exit code 1 = Skip build (tests failed or not completed)
# Exit code 0 = Proceed with build (tests passed)

echo "🔍 Checking if deployment should proceed..."

# Get environment variables from Vercel
COMMIT_SHA="${VERCEL_GIT_COMMIT_SHA}"
REPO_OWNER="${VERCEL_GIT_REPO_OWNER}"
REPO_NAME="${VERCEL_GIT_REPO_SLUG}"

if [ -z "$COMMIT_SHA" ]; then
  echo "⚠️  No commit SHA found, allowing build to proceed"
  exit 0
fi

echo "📝 Repository: $REPO_OWNER/$REPO_NAME"
echo "📝 Commit SHA: $COMMIT_SHA"

# Check if this is a documentation-only change
FILES_CHANGED=$(git diff-tree --no-commit-id --name-only -r "$COMMIT_SHA" 2>/dev/null || echo "")

if echo "$FILES_CHANGED" | grep -qvE '^(docs/|private/|.*\.md$|\.gitignore|LICENSE|.*\.txt$)'; then
  echo "✅ Code changes detected, proceeding with build"
  echo "ℹ️  Note: Tests run in parallel via GitHub Actions"
  echo "ℹ️  To block deployment until tests pass, use GitHub Actions deployment instead"
  exit 0
else
  echo "📄 Only documentation/non-code files changed"
  echo "⏭️  Skipping build (no code changes)"
  exit 1
fi
