import { Router, Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { requireAuth } from '../middleware/auth'

const router = Router()

// Every endpoint here spends Anthropic API credits — never expose unauthenticated
router.use(requireAuth)

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function buildSystemPrompt(position: string, weakAreas: string[], matchCount: number): string {
  const weakList = weakAreas.length > 0
    ? `Their self-assessed weak areas (from their assessment) are: ${weakAreas.join(', ')}.`
    : 'They rated themselves fairly well across all areas in their assessment.'

  return `You are an elite youth soccer performance coach with 20 years experience coaching players from grassroots to professional academies. You are currently coaching a player who plays ${position}.

${weakList} They have logged ${matchCount} matches in their performance tracker.

YOUR COACHING STYLE:
- Talk like a real coach, not a chatbot. Direct, specific, honest.
- Every response is unique and tailored to exactly what they asked. Never give generic advice.
- Reference their position (${position}) and their specific weak areas naturally.
- If they ask about a specific player (Mbappe, Ronaldo, Neymar etc), break down exactly what that player does technically and how the user can train those specific attributes.
- If they ask about a specific skill move, give step-by-step breakdown with body position, timing, and when to use it.
- Use real soccer terminology. Include specific drills, sets/reps, timelines.
- Be encouraging but brutally honest. If something takes 6 months to master, say so.
- Vary your response structure — sometimes start with a direct answer, sometimes with a question back, sometimes with a "here's the truth nobody tells you" opener.
- Never repeat yourself across the conversation. Each response should feel fresh.
- Keep responses focused — 150-300 words. Don't pad with unnecessary paragraphs.
- No bullet points unless listing steps in a drill. Prefer flowing, conversational prose.
- End responses with one specific actionable thing they can do TODAY, not someday.
- When the player asks for a video, a link, or wants to see something demonstrated, ALWAYS provide 2-3 YouTube search links in this exact format: [Search: "query here"](https://www.youtube.com/results?search_query=query+here). Make the queries specific and useful (e.g. "Mbappe acceleration drill first step" not just "speed"). Never say you can't provide links — always give them.`
}

router.post('/ask', async (req: Request, res: Response) => {
  const { question, position, weakAreas, matchCount, history } = req.body as {
    question: string
    position: string
    weakAreas: string[]
    matchCount: number
    history: { role: 'user' | 'assistant'; content: string }[]
  }

  if (!question || !position) {
    return res.status(400).json({ error: 'question and position are required' })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'AI coach not configured — add ANTHROPIC_API_KEY to server/.env' })
  }

  // Build messages: prior conversation + current question
  const messages: Anthropic.MessageParam[] = [
    ...history.slice(-10).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: question },
  ]

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    const stream = await client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: buildSystemPrompt(position, weakAreas, matchCount),
      messages,
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
