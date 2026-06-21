import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import { requireAuth, type AuthRequest } from '../middleware/auth'
import { query } from '../db'

const router = Router()
router.use(requireAuth)

router.get('/', async (req: AuthRequest, res) => {
  try {
    const goals = await query(`SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC`, [req.userId])
    res.json(goals)
  } catch {
    res.status(500).json({ error: 'Failed to fetch goals' })
  }
})

router.post(
  '/',
  [
    body('title').trim().notEmpty().isLength({ max: 200 }),
    body('category').isIn(['scoring','passing','fitness','minutes','training','custom']),
    body('targetValue').isFloat({ min: 0 }),
    body('currentValue').isFloat({ min: 0 }),
    body('unit').trim().notEmpty(),
  ],
  async (req: AuthRequest, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { title, description, category, targetValue, currentValue, unit, deadline } = req.body
    try {
      const [goal] = await query(
        `INSERT INTO goals (user_id, title, description, category, target_value, current_value, unit, deadline)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [req.userId, title, description, category, targetValue, currentValue, unit, deadline || null]
      )
      res.status(201).json(goal)
    } catch {
      res.status(500).json({ error: 'Failed to create goal' })
    }
  }
)

router.patch('/:id/progress', async (req: AuthRequest, res) => {
  const { currentValue } = req.body
  try {
    const [goal] = await query(
      `UPDATE goals SET current_value = $1, completed = (current_value >= target_value), updated_at = NOW()
       WHERE id = $2 AND user_id = $3 RETURNING *`,
      [currentValue, req.params.id, req.userId]
    )
    if (!goal) return res.status(404).json({ error: 'Goal not found' })
    res.json(goal)
  } catch {
    res.status(500).json({ error: 'Failed to update goal' })
  }
})

export default router
