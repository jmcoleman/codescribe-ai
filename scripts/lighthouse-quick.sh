#!/bin/bash

# Quick Lighthouse Accessibility Audit
# Fast accessibility-only audit with instant results

set -e

echo "🔍 Quick Accessibility Audit"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if lighthouse is installed
if ! command -v lighthouse &> /dev/null; then
    echo -e "${RED}❌ Lighthouse CLI not found${NC}"
    echo ""
    echo "Install with: npm install -g lighthouse"
    exit 1
fi

# Check if server is running
SERVER_URL="http://localhost:5173"
if ! curl -s "$SERVER_URL" > /dev/null 2>&1; then
    echo -e "${RED}❌ Dev server not running at $SERVER_URL${NC}"
    echo ""
    echo "Start dev server: cd client && npm run dev"
    exit 1
fi

echo -e "${GREEN}✅ Dev server is running${NC}"
echo -e "${BLUE}🚀 Running accessibility audit...${NC}"
echo ""

# Run lighthouse with accessibility only
lighthouse "$SERVER_URL" \
    --only-categories=accessibility \
    --output=html \
    --output-path=./lighthouse-reports/accessibility-latest \
    --view

echo ""
echo -e "${GREEN}✅ Audit complete!${NC}"
echo ""
echo "Target: 90+ score for WCAG AA compliance"
