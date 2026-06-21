import { Router } from 'express'
import { requireAuth, type AuthRequest } from '../middleware/auth'
import { query } from '../db'

const router = Router()
router.use(requireAuth)

router.get('/', async (req: AuthRequest, res) => {
  try {
    const [player] = await query(`SELECT * FROM players WHERE user_id = $1`, [req.userId])
    res.json(player ?? null)
  } catch {
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

router.put('/', async (req: AuthRequest, res) => {
  const { name, age, height, weight, dominantFoot, primaryPosition, secondaryPosition, club, jerseyNumber, nationality, bio } = req.body
  try {
    const [player] = await query(
      `INSERT INTO players (user_id, name, age, height, weight, dominant_foot, primary_position, secondary_position, club, jersey_number, nationality, bio)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (user_id) DO UPDATE SET
         name = EXCLUDED.name, age = EXCLUDED.age, height = EXCLUDED.height,
         weight = EXCLUDED.weight, dominant_foot = EXCLUDED.dominant_foot,
         primary_position = EXCLUDED.primary_position, secondary_position = EXCLUDED.secondary_position,
         club = EXCLUDED.club, jersey_number = EXCLUDED.jersey_number,
         nationality = EXCLUDED.nationality, bio = EXCLUDED.bio,
         updated_at = NOW()
       RETURNING *`,
      [req.userId, name, age || null, height || null, weight || null,
       dominantFoot || 'right', primaryPosition || 'CM', secondaryPosition || null,
       club || '', jerseyNumber || null, nationality || null, bio || null]
    )
    res.json(player)
  } catch {
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

export default router
