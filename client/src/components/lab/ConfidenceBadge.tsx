/* ═══ Confidence & Quality Badges ═════════════════════════════════════════
   Consistent visual treatment for confidence levels and recommendation
   quality across every Performance Lab module. */
import { font } from '@/design/tokens'
import { CONFIDENCE_LABEL, QUALITY_LABEL, QUALITY_COLOR, type ConfidenceLevel, type RecommendationQuality } from '@/lib/aiTrust'

const BC = { fontFamily: font.display }

const CONFIDENCE_COLOR: Record<ConfidenceLevel, string> = {
  very_high: '#2dd4a0',
  high: '#4d9fff',
  moderate: '#ffba08',
  limited: '#ff8a5c',
  insufficient: '#ff4d5e',
}

export function ConfidenceBadge({ level, compact }: { level: ConfidenceLevel; compact?: boolean }) {
  const c = CONFIDENCE_COLOR[level]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5" style={{ background: `${c}18`, border: `1px solid ${c}40` }}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
      <span style={{ ...BC, fontSize: compact ? '0.6rem' : '0.65rem', fontWeight: 700, color: c, letterSpacing: '0.02em' }}>
        {CONFIDENCE_LABEL[level]}
      </span>
    </span>
  )
}

export function QualityBadge({ quality }: { quality: RecommendationQuality }) {
  const c = QUALITY_COLOR[quality]
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5" style={{ background: `${c}18`, border: `1px solid ${c}40` }}>
      <span style={{ ...BC, fontSize: '0.6rem', fontWeight: 700, color: c }}>{QUALITY_LABEL[quality]}</span>
    </span>
  )
}
