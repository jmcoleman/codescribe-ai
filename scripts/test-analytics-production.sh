#!/bin/bash
# Analytics Production Diagnostic Script
# Tests analytics tracking in production environment
# Usage: ./scripts/test-analytics-production.sh

set -e

echo "========================================="
echo "Analytics Production Diagnostic"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROD_URL="https://codescribeai.com"
API_URL="${PROD_URL}/api"

echo "Testing production environment: ${PROD_URL}"
echo ""

# Check 1: Health Check
echo "1. Testing API health..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "${API_URL}/health" || echo "000")
HEALTH_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)

if [ "$HEALTH_CODE" == "200" ]; then
  echo -e "${GREEN}✓${NC} API is responding (200 OK)"
else
  echo -e "${RED}✗${NC} API health check failed (HTTP ${HEALTH_CODE})"
  exit 1
fi
echo ""

# Check 2: Test analytics endpoint (should fail without key)
echo "2. Testing analytics endpoint authentication..."
ANALYTICS_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/analytics/track" \
  -H "Content-Type: application/json" \
  -d '{"eventName":"session_start","eventData":{},"sessionId":"test"}' 2>&1 || echo "000")
ANALYTICS_CODE=$(echo "$ANALYTICS_RESPONSE" | tail -n1)

if [ "$ANALYTICS_CODE" == "401" ]; then
  echo -e "${GREEN}✓${NC} Analytics endpoint requires authentication (401 Unauthorized)"
  echo "  This is expected - endpoint is working correctly"
elif [ "$ANALYTICS_CODE" == "200" ]; then
  echo -e "${YELLOW}⚠${NC} Analytics endpoint accepted request without key (200 OK)"
  echo "  WARNING: This should not happen - check server configuration"
else
  echo -e "${RED}✗${NC} Analytics endpoint returned unexpected status (HTTP ${ANALYTICS_CODE})"
  echo "  Response: $(echo "$ANALYTICS_RESPONSE" | head -n-1)"
fi
echo ""

# Check 3: Environment detection
echo "3. Testing production hostname detection..."
if curl -s "${PROD_URL}" | grep -q "codescribeai.com"; then
  echo -e "${GREEN}✓${NC} Production hostname is correct"
else
  echo -e "${YELLOW}⚠${NC} Could not verify production hostname"
fi
echo ""

# Check 4: Instructions for manual testing
echo "========================================="
echo "Manual Testing Steps"
echo "========================================="
echo ""
echo "4. Test with your authentication token:"
echo ""
echo "   a) Login to ${PROD_URL}"
echo "   b) Open browser DevTools (F12) → Console"
echo "   c) Run: localStorage.getItem('codescribe_auth_token')"
echo "   d) Copy the token (without quotes)"
echo ""
echo "   e) Test doc generation:"
echo "      curl -X POST ${API_URL}/generate \\"
echo "        -H \"Authorization: Bearer YOUR_TOKEN_HERE\" \\"
echo "        -H \"Content-Type: application/json\" \\"
echo "        -H \"X-Session-Id: test-session-123\" \\"
echo "        -d '{"
echo "          \"code\": \"function hello() { return \\\"world\\\"; }\","
echo "          \"language\": \"javascript\","
echo "          \"docType\": \"README\""
echo "        }'"
echo ""
echo "   f) Check Vercel logs for errors:"
echo "      - Go to: Vercel Dashboard → Deployments → Latest → Runtime Logs"
echo "      - Search for: \"[DEBUG] doc_generation analytics error:\""
echo ""

echo "5. Check database directly:"
echo ""
echo "   psql \"YOUR_PRODUCTION_POSTGRES_URL\" -c \\"
echo "     \"SELECT event_name, created_at FROM analytics_events \\"
echo "     ORDER BY created_at DESC LIMIT 10;\""
echo ""

echo "========================================="
echo "Environment Variables to Verify"
echo "========================================="
echo ""
echo "In Vercel Dashboard → Settings → Environment Variables (Production):"
echo ""
echo "Server-side (required):"
echo "  - ANALYTICS_API_KEY = <32+ character random string>"
echo "  - POSTGRES_URL = <your production database URL>"
echo ""
echo "Client-side (required):"
echo "  - VITE_ANALYTICS_API_KEY = <same as server ANALYTICS_API_KEY>"
echo ""
echo "To generate API key:"
echo "  openssl rand -base64 32"
echo ""

echo "========================================="
echo "Quick Fixes"
echo "========================================="
echo ""
echo "If events are not appearing:"
echo ""
echo "1. Add missing VITE_ANALYTICS_API_KEY to Vercel:"
echo "   - Get server ANALYTICS_API_KEY value"
echo "   - Add VITE_ANALYTICS_API_KEY with same value"
echo "   - Environment: Production"
echo "   - Save and REDEPLOY (git push won't pick up new env vars!)"
echo ""
echo "2. Verify database migration:"
echo "   cd server"
echo "   POSTGRES_URL=\"<prod-url>\" npm run migrate:status"
echo "   # If migration 046 is missing:"
echo "   POSTGRES_URL=\"<prod-url>\" npm run migrate"
echo ""
echo "3. Check Vercel Runtime Logs for detailed errors"
echo ""

echo "========================================="
echo "For detailed troubleshooting, see:"
echo "docs/troubleshooting/ANALYTICS-PRODUCTION-DEBUGGING.md"
echo "========================================="
