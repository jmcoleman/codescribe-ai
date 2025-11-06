# Community Support Strategy

**Purpose:** Planning guide for launching community support channels
**Status:** 📋 Planning Phase
**Created:** November 5, 2025
**Last Updated:** November 5, 2025

---

## Executive Summary

Community support provides a scalable, cost-effective way to help Free and Starter tier users while building user engagement. This document outlines when to launch, which platform to choose, and how to manage community growth.

**Key Decision Points:**
- Launch when you have **100+ active users** OR **5+ support requests/week**
- Start with **Discord** (easiest for dev tools) or **GitHub Discussions** (if open-source)
- Dedicated community manager needed at **1,000+ users**

---

## Current State (v2.5.3)

### Support Tiers (All Authenticated Users)

| Tier | Response Time | Channel | Status |
|------|--------------|---------|--------|
| **Enterprise/Team** | 24-48 hours | Email (priority) | ✅ Active |
| **Pro** | 2-3 business days | Email | ✅ Active |
| **Starter** | 3-5 business days | Email | ✅ Active |
| **Free** | 5-7 business days | Email | ✅ Active |

### What We Have
- ✅ Support form with file attachments (authenticated users only)
- ✅ Tier-based response time expectations
- ✅ Email triage system (subject line badges: `[PRO]`, `[FREE]`, etc.)
- ✅ Visual tier badges in support emails for prioritization

### What We Don't Have Yet
- ❌ Community forum/channel
- ❌ Self-service knowledge base
- ❌ User-to-user support
- ❌ Public FAQ/troubleshooting guides

---

## When to Launch Community Support

### Trigger Metrics

Launch community support when you hit **ANY** of these thresholds:

#### Primary Triggers (Launch Now)
1. **100+ Active Users** (30-day active)
   - Enough critical mass for community engagement
   - Users can help each other
   - Common questions emerge

2. **5+ Support Requests Per Week**
   - Shows consistent demand
   - Indicates need for scalable support
   - Email support becoming time-consuming

#### Secondary Triggers (Consider Launching)
3. **Repetitive Questions**
   - Same 5-10 questions asked repeatedly
   - Clear patterns in support tickets
   - Good candidates for FAQ/community answers

4. **Feature Requests Piling Up**
   - Users want to discuss roadmap
   - Need feedback/voting mechanism
   - Community can help prioritize

5. **User Engagement Signals**
   - Users asking to connect with other users
   - Social media discussions about your product
   - GitHub issues becoming discussion threads

---

## Platform Options

### Option 1: Discord (Recommended for Dev Tools) ⭐

**Best For:** Developer tools, SaaS products, indie hackers

**Pros:**
- ✅ **Zero cost** (free tier is generous)
- ✅ **Easy setup** (15 minutes to launch)
- ✅ **Real-time chat** (fast responses)
- ✅ **Popular with devs** (low friction to join)
- ✅ **Built-in moderation** (auto-mod, roles, permissions)
- ✅ **Rich features** (voice, screen share, threads, forums)
- ✅ **Mobile apps** (iOS/Android)
- ✅ **Bots/integrations** (GitHub, analytics, auto-welcome)

**Cons:**
- ❌ **Not searchable by Google** (content siloed)
- ❌ **Fast-moving** (older discussions get buried)
- ❌ **Notification overload** (can be noisy)
- ❌ **Less formal** (casual vibe, not great for official docs)

**Recommended Structure:**
```
📢 announcements (read-only, releases/updates)
❓ general-help
🐛 bug-reports
💡 feature-requests
🚀 showcase (user projects)
💬 off-topic
```

**Cost:** Free (unlimited users, messages, channels)

**Time to Launch:** 15-30 minutes

---

### Option 2: GitHub Discussions (Best for Open Source)

**Best For:** Open-source projects, technical products with GitHub presence

**Pros:**
- ✅ **Free** (if you have a public repo)
- ✅ **Searchable** (indexed by Google)
- ✅ **Integrated** (GitHub issues, PRs, releases)
- ✅ **Familiar** (devs already have GitHub accounts)
- ✅ **Structured** (categories, tags, upvotes)
- ✅ **Long-form** (markdown support, code blocks)
- ✅ **No separate platform** (one less thing to manage)

**Cons:**
- ❌ **Requires public repo** (or public discussions on private repo)
- ❌ **Less real-time** (async only, no live chat)
- ❌ **Limited features** (no voice, screen share, DMs)
- ❌ **GitHub-only** (excludes non-GitHub users)

**Recommended Categories:**
- 💬 General Discussion
- ❓ Q&A
- 💡 Ideas / Feature Requests
- 📣 Announcements
- 🎉 Show and Tell

**Cost:** Free

**Time to Launch:** 5 minutes (if repo is public)

---

### Option 3: Discourse (Self-Hosted Forum)

**Best For:** Established products, companies wanting full control

