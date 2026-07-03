/* ═══ Video Player — the review desk ═════════════════════════════════════════
   Direct video files (mp4/webm URLs) get full frame-accurate control: play,
   speed, frame stepping, PiP, fullscreen, keyboard shortcuts, and a
   click-to-seek timeline with markers. YouTube/Vimeo embeds get the
   platform's own player chrome — we don't fake programmatic control we
   don't have (no IFrame API integration yet), and say so plainly rather
   than showing dead buttons. */
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import {
  Play, Pause, Volume2, VolumeX, Maximize, PictureInPicture2,
  SkipBack, SkipForward, Gauge, Bookmark as BookmarkIcon,
} from 'lucide-react'
import { color, font } from '@/design/tokens'
import type { VideoAsset, Marker } from '@/lib/videoStudio'
import { MARKER_META, formatTime } from '@/lib/videoStudio'

const BC = { fontFamily: font.display }
const B  = { fontFamily: font.ui }
const MONO = { fontFamily: font.mono }

export interface VideoPlayerHandle {
  seek: (t: number) => void
  getTime: () => number
  play: () => void
  pause: () => void
}

interface Props {
  video: VideoAsset
  markers?: Marker[]
  onTimeUpdate?: (t: number, duration: number) => void
  onSeekMode?: (active: boolean) => void
  overlay?: React.ReactNode
  readOnly?: boolean
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, Props>(function VideoPlayer(
  { video, markers = [], onTimeUpdate, overlay, readOnly }, ref
) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [rate, setRate] = useState(1)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showRateMenu, setShowRateMenu] = useState(false)
  const isDirect = video.source === 'direct'

  useImperativeHandle(ref, () => ({
    seek: (t: number) => { if (videoRef.current) videoRef.current.currentTime = t },
    getTime: () => videoRef.current?.currentTime ?? 0,
    play: () => videoRef.current?.play(),
    pause: () => videoRef.current?.pause(),
  }))

  useEffect(() => {
    const v = videoRef.current
    if (!v || !isDirect) return
    const onTime = () => { setTime(v.currentTime); onTimeUpdate?.(v.currentTime, v.duration || 0) }
    const onMeta = () => setDuration(v.duration || 0)
    v.addEventListener('timeupdate', onTime)
    v.addEventListener('loadedmetadata', onMeta)
    v.addEventListener('play', () => setPlaying(true))
    v.addEventListener('pause', () => setPlaying(false))
    return () => { v.removeEventListener('timeupdate', onTime); v.removeEventListener('loadedmetadata', onMeta) }
  }, [isDirect, onTimeUpdate])

