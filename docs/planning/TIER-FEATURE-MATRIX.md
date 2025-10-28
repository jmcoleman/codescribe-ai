# CodeScribe AI - Tier & Deployment Feature Matrix

**Version:** 2.1 | **Last Updated:** October 27, 2025
**Source of Truth:** [MONETIZATION-STRATEGY.md](../../private/strategic-planning/MONETIZATION-STRATEGY.md)

---

## Quick Reference: What You're Actually Paying For

- ✅ **Volume:** Higher monthly limits (10 → 50 → 200 → 1,000 → unlimited docs)
- ✅ **Support:** Community → Email 48h → Email 24h → Priority Email → Dedicated Slack
- ✅ **Collaboration:** Team workspace, shared templates, integrations (Team+)
- ❌ **NOT Features:** All tiers get all 4 doc types (README, JSDoc, API, ARCHITECTURE)

### Soft Features (Marketing Only - No Technical Difference)
- **"Built-in API Credits"**: All tiers use server's API key (not user's own)
- **"Priority Queue"**: Flag only in v2.1 (all tiers get same speed)

---

## Tier Comparison Matrix

| Feature | Free | Starter | Pro | Team | Enterprise |
|---------|------|---------|-----|------|------------|
| **Price** | $0/mo | $12/mo | $29/mo | $99/mo | Custom |
| **Monthly Docs** | 10 | 50 | 200 | 1,000 | Unlimited |
| **Max File Size** | 100 KB | 500 KB | 1 MB | 5 MB | 50 MB |
| | | | | | |
| **Core Features** | | | | | |
| Doc Types (4) | ✅ All | ✅ All | ✅ All | ✅ All | ✅ All |
| Real-time Streaming | ✅ | ✅ | ✅ | ✅ | ✅ |
| Quality Scoring | ✅ | ✅ | ✅ | ✅ | ✅ |
| Monaco Editor | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mermaid Diagrams | ✅ | ✅ | ✅ | ✅ | ✅ |
| Markdown Export | ✅ | ✅ | ✅ | ✅ | ✅ |
| | | | | | |
| **Soft Features** (Marketing Only) | | | | | |
| "Built-in API Credits" | ❌ | ✅ | ✅ | ✅ | ✅ |
| "Priority Queue" | ❌ | ✅ | ✅ | ✅ | ✅ Dedicated |
| | | | | | |
| **Premium Features** (Phase 3-4) | | | | | |
| Batch Processing | ❌ | ❌ | ⏳ Planned | ✅ 50 files | ✅ Unlimited |
| Custom Templates | ❌ | ❌ | ⏳ Planned | ✅ | ✅ |
| Export Formats | MD only | MD only | ⏳ MD/HTML/PDF | MD/HTML/PDF | MD/HTML/PDF |
| Advanced Parsing | ❌ | ❌ | ⏳ Planned | ✅ | ✅ |
| | | | | | |
| **Collaboration** (Phase 5-6) | | | | | |
| API Access | ❌ | ❌ | ❌ | ✅ REST + CLI | ✅ |
| Team Workspace | ❌ | ❌ | ❌ | ✅ 10 users | ✅ Unlimited |
| Version History | ❌ | ❌ | ❌ | ✅ 90 days | ✅ Unlimited |
| Integrations | ❌ | ❌ | ❌ | ✅ Slack/GitHub/CI | ✅ Custom |
| | | | | | |
| **Enterprise** (Phase 6) | | | | | |
| SSO/SAML | ❌ | ❌ | ❌ | ❌ | ✅ |
| Audit Logs | ❌ | ❌ | ❌ | ❌ | ✅ |
| White Label | ❌ | ❌ | ❌ | ❌ | ✅ |
| On-Premise | ❌ | ❌ | ❌ | ❌ | ✅ |
| SLA | None | None | None | None | 99.9% |
| | | | | | |
| **Support** | | | | | |
| Support Channel | Community | Email | Email | Priority Email | Dedicated Slack |
| Response Time | N/A | 48h | 24h | 24h priority | Real-time |
| Account Manager | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Deployment Options

### Hosted SaaS (codescribeai.com)
**All Tiers Available:** Free, Starter, Pro, Team, Enterprise

| Aspect | Details |
|--------|---------|
| **API Key** | Uses server's API key (included in all tiers) |
| **Volume Limits** | Enforced per tier (10/50/200/1,000/unlimited docs/month) |
| **Data Privacy** | Code processed in-memory only, not stored (auth/usage metadata only) |
| **Infrastructure** | Vercel + Neon Postgres (autoscaling, 99.9% uptime) |
| **Updates** | Automatic (no maintenance required) |
| **Best For** | Individual developers, teams, enterprises (managed solution) |

### Self-Hosted (Open Source)
**Tier:** Effectively "Free Unlimited"

| Aspect | Details |
|--------|---------|
| **API Key** | User provides their own Claude API key (Anthropic account required) |
| **Volume Limits** | None (unlimited docs, limited only by your Claude API costs) |
| **Data Privacy** | Full control (runs on your infrastructure) |
| **Infrastructure** | Node.js + Express (deploy anywhere: Vercel, Railway, Docker, localhost) |
| **Updates** | Manual (git pull + npm install) |
| **Best For** | Cost-conscious developers, privacy-sensitive use cases, high-volume users |
| **Setup** | Clone repo, add `.env` with `CLAUDE_API_KEY`, `npm install`, `npm run dev` |

---

## Key Takeaways

1. **Open Core Philosophy**: All tiers get ALL 4 doc types (README, JSDoc, API, ARCHITECTURE) to drive adoption
2. **Volume-Based Pricing**: You're paying for convenience (docs/month), not features
3. **Soft Features**: "Built-in API credits" and "Priority queue" are marketing language (all tiers technically same in v2.1)
4. **GitLab/Supabase Model**: Generous free tier (10 docs/month) encourages trial → natural upgrade path
5. **Self-Hosting Escape Hatch**: Developers can always clone repo and use own API key for unlimited docs
6. **Deferred Features**: Batch processing, custom templates, export formats planned for Phase 3-4 (Pro+ only)

---

## Revenue Strategy Summary

| Tier | Target User | Conversion Strategy |
|------|-------------|---------------------|
| **Free** | Students, hobby projects | Portfolio-worthy (10 docs), not enough for regular use |
| **Starter** | Active solo developers | 5x volume for $12/mo (convenient for regular use) |
| **Pro** | Power users, consultants | 20x volume for $29/mo + deferred features (Phase 3-4) |
| **Team** | Small dev teams | Collaboration features + shared quota (1,000 docs/mo) |
| **Enterprise** | Large orgs | Compliance + control (SSO, audit logs, white-label, SLA) |

---

**For detailed feature specifications and implementation roadmap, see:**
- [ROADMAP.md](roadmap/ROADMAP.md) - Full development roadmap with epics
- [MONETIZATION-STRATEGY.md](../../private/strategic-planning/MONETIZATION-STRATEGY.md) - Comprehensive pricing strategy (private)
- [tiers.js](../../server/src/config/tiers.js) - Technical tier configuration
