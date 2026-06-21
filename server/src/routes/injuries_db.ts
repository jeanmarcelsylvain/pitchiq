import { Router } from 'express'
import { requireAuth, type AuthRequest } from '../middleware/auth'
import { query } from '../db'

const router = Router()
router.use(requireAuth)

router.get('/', async (req: AuthRequest, res) => {
  try {
    const rows = await query(`SELECT * FROM injuries WHERE user_id = $1 ORDER BY created_at DESC`, [req.userId])
    res.json(rows)
  } catch {
    res.status(500).json({ error: 'Failed to fetch injuries' })
  }
})

router.post('/', async (req: AuthRequest, res) => {
  const { date, type, bodyPart, severity, status, plan, conversation } = req.body
  try {
    const [row] = await query(
      `INSERT INTO injuries (user_id, date, type, body_part, severity, status, plan, conversation)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.userId, date || new Date().toISOString().slice(0,10), type, bodyPart || '', severity || 'unknown', status || 'active', plan || '', JSON.stringify(conversation || [])]
    )
    res.status(201).json(row)
  } catch {
    res.status(500).json({ error: 'Failed to create injury' })
  }
})

router.patch('/:id', async (req: AuthRequest, res) => {
  const { status, plan, conversation } = req.body
  try {
    const fields: string[] = []
    const values: unknown[] = []
    let i = 1
    if (status !== undefined) { fields.push(`status = $${i++}`); values.push(status) }
    if (plan !== undefined) { fields.push(`plan = $${i++}`); values.push(plan) }
    if (conversation !== undefined) { fields.push(`conversation = $${i++}`); values.push(JSON.stringify(conversation)) }
    fields.push(`updated_at = NOW()`)
    values.push(req.params.id, req.userId)

    const [row] = await query(
      `UPDATE injuries SET ${fields.join(', ')} WHERE id = $${i++} AND user_id = $${i} RETURNING *`,
      values
    )
    if (!row) return res.status(404).json({ error: 'Not found' })
    res.json(row)
  } catch {
    res.status(500).json({ error: 'Failed to update injury' })
  }
})

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await query(`DELETE FROM injuries WHERE id = $1 AND user_id = $2`, [req.params.id, req.userId])
    res.status(204).send()
  } catch {
    res.status(500).json({ error: 'Failed to delete injury' })
  }
})

export default router
