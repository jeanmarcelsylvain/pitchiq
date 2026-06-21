import { Router } from 'express'
import { body, param, validationResult } from 'express-validator'
import { requireAuth, type AuthRequest } from '../middleware/auth'
import { query } from '../db'

const router = Router()

router.use(requireAuth)

router.get('/', async (req: AuthRequest, res) => {
  try {
    const matches = await query(
      `SELECT * FROM matches WHERE user_id = $1 ORDER BY date DESC LIMIT 100`,
      [req.userId]
    )
    res.json(matches)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch matches' })
  }
})

router.post(
  '/',
  [
    body('date').isISO8601(),
    body('opponent').trim().notEmpty().isLength({ max: 100 }),
    body('position').isIn(['GK','CB','LB','RB','CDM','CM','CAM','LM','RM','LW','RW','CF','ST']),
    body('minutesPlayed').isInt({ min: 0, max: 120 }),
    body('goals').isInt({ min: 0 }),
    body('assists').isInt({ min: 0 }),
    body('passAccuracy').isFloat({ min: 0, max: 100 }),
    body('rating').isFloat({ min: 1, max: 10 }),
  ],
  async (req: AuthRequest, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const {
      date, opponent, competition, venue, result, teamScore, opponentScore,
      position, minutesPlayed, goals, assists, shots, shotsOnTarget,
      passAccuracy, tackles, interceptions, distanceCovered, sprintSpeed, rating, notes,
    } = req.body

    try {
      const [match] = await query(
        `INSERT INTO matches (
          user_id, date, opponent, competition, venue, result, team_score, opponent_score,
          position, minutes_played, goals, assists, shots, shots_on_target,
          pass_accuracy, tackles, interceptions, distance_covered, sprint_speed, rating, notes
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
        RETURNING *`,
        [
          req.userId, date, opponent, competition, venue, result, teamScore, opponentScore,
          position, minutesPlayed, goals, assists, shots ?? 0, shotsOnTarget ?? 0,
          passAccuracy, tackles ?? 0, interceptions ?? 0, distanceCovered ?? 0, sprintSpeed ?? 0, rating, notes,
        ]
      )
      res.status(201).json(match)
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Failed to create match' })
    }
  }
)

router.delete('/:id', param('id').isUUID(), async (req: AuthRequest, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  try {
    await query(
      `DELETE FROM matches WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId]
    )
    res.status(204).send()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete match' })
  }
})

export default router
