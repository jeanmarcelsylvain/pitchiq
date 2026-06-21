import { Router } from 'express'
import { requireAuth, type AuthRequest } from '../middleware/auth'
import { query } from '../db'

const router = Router()
router.use(requireAuth)

router.get('/latest', async (req: AuthRequest, res) => {
  try {
    const [row] = await query(
      `SELECT * FROM training_plans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.userId]
    )
    res.json(row ?? null)
  } catch {
    res.status(500).json({ error: 'Failed to fetch training plan' })
  }
})

router.post('/', async (req: AuthRequest, res) => {
  const { plan, rawText, position, days, duration } = req.body
  try {
    const [row] = await query(
      `INSERT INTO training_plans (user_id, plan, raw_text, position, days, duration)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.userId, JSON.stringify(plan || []), rawText || '', position || null, days || 5, duration || 60]
    )
    res.status(201).json(row)
  } catch {
    res.status(500).json({ error: 'Failed to save training plan' })
  }
})

export default router
