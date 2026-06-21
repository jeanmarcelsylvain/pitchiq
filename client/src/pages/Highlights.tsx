import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Upload, Play, Pause, Trash2, Download, Film, Plus, X, Type,
  Music, Volume2, VolumeX, Scissors, RotateCcw, RotateCw,
  Sun, Contrast, Droplets, Zap, ChevronDown, ChevronUp,
  Layers, Square, Maximize, Mic, MicOff, Eye, EyeOff,
  SkipBack, SkipForward, FastForward, Rewind, Copy, FlipHorizontal
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Clip {
  id: string
  file: File
  url: string
  name: string
  duration: number
  startTime: number
  endTime: number
  thumbnail: string
  volume: number
  muted: boolean
  speed: number
  visible: boolean
  filters: ClipFilters
  textOverlays: TextOverlay[]
  transition: TransitionType
  aspectRatio: AspectRatio
}

interface ClipFilters {
  brightness: number   // 0–200 (100 = normal)
  contrast: number
  saturation: number
  exposure: number     // mapped to brightness offset
  sharpness: number    // 0–10
  blur: number         // 0–10
  hue: number          // 0–360
}

interface TextOverlay {
  id: string
  text: string
  x: number
  y: number
  fontSize: number
  color: string
  bold: boolean
  italic: boolean
  style: 'plain' | 'scoreboard' | 'nametag' | 'title' | 'watermark'
  startAt: number  // seconds into clip
  endAt: number
}

type TransitionType = 'none' | 'fade' | 'wipe-left' | 'wipe-right' | 'zoom' | 'flash' | 'blur' | 'slide-up'
type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5'
type TabId = 'trim' | 'color' | 'text' | 'audio' | 'transition' | 'speed' | 'export'
type Preset = 'none' | 'cinematic' | 'broadcast' | 'vivid' | 'cold' | 'warm' | 'vintage' | 'bw'

interface AudioTrack {
  id: string
  file: File
  url: string
  name: string
  volume: number
  startAt: number
  duration: number
}

interface HistoryEntry {
  clips: Clip[]
  audioTracks: AudioTrack[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: ClipFilters = {
  brightness: 100, contrast: 100, saturation: 100,
  exposure: 0, sharpness: 0, blur: 0, hue: 0,
}

const PRESETS: Record<Preset, Partial<ClipFilters>> = {
  none: DEFAULT_FILTERS,
  cinematic: { brightness: 95, contrast: 115, saturation: 85, hue: 200 },
  broadcast: { brightness: 105, contrast: 110, saturation: 120 },
  vivid: { brightness: 110, contrast: 120, saturation: 150 },
  cold: { brightness: 100, contrast: 105, saturation: 90, hue: 210 },
  warm: { brightness: 108, contrast: 105, saturation: 115, hue: 30 },
  vintage: { brightness: 90, contrast: 95, saturation: 70, hue: 35, blur: 0.3 },
  bw: { saturation: 0, contrast: 120 },
}

const TRANSITIONS: { id: TransitionType; label: string }[] = [
  { id: 'none', label: 'Cut' },
  { id: 'fade', label: 'Fade' },
  { id: 'wipe-left', label: 'Wipe Left' },
  { id: 'wipe-right', label: 'Wipe Right' },
  { id: 'zoom', label: 'Zoom' },
  { id: 'flash', label: 'Flash' },
  { id: 'blur', label: 'Blur' },
  { id: 'slide-up', label: 'Slide Up' },
]

const ASPECT_RATIOS: { id: AspectRatio; label: string; w: number; h: number }[] = [
  { id: '16:9', label: '16:9 YouTube', w: 16, h: 9 },
  { id: '9:16', label: '9:16 TikTok', w: 9, h: 16 },
  { id: '1:1', label: '1:1 Instagram', w: 1, h: 1 },
  { id: '4:5', label: '4:5 Reels', w: 4, h: 5 },
]

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4]

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  const ms = Math.floor((s % 1) * 10)
  return `${m}:${sec.toString().padStart(2, '0')}.${ms}`
}

