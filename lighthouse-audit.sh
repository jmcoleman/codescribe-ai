#!/bin/bash

# Lighthouse Accessibility Audit Script
# Runs comprehensive Lighthouse audits on CodeScribe AI

set -e

echo "🔍 Lighthouse Accessibility Audit for CodeScribe AI"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if lighthouse is installed
if ! command -v lighthouse &> /dev/null; then
    echo -e "${YELLOW}⚠️  Lighthouse CLI not found. Installing...${NC}"
    npm install -g lighthouse
    echo ""
fi

# Check if server is running
SERVER_URL="http://localhost:5173"
if ! curl -s "$SERVER_URL" > /dev/null 2>&1; then
    echo -e "${RED}❌ Dev server not running at $SERVER_URL${NC}"
    echo ""
    echo "Please start the dev server first:"
    echo "  cd client && npm run dev"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Dev server is running${NC}"
echo ""

# Create reports directory if it doesn't exist
REPORTS_DIR="./lighthouse-reports"
mkdir -p "$REPORTS_DIR"

# Timestamp for report filenames
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "📊 Running Lighthouse audits..."
echo ""

# Function to run audit and parse score
run_audit() {
    local category=$1
    local category_name=$2

    echo -e "${BLUE}Running $category_name audit...${NC}"

    lighthouse "$SERVER_URL" \
        --only-categories="$category" \
        --output=html \
        --output=json \
        --output-path="$REPORTS_DIR/lighthouse-$category-$TIMESTAMP" \
        --chrome-flags="--headless" \
        --quiet

    # Parse score from JSON report
    local score=$(cat "$REPORTS_DIR/lighthouse-$category-$TIMESTAMP.report.json" | \
        grep -o "\"$category\":{\"score\":[0-9.]*" | \
        grep -o "[0-9.]*$" | \
        awk '{print int($1*100)}')

    echo -e "  Score: ${GREEN}$score/100${NC}"
    echo ""

    return $score
}

# Run audits
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Accessibility audit (primary focus)
run_audit "accessibility" "Accessibility"
ACCESSIBILITY_SCORE=$?

# Performance audit
run_audit "performance" "Performance"
PERFORMANCE_SCORE=$?

# Best Practices audit
run_audit "best-practices" "Best Practices"
BEST_PRACTICES_SCORE=$?

# SEO audit
run_audit "seo" "SEO"
SEO_SCORE=$?

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Summary
echo "📋 AUDIT SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
printf "%-20s %s\n" "Accessibility:" "$ACCESSIBILITY_SCORE/100"
printf "%-20s %s\n" "Performance:" "$PERFORMANCE_SCORE/100"
printf "%-20s %s\n" "Best Practices:" "$BEST_PRACTICES_SCORE/100"
printf "%-20s %s\n" "SEO:" "$SEO_SCORE/100"
echo ""

# Overall grade
AVERAGE=$(( (ACCESSIBILITY_SCORE + PERFORMANCE_SCORE + BEST_PRACTICES_SCORE + SEO_SCORE) / 4 ))
printf "%-20s %s\n" "Overall Average:" "$AVERAGE/100"
echo ""

# Pass/fail status
if [ $ACCESSIBILITY_SCORE -ge 90 ]; then
    echo -e "${GREEN}✅ ACCESSIBILITY PASSED${NC} (Target: 90+)"
else
    echo -e "${RED}❌ ACCESSIBILITY NEEDS IMPROVEMENT${NC} (Target: 90+)"
fi
echo ""

# Report locations
echo "📁 Reports saved to:"
echo "   $REPORTS_DIR/"
echo ""
echo "   - lighthouse-accessibility-$TIMESTAMP.report.html"
echo "   - lighthouse-performance-$TIMESTAMP.report.html"
echo "   - lighthouse-best-practices-$TIMESTAMP.report.html"
echo "   - lighthouse-seo-$TIMESTAMP.report.html"
echo ""

# Open accessibility report in browser
echo -e "${BLUE}Opening accessibility report in browser...${NC}"
open "$REPORTS_DIR/lighthouse-accessibility-$TIMESTAMP.report.html" 2>/dev/null || \
    xdg-open "$REPORTS_DIR/lighthouse-accessibility-$TIMESTAMP.report.html" 2>/dev/null || \
    echo "Please open the report manually: $REPORTS_DIR/lighthouse-accessibility-$TIMESTAMP.report.html"

echo ""
echo -e "${GREEN}✅ Audit complete!${NC}"
