import { Router } from 'express'
import { requireAuth, type AuthRequest } from '../middleware/auth'
import { query } from '../db'

const router = Router()
router.use(requireAuth)

router.get('/season-stats', async (req: AuthRequest, res) => {
  try {
    const [stats] = await query(
      `SELECT
        COUNT(*)::int AS matches,
        COALESCE(SUM(minutes_played), 0)::int AS minutes_played,
        COALESCE(SUM(goals), 0)::int AS goals,
        COALESCE(SUM(assists), 0)::int AS assists,
        ROUND(AVG(goals)::numeric, 2) AS goals_per_game,
        ROUND(AVG(assists)::numeric, 2) AS assists_per_game,
        ROUND(AVG(pass_accuracy)::numeric, 1) AS avg_pass_accuracy,
        ROUND(AVG(rating)::numeric, 2) AS avg_rating,
        ROUND(AVG(sprint_speed)::numeric, 1) AS avg_sprint_speed,
        ROUND(SUM(distance_covered)::numeric, 1) AS total_distance
      FROM matches WHERE user_id = $1`,
      [req.userId]
    )
    res.json(stats)
  } catch {
    res.status(500).json({ error: 'Failed to fetch season stats' })
  }
})

router.get('/trends/:metric', async (req: AuthRequest, res) => {
  const allowed = ['goals','assists','pass_accuracy','rating','sprint_speed','distance_covered','minutes_played']
  const { metric } = req.params

  if (!allowed.includes(metric)) {
    return res.status(400).json({ error: 'Invalid metric' })
  }

  try {
    const rows = await query(
      `SELECT date, ${metric} AS value FROM matches
       WHERE user_id = $1 ORDER BY date ASC LIMIT 50`,
      [req.userId]
    )
    res.json(rows)
  } catch {
    res.status(500).json({ error: 'Failed to fetch trend data' })
  }
})

router.get('/insights', async (req: AuthRequest, res) => {
  try {
    const [sprintTrend] = await query(
      `SELECT
        ROUND(AVG(sprint_speed) FILTER (WHERE date >= NOW() - INTERVAL '30 days')::numeric, 1) AS recent,
        ROUND(AVG(sprint_speed) FILTER (WHERE date < NOW() - INTERVAL '30 days')::numeric, 1) AS older
       FROM matches WHERE user_id = $1`,
      [req.userId]
    )

    const insights = []

    if (sprintTrend && sprintTrend.recent && sprintTrend.older) {
      const change = ((Number(sprintTrend.recent) - Number(sprintTrend.older)) / Number(sprintTrend.older)) * 100
      if (Math.abs(change) > 3) {
        insights.push({
          type: change > 0 ? 'improvement' : 'warning',
          title: `Sprint Speed ${change > 0 ? 'Up' : 'Down'} ${Math.abs(change).toFixed(1)}%`,
          body: `Your average sprint speed has ${change > 0 ? 'improved' : 'declined'} ${Math.abs(change).toFixed(1)}% compared to the previous period.`,
          metric: 'sprintSpeed',
          changePercent: change,
        })
      }
    }

    res.json(insights)
  } catch {
    res.status(500).json({ error: 'Failed to generate insights' })
  }
})

export default router
