import { Router } from 'express'
import { requireAuth, type AuthRequest } from '../middleware/auth'
import { query } from '../db'

const router = Router()
router.use(requireAuth)

router.get('/', async (req: AuthRequest, res) => {
  try {
    const rows = await query(`SELECT * FROM season_archive WHERE user_id = $1 ORDER BY archived_at DESC`, [req.userId])
    res.json(rows)
  } catch {
    res.status(500).json({ error: 'Failed to fetch seasons' })
  }
})

router.post('/', async (req: AuthRequest, res) => {
  const { name, startDate, endDate, matches, goals, assists, wins, losses, draws, avgRating, highlights } = req.body
  try {
    const [row] = await query(
      `INSERT INTO season_archive (user_id, name, start_date, end_date, matches, goals, assists, wins, losses, draws, avg_rating, highlights)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [req.userId, name, startDate || null, endDate || null, JSON.stringify(matches || []),
       goals || 0, assists || 0, wins || 0, losses || 0, draws || 0, avgRating || 0, highlights || '']
    )
    res.status(201).json(row)
  } catch {
    res.status(500).json({ error: 'Failed to archive season' })
  }
})

export default router
