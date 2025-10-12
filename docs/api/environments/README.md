# Postman Environments

This folder contains environment configurations for testing CodeScribe AI API in different environments.

## Available Environments

### Local Development
**File:** `local.postman_environment.json`
- **Base URL:** http://localhost:3000
- **Use for:** Local development and testing
- **Setup:** Start server with `npm run dev`

### Production
**File:** `production.postman_environment.json`
- **Base URL:** https://codescribe-ai.vercel.app
- **Use for:** Testing live production API
- **Note:** Read-only, be careful with destructive operations

### Staging (Optional)
**File:** `staging.postman_environment.json`
- **Base URL:** https://codescribe-ai-staging.vercel.app
- **Use for:** Pre-production testing

## How to Use

### Import Environments

1. Open Postman
2. Click "Environments" (left sidebar)
3. Click "Import"
4. Select environment file(s)
5. Click "Import"

### Switch Environments

1. Click environment dropdown (top right in Postman)
2. Select desired environment
3. Requests will now use that environment's variables

### Variables Available

All environments include:
- `baseUrl` - Server base URL
- `apiPath` - API path prefix (/api)
- `environment` - Environment name

### Using Variables in Requests

In Postman, use double curly braces:
\`\`\`
{{baseUrl}}{{apiPath}}/generate
\`\`\`

This resolves to:
- Local: `http://localhost:3000/api/generate`
- Production: `https://codescribe-ai.vercel.app/api/generate`

## Adding Custom Variables

To add environment-specific variables:

1. Click environment name
2. Click "Edit"
3. Add new variable in "Initial Value" column
4. Save

**Example:**
\`\`\`json
{
  "key": "apiKey",
  "value": "your-api-key-here",
  "type": "secret"
}
\`\`\`

## Security Note

⚠️ **Never commit sensitive values** like API keys or secrets to git.

If you need secrets:
1. Add variable with empty value to committed file
2. Fill in actual value locally in Postman
3. Add `*.postman_environment.json` to `.gitignore` if needed

## Quick Setup

\`\`\`bash
# Import all environments at once
# In Postman: Import → Folder → Select docs/api/environments/
\`\`\`

---

**Need help?** See [API Documentation](../README.md)