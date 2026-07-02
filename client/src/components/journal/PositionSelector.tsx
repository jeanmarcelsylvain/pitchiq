/* ═══ Position Selector — pitch, not a dropdown ══════════════════════════
   Tap/click a spot on a real pitch to set position. Large touch targets,
   smooth selection animation, works identically on mobile and desktop. */
import { motion } from 'framer-motion'
import { color, font, ease } from '@/design/tokens'
import type { Position } from '@/types'

const BC = { fontFamily: font.display }

const COORDS: Record<Position, [number, number]> = {
  GK: [50, 6], CB: [50, 20], LB: [16, 24], RB: [84, 24],
  CDM: [50, 40], CM: [50, 52], CAM: [50, 65],
  LM: [16, 52], RM: [84, 52], LW: [16, 78], RW: [84, 78],
  CF: [50, 84], ST: [50, 91],
}

const ORDER: Position[] = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'CF', 'ST']

export function PositionSelector({ value, onChange, suggested }: {
  value: Position; onChange: (p: Position) => void; suggested?: Position
}) {
  return (
    <div>
      <div className="relative mx-auto w-full max-w-[320px] rounded-lg overflow-hidden"
        style={{ aspectRatio: '68/100', background: 'linear-gradient(180deg, #0f1830, #0a0d1c)', border: `1px solid ${color.border}` }}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
          <rect x="2" y="2" width="96" height="96" fill="none" stroke={color.border} strokeWidth="0.5" />
          <line x1="2" y1="50" x2="98" y2="50" stroke={color.border} strokeWidth="0.5" />
          <circle cx="50" cy="50" r="9" fill="none" stroke={color.border} strokeWidth="0.5" />
          <rect x="22" y="2" width="56" height="16" fill="none" stroke={color.border} strokeWidth="0.5" />
          <rect x="22" y="82" width="56" height="16" fill="none" stroke={color.border} strokeWidth="0.5" />
        </svg>

        {ORDER.map(pos => {
          const [x, y] = COORDS[pos]
          const isActive = pos === value
          const isSuggested = pos === suggested && !isActive
          return (
            <button key={pos}
              type="button"
              onClick={() => onChange(pos)}
              aria-label={`Set position to ${pos}${isSuggested ? ' (suggested — you usually play here)' : ''}`}
              aria-pressed={isActive}
              className="absolute flex items-center justify-center rounded-full transition-colors focus-visible:scale-110"
              style={{
                left: `${x}%`, top: `${100 - y}%`, transform: 'translate(-50%,-50%)',
                width: 40, height: 40,
                background: isActive ? color.accent : isSuggested ? 'rgba(255,90,60,0.12)' : 'rgba(37,43,77,0.7)',
                border: `2px solid ${isActive ? color.accent : isSuggested ? 'rgba(255,90,60,0.5)' : color.border}`,
              }}>
              {isActive && (
                <motion.span aria-hidden layoutId="position-ring" className="absolute inset-0 rounded-full"
                  style={{ boxShadow: `0 0 0 4px rgba(255,90,60,0.18)` }}
                  transition={{ duration: 0.35, ease }} />
              )}
              <span style={{ ...BC, fontSize: '0.62rem', fontWeight: 800, color: isActive ? color.bg : color.inkDim }}>
                {pos}
              </span>
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-center" style={{ fontFamily: font.ui, fontSize: '0.78rem', color: color.inkMuted }}>
        {suggested && suggested !== value
          ? <>Tap a position — you usually play <strong style={{ color: color.accentSoft }}>{suggested}</strong>.</>
          : 'Tap the pitch to set your position.'}
      </p>
    </div>
  )
}
