# Success Metrics — PitchIQ

---

## North Star Metric

**Weekly Active Players (WAP):** The number of unique players who either log a match or visit the dashboard in a given week.

*Why:* A player only gets value from PitchIQ if they use it consistently. WAP captures habitual engagement better than MAU (too loose) or DAU (unrealistic — players don't train every day).

---

## Primary Metrics

### Acquisition
| Metric | Definition | Target (Day 90) |
|---|---|---|
| Sign-ups | New accounts created | 1,000 |
| Demo-to-sign-up conversion | % of demo visitors who create an account | > 25% |
| Activation rate | % of sign-ups who log ≥ 1 match within 7 days | > 60% |

### Engagement
| Metric | Definition | Target (Day 90) |
|---|---|---|
| Weekly Active Players | Unique players active in a 7-day window | 500 |
| Matches logged per user/month | Avg across all active users | ≥ 4 |
| Dashboard visits per week | Per WAP | > 3 |
| Goals created per active user | Total / active users | > 2 |
| Insights read rate | Insights opened / insights generated | > 70% |

### Retention
| Metric | Definition | Target |
|---|---|---|
| D7 Retention | % of new users who return within 7 days | > 40% |
| D30 Retention | % who return within 30 days | > 20% |
| 8-week retention | % still logging matches after 8 weeks | > 15% |

### Product Health
| Metric | Definition | Target |
|---|---|---|
| Match log completion rate | % of started logs that are submitted | > 85% |
| API p95 latency | Server response time (95th percentile) | < 200ms |
| Error rate | 5xx responses / total API calls | < 0.1% |
| NPS | Net Promoter Score | > 50 |

---

## Anti-Metrics (Things We Are Watching to NOT Increase)

| Anti-Metric | Why It Matters |
|---|---|
| Time to log a match | If this exceeds 90 seconds, logging becomes a chore and will be skipped |
| Insight skip rate | If players are skipping insights, we're generating noise, not signal |
| Bounce rate on analytics page | Complex charts that don't communicate clearly become a trust problem |

---

## Instrumentation Plan

**Events to track (PostHog / Mixpanel):**

```
match_logged              { position, competition, rating }
insight_viewed            { insight_type, metric }
goal_created              { category }
goal_milestone_reached    { percent_complete }
analytics_chart_viewed    { metric_key }
profile_page_viewed
demo_mode_entered
sign_up_completed         { auth_method }
```

**Key funnels:**
1. Landing → Demo → Sign-up → First match logged (Activation funnel)
2. Dashboard → Analytics → Chart interaction (Depth funnel)
3. Goal created → 50% milestone → 100% complete (Goal completion funnel)

---

## Review Cadence

| Frequency | Review |
|---|---|
| Daily | Error rate, API latency, new sign-ups |
| Weekly | WAP, D7 retention cohort, matches logged |
| Monthly | D30 retention, NPS, feature usage breakdown |
| Quarterly | Full metric review vs targets; roadmap reprioritization |
