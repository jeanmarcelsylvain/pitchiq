/* ═══ QR Code ══════════════════════════════════════════════════════════════
   Points directly at the athlete's share link — for business cards,
   posters, recruiting packets, and social media. */
import { useState } from 'react'
import { Download } from 'lucide-react'
import { color, font } from '@/design/tokens'
import { qrCodeUrl } from '@/lib/recruitProfile'

const BC = { fontFamily: font.display }
const B  = { fontFamily: font.ui }

export function QRCode({ url, size = 160 }: { url: string; size?: number }) {
  const [loaded, setLoaded] = useState(false)
  const src = qrCodeUrl(url, size * 2)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative rounded-lg overflow-hidden" style={{ width: size, height: size, background: color.bg, border: `1px solid ${color.border}` }}>
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ ...B, fontSize: '0.65rem', color: color.inkMuted }}>
            Generating…
          </div>
        )}
        <img src={src} alt="QR code linking to this player's public profile" width={size} height={size}
          onLoad={() => setLoaded(true)} style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.3s' }} loading="lazy" />
      </div>
      <a href={src} download="pitchiq-profile-qr.png"
        className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ ...BC, color: color.accentSoft }}>
        <Download className="h-3 w-3" /> Download QR
      </a>
    </div>
  )
}
