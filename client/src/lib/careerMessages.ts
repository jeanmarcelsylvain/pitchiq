/* ═══ Career Messages ═════════════════════════════════════════════════════
   Short, calm lines that remind the athlete PitchIQ is documenting a
   career, not just logging matches. Sparingly triggered — never on every
   action. Personalized variants only fire when a real, verified streak or
   trend backs them; otherwise a timeless generic line is used. Nothing is
   ever invented. */

export type CareerMessageTrigger =
  | 'match_logged' | 'training_completed' | 'achievement_unlocked'
  | 'season_start' | 'return_from_injury' | 'personal_record'
  | 'difficult_performance' | 'exceptional_performance' | 'ai_analysis_start'
  | 'viewing_progression'

const GENERIC: Record<CareerMessageTrigger, string[]> = {
  match_logged: [
    'Every match becomes part of your story.',
    'Progress is built one session at a time.',
    "Your statistics tell a story. Make sure it's one worth reading.",
    'Today\'s work creates tomorrow\'s confidence.',
  ],
  training_completed: [
    'Every training session leaves a fingerprint.',
    'Discipline creates freedom.',
    'Train with intention.',
  ],
  achievement_unlocked: [
    'Progress is earned, not given.',
    'Small improvements become elite careers.',
    'One great match is exciting. Many great matches build careers.',
  ],
  season_start: [
    'A new season. The same principles.',
    'Consistency beats intensity.',
    'Trust the process.',
  ],
  return_from_injury: [
    'Recovery is part of the work, not a delay from it.',
    'Patience now is speed later.',
  ],
  personal_record: [
    'Your next breakthrough starts with today\'s work.',
    'The best players measure everything.',
  ],
  difficult_performance: [
    'Growth is rarely linear.',
    'Focus on what you can control.',
    'Development happens before results.',
  ],
  exceptional_performance: [
    'Confidence comes from preparation.',
    'One great match is exciting. Many great matches build careers.',
  ],
  ai_analysis_start: [
    'Improvement compounds.',
    'The best players measure everything.',
  ],
  viewing_progression: [
    'Your future performance is shaped by today\'s habits.',
    'Master the fundamentals.',
  ],
}

let recentlyShown: string[] = []

function pickLine(trigger: CareerMessageTrigger): string {
  const pool = GENERIC[trigger].filter(l => !recentlyShown.includes(l))
  const line = (pool.length ? pool : GENERIC[trigger])[Math.floor(Math.random() * (pool.length ? pool.length : GENERIC[trigger].length))]
  recentlyShown = [line, ...recentlyShown].slice(0, 4)
  return line
}

/* ── Personalization — only reference verified, computed trends ─────────── */
export interface CareerMessageContext {
  ratingStreak5?: number      // matches in a row above season average, ending at the most recent
  passingTrend4?: boolean     // pass accuracy improved for 4 straight matches
  distanceTrend?: boolean     // work rate / distance trending up
}

export function getCareerMessage(trigger: CareerMessageTrigger, ctx?: CareerMessageContext): string {
  if (trigger === 'match_logged' && ctx) {
    if (ctx.ratingStreak5 && ctx.ratingStreak5 >= 3) {
      return `${ctx.ratingStreak5} strong performances in a row. Keep building.`
    }
    if (ctx.passingTrend4) {
      return 'Your passing has improved for four straight matches.'
    }
    if (ctx.distanceTrend) {
      return 'Your work rate continues to improve.'
    }
  }
  return pickLine(trigger)
}
