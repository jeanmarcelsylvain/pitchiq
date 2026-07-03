/* ═══ Video Watch — the public face of a shared clip ═════════════════════════
   No login, read-only. Renders whatever the athlete included when they
   generated the link (markers for Coach/Recruiter links, notes only for
   Coach links, nothing extra for Public links). */
import { useParams } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { color, font } from '@/design/tokens'
import { decodeVideoShare, MARKER_META, VIDEO_AUDIENCE_META, formatTime, type VideoAsset } from '@/lib/videoStudio'
import { VideoPlayer } from '@/components/video/VideoPlayer'

const BC = { fontFamily: font.display }
const B = { fontFamily: font.ui }
const MONO = { fontFamily: font.mono }

export default function VideoWatch() {
  const { encoded } = useParams<{ encoded: string }>()
  const data = encoded ? decodeVideoShare(encoded) : null

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: color.bg }}>
        <p style={{ ...B, color: color.inkMuted }}>This video link is invalid or has expired.</p>
      </div>
    )
  }

  const asset: VideoAsset = {
    id: 'shared', title: data.title, type: data.type, url: data.url, source: data.source, embedId: data.embedId,
    date: data.date, opponent: data.opponent, competition: data.competition, tags: [], createdAt: '',
  }

  return (
    <div style={{ background: color.bg, color: color.ink, minHeight: '100vh' }} className="font-sans">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${color.border}` }}>
        <span style={{ ...BC, fontWeight: 800, letterSpacing: '0.08em', fontSize: '0.9rem', color: color.ink }}>PITCHIQ</span>
        <div className="flex items-center gap-1.5" style={{ ...B, fontSize: '0.7rem', color: color.inkMuted }}>
          <ShieldCheck className="h-3.5 w-3.5" style={{ color: color.emerald }} /> {VIDEO_AUDIENCE_META[data.audience].label} Link
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-5 sm:px-6 py-8 sm:py-12 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-white">{data.title}</h1>
          <p style={{ ...B, fontSize: '0.8rem', color: color.inkMuted }} className="mt-1">
            {data.date}{data.opponent ? ` · vs ${data.opponent}` : ''}{data.competition ? ` · ${data.competition}` : ''}
          </p>
        </div>

        <VideoPlayer video={asset} readOnly markers={(data.markers ?? []).map((m, i) => ({ id: `m${i}`, videoId: 'shared', time: m.time, type: m.type, label: m.label, createdAt: '' }))} />

        {data.markers && data.markers.length > 0 && (
          <div className="rounded-2xl p-5" style={{ background: color.surface, border: `1px solid ${color.border}` }}>
            <p style={{ ...BC, fontSize: '0.62rem', letterSpacing: '0.14em', color: color.inkMuted }} className="uppercase mb-3">Marked Moments</p>
            <div className="space-y-1.5">
              {data.markers.map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: MARKER_META[m.type].color }} />
                  <span style={{ ...MONO, fontSize: '0.68rem', color: color.accentSoft }} className="font-bold">{formatTime(m.time)}</span>
                  <span style={{ ...B, fontSize: '0.76rem', color: color.inkDim }}>{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.notes && data.notes.length > 0 && (
          <div className="rounded-2xl p-5" style={{ background: color.surface, border: `1px solid ${color.border}` }}>
            <p style={{ ...BC, fontSize: '0.62rem', letterSpacing: '0.14em', color: color.inkMuted }} className="uppercase mb-3">Notebook</p>
            <div className="space-y-1.5">
              {data.notes.map((n, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span style={{ ...MONO, fontSize: '0.68rem', color: color.accentSoft }} className="font-bold shrink-0">{formatTime(n.time)}</span>
                  <span style={{ ...B, fontSize: '0.76rem', color: color.inkDim }}>{n.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
