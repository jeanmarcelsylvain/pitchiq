# Product Requirements Document — PitchIQ

**Version:** 1.0  
**Status:** MVP  
**Author:** Product Team  
**Last Updated:** January 2024

---

## Problem Statement

Competitive youth soccer players (ages 14–22) lack access to the data-driven performance analytics that professional clubs use. They track stats in notes apps or spreadsheets — if at all — and receive feedback only during practice. There is no consumer product purpose-built for this demographic that connects raw match data to actionable improvement insights.

**The gap:** Between professional analytics tools (too expensive, too complex) and nothing.

---

## Target User

**Primary:** Competitive youth soccer players aged 14–22  
— ECNL, DA, MLS Next, high school varsity, college club

**Secondary:** Coaches and parents who support player development

---

## Goals

1. Make it effortless for players to log a match in under 60 seconds
2. Surface patterns and insights the player cannot see themselves
3. Keep players engaged across a full season with goals and milestones
4. Position PitchIQ as the "Strava for soccer" — a brand identity built on self-improvement data

---

## Success Metrics

| Metric | Target (90-day post-launch) |
|---|---|
| Weekly Active Users (WAU) | 500+ |
| D7 Retention | > 40% |
| D30 Retention | > 20% |
| Avg matches logged per user per month | > 4 |
| Goals created per active user | > 2 |
| Dashboard visits per week per WAU | > 3 |
| Session-to-insight conversion | > 60% |

---

## Features

### Must Have (MVP)
- User authentication (Google OAuth via Firebase)
- Match logging with 14 trackable fields
- Season dashboard with KPI cards
- Analytics page with interactive charts
- Goal setting and progress tracking
- Performance insights engine (rule-based)
- Player profile
- Responsive design (mobile + desktop)

### Should Have (v1.1)
- Training session logging
- Push notifications for milestones
- Match notes / rich text
- Export to CSV
- Position heatmap placeholder

### Could Have (v2.0)
- AI-generated insights via LLM
- Team/squad profiles
- Recruit profile PDF export
- Video clip linking
- Coach dashboard (read-only view)

### Won't Have (MVP)
- Video analysis
- GPS tracking integration
- Live match tracking
- Social / feed features
- Marketplace

---

## Non-Goals

- We are not building a social network
- We are not replacing club-level coaching software
- We are not targeting recreational players as primary users
- We will not ingest GPS or wearable data in v1

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Low data entry compliance | High | High | Make logging < 60 seconds; autofill where possible |
| User churn after 2 weeks | Medium | High | Weekly email digests; milestone notifications |
| Inaccurate self-reported stats | Medium | Medium | Include notes field; normalize against team data in v2 |
| Firebase cost at scale | Low | Medium | Implement aggressive caching; migrate to Auth0 if needed |
| Competition from Hudl/Catapult | Medium | Medium | Focus on individual player UX, not team management |

---

## Future Opportunities

- **Recruiting Mode:** Generate a shareable URL with a player's season stats for college coaches
- **AI Coach:** LLM-powered weekly video message summarizing trends
- **Marketplace:** Sell personalized training programs based on identified weaknesses
- **API partnerships:** Pull in official match data from league providers (ECNL, MLS Next)
