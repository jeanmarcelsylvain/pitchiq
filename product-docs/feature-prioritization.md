# Feature Prioritization — PitchIQ

Framework: MoSCoW (Must Have / Should Have / Could Have / Won't Have)  
Prioritization factors: User impact, implementation effort, strategic alignment, retention value

---

## Must Have (MVP — Ship Day 1)

| Feature | Rationale |
|---|---|
| Google OAuth sign-in | Lowest friction for target demographic; Firebase handles it in hours |
| Player profile setup | First personalization step; creates ownership and identity |
| Match logging (14 fields) | Core value prop — without this, there is no product |
| Season dashboard with KPI cards | The "why log" answer — players see data made meaningful immediately |
| Performance rating trend chart | Single most motivating chart: shows improvement over time |
| Goals page with progress bars | Gamification layer that drives return visits |
| Insights engine (rule-based) | Differentiator — turns stats into guidance without requiring AI |
| Analytics page (6 charts) | Lets data-curious players go deeper |
| Responsive mobile design | Target users are teenagers who will open this on a phone post-match |
| PostgreSQL schema + API | Production-grade data layer from day one |

---

## Should Have (v1.1 — Weeks 3–6 post-launch)

| Feature | Rationale |
|---|---|
| Training session logging | Completes the picture: match + training performance together |
| Email digest ("Week in Review") | Highest-ROI retention driver after push notifications |
| Match search + filter | Usability gap once users have > 10 matches |
| Insight read/unread state | Lightweight engagement loop |
| Data export (CSV) | Requested in every user interview; simple to build |
| Position-based performance breakdown | Reveals whether players are better in different positions |
| Goal milestone push notifications | Web Push API; triggers at 50% and 100% completion |

---

## Could Have (v2.0 — Post-PMF)

| Feature | Rationale |
|---|---|
| AI-powered insights (GPT-4 integration) | Significant step up from rule-based; expensive but high WOW factor |
| Shareable recruiting profile | Huge value for ECNL persona; needs polish and privacy controls |
| PDF season summary export | Recruiting use case; strong viral loop potential |
| Coach read-only view | Opens B2B channel; different product motion |
| Team/squad profiles | Network effects; social layer |
| Video clip linking | Hybrid reel + stats profile; complex but high value |
| iOS/Android native app | Push notifications, offline logging; high effort |
| Competition benchmarking | "How do you rank vs other CM players your age?" — aspirational |

---

## Won't Have (Explicitly out of scope for v1)

| Feature | Reason |
|---|---|
| Social feed / follows | Adds complexity; dilutes core value; different product |
| Live match tracking | Hardware dependency; out of scope |
| GPS/wearable integration | Requires API partnerships; 6+ month project |
| Payments / subscriptions | Free at MVP to drive adoption; monetize after retention proven |
| Video analysis AI | Entirely different product category |
| Fantasy soccer integration | Off-brand; different user motivation entirely |
| Multi-language support | Deferred; English-first for US market launch |

---

## Prioritization Decision Log

**Why rule-based insights over AI at MVP?**  
Rule-based insights ship in days. GPT-4 adds latency, cost, and prompt engineering complexity. The insights players need most ("your sprint speed improved 6%") are deterministic, not generative. Ship fast, iterate.

**Why no social features at MVP?**  
Social features require a critical mass of users to be valuable. Building them before product-market fit is premature optimization. Strava didn't launch with segments — it launched with run tracking.

**Why Google OAuth only (not email/password)?**  
Teenagers overwhelmingly prefer OAuth. Password management is friction that kills sign-up conversion. Firebase makes Google OAuth trivial.

**Why PostgreSQL and not Firebase Firestore?**  
Analytics queries (aggregations, trends, time-series) are dramatically easier in SQL. Firebase Firestore is optimized for document reads, not the complex GROUP BY queries PitchIQ needs at scale.
