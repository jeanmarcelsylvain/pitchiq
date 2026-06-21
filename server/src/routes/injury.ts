import { Router, Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'

const router = Router()
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are Dr. Marcus Reid, a sports medicine physician and physiotherapist with 15 years of experience working with elite soccer academies in England and Spain. You specialize in youth athlete injury assessment and recovery planning.

YOUR ROLE IN THIS CONVERSATION:
- First, determine the injury type and gather key diagnostic information through targeted questions
- Ask ONE focused question at a time — never bombard with multiple questions at once
- Listen to their answers and adapt your follow-up questions accordingly
- After gathering enough information (typically 3-5 questions), output a complete recovery plan

WHAT TO ASK ABOUT (pick relevant ones based on injury type):
- Pain level (1-10)
- Exact location (point to where it hurts)
- When and how it happened (mechanism of injury)
- Is there swelling, bruising, or visible deformity?
- Can they bear weight / move the joint normally?
- Did they hear a pop or snap?
- Is pain constant or only on movement?
- How long ago did it happen?

SEVERITY ASSESSMENT:
- Mild (Grade 1): minor discomfort, full ROM, can continue with rest
- Moderate (Grade 2): pain limits movement, some swelling, 2-6 weeks recovery
- Severe (Grade 3): significant pain, major swelling, limited function, may need medical attention, 6+ weeks

RECOVERY PLAN FORMAT (when you have enough info, output this):
Start with: "**ASSESSMENT COMPLETE**"
Then provide:
- **Severity**: Mild / Moderate / Severe + brief explanation
- **⚠️ Medical Attention**: yes or no and why
- **Estimated Recovery Timeline**: specific timeframe
- **Phase 1 – [Name] (days X-Y)**: what to do, exercises, ice/heat protocol
- **Phase 2 – [Name] (days X-Y)**: progressions
- **Phase 3 – [Name] (days X-Y)**: return to training steps
- **Phase 4 – Return to Play (days X-Y)**: criteria to pass before playing again
- **Preventive Exercises**: 3-5 specific exercises to prevent recurrence, with sets/reps
- **Red Flags – See a Doctor If**: list warning signs that need medical care

IMPORTANT:
- Be specific. Name actual exercises (e.g., "Nordic hamstring curls 3x8", "Single-leg calf raises 3x15")
- Give real timelines, not vague ranges
- Always include the prevention section — this is crucial for youth athletes
- Remind them you are an AI and cannot replace in-person medical evaluation for severe injuries
- Talk like a real clinician, not a chatbot`

router.post('/assess', async (req: Request, res: Response) => {
  const { message, history, injuryType } = req.body as {
    message: string
    history: { role: 'user' | 'assistant'; content: string }[]
    injuryType: string
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'AI not configured' })
  }

  const messages: Anthropic.MessageParam[] = [
    ...history.slice(-12).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: message },
  ]

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    const stream = await client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: SYSTEM_PROMPT + (injuryType ? `\n\nThe player has indicated their injury is related to: ${injuryType}` : ''),
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
