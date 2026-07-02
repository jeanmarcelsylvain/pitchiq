/* ═══════════════════════════════════════════════════════════════════════════
   PitchIQ Design Tokens — single source of truth.
   Tailwind config mirrors these values; anything rendered with inline styles
   (Landing page, charts, SVG) imports from here so the two never drift.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Color ──────────────────────────────────────────────────────────────── */
export const color = {
  /* Surfaces — rich near-black navy → deep indigo elevation ramp */
  bg:        '#0a0d1c',   // page background (near-black navy)
  surface:   '#10142a',   // raised panels, cards
  surface2:  '#171c38',   // higher elevation (modals, popovers)
  border:    '#252b4d',   // hairline dividers
  borderHi:  '#38406e',   // hovered / focused borders

  /* Brand accent — warm coral-orange */
  accent:      '#ff5a3c',
  accentSoft:  '#ff7a60',
  accentDeep:  '#e03c20',
  accentInk:   '#3a1208', // dark text on accent surfaces

  /* Text */
  ink:       '#f4f1ea',   // primary (soft white)
  inkDim:    '#d5d3e6',   // secondary
  inkMuted:  '#9a97b8',   // tertiary / captions

  /* Semantic support */
  emerald:   '#2dd4a0',   // success / positive deltas (subtle emerald)
  ai:        '#4d9fff',   // electric blue — reserved for AI features only
  warn:      '#ffba08',
  danger:    '#ff4d5e',
} as const

/* ── Typography scale ───────────────────────────────────────────────────── */
export const font = {
  display: '"Barlow Condensed", sans-serif',  // headlines, numbers, labels
  ui:      '"Inter", "Barlow", sans-serif',   // body, controls
  mono:    '"JetBrains Mono", monospace',     // data readouts
} as const

export const type = {
  hero:    { fontFamily: font.display, fontSize: 'clamp(3.5rem, 11vw, 9rem)',   fontWeight: 800, lineHeight: 0.88, letterSpacing: '-0.02em' },
  display: { fontFamily: font.display, fontSize: 'clamp(2.5rem, 6vw, 5rem)',    fontWeight: 800, lineHeight: 0.9,  letterSpacing: '-0.02em' },
  h1:      { fontFamily: font.display, fontSize: 'clamp(2rem, 4vw, 3.5rem)',    fontWeight: 800, lineHeight: 0.92, letterSpacing: '-0.02em' },
  h2:      { fontFamily: font.display, fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 700, lineHeight: 1,    letterSpacing: '-0.01em' },
  h3:      { fontFamily: font.display, fontSize: '1.25rem',                     fontWeight: 700, lineHeight: 1.1,  letterSpacing: '0' },
  bodyLg:  { fontFamily: font.ui,      fontSize: '1.05rem',  fontWeight: 400, lineHeight: 1.7 },
  body:    { fontFamily: font.ui,      fontSize: '0.9rem',   fontWeight: 400, lineHeight: 1.65 },
  caption: { fontFamily: font.ui,      fontSize: '0.75rem',  fontWeight: 400, lineHeight: 1.5 },
  label:   { fontFamily: font.display, fontSize: '0.65rem',  fontWeight: 600, lineHeight: 1, letterSpacing: '0.22em', textTransform: 'uppercase' as const },
  button:  { fontFamily: font.display, fontSize: '0.85rem',  fontWeight: 700, lineHeight: 1, letterSpacing: '0.08em' },
  number:  { fontFamily: font.display, fontWeight: 800, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' as const },
} as const

/* ── Spacing — 8-point system (Tailwind's default scale already is 4/8pt;
      these named stops document the vertical rhythm used across sections) ── */
export const space = {
  sectionY: 'clamp(5rem, 10vw, 8rem)',  // between major sections
  blockY:   '4rem',                     // between blocks within a section
  gutter:   'clamp(1.5rem, 4vw, 2.5rem)',
} as const

/* ── Radii ──────────────────────────────────────────────────────────────── */
export const radius = {
  sm: '6px',    // inputs, badges
  md: '10px',   // buttons, small cards
  lg: '16px',   // cards, panels
  xl: '24px',   // modals, feature panels
  full: '9999px',
} as const

/* ── Shadows — soft, layered, never harsh ───────────────────────────────── */
export const shadow = {
  card:  '0 1px 2px rgba(4,6,16,0.5), 0 8px 32px rgba(4,6,16,0.35)',
  float: '0 4px 12px rgba(4,6,16,0.5), 0 24px 64px rgba(4,6,16,0.45)',
  nav:   '0 1px 0 rgba(37,43,77,0.6), 0 8px 24px rgba(4,6,16,0.35)',
  modal: '0 8px 24px rgba(4,6,16,0.6), 0 48px 96px rgba(4,6,16,0.5)',
  glowAccent: '0 0 24px rgba(255,90,60,0.28)',
  glowAi:     '0 0 24px rgba(77,159,255,0.25)',
} as const

/* ── Motion — one timing language for the entire product ────────────────── */
export const ease = [0.16, 1, 0.3, 1] as [number, number, number, number] // signature curve

export const duration = {
  fast:   0.2,   // micro-interactions: hover, press
  medium: 0.5,   // reveals, state changes
  slow:   0.9,   // section entrances, masked text
} as const

export const spring = {
  snappy:  { type: 'spring' as const, stiffness: 320, damping: 28 },          // modals, toggles
  gentle:  { type: 'spring' as const, stiffness: 160, damping: 24 },          // cards, layout shifts
  elastic: { type: 'spring' as const, stiffness: 260, damping: 18, mass: 0.6 }, // magnetic pull, playful
} as const

export const transition = {
  fast:   { duration: duration.fast,   ease },
  medium: { duration: duration.medium, ease },
  slow:   { duration: duration.slow,   ease },
} as const
