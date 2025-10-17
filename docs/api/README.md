# CodeScribe AI - API Documentation

**API Version:** 1.0.0
**Status:** ✅ Production-Ready (Deployment Pending)
**Base URL (Dev):** `http://localhost:3000/api`
**Base URL (Prod):** `https://codescribe-ai.vercel.app/api` _(Coming Day 5)_

## 📋 Overview

The CodeScribe AI API provides AI-powered code documentation generation with real-time streaming, quality scoring, and AST-based code analysis.

**Key Features:**
- 🤖 AI-powered documentation generation (Claude Sonnet 4.5)
- ⚡ Real-time streaming with Server-Sent Events (SSE)
- 📊 Quality scoring on 5 criteria (100-point scale)
- 📝 Multiple documentation types (README, JSDoc, API, ARCHITECTURE)
- 🔒 Rate limiting (10 req/min, 100 req/hour)
- 📁 File upload support (16 file types)
- ✅ Comprehensive testing (133+ tests, 95.81% coverage)

**Quick Links:**
- [API Reference](API-Reference.md) - Complete endpoint specifications
- [Testing Documentation](../testing/) - Test coverage and strategies
- [Architecture Diagrams](../architecture/) - System design overview

---

## 📦 Postman Collection & Environments

### Import Collection
1. Download [CodeScribe-AI.postman_collection.json](./CodeScribe-AI.postman_collection.json)
2. Postman → Import → Select file

## Setup
1. Copy template: `cp local.postman_environment.example.json local.postman_environment.json`
2. Edit `local.postman_environment.json` and add your API key
3. Import into Postman

### Import Environments
1. Navigate to [environments/](./environments/) folder
2. Import desired environment files:
   - **Local:** `local.postman_environment.json`
   - **Production:** `production.postman_environment.json`

### Using Environments
1. Collection imported ✅
2. Environment imported ✅
3. Select environment from dropdown (top-right in Postman)
4. Send requests!

**Variables:**
- `{{baseUrl}}` - Server URL
- `{{apiPath}}` - API path (/api)

See [environments/README.md](./environments/README.md) for details.

## 🚀 Quick Start

\`\`\`bash
# Start local server
npm run dev

# In Postman:
# 1. Select "CodeScribe AI - Local" environment
# 2. Send "Health Check" request
# 3. Should see: {"status":"healthy"}
\`\`\`