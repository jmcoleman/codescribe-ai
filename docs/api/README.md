# CodeScribe AI - API Documentation

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