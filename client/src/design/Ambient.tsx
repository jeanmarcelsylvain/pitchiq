/* ═══════════════════════════════════════════════════════════════════════════
   Ambient — global atmosphere layer: film grain, soft vignette, a cursor-
   following glow, and slow-breathing radial light. Mounted once at app root.
   All layers are pointer-events: none, GPU-composited, and disabled for
   prefers-reduced-motion where they involve movement.
   ═══════════════════════════════════════════════════════════════════════════ */
import { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'

export function Ambient() {
  const reduced = useReducedMotion()
  const mx = useMotionValue(-400)
  const my = useMotionValue(-400)
  const gx = useSpring(mx, { stiffness: 60, damping: 20, mass: 0.8 })
  const gy = useSpring(my, { stiffness: 60, damping: 20, mass: 0.8 })

  useEffect(() => {
    if (reduced) return
    const move = (e: MouseEvent) => { mx.set(e.clientX - 300); my.set(e.clientY - 300) }
    window.addEventListener('mousemove', move, { passive: true })
    return () => window.removeEventListener('mousemove', move)
  }, [reduced, mx, my])

  return (
    <>
      {/* Slow-breathing ambient light — barely perceptible depth */}
      {!reduced && (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(56,64,110,0.22), transparent 70%)' }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Cursor glow — warm, wide, very faint */}
      {!reduced && (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed z-0 hidden lg:block"
          style={{
            x: gx, y: gy, width: 600, height: 600, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,90,60,0.045) 0%, transparent 65%)',
          }}
        />
      )}

      {/* Film grain — animated via CSS keyframes in index.css */}
      <div aria-hidden className="grain pointer-events-none fixed inset-0 z-[60]" />

      {/* Soft vignette */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[59]"
        style={{ background: 'radial-gradient(ellipse 120% 100% at 50% 50%, transparent 65%, rgba(4,6,16,0.35) 100%)' }}
      />
    </>
  )
}
