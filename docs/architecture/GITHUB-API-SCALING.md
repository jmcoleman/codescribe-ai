# GitHub API Scaling Guide

**Status:** Current implementation uses server-side token (v2.7.8+)
**Last Updated:** November 14, 2025

---

## Current Implementation

### Architecture
All GitHub API requests use a **single server-side token** configured in `server/.env`:

```bash
GITHUB_TOKEN=ghp_your_token_here
```

**Code Location:** `server/src/services/githubService.js:16`

### Rate Limits

| Configuration | Requests/Hour | Shared Across |
|--------------|---------------|---------------|
| No token | 60 | All users |
| With token | 5,000 | All users |

### Request Consumption per Repository Load

Each repository load consumes:
- **1 request** - Fetch branches (`/repos/:owner/:repo/branches`)
- **1 request** - Fetch tree (`/repos/:owner/:repo/git/trees/:sha`)
- **1 request per file preview** - Fetch file content (`/repos/:owner/:repo/contents/:path`)

**Example:** Loading a repo and previewing 3 files = 5 API requests

---

## When to Scale

### Monitor These Signals

1. **Rate limit errors in logs:** `429 Too Many Requests` errors
2. **Usage metrics:** Track requests/hour in production
3. **User reports:** "Failed to load from GitHub" errors

### Capacity Planning

**Current capacity (5,000/hour):**
- ~83 requests/minute shared across all users
- Supports ~50-100 concurrent users with moderate usage
- Heavy users (10+ file previews/minute) reduce capacity quickly

**Triggers for scaling:**
- Consistent rate limit errors during peak hours
- More than 100 active users
- Heavy usage patterns (CI/CD integrations, automation)

---

## Scaling Options

### Option 1: Server Token (Current) ✅

**Good for:**
- MVP and early growth
- <100 concurrent users
- Moderate usage patterns

**Pros:**
- Simple implementation
- No user permission requirements
- Works immediately

**Cons:**
- Shared rate limit across all users
- Single point of failure
- Doesn't scale infinitely

**Implementation:** Already complete

---

### Option 2: Request Caching

**Good for:**
- Reducing redundant API calls
- Extending server token capacity 3-5x
- Improving response times

**Strategy:**

```javascript
// Cache repository metadata with TTL
{
  "facebook/react:main:branches": [...], // TTL: 10 minutes
  "facebook/react:main:tree": {...},     // TTL: 10 minutes
  "facebook/react:main:README.md": {...} // TTL: 5 minutes
}
```

**Implementation Options:**
1. **In-memory cache** (Node.js Map) - Simple, loses data on restart
2. **Redis** - Production-grade, persistent, shared across instances

**Estimated Impact:**
- Reduces API calls by 60-80% for popular repositories
- Extends capacity from 5,000/hour to 15,000-25,000 effective requests

**Code Changes:**
1. Add caching layer in `server/src/services/githubService.js`
2. Cache keys: `${owner}/${repo}:${ref}:${endpoint}`
3. TTL: 5-10 minutes for tree/branches, 5 minutes for files

---

### Option 3: Per-User GitHub Tokens

**Good for:**
- Scaling beyond 1,000 concurrent users
- When caching isn't enough
- Enterprise deployments

**How It Works:**
1. Request GitHub OAuth scope: `repo` (private repos) or `public_repo` (public only)
2. Store user's GitHub access token in database (encrypted)
3. Use user's token for GitHub API requests
4. Each user gets their own 5,000/hour limit

**Pros:**
- Scales infinitely (each user = separate rate limit)
- No shared bottleneck
- Access to private repositories (if `repo` scope)

**Cons:**
- Requires additional OAuth permissions (user friction)
- Privacy concerns (storing GitHub tokens)
- More complex error handling (invalid/expired tokens)
- Users without GitHub accounts can't use feature

**Implementation Steps:**

1. **Update GitHub OAuth App:**
   ```javascript
   // Add scope to OAuth request
   const scopes = 'user:email,public_repo'; // or 'repo' for private
   ```

2. **Store Token:**
   ```sql
   ALTER TABLE users ADD COLUMN github_token TEXT ENCRYPTED;
   ```

3. **Update githubService.js:**
   ```javascript
   async fetchTree(owner, repo, ref, userToken = null) {
     const octokit = new Octokit({
       auth: userToken || process.env.GITHUB_TOKEN
     });
     // ... rest of implementation
   }
   ```

4. **Pass User Token from Frontend:**
   ```javascript
   // Frontend sends user's stored token in request
   await githubService.fetchTree(owner, repo, ref);
   ```

5. **Fallback Strategy:**
   - Try user token first
   - Fall back to server token if user doesn't have one
   - Handle expired tokens gracefully

**Security Considerations:**
- Encrypt tokens at rest (use database encryption)
- Don't log tokens
- Allow users to revoke access
- Add to data export (GDPR compliance)

---

## Recommended Scaling Path

### Phase 1: Current (v2.7.8) ✅
- Server token only
- Monitor rate limit usage

### Phase 2: Add Caching (100-500 users)
- Implement Redis caching
- 5-10 minute TTL for metadata
- Monitor cache hit rates

### Phase 3: Per-User Tokens (500+ users)
- Add GitHub OAuth scope
- Store user tokens
- Fall back to server token
- Monitor per-user vs server token usage

---

## Monitoring

### Add to Production Logging

```javascript
// Log rate limit status after each GitHub API call
const remaining = response.headers['x-ratelimit-remaining'];
const reset = response.headers['x-ratelimit-reset'];

if (remaining < 100) {
  console.warn(`[GitHub API] Low rate limit: ${remaining} remaining`);
}
```

### Metrics to Track

1. **API requests/hour** - Total GitHub API calls
2. **Rate limit remaining** - Current headroom
3. **429 errors** - Rate limit exceeded errors
4. **Cache hit rate** - If caching implemented
5. **Active users/hour** - Concurrent usage patterns

---

## Related Files

- **Service:** `server/src/services/githubService.js` - GitHub API client
- **Routes:** `server/src/routes/api.js` - GitHub endpoints
- **Frontend:** `client/src/services/githubService.js` - API calls
- **Components:** `client/src/components/GitHubLoader/` - UI components

---

## References

- [GitHub REST API Rate Limits](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting)
- [GitHub OAuth Scopes](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps)
- [Octokit.js Documentation](https://github.com/octokit/octokit.js)