function filtersToCSS(f: ClipFilters) {
  const bright = Math.max(0, Math.min(200, f.brightness + f.exposure))
  return [
    `brightness(${bright}%)`,
    `contrast(${f.contrast}%)`,
    `saturate(${f.saturation}%)`,
    `hue-rotate(${f.hue}deg)`,
    f.blur > 0 ? `blur(${f.blur * 0.5}px)` : '',
  ].filter(Boolean).join(' ')
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useHistory(initial: HistoryEntry) {
  const [stack, setStack] = useState<HistoryEntry[]>([initial])
  const [idx, setIdx] = useState(0)

  const push = useCallback((entry: HistoryEntry) => {
    setStack(prev => [...prev.slice(0, idx + 1), entry])
    setIdx(prev => prev + 1)
  }, [idx])

  const undo = useCallback(() => {
    setIdx(prev => Math.max(0, prev - 1))
  }, [])

  const redo = useCallback(() => {
    setStack(prev => { setIdx(i => Math.min(prev.length - 1, i + 1)); return prev })
  }, [])

  return { state: stack[idx], push, undo, redo, canUndo: idx > 0, canRedo: idx < stack.length - 1 }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FilterSlider({ label, value, min, max, step = 1, onChange }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-mono">{value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full accent-pitch-500 cursor-pointer" />
    </div>
  )
}

function TabBtn({ id, active, label, onClick }: { id: string; active: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
        active ? 'bg-pitch-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}>
      {label}
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Highlights() {
  const { state, push, undo, redo, canUndo, canRedo } = useHistory({ clips: [], audioTracks: [] })
  const clips = state.clips
  const audioTracks = state.audioTracks

  const setClips = useCallback((updater: (prev: Clip[]) => Clip[]) => {
    const next = updater(clips)
    push({ clips: next, audioTracks })
  }, [clips, audioTracks, push])

  const setAudioTracks = useCallback((updater: (prev: AudioTrack[]) => AudioTrack[]) => {
    const next = updater(audioTracks)
    push({ clips, audioTracks: next })
  }, [clips, audioTracks, push])

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('trim')
  const [dragOver, setDragOver] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playTime, setPlayTime] = useState(0)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportAspect, setExportAspect] = useState<AspectRatio>('16:9')
  const [isRecordingVoice, setIsRecordingVoice] = useState(false)
  const [addingText, setAddingText] = useState(false)
  const [newTextVal, setNewTextVal] = useState('')
  const [newTextStyle, setNewTextStyle] = useState<TextOverlay['style']>('plain')
  const [newTextColor, setNewTextColor] = useState('#ffffff')
  const [timelineZoom, setTimelineZoom] = useState(1)
  const [previewError, setPreviewError] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const previewVideoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const voiceRecorderRef = useRef<MediaRecorder | null>(null)
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timelineRef = useRef<HTMLDivElement>(null)

  const selected = clips.find(c => c.id === selectedId) ?? null

  // ── Cleanup on unmount
  useEffect(() => {
    return () => {
      clips.forEach(c => URL.revokeObjectURL(c.url))
      audioTracks.forEach(a => URL.revokeObjectURL(a.url))
    }
  }, [])

  // ── Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo() }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') { e.preventDefault(); redo() }
      if (e.key === ' ') { e.preventDefault(); togglePlay() }
      if (e.key === 'Delete' && selectedId) removeClip(selectedId)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedId, isPlaying, canUndo, canRedo])

  // ── Thumbnail generation
  const generateThumbnail = async (file: File, time = 0.5): Promise<string> => {
    return new Promise(resolve => {
      const video = document.createElement('video')
      video.crossOrigin = 'anonymous'
      video.src = URL.createObjectURL(file)
      video.currentTime = time
      const done = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 192; canvas.height = 108
        canvas.getContext('2d')!.drawImage(video, 0, 0, 192, 108)
        resolve(canvas.toDataURL('image/jpeg', 0.75))
        URL.revokeObjectURL(video.src)
      }
      video.onseeked = done
      video.onloadeddata = () => { video.currentTime = time }
      video.onerror = () => resolve('')
    })
  }

  // ── Add video files
  const addFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('video/'))
    if (!arr.length) return
    if (clips.length + arr.length > 20) { alert('Max 20 clips'); return }

    for (const file of arr) {
      const url = URL.createObjectURL(file)
      const duration = await new Promise<number>(res => {
        const v = document.createElement('video')
        v.src = url
        v.onloadedmetadata = () => res(v.duration)
        v.onerror = () => res(30)
      })
      const thumbnail = await generateThumbnail(file)
      const clip: Clip = {
        id: crypto.randomUUID(), file, url,
        name: file.name.replace(/\.[^.]+$/, ''),
        duration, startTime: 0, endTime: Math.min(duration, 60),
        volume: 1, muted: false, speed: 1, visible: true,
        filters: { ...DEFAULT_FILTERS },
        textOverlays: [], transition: 'fade',
        aspectRatio: exportAspect,
        thumbnail,
      }
      setClips(prev => [...prev, clip])
      setSelectedId(clip.id)
    }
  }, [clips.length, exportAspect])

  // ── Add audio
  const addAudio = async (file: File) => {
    const url = URL.createObjectURL(file)
    const duration = await new Promise<number>(res => {
      const a = document.createElement('audio')
      a.src = url
      a.onloadedmetadata = () => res(a.duration)
      a.onerror = () => res(180)
    })
    const track: AudioTrack = {
      id: crypto.randomUUID(), file, url,
      name: file.name.replace(/\.[^.]+$/, ''),
      volume: 0.7, startAt: 0, duration,
    }
    setAudioTracks(prev => [...prev, track])
  }

  // ── Drag drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    const videos = files.filter(f => f.type.startsWith('video/'))
    const audios = files.filter(f => f.type.startsWith('audio/'))
    if (videos.length) addFiles(videos)
    if (audios.length) audios.forEach(addAudio)
  }

  const updateClip = (id: string, patch: Partial<Clip>) => {
    setClips(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c))
  }

  const updateFilters = (id: string, patch: Partial<ClipFilters>) => {
    setClips(prev => prev.map(c => c.id === id ? { ...c, filters: { ...c.filters, ...patch } } : c))
  }

  const removeClip = (id: string) => {
    setClips(prev => {
      const next = prev.filter(c => c.id !== id)
      setSelectedId(next[0]?.id ?? null)
      return next
    })
  }

  const duplicateClip = (id: string) => {
    const clip = clips.find(c => c.id === id)
    if (!clip) return
    const copy: Clip = { ...clip, id: crypto.randomUUID(), name: clip.name + ' (copy)' }
    setClips(prev => {
      const idx = prev.findIndex(c => c.id === id)
      const arr = [...prev]
      arr.splice(idx + 1, 0, copy)
      return arr
    })
    setSelectedId(copy.id)
  }

  const splitClip = (id: string) => {
    const clip = clips.find(c => c.id === id)
    if (!clip) return
    const mid = clip.startTime + (clip.endTime - clip.startTime) / 2
    const a: Clip = { ...clip, endTime: mid }
    const b: Clip = { ...clip, id: crypto.randomUUID(), name: clip.name + ' (2)', startTime: mid }
    setClips(prev => {
      const arr = [...prev]
      const idx = arr.findIndex(c => c.id === id)
      arr.splice(idx, 1, a, b)
      return arr
    })
  }

  const moveClip = (id: string, dir: -1 | 1) => {
    setClips(prev => {
      const arr = [...prev]
      const idx = arr.findIndex(c => c.id === id)
      const nIdx = idx + dir
      if (nIdx < 0 || nIdx >= arr.length) return prev
      ;[arr[idx], arr[nIdx]] = [arr[nIdx], arr[idx]]
      return arr
    })
  }

  const applyPreset = (preset: Preset) => {
    if (!selected) return
    updateFilters(selected.id, { ...DEFAULT_FILTERS, ...PRESETS[preset] })
  }

  const resetFilters = () => {
    if (!selected) return
    updateFilters(selected.id, { ...DEFAULT_FILTERS })
  }

  const addTextOverlay = () => {
    if (!selected || !newTextVal.trim()) return
    const overlay: TextOverlay = {
      id: crypto.randomUUID(), text: newTextVal,
      x: 50, y: 80, fontSize: 36, color: newTextColor,
      bold: true, italic: false, style: newTextStyle,
      startAt: 0, endAt: selected.endTime - selected.startTime,
    }
    updateClip(selected.id, { textOverlays: [...selected.textOverlays, overlay] })
    setNewTextVal('')
    setAddingText(false)
  }

  const removeTextOverlay = (clipId: string, overlayId: string) => {
    const clip = clips.find(c => c.id === clipId)
    if (!clip) return
    updateClip(clipId, { textOverlays: clip.textOverlays.filter(t => t.id !== overlayId) })
  }

  // ── Preview playback
  const togglePlay = () => {
    const v = previewVideoRef.current
    if (!selected || !v) return
    if (isPlaying) {
      v.pause()
      setIsPlaying(false)
      if (playIntervalRef.current) clearInterval(playIntervalRef.current)
      return
    }
    v.src = selected.url
    v.playbackRate = selected.speed
    v.currentTime = selected.startTime
    v.style.filter = filtersToCSS(selected.filters)
    v.play().catch(() => setPreviewError(true))
    setIsPlaying(true)
    setPlayTime(0)
    playIntervalRef.current = setInterval(() => {
      const elapsed = v.currentTime - selected.startTime
      setPlayTime(elapsed)
      if (v.currentTime >= selected.endTime) {
        v.pause()
        setIsPlaying(false)
        clearInterval(playIntervalRef.current!)
      }
    }, 50)
  }

  // ── Voice recording
  const toggleVoiceRecord = async () => {
    if (isRecordingVoice) {
      voiceRecorderRef.current?.stop()
      setIsRecordingVoice(false)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []
      recorder.ondataavailable = e => chunks.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const file = new File([blob], 'voiceover.webm', { type: 'audio/webm' })
        addAudio(file)
        stream.getTracks().forEach(t => t.stop())
      }
      recorder.start()
      voiceRecorderRef.current = recorder
      setIsRecordingVoice(true)
    } catch {
      alert('Microphone access denied')
    }
  }

  // ── Export
  const exportReel = async () => {
    if (!clips.length) return
    setIsExporting(true); setExportProgress(0)

    const ratio = ASPECT_RATIOS.find(r => r.id === exportAspect)!
    const canvas = canvasRef.current!
    const W = 1920, H = Math.round(W * ratio.h / ratio.w)
    canvas.width = W; canvas.height = H

    const ctx = canvas.getContext('2d')!
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9' : 'video/webm'
    const stream = canvas.captureStream(30)
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 })
    const chunks: Blob[] = []
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
    recorder.start(100)

    const totalDur = clips.filter(c => c.visible).reduce((s, c) => s + (c.endTime - c.startTime) / c.speed, 0)
    let elapsed = 0

    for (const clip of clips.filter(c => c.visible)) {
      const clipDur = (clip.endTime - clip.startTime) / clip.speed
      await new Promise<void>(resolve => {
        const video = document.createElement('video')
        video.src = clip.url
        video.muted = clip.muted
        video.volume = clip.volume
        video.playbackRate = clip.speed
        video.currentTime = clip.startTime

        video.oncanplay = async () => {
          await video.play().catch(() => {})
          const startWall = performance.now()

          const draw = () => {
            const wallSec = (performance.now() - startWall) / 1000
            const videoT = clip.startTime + wallSec * clip.speed

            if (videoT >= clip.endTime || video.paused || video.ended) {
              video.pause()
              elapsed += clipDur
              resolve()
              return
            }

            // Background
            ctx.fillStyle = '#000'
            ctx.fillRect(0, 0, W, H)

            // Apply filters via globalCompositeOperation trick
            ctx.save()
            ctx.filter = filtersToCSS(clip.filters)

            // Fit video to canvas maintaining AR
            const vAR = video.videoWidth / video.videoHeight
            const cAR = W / H
            let dx = 0, dy = 0, dw = W, dh = H
            if (vAR > cAR) { dh = H; dw = dh * vAR; dx = (W - dw) / 2 }
            else { dw = W; dh = dw / vAR; dy = (H - dh) / 2 }
            ctx.drawImage(video, dx, dy, dw, dh)
            ctx.restore()

            // Text overlays
            for (const overlay of clip.textOverlays) {
              const inRange = wallSec >= overlay.startAt && wallSec <= overlay.endAt
              if (!inRange) continue
              const x = (overlay.x / 100) * W
              const y = (overlay.y / 100) * H
              const fs = overlay.fontSize * (W / 1280)

              if (overlay.style === 'scoreboard') {
                ctx.fillStyle = 'rgba(0,0,0,0.75)'
                ctx.fillRect(x - 10, y - fs - 6, overlay.text.length * fs * 0.6 + 20, fs + 16)
                ctx.strokeStyle = '#22c55e'
                ctx.lineWidth = 2
                ctx.strokeRect(x - 10, y - fs - 6, overlay.text.length * fs * 0.6 + 20, fs + 16)
              } else if (overlay.style === 'nametag') {
                ctx.fillStyle = 'rgba(34,197,94,0.9)'
                ctx.fillRect(x - 8, y - fs - 4, overlay.text.length * fs * 0.58 + 16, fs + 12)
              } else if (overlay.style === 'title') {
                ctx.fillStyle = 'rgba(0,0,0,0.55)'
                ctx.fillRect(0, y - fs - 8, W, fs + 24)
              }

              ctx.font = `${overlay.bold ? 'bold' : ''} ${overlay.italic ? 'italic' : ''} ${fs}px sans-serif`.trim()
              ctx.fillStyle = overlay.color
              ctx.textAlign = overlay.style === 'title' ? 'center' : 'left'
              ctx.fillText(overlay.text, overlay.style === 'title' ? W / 2 : x, y)
            }

            setExportProgress(Math.round(((elapsed + wallSec) / totalDur) * 100))
            requestAnimationFrame(draw)
          }
          requestAnimationFrame(draw)
        }
        video.onerror = () => { elapsed += clipDur; resolve() }
      })
    }

    recorder.stop()
    await new Promise<void>(r => { recorder.onstop = () => r() })

    const blob = new Blob(chunks, { type: 'video/webm' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `highlight-reel-${exportAspect.replace(':', 'x')}.webm`
    a.click()
    URL.revokeObjectURL(url)
    setIsExporting(false); setExportProgress(0)
  }

  const totalDuration = clips.filter(c => c.visible).reduce((s, c) => s + (c.endTime - c.startTime) / c.speed, 0)
  const TPXSCALE = 80 * timelineZoom

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] -m-4 lg:-m-6 bg-slate-950 text-white select-none">

      {/* ── Top toolbar ── */}
      <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-2 bg-slate-950/90 backdrop-blur flex-shrink-0">
        <div className="flex items-center gap-1.5 mr-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pitch-600">
            <Film className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-white hidden sm:block">Highlight Editor</span>
        </div>

        <div className="h-4 w-px bg-slate-800" />

        {/* Undo/Redo */}
        <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)"
          className="flex items-center justify-center h-7 w-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-25 transition-all">
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)"
          className="flex items-center justify-center h-7 w-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-25 transition-all">
          <RotateCw className="h-3.5 w-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-800" />

        {/* Clip actions */}
        {selected && (
          <>
            <button onClick={() => splitClip(selected.id)} title="Split at midpoint"
              className="flex items-center gap-1 h-7 px-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
              <Scissors className="h-3.5 w-3.5" /> Split
            </button>
            <button onClick={() => duplicateClip(selected.id)} title="Duplicate"
              className="flex items-center gap-1 h-7 px-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
              <Copy className="h-3.5 w-3.5" /> Duplicate
            </button>
            <button onClick={() => removeClip(selected.id)} title="Delete (Del)"
              className="flex items-center gap-1 h-7 px-2 rounded-lg text-xs text-red-500 hover:text-red-400 hover:bg-red-950/30 transition-all">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
            <div className="h-4 w-px bg-slate-800" />
          </>
        )}

        <div className="flex-1" />

        {/* Voice recording */}
        <button onClick={toggleVoiceRecord}
          className={`flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium transition-all ${
            isRecordingVoice ? 'bg-red-600 text-white animate-pulse' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}>
          {isRecordingVoice ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          {isRecordingVoice ? 'Stop' : 'Voice'}
        </button>

        {/* Add media */}
        <button onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition-all">
          <Plus className="h-3.5 w-3.5" /> Add Clip
        </button>
        <button onClick={() => audioInputRef.current?.click()}
          className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition-all">
          <Music className="h-3.5 w-3.5" /> Add Audio
        </button>

        {/* Export */}
        <button onClick={exportReel} disabled={!clips.length || isExporting}
          className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-semibold bg-pitch-600 hover:bg-pitch-500 disabled:opacity-40 transition-all text-white">
          <Download className="h-3.5 w-3.5" />
          {isExporting ? `${exportProgress}%` : 'Export'}
        </button>

        <input ref={fileInputRef} type="file" accept="video/*" multiple className="hidden"
          onChange={e => e.target.files && addFiles(e.target.files)} />
        <input ref={audioInputRef} type="file" accept="audio/*" multiple className="hidden"
          onChange={e => e.target.files && Array.from(e.target.files).forEach(addAudio)} />
      </div>

      {/* ── Main workspace ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: clips panel ── */}
        <div className="w-44 flex-shrink-0 border-r border-slate-800 bg-slate-900/50 flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-800">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Media ({clips.length})</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {clips.map((clip, i) => (
              <div key={clip.id}
                onClick={() => setSelectedId(clip.id)}
                className={`relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                  selectedId === clip.id ? 'border-pitch-500' : 'border-transparent hover:border-slate-600'
                } ${!clip.visible ? 'opacity-40' : ''}`}
              >
                {clip.thumbnail
                  ? <img src={clip.thumbnail} alt="" className="w-full aspect-video object-cover" />
                  : <div className="w-full aspect-video bg-slate-800 flex items-center justify-center"><Film className="h-5 w-5 text-slate-600" /></div>
                }
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 px-1.5 py-1">
                  <p className="text-xs text-white truncate">{clip.name}</p>
                  <p className="text-xs text-slate-400">{fmt(clip.endTime - clip.startTime)}</p>
                </div>
                <div className="absolute top-1 left-1 flex items-center gap-1">
                  <span className="text-xs bg-black/60 px-1 py-0.5 rounded font-mono">{i + 1}</span>
                </div>
                <div className="absolute top-1 right-1 flex gap-0.5">
                  <button onClick={e => { e.stopPropagation(); updateClip(clip.id, { visible: !clip.visible }) }}
                    className="h-5 w-5 flex items-center justify-center rounded bg-black/60 text-slate-300 hover:text-white">
                    {clip.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            ))}

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed py-4 cursor-pointer transition-all ${
                dragOver ? 'border-pitch-500 bg-pitch-600/10' : 'border-slate-700 hover:border-slate-500'
              }`}
            >
              <Upload className="h-5 w-5 text-slate-600" />
              <p className="text-xs text-slate-600 text-center">Drop or click</p>
            </div>
          </div>
        </div>

        {/* ── Center: preview + controls ── */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Preview */}
          <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden">
            {selected ? (
              <>
                <video
                  ref={previewVideoRef}
                  key={selected.id}
                  src={selected.url}
                  className="max-h-full max-w-full object-contain"
                  style={{ filter: filtersToCSS(selected.filters) }}
                  onEnded={() => setIsPlaying(false)}
                  onError={() => setPreviewError(true)}
                  playsInline muted={selected.muted}
                />
                {/* Text overlays preview */}
                {selected.textOverlays.map(t => (
                  <div key={t.id}
                    style={{
                      position: 'absolute',
                      left: `${t.x}%`,
                      top: `${t.y}%`,
                      fontSize: t.fontSize,
                      color: t.color,
                      fontWeight: t.bold ? 'bold' : 'normal',
                      fontStyle: t.italic ? 'italic' : 'normal',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                      pointerEvents: 'none',
                      padding: t.style === 'scoreboard' ? '4px 10px' : t.style === 'nametag' ? '2px 8px' : '0',
                      background: t.style === 'scoreboard' ? 'rgba(0,0,0,0.75)' : t.style === 'nametag' ? 'rgba(34,197,94,0.85)' : 'transparent',
                      borderRadius: 4,
                      border: t.style === 'scoreboard' ? '1px solid #22c55e' : 'none',
                    }}>
                    {t.text}
                  </div>
                ))}
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800">
                  <Film className="h-8 w-8 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">No clip selected</p>
                  <p className="text-xs text-slate-600 mt-0.5">Add a video clip to get started</p>
                </div>
                <button onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-xl bg-pitch-600 hover:bg-pitch-500 px-4 py-2 text-sm font-semibold text-white transition-all">
                  <Upload className="h-4 w-4" /> Upload Clips
                </button>
              </div>
            )}

            {/* Playback overlay controls */}
            {selected && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-6">
                {/* Progress bar */}
                <div className="relative h-1 bg-slate-700 rounded-full mb-3 cursor-pointer"
                  onClick={e => {
                    if (!selected || !previewVideoRef.current) return
                    const rect = e.currentTarget.getBoundingClientRect()
                    const pct = (e.clientX - rect.left) / rect.width
                    const t = selected.startTime + pct * (selected.endTime - selected.startTime)
                    previewVideoRef.current.currentTime = t
                    setPlayTime(pct * (selected.endTime - selected.startTime))
                  }}
                >
                  <div className="absolute top-0 left-0 h-full bg-pitch-500 rounded-full transition-all"
                    style={{ width: `${((playTime) / Math.max(0.01, selected.endTime - selected.startTime)) * 100}%` }} />
                  <div className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow-md"
                    style={{ left: `${((playTime) / Math.max(0.01, selected.endTime - selected.startTime)) * 100}%` }} />
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={() => { if (previewVideoRef.current) { previewVideoRef.current.currentTime = selected.startTime; setPlayTime(0) } }}
                    className="text-slate-300 hover:text-white transition-colors">
                    <SkipBack className="h-4 w-4" />
                  </button>
                  <button onClick={togglePlay}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-all">
                    {isPlaying ? <Pause className="h-4 w-4 text-white" /> : <Play className="h-4 w-4 text-white ml-0.5" />}
                  </button>
                  <button onClick={() => { if (previewVideoRef.current) { previewVideoRef.current.currentTime = selected.endTime; setPlayTime(selected.endTime - selected.startTime) } }}
                    className="text-slate-300 hover:text-white transition-colors">
                    <SkipForward className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-mono text-slate-300">
                    {fmt(playTime)} / {fmt(selected.endTime - selected.startTime)}
                  </span>
                  <div className="flex-1" />
                  <span className="text-xs text-slate-500">Total: {fmt(totalDuration)}</span>
                  <button onClick={() => updateClip(selected.id, { muted: !selected.muted })}
                    className="text-slate-400 hover:text-white transition-colors">
                    {selected.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Export progress overlay */}
            {isExporting && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
                <div className="text-4xl font-black text-white">{exportProgress}%</div>
                <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-pitch-500 transition-all duration-300 rounded-full"
                    style={{ width: `${exportProgress}%` }} />
                </div>
                <p className="text-sm text-slate-400">Rendering highlight reel...</p>
              </div>
            )}
          </div>

          {/* ── Timeline ── */}
          <div className="flex-shrink-0 border-t border-slate-800 bg-slate-900">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-xs font-semibold text-slate-500">TIMELINE</span>
                <span className="text-xs text-slate-700">{clips.length} clips · {fmt(totalDuration)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-600">Zoom</span>
                <button onClick={() => setTimelineZoom(z => Math.max(0.25, z - 0.25))}
                  className="h-5 w-5 flex items-center justify-center rounded text-slate-500 hover:text-white hover:bg-slate-800">
                  <ChevronDown className="h-3 w-3" />
                </button>
                <span className="text-xs text-slate-400 w-8 text-center">{timelineZoom}x</span>
                <button onClick={() => setTimelineZoom(z => Math.min(4, z + 0.25))}
                  className="h-5 w-5 flex items-center justify-center rounded text-slate-500 hover:text-white hover:bg-slate-800">
                  <ChevronUp className="h-3 w-3" />
                </button>
              </div>
            </div>

            <div ref={timelineRef} className="overflow-x-auto pb-2" style={{ height: 100 }}>
              <div className="flex items-center gap-0 px-3 pt-3 h-full" style={{ minWidth: clips.length * 120 }}>
                {clips.length === 0 ? (
                  <div className="flex items-center gap-2 text-slate-700 text-sm pl-2">
                    <Film className="h-4 w-4" /> Add clips to see the timeline
                  </div>
                ) : clips.map((clip, i) => {
                  const w = Math.max(60, (clip.endTime - clip.startTime) / clip.speed * TPXSCALE)
                  return (
                    <div key={clip.id}
                      onClick={() => setSelectedId(clip.id)}
                      className={`relative flex-shrink-0 h-14 rounded-lg overflow-hidden cursor-pointer border-2 transition-all mr-1 ${
                        selectedId === clip.id ? 'border-pitch-500 shadow-lg shadow-pitch-900/50' : 'border-slate-700 hover:border-slate-500'
                      } ${!clip.visible ? 'opacity-30' : ''}`}
                      style={{ width: w }}
                    >
                      {clip.thumbnail
                        ? <img src={clip.thumbnail} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-slate-800" />
                      }
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 flex flex-col justify-end px-1.5 pb-1">
                        <p className="text-xs text-white truncate leading-none">{clip.name}</p>
                        <p className="text-xs text-slate-400">{fmt(clip.endTime - clip.startTime)}</p>
                      </div>
                      {/* Transition indicator */}
                      {i < clips.length - 1 && clip.transition !== 'none' && (
                        <div className="absolute right-0 top-0 bottom-0 w-4 bg-pitch-600/40 flex items-center justify-center">
                          <div className="h-3 w-0.5 bg-pitch-400" />
                        </div>
                      )}
                      {/* Reorder buttons */}
                      <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100">
                        <button onClick={e => { e.stopPropagation(); moveClip(clip.id, -1) }}
                          disabled={i === 0}
                          className="h-4 w-4 flex items-center justify-center bg-black/60 rounded text-slate-300 hover:text-white disabled:opacity-20">
                          ←
                        </button>
                        <button onClick={e => { e.stopPropagation(); moveClip(clip.id, 1) }}
                          disabled={i === clips.length - 1}
                          className="h-4 w-4 flex items-center justify-center bg-black/60 rounded text-slate-300 hover:text-white disabled:opacity-20">
                          →
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Audio tracks */}
            {audioTracks.length > 0 && (
              <div className="border-t border-slate-800 px-3 py-2">
                <div className="flex items-center gap-1 mb-1">
                  <Music className="h-3 w-3 text-purple-400" />
                  <span className="text-xs text-slate-500">AUDIO TRACKS</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {audioTracks.map(track => (
                    <div key={track.id} className="flex items-center gap-2 rounded-lg bg-purple-600/10 border border-purple-600/20 px-2 py-1">
                      <Music className="h-3 w-3 text-purple-400" />
                      <span className="text-xs text-purple-300 max-w-24 truncate">{track.name}</span>
                      <input type="range" min={0} max={1} step={0.05} value={track.volume}
                        onChange={e => setAudioTracks(prev => prev.map(t => t.id === track.id ? { ...t, volume: parseFloat(e.target.value) } : t))}
                        className="w-16 accent-purple-500" />
                      <button onClick={() => setAudioTracks(prev => prev.filter(t => t.id !== track.id))}
                        className="text-slate-600 hover:text-red-400">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: properties panel ── */}
        <div className="w-64 flex-shrink-0 border-l border-slate-800 bg-slate-900/50 flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-slate-600 text-center px-4">Select a clip to edit its properties</p>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex items-center gap-1 p-2 border-b border-slate-800 flex-wrap">
                {([
                  { id: 'trim', label: 'Trim' }, { id: 'color', label: 'Color' },
                  { id: 'text', label: 'Text' }, { id: 'audio', label: 'Audio' },
                  { id: 'transition', label: 'FX' }, { id: 'speed', label: 'Speed' },
                  { id: 'export', label: 'Export' },
                ] as { id: TabId; label: string }[]).map(t => (
                  <TabBtn key={t.id} id={t.id} active={activeTab === t.id} label={t.label} onClick={() => setActiveTab(t.id)} />
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-4">

                {/* ── TRIM TAB ── */}
                {activeTab === 'trim' && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Clip name</p>
                      <input value={selected.name}
                        onChange={e => updateClip(selected.id, { name: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-pitch-500" />
                    </div>

                    <FilterSlider label="Start time" value={parseFloat(selected.startTime.toFixed(1))}
                      min={0} max={selected.duration - 0.5} step={0.1}
                      onChange={v => { if (v < selected.endTime - 0.5) updateClip(selected.id, { startTime: v }) }} />
                    <FilterSlider label="End time" value={parseFloat(selected.endTime.toFixed(1))}
                      min={0.5} max={selected.duration} step={0.1}
                      onChange={v => { if (v > selected.startTime + 0.5) updateClip(selected.id, { endTime: v }) }} />

                    {/* Visual trim bar */}
                    <div className="relative h-8 bg-slate-800 rounded-lg overflow-hidden">
                      <div className="absolute top-0 h-full bg-pitch-600/40 border-x-2 border-pitch-500 rounded"
                        style={{
                          left: `${(selected.startTime / selected.duration) * 100}%`,
                          width: `${((selected.endTime - selected.startTime) / selected.duration) * 100}%`
                        }} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs text-slate-300 font-mono">
                          {fmt(selected.startTime)} → {fmt(selected.endTime)} · {fmt(selected.endTime - selected.startTime)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => splitClip(selected.id)}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 py-2 text-xs font-medium text-slate-300 hover:text-white transition-all">
                        <Scissors className="h-3.5 w-3.5" /> Split
                      </button>
                      <button onClick={() => duplicateClip(selected.id)}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 py-2 text-xs font-medium text-slate-300 hover:text-white transition-all">
                        <Copy className="h-3.5 w-3.5" /> Duplicate
                      </button>
                    </div>

                    {/* Reorder */}
                    <div className="flex gap-2">
                      <button onClick={() => moveClip(selected.id, -1)}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 py-2 text-xs font-medium text-slate-300 hover:text-white transition-all">
                        ← Move Left
                      </button>
                      <button onClick={() => moveClip(selected.id, 1)}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 py-2 text-xs font-medium text-slate-300 hover:text-white transition-all">
                        Move Right →
                      </button>
                    </div>
                  </div>
                )}

                {/* ── COLOR TAB ── */}
                {activeTab === 'color' && (
                  <div className="space-y-4">
                    {/* Presets */}
                    <div>
                      <p className="text-xs text-slate-500 mb-2">Style Presets</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(Object.keys(PRESETS) as Preset[]).map(p => (
                          <button key={p} onClick={() => applyPreset(p)}
                            className="rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-pitch-600/50 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-all capitalize">
                            {p === 'bw' ? 'B&W' : p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="h-px bg-slate-800" />

                    {/* Manual controls */}
                    <FilterSlider label="Brightness" value={selected.filters.brightness} min={0} max={200}
                      onChange={v => updateFilters(selected.id, { brightness: v })} />
                    <FilterSlider label="Contrast" value={selected.filters.contrast} min={0} max={200}
                      onChange={v => updateFilters(selected.id, { contrast: v })} />
                    <FilterSlider label="Saturation" value={selected.filters.saturation} min={0} max={200}
                      onChange={v => updateFilters(selected.id, { saturation: v })} />
                    <FilterSlider label="Exposure" value={selected.filters.exposure} min={-50} max={50}
                      onChange={v => updateFilters(selected.id, { exposure: v })} />
                    <FilterSlider label="Hue Shift" value={selected.filters.hue} min={0} max={360}
                      onChange={v => updateFilters(selected.id, { hue: v })} />
                    <FilterSlider label="Blur" value={selected.filters.blur} min={0} max={10} step={0.1}
                      onChange={v => updateFilters(selected.id, { blur: v })} />

                    <button onClick={resetFilters}
                      className="w-full rounded-lg bg-slate-800 hover:bg-slate-700 py-2 text-xs font-medium text-slate-400 hover:text-white transition-all">
                      Reset to Default
                    </button>
                  </div>
                )}

                {/* ── TEXT TAB ── */}
                {activeTab === 'text' && (
                  <div className="space-y-3">
                    {!addingText ? (
                      <button onClick={() => setAddingText(true)}
                        className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 hover:border-pitch-600 py-3 text-sm text-slate-400 hover:text-white transition-all">
                        <Plus className="h-4 w-4" /> Add Text Overlay
                      </button>
                    ) : (
                      <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-800/50 p-3">
                        <input value={newTextVal} onChange={e => setNewTextVal(e.target.value)}
                          placeholder="Enter text..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-pitch-500"
                          onKeyDown={e => e.key === 'Enter' && addTextOverlay()} />

                        <div>
                          <p className="text-xs text-slate-500 mb-1.5">Style</p>
                          <div className="grid grid-cols-2 gap-1">
                            {(['plain', 'scoreboard', 'nametag', 'title', 'watermark'] as TextOverlay['style'][]).map(s => (
                              <button key={s} onClick={() => setNewTextStyle(s)}
                                className={`py-1 rounded-lg text-xs font-medium transition-all capitalize ${
                                  newTextStyle === s ? 'bg-pitch-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'
                                }`}>{s}</button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-xs text-slate-500">Color</label>
                          <input type="color" value={newTextColor} onChange={e => setNewTextColor(e.target.value)}
                            className="h-7 w-10 rounded cursor-pointer bg-transparent border-0" />
                        </div>

                        <div className="flex gap-2">
                          <button onClick={addTextOverlay}
                            className="flex-1 rounded-lg bg-pitch-600 hover:bg-pitch-500 py-1.5 text-xs font-semibold text-white transition-all">
                            Add
                          </button>
                          <button onClick={() => setAddingText(false)}
                            className="flex-1 rounded-lg bg-slate-700 hover:bg-slate-600 py-1.5 text-xs font-medium text-slate-300 transition-all">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Existing overlays */}
                    {selected.textOverlays.map(t => (
                      <div key={t.id} className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white truncate">{t.text}</p>
                          <p className="text-xs text-slate-500 capitalize">{t.style}</p>
                        </div>
                        <button onClick={() => removeTextOverlay(selected.id, t.id)}
                          className="text-slate-600 hover:text-red-400 ml-2">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}

                    {selected.textOverlays.length === 0 && !addingText && (
                      <p className="text-xs text-slate-600 text-center py-4">No text overlays yet</p>
                    )}
                  </div>
                )}

                {/* ── AUDIO TAB ── */}
                {activeTab === 'audio' && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-2">Clip Volume</p>
                      <FilterSlider label="Volume" value={Math.round(selected.volume * 100)} min={0} max={100}
                        onChange={v => updateClip(selected.id, { volume: v / 100 })} />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2">
                      <span className="text-xs text-slate-300">Mute clip audio</span>
                      <button onClick={() => updateClip(selected.id, { muted: !selected.muted })}
                        className={`relative h-5 w-9 rounded-full transition-all ${selected.muted ? 'bg-pitch-600' : 'bg-slate-700'}`}>
                        <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${selected.muted ? 'left-4' : 'left-0.5'}`} />
                      </button>
                    </div>

                    <div className="h-px bg-slate-800" />

                    <div>
                      <p className="text-xs text-slate-500 mb-2">Background Music</p>
                      <button onClick={() => audioInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 hover:border-purple-600 py-3 text-xs text-slate-400 hover:text-purple-300 transition-all">
                        <Music className="h-4 w-4" /> Add Music / Audio
                      </button>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 mb-2">Voice Over</p>
                      <button onClick={toggleVoiceRecord}
                        className={`w-full flex items-center justify-center gap-2 rounded-xl border py-3 text-xs font-medium transition-all ${
                          isRecordingVoice
                            ? 'border-red-600 bg-red-900/20 text-red-400 animate-pulse'
                            : 'border-slate-700 hover:border-red-600/50 text-slate-400 hover:text-red-300'
                        }`}>
                        {isRecordingVoice ? <><MicOff className="h-4 w-4" /> Stop Recording</> : <><Mic className="h-4 w-4" /> Record Voice Over</>}
                      </button>
                    </div>

                    {audioTracks.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-500">Audio Tracks</p>
                        {audioTracks.map(t => (
                          <div key={t.id} className="rounded-lg border border-slate-700 bg-slate-800/40 p-2 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-white truncate flex-1">{t.name}</p>
                              <button onClick={() => setAudioTracks(prev => prev.filter(a => a.id !== t.id))}
                                className="text-slate-600 hover:text-red-400 ml-1">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                            <FilterSlider label="Volume" value={Math.round(t.volume * 100)} min={0} max={100}
                              onChange={v => setAudioTracks(prev => prev.map(a => a.id === t.id ? { ...a, volume: v / 100 } : a))} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── TRANSITION TAB ── */}
                {activeTab === 'transition' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500">Transition to next clip</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {TRANSITIONS.map(t => (
                        <button key={t.id} onClick={() => updateClip(selected.id, { transition: t.id })}
                          className={`rounded-lg py-2 text-xs font-medium transition-all ${
                            selected.transition === t.id
                              ? 'bg-pitch-600 text-white border border-pitch-500'
                              : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600'
                          }`}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-600">Transitions are applied during export</p>
                  </div>
                )}

                {/* ── SPEED TAB ── */}
                {activeTab === 'speed' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500">Playback Speed</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {SPEED_OPTIONS.map(s => (
                        <button key={s} onClick={() => updateClip(selected.id, { speed: s })}
                          className={`rounded-lg py-2 text-xs font-bold transition-all ${
                            selected.speed === s
                              ? 'bg-pitch-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                          }`}>
                          {s}x
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-600">
                      {selected.speed < 1 ? '🐢 Slow motion' : selected.speed > 1 ? '⚡ Speed up' : '▶ Normal speed'}
                    </p>
                    <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2">
                      <p className="text-xs text-slate-400">Clip duration at {selected.speed}x:</p>
                      <p className="text-sm font-bold text-white">{fmt((selected.endTime - selected.startTime) / selected.speed)}</p>
                    </div>
                  </div>
                )}

                {/* ── EXPORT TAB ── */}
                {activeTab === 'export' && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-2">Aspect Ratio</p>
                      <div className="space-y-1.5">
                        {ASPECT_RATIOS.map(r => (
                          <button key={r.id} onClick={() => setExportAspect(r.id)}
                            className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all ${
                              exportAspect === r.id
                                ? 'bg-pitch-600/20 border border-pitch-600/50 text-white'
                                : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white'
                            }`}>
                            <span className="font-medium">{r.label}</span>
                            <span className="text-xs text-slate-500">{r.id}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-3 space-y-1">
                      <p className="text-xs text-slate-500">Export settings</p>
                      <p className="text-xs text-slate-300">Format: <span className="text-white">WebM (VP9)</span></p>
                      <p className="text-xs text-slate-300">Quality: <span className="text-white">8 Mbps</span></p>
                      <p className="text-xs text-slate-300">Clips: <span className="text-white">{clips.filter(c => c.visible).length}</span></p>
                      <p className="text-xs text-slate-300">Duration: <span className="text-white">{fmt(totalDuration)}</span></p>
                    </div>

                    <button onClick={exportReel} disabled={!clips.length || isExporting}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-pitch-600 hover:bg-pitch-500 disabled:opacity-40 py-3 text-sm font-semibold text-white transition-all">
                      <Download className="h-4 w-4" />
                      {isExporting ? `Exporting ${exportProgress}%` : 'Export Reel'}
                    </button>

                    {isExporting && (
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-pitch-500 transition-all duration-300 rounded-full"
                          style={{ width: `${exportProgress}%` }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Hidden canvas for export */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
