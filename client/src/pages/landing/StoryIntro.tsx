/* ═══ ACT I — the problem. Dark. Unknown. Potential. ════════════════════════
   Emotional open: statements land one at a time as oversized typography,
   the light slowly warms as "data" enters the story. */
import { useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { color, font } from '@/design/tokens'
import { MaskedLines, Reveal } from '@/design/motion'

const BC = { fontFamily: font.display }
const B  = { fontFamily: font.ui }

export function WhyPitchIQ() {
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  /* light warms from cold indigo to coral as the answer arrives */
  const warmth = useTransform(scrollYProgress, [0.2, 0.8], [0, 0.5])

  return (
    <section ref={ref} className="relative px-6 lg:px-10 overflow-hidden"
      style={{ paddingTop: 'clamp(6rem,12vw,10rem)', paddingBottom: 'clamp(6rem,12vw,10rem)', borderBottom: `1px solid ${color.border}` }}>
      {/* environmental light — cold, then warming */}
      <motion.div aria-hidden className="absolute inset-0 pointer-events-none"
        style={{ opacity: reduced ? 0.3 : warmth, background: 'radial-gradient(ellipse 60% 45% at 75% 60%, rgba(255,90,60,0.1), transparent 70%)' }} />
      <div aria-hidden className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 55% 40% at 20% 20%, rgba(56,64,110,0.25), transparent 70%)' }} />

      <div className="max-w-5xl mx-auto relative">
        <Reveal><p className="uppercase mb-16" style={{ ...BC, fontSize: '0.65rem', letterSpacing: '0.22em', color: color.inkMuted }}>01 / The Problem</p></Reveal>

        <div className="space-y-20">
          <MaskedLines as="h2"
            style={{ ...BC, fontSize: 'clamp(2.25rem,5.5vw,4.5rem)', fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.02em', color: color.inkMuted }}
            lines={['MOST PLAYERS NEVER KNOW WHY', 'THEY DOMINATE ONE WEEKEND', 'AND DISAPPEAR THE NEXT.']} />

          <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-end">
            <MaskedLines as="h2" delay={0.1}
              style={{ ...BC, fontSize: 'clamp(2.25rem,5.5vw,4.5rem)', fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.02em', color: color.inkDim }}
              lines={['THEY RELY ON MEMORY.', <span key="l" style={{ color: 'transparent', WebkitTextStroke: `1.5px ${color.inkDim}` }}>MEMORY LIES.</span>]} />
          </div>

          <div>
            <MaskedLines as="h2" delay={0.1}
              style={{ ...BC, fontSize: 'clamp(3rem,8vw,7rem)', fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.03em', color: color.ink }}
              lines={[<span key="d">DATA <span style={{ color: color.accent }}>DOESN'T.</span></span>]} />
            <Reveal delay={0.35}>
              <p className="mt-10 max-w-md" style={{ ...B, fontSize: '1.05rem', lineHeight: 1.7, color: color.inkDim }}>
                PitchIQ turns every match you play into evidence — so improvement stops being a feeling and starts being a fact.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