**Pros:**
- ✅ **Professional** (traditional forum format)
- ✅ **Searchable** (SEO-friendly, Google indexed)
- ✅ **Full control** (own your data, custom domain)
- ✅ **Rich features** (badges, trust levels, moderation)
- ✅ **Single Sign-On** (integrate with your auth)
- ✅ **Long-term archive** (content doesn't disappear)

**Cons:**
- ❌ **Cost** ($100-300/month hosted, or self-host)
- ❌ **Setup time** (1-2 days for customization)
- ❌ **Maintenance** (updates, security, backups)
- ❌ **Higher friction** (users need to create account)
- ❌ **Slower growth** (not where users already are)

**Cost:**
- **Hosted (Standard):** $100/month (official Discourse hosting)
- **Hosted (Business):** $300/month (priority support, SSO)
- **Self-hosted:** $10-50/month (VPS + domain + SSL)

**Time to Launch:** 1-2 days (configuration + customization)

---

### Option 4: Slack Community (Alternative to Discord)

**Best For:** B2B SaaS, enterprise products, professional communities

**Pros:**
- ✅ **Professional** (workplace tool, taken seriously)
- ✅ **Organized** (channels, threads, search)
- ✅ **Integrations** (Zapier, webhooks, bots)
- ✅ **Mobile apps** (iOS/Android)

**Cons:**
- ❌ **Message limits** (10K message history on free tier)
- ❌ **Costly** (paid plans for full history: $7.25/user/month)
- ❌ **Fatigue** (users already in work Slacks)
- ❌ **Less popular** (for community vs workplace)

**Cost:**
- **Free:** 10K message history, 10 integrations
- **Pro:** $7.25/user/month, unlimited history

**Time to Launch:** 30 minutes

---

### Option 5: Hybrid Approach (Discord + GitHub Discussions)

**Best For:** Products targeting developers with both casual and technical users

**Strategy:**
- **Discord:** Real-time help, casual discussions, announcements
- **GitHub Discussions:** Long-form Q&A, feature requests, bug reports

**Pros:**
- ✅ **Best of both worlds** (real-time + searchable)
- ✅ **Still free** (both platforms are free)
- ✅ **Different audiences** (Discord for quick help, GitHub for deep dives)

**Cons:**
- ❌ **Split community** (need to manage both)
- ❌ **Duplicate effort** (monitoring two channels)
- ❌ **Confusing** (where do users go first?)

---

## Recommendation Matrix

| Users | Support Requests/Week | Best Platform | Why |
|-------|----------------------|---------------|-----|
| 0-50 | 0-2 | ❌ **Wait** | Too early, focus on product |
| 50-100 | 2-5 | 🟡 **Consider Discord** | If users are asking for community |
| 100-500 | 5-15 | ✅ **Launch Discord** | Critical mass for engagement |
| 500-1000 | 15-30 | ✅ **Discord or Discord + GitHub** | Consider hybrid if open-source |
| 1000+ | 30+ | ✅ **Discord + GitHub OR Discourse** | Need robust, searchable solution |

---

## Launch Plan: Discord (Recommended First Step)

### Phase 1: Setup (Day 1)
1. **Create Discord Server** (15 minutes)
   - Server name: "CodeScribe AI Community"
   - Server icon: Your logo
   - Verification level: Medium (email required)

2. **Create Channels** (15 minutes)
   ```
   WELCOME & INFO
   ├── 📢 announcements (read-only)
   └── 📋 rules (read-only)

   SUPPORT
   ├── ❓ general-help
   └── 🐛 bug-reports

   COMMUNITY
   ├── 💡 feature-requests
   ├── 🚀 showcase
   └── 💬 off-topic
   ```

3. **Set Permissions** (10 minutes)
   - Create `@Moderator` role
   - Create `@Team` role (for you/your team)
   - Set `#announcements` to read-only

4. **Add Bots** (30 minutes)
   - **MEE6** (auto-mod, welcome messages, leveling)
   - **GitHub Bot** (post new releases, issues)
   - **Statbot** (analytics: active users, message counts)

### Phase 2: Launch (Days 2-3)
1. **Write Welcome Message** (30 minutes)
   - Pin in `#announcements`
   - Include: Community guidelines, how to get help, useful links

2. **Create FAQs** (1 hour)
   - Pin in `#general-help`
   - Cover top 5-10 common questions

3. **Announce to Users** (1 hour)
   - In-app banner (if possible)
   - Email to existing users
   - Tweet/social media
   - Add link to footer and support modal

### Phase 3: Seed Community (Weeks 1-2)
1. **Invite Beta Users** (manually invite 10-20 engaged users)
2. **Post Daily** (at least 1 message/day to keep it active)
3. **Welcome New Members** (first 100 members get personal greeting)
4. **Answer Questions Fast** (< 1 hour response time in first 2 weeks)

---

## Integration with Support Modal

Once community is launched, update [ContactSupportModal.jsx](../../client/src/components/ContactSupportModal.jsx):

### Free/Starter Tier Banner
Add a "Join Community" link for Free/Starter users:

```jsx
{/* Response Time Banner */}
<div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${responseTimeInfo.bgColor} ${responseTimeInfo.borderColor} mb-5`}>
  <div className="flex items-center gap-2">
    <span className={`text-xs font-semibold ${responseTimeInfo.textColor}`}>
      {responseTimeInfo.badge}
    </span>
  </div>
  <span className={`text-xs ${responseTimeInfo.textColor}`}>
    Response within {responseTimeInfo.time}
  </span>
