import { Router, Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'

const router = Router()
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

router.post('/generate', async (req: Request, res: Response) => {
  const { position, daysPerWeek, sessionLength, focusAreas, avgRating, avgPass, avgSpeed, goals, matchCount } = req.body as {
    position: string
    daysPerWeek: number
    sessionLength: number
    focusAreas: string[]
    avgRating: number
    avgPass: number
    avgSpeed: number
    goals: number
    matchCount: number
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'AI not configured' })
  }

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const trainingDays = weekDays.slice(0, daysPerWeek)

  // Spread rest days: if 5 training days, rest on Wednesday and Sunday typically
  const restCount = 7 - daysPerWeek
  const restInsert = restCount > 0 ? `Include ${restCount} rest/recovery day(s) spread throughout the week.` : 'No rest days — this is a high-volume week.'

  const systemPrompt = `You are Coach Marcos, a UEFA Pro License soccer coach and strength & conditioning specialist who has trained players at Championship and La Liga level. You write elite-level individualized training programs that push players to improve.

CRITICAL RULES:
- You MUST output a plan for ALL 7 days of the week, no exceptions
- Every training day must have 5-7 specific exercises/drills — not generic ones
- Name every drill specifically (e.g. "Rondo 4v2 in 10x10 yard box", not "passing drill")
- Give exact sets × reps × duration for every drill (e.g. "4 sets × 12 reps", "6 × 20 yards", "4 minutes")
- Rest days should still include active recovery (light stretching, foam rolling, meditation)
- Drills must be performable solo or with minimal equipment (cones, ball, wall)
- Intensity must actually vary — Low days are genuinely easy, High days are genuinely demanding
- Reference the player's specific stats in the plan where relevant

OUTPUT FORMAT — use EXACTLY this structure for each day, no deviations:

[DAY]
Name: Monday
Intensity: High
Focus: Shooting & Finishing
Duration: 60 min
WarmUp: 5-minute dynamic warm-up — high knees 2×20, butt kicks 2×20, leg swings 10 each side, ball juggling 3 minutes
Main:
• Drill 1 name — description with exact sets/reps (e.g. 4×8 reps, 30 seconds rest between sets)
• Drill 2 name — description with exact sets/reps
• Drill 3 name — description with exact sets/reps
• Drill 4 name — description with exact sets/reps
• Drill 5 name — description with exact sets/reps
CoolDown: 5 minutes static stretching — quads 45s each, hamstrings 45s, hip flexors 60s
CoachNote: One specific coaching cue or mental tip for this day's session
[/DAY]

Repeat [DAY]...[/DAY] block for all 7 days.`

  const userMessage = `Create a complete 7-day weekly training plan for a ${position} with these specs:

Player stats:
- Average match rating: ${avgRating.toFixed(1)}/10
- Pass accuracy: ${avgPass}%
- Sprint speed: ${avgSpeed} km/h
- Goals this season: ${goals} in ${matchCount} matches

Training schedule: ${daysPerWeek} hard training days, ${restInsert}
Session length: ${sessionLength} minutes per training session
Priority focus areas: ${focusAreas.length > 0 ? focusAreas.join(', ') : 'balanced development across all areas'}

Based on this player's stats:
${avgRating < 6.5 ? '- Rating is below average — need consistency drills and decision-making work' : ''}
${avgPass < 75 ? '- Pass accuracy is low — prioritize short passing accuracy and first touch' : ''}
${avgSpeed < 28 ? '- Sprint speed is below average — include acceleration and sprint mechanics work' : ''}
${goals < 3 && matchCount > 5 ? '- Low goal output — finishing and shooting drills are critical' : ''}

Write a plan that will genuinely challenge and improve this player. Be specific, technical, and demanding.`

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    const stream = await client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
      }
    }
    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    res.write(`data: ${JSON.stringify({ error: msg })}\n\n`)
    res.end()
  }
})

export default router
