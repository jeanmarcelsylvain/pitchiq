/* ═══════════════════════════════════════════════════════════════════════════
   PitchIQ Motion System — reusable animation primitives.
   Every component here consumes the shared tokens (ease, duration, spring)
   and respects prefers-reduced-motion. Nothing on the site should animate
   with values that don't come from this file or tokens.ts.
   ═══════════════════════════════════════════════════════════════════════════ */
import { useRef, useState, useEffect, type ReactNode, type CSSProperties } from 'react'
import {
  motion, useInView, useSpring, useMotionValue, useReducedMotion,
} from 'framer-motion'
import { ease, duration, spring } from './tokens'

export { ease, duration, spring }

/* ── Reveal — fade-up + blur-in on scroll. The workhorse entrance. ───────── */
export function Reveal({ children, delay = 0, className = '', y = 36 }: {
  children: ReactNode; delay?: number; className?: string; y?: number
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const reduced = useReducedMotion()
  return (
    <motion.div
      ref={ref}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y, filter: 'blur(6px)' }}
      animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : undefined}
      transition={{ duration: duration.slow, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ── MaskedLines — headline lines rise out of a clipping mask. ───────────── */
export function MaskedLines({ lines, style, delay = 0, as: Tag = 'h1' }: {
  lines: ReactNode[]; style: CSSProperties; delay?: number; as?: 'h1' | 'h2' | 'h3' | 'p'
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const reduced = useReducedMotion()
  return (
    <Tag ref={ref} style={style}>
      {lines.map((line, i) => (
        <span key={i} style={{ display: 'block', overflow: 'hidden' }}>
          <motion.span
            style={{ display: 'block' }}
            initial={reduced ? { opacity: 0 } : { y: '110%' }}
            animate={inView ? { y: 0, opacity: 1 } : undefined}
            transition={{ duration: 1, delay: delay + i * 0.09, ease }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}

/* ── Counter — numbers count up with cubic ease-out once visible. ────────── */
export function Counter({ to, suffix = '', decimals = 0 }: {
  to: number; suffix?: string; decimals?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!inView) return
    const dur = 1800, start = performance.now()
    let raf: number
    const tick = (t: number) => {
      const p = Math.min((t - start) / dur, 1)
      setN((1 - Math.pow(1 - p, 3)) * to)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, to])
  return <span ref={ref}>{decimals ? n.toFixed(decimals) : Math.floor(n).toLocaleString()}{suffix}</span>
}

/* ── Magnetic — element follows the cursor on an elastic spring. ─────────── */
export function Magnetic({ children, strength = 0.25 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: spring.elastic.stiffness, damping: spring.elastic.damping, mass: spring.elastic.mass })
  const sy = useSpring(y, { stiffness: spring.elastic.stiffness, damping: spring.elastic.damping, mass: spring.elastic.mass })
  const reduced = useReducedMotion()
  if (reduced) return <div>{children}</div>
  return (
    <motion.div
      ref={ref}
      style={{ x: sx, y: sy, display: 'inline-block' }}
      onMouseMove={e => {
        const r = ref.current?.getBoundingClientRect()
        if (!r) return
        x.set((e.clientX - (r.left + r.width / 2)) * strength)
        y.set((e.clientY - (r.top + r.height / 2)) * strength)
      }}
      onMouseLeave={() => { x.set(0); y.set(0) }}
    >
      {children}
    </motion.div>
  )
}

/* ── Stagger — reveals children one after another. ───────────────────────── */
export function Stagger({ children, className = '', gap = 0.06 }: {
  children: ReactNode[]; className?: string; gap?: number
}) {
  return (
    <>
      {children.map((child, i) => (
        <motion.div
          key={i}
          className={className}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.medium, delay: gap * i, ease }}
        >
          {child}
        </motion.div>
      ))}
    </>
  )
}