</div>

{/* Community Link for Free/Starter Users */}
{(user?.tier === 'free' || user?.tier === 'starter') && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
    <p className="text-sm text-blue-800 mb-2">
      💬 <strong>Want faster help?</strong> Join our active Discord community!
    </p>
    <a
      href="https://discord.gg/codescribeai"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
    >
      Join Discord Community →
    </a>
  </div>
)}
```

---

## Growth & Moderation

### Early Stage (0-500 members)
- **You** handle moderation (15-30 min/day)
- Respond to every question
- Welcome new members personally
- No automation needed yet

### Growth Stage (500-2000 members)
- **Recruit 2-3 volunteer moderators** (active community members)
- Set up auto-moderation (MEE6, spam filters)
- Create FAQs and pin common answers
- Weekly community spotlight/highlights

### Established Stage (2000+ members)
- **Hire part-time community manager** ($2K-5K/month)
- Structured onboarding for new members
- Regular events (AMAs, office hours, webinars)
- Community metrics dashboard

---

## Success Metrics

Track these metrics to measure community health:

### Engagement Metrics
- **Daily Active Users (DAU)** - Should be 10-20% of total members
- **Messages Per Day** - Healthy: 20-50 for <500 members, 100+ for 1000+
- **Response Time** - Average time until first reply (target: < 2 hours)
- **Unanswered Questions** - Target: < 5% go unanswered

### Quality Metrics
- **User-to-User Support %** - Target: 30%+ (users helping each other)
- **Question Resolution Rate** - Target: 80%+ marked as solved
- **Member Retention** - % of members active after 30 days (target: 40%+)

### Business Metrics
- **Support Email Reduction** - Track if community reduces email volume
- **Feature Request Voting** - Gather product feedback
- **User Retention** - Do community members churn less?

---

## Migration Path

If you start with Discord and need to upgrade later:

### Discord → Discourse
- Export Discord channel history (use DiscordChatExporter)
- Import to Discourse (use migration tools)
- Keep Discord for real-time, Discourse for archive
- Takes 1-2 weeks for full migration

### Discord → Discord + GitHub
- Add GitHub Discussions (5 minutes)
- Cross-post important threads
- Use Discord for support, GitHub for feature requests
- Can run in parallel indefinitely

---

## Decision Framework

Use this flowchart to decide:

```
Do you have 100+ active users OR 5+ support requests/week?
├─ NO → Wait, focus on product
└─ YES → Do you have a public GitHub repo?
    ├─ YES → Start with GitHub Discussions (free, 5 min setup)
    │         Need real-time chat? → Add Discord
    └─ NO → Start with Discord (free, 15 min setup)
              Need searchable archive? → Add Discourse later

Do you have 1000+ users?
└─ YES → Consider hiring part-time community manager
          Evaluate Discord + GitHub Discussions vs Discourse
```

---

## Action Items (When Ready to Launch)

- [ ] Choose platform (Discord recommended)
- [ ] Set up server/forum
- [ ] Create channels/categories
- [ ] Write welcome message and guidelines
- [ ] Add to support modal (Free/Starter tier banner)
- [ ] Add to footer
- [ ] Announce to existing users
- [ ] Invite 10-20 beta users
- [ ] Monitor daily for first 2 weeks
- [ ] Track engagement metrics

---

## Resources

### Discord
- [Discord Community Guidelines](https://discord.com/community-guidelines)
- [Building a Discord Community](https://discord.com/community)
- [Discord Bot List](https://top.gg/)

### GitHub Discussions
- [GitHub Discussions Docs](https://docs.github.com/en/discussions)
- [Best Practices](https://docs.github.com/en/discussions/guides/best-practices-for-community-conversations-on-github)

### Discourse
- [Discourse Hosting](https://www.discourse.org/pricing)
- [Self-Hosting Guide](https://github.com/discourse/discourse/blob/main/docs/INSTALL.md)
- [Discourse Admin Guide](https://meta.discourse.org/)

---

## Related Documentation

- [ContactSupportModal.jsx](../../client/src/components/ContactSupportModal.jsx) - Support form implementation
- [emailService.js](../../server/src/services/emailService.js) - Email triage system
- [EMAIL-RATE-LIMITING.md](../security/EMAIL-RATE-LIMITING.md) - Support email quotas

---

**Last Updated:** November 5, 2025
**Version:** 1.0.0
**Status:** Planning Phase
