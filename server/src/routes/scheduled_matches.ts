import { Router } from 'express'
import { requireAuth, type AuthRequest } from '../middleware/auth'
import { query } from '../db'

const router = Router()
router.use(requireAuth)

router.get('/', async (req: AuthRequest, res) => {
  try {
    const rows = await query(`SELECT * FROM scheduled_matches WHERE user_id = $1 ORDER BY date ASC`, [req.userId])
    res.json(rows)
  } catch {
    res.status(500).json({ error: 'Failed to fetch scheduled matches' })
  }
})

router.post('/', async (req: AuthRequest, res) => {
  const { date, opponent, competition, venue, kickoffTime, notes } = req.body
  try {
    const [row] = await query(
      `INSERT INTO scheduled_matches (user_id, date, opponent, competition, venue, kickoff_time, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.userId, date, opponent, competition || '', venue || 'home', kickoffTime || '', notes || '']
    )
    res.status(201).json(row)
  } catch {
    res.status(500).json({ error: 'Failed to create scheduled match' })
  }
})

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await query(`DELETE FROM scheduled_matches WHERE id = $1 AND user_id = $2`, [req.params.id, req.userId])
    res.status(204).send()
  } catch {
    res.status(500).json({ error: 'Failed to delete scheduled match' })
  }
})

export default router