  useEffect(() => {
    if (readOnly) return
    const handler = (e: KeyboardEvent) => {
      if (!isDirect || !videoRef.current) return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      const v = videoRef.current
      if (e.key === ' ') { e.preventDefault(); v.paused ? v.play() : v.pause() }
      else if (e.key === 'ArrowRight') { v.currentTime = Math.min(duration, v.currentTime + 5) }
      else if (e.key === 'ArrowLeft') { v.currentTime = Math.max(0, v.currentTime - 5) }
      else if (e.key === '.') { v.pause(); v.currentTime = Math.min(duration, v.currentTime + 1 / 30) }
      else if (e.key === ',') { v.pause(); v.currentTime = Math.max(0, v.currentTime - 1 / 30) }
      else if (e.key === 'f') { containerRef.current?.requestFullscreen?.() }
      else if (e.key === 'm') { v.muted = !v.muted; setMuted(v.muted) }
      else if (e.key === ']') setRate(r => { const nr = Math.min(2, r + 0.25); if (v) v.playbackRate = nr; return nr })
      else if (e.key === '[') setRate(r => { const nr = Math.max(0.25, r - 0.25); if (v) v.playbackRate = nr; return nr })
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isDirect, duration, readOnly])

  const togglePlay = () => { const v = videoRef.current; if (!v) return; v.paused ? v.play() : v.pause() }
  const toggleMute = () => { const v = videoRef.current; if (!v) return; v.muted = !v.muted; setMuted(v.muted) }
  const setSpeed = (r: number) => { setRate(r); if (videoRef.current) videoRef.current.playbackRate = r; setShowRateMenu(false) }
  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture()
      else if (videoRef.current) await videoRef.current.requestPictureInPicture()
    } catch { /* PiP unsupported in this browser — silently ignore */ }
  }
  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen()
    else containerRef.current?.requestFullscreen?.()
  }
  const seekTo = (t: number) => { if (videoRef.current) videoRef.current.currentTime = t }

  return (
    <div className="space-y-3">
      <div ref={containerRef} className="relative rounded-2xl overflow-hidden" style={{ background: '#000', aspectRatio: '16/9' }}>
        {isDirect ? (
          <video ref={videoRef} src={video.url} className="h-full w-full" playsInline
            aria-label={`${video.title} video player`} />
        ) : video.source === 'youtube' ? (
          <iframe className="h-full w-full" src={`https://www.youtube.com/embed/${video.embedId}`}
            title={video.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen />
        ) : (
          <iframe className="h-full w-full" src={`https://player.vimeo.com/video/${video.embedId}`}
            title={video.title} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
        )}

        {isDirect && overlay && <div className="absolute inset-0 pointer-events-none">{overlay}</div>}

        {isDirect && (
          <div className="absolute bottom-0 inset-x-0 p-3" style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.75), transparent)' }}>
            {/* seek + markers */}
            <div className="relative h-1.5 rounded-full mb-2.5 cursor-pointer" style={{ background: 'rgba(255,255,255,0.2)' }}
              role="slider" aria-label="Seek" aria-valuemin={0} aria-valuemax={duration} aria-valuenow={time}
              onClick={e => {
                const rect = e.currentTarget.getBoundingClientRect()
                seekTo(((e.clientX - rect.left) / rect.width) * duration)
              }}>
              <div className="h-full rounded-full" style={{ width: duration ? `${(time / duration) * 100}%` : 0, background: color.accentSoft }} />
              {markers.map(m => (
                <button key={m.id} onClick={e => { e.stopPropagation(); seekTo(m.time) }}
                  aria-label={`${MARKER_META[m.type].label}: ${m.label} at ${formatTime(m.time)}`}
                  className="absolute top-1/2 h-2.5 w-2.5 rounded-full -translate-y-1/2 -translate-x-1/2 hover:scale-150 transition-transform"
                  style={{ left: duration ? `${(m.time / duration) * 100}%` : 0, background: MARKER_META[m.type].color, border: '1.5px solid #0a0d1c' }} />
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'} className="rounded-full p-2" style={{ background: 'rgba(255,255,255,0.12)' }}>
                {playing ? <Pause className="h-4 w-4 text-white" /> : <Play className="h-4 w-4 text-white" />}
              </button>
              <button onClick={() => seekTo(Math.max(0, time - 1 / 30))} aria-label="Step back one frame" className="rounded-full p-1.5 hover:bg-white/10">
                <SkipBack className="h-3.5 w-3.5 text-white" />
              </button>
              <button onClick={() => seekTo(Math.min(duration, time + 1 / 30))} aria-label="Step forward one frame" className="rounded-full p-1.5 hover:bg-white/10">
                <SkipForward className="h-3.5 w-3.5 text-white" />
              </button>
              <button onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'} className="rounded-full p-1.5 hover:bg-white/10">
                {muted ? <VolumeX className="h-3.5 w-3.5 text-white" /> : <Volume2 className="h-3.5 w-3.5 text-white" />}
              </button>
              <span style={{ ...MONO, fontSize: '0.68rem', color: '#fff' }}>{formatTime(time)} / {formatTime(duration)}</span>

              <div className="relative ml-auto flex items-center gap-1">
                <button onClick={() => setShowRateMenu(s => !s)} aria-label="Playback speed" aria-expanded={showRateMenu}
                  className="flex items-center gap-1 rounded-full px-2 py-1 hover:bg-white/10">
                  <Gauge className="h-3.5 w-3.5 text-white" /> <span style={{ ...MONO, fontSize: '0.65rem', color: '#fff' }}>{rate}x</span>
                </button>
                {showRateMenu && (
                  <div className="absolute bottom-9 right-0 rounded-lg p-1 z-10" style={{ background: '#171c38', border: `1px solid ${color.border}` }}>
                    {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].map(r => (
                      <button key={r} onClick={() => setSpeed(r)} className="block w-full px-3 py-1 text-left rounded-md hover:bg-white/10"
                        style={{ ...MONO, fontSize: '0.7rem', color: r === rate ? color.accentSoft : '#fff' }}>{r}x</button>
                    ))}
                  </div>
                )}
                <button onClick={togglePiP} aria-label="Picture in picture" className="rounded-full p-1.5 hover:bg-white/10">
                  <PictureInPicture2 className="h-3.5 w-3.5 text-white" />
                </button>
                <button onClick={toggleFullscreen} aria-label="Fullscreen" className="rounded-full p-1.5 hover:bg-white/10">
                  <Maximize className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {!isDirect && (
        <p style={{ ...B, fontSize: '0.68rem', color: color.inkMuted }} className="flex items-center gap-1.5">
          <BookmarkIcon className="h-3 w-3" /> Frame stepping, PiP and marker-seek are available for direct video files — this {video.source === 'youtube' ? 'YouTube' : 'Vimeo'} embed uses its own native controls.
        </p>
      )}
    </div>
  )
})
