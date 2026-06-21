import { useState, useRef, useEffect } from 'react'
import {
  Upload, Play, Pause, Trash2, Download, Film, Plus, X,
  Music, Volume2, VolumeX, Scissors, RotateCcw, RotateCw,
  Layers, ChevronDown, ChevronUp, Mic, MicOff, Eye, EyeOff,
  SkipBack, SkipForward, Copy,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClipFilters {
  brightness: number
  contrast: number
  saturation: number
  exposure: number
  blur: number
  hue: number
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
  startAt: number
  endAt: number
}

type TransitionType = 'none' | 'fade' | 'wipe-left' | 'wipe-right' | 'zoom' | 'flash' | 'blur' | 'slide-up'
type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5'
type TabId = 'trim' | 'color' | 'text' | 'audio' | 'transition' | 'speed' | 'export'
type Preset = 'none' | 'cinematic' | 'broadcast' | 'vivid' | 'cold' | 'warm' | 'vintage' | 'bw'

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
}

interface AudioTrack {
  id: string
  file: File
  url: string
  name: string
  volume: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: ClipFilters = {
  brightness: 100, contrast: 100, saturation: 100,
  exposure: 0, blur: 0, hue: 0,
}

const PRESETS: Record<Preset, ClipFilters> = {
  none:       { brightness: 100, contrast: 100, saturation: 100, exposure: 0,   blur: 0,   hue: 0   },
  cinematic:  { brightness: 95,  contrast: 115, saturation: 85,  exposure: 0,   blur: 0,   hue: 200 },
  broadcast:  { brightness: 105, contrast: 110, saturation: 120, exposure: 0,   blur: 0,   hue: 0   },
  vivid:      { brightness: 110, contrast: 120, saturation: 150, exposure: 0,   blur: 0,   hue: 0   },
  cold:       { brightness: 100, contrast: 105, saturation: 90,  exposure: 0,   blur: 0,   hue: 210 },
  warm:       { brightness: 108, contrast: 105, saturation: 115, exposure: 0,   blur: 0,   hue: 30  },
  vintage:    { brightness: 90,  contrast: 95,  saturation: 70,  exposure: 0,   blur: 0.3, hue: 35  },
  bw:         { brightness: 100, contrast: 120, saturation: 0,   exposure: 0,   blur: 0,   hue: 0   },
}

const TRANSITIONS: { id: TransitionType; label: string }[] = [
  { id: 'none',       label: 'Cut'       },
  { id: 'fade',       label: 'Fade'      },
  { id: 'wipe-left',  label: 'Wipe Left' },
  { id: 'wipe-right', label: 'Wipe Right'},
  { id: 'zoom',       label: 'Zoom'      },
  { id: 'flash',      label: 'Flash'     },
  { id: 'blur',       label: 'Blur'      },
  { id: 'slide-up',   label: 'Slide Up'  },
]

const ASPECT_RATIOS: { id: AspectRatio; label: string; w: number; h: number }[] = [
  { id: '16:9', label: '16:9  YouTube', w: 16, h: 9  },
  { id: '9:16', label: '9:16  TikTok',  w: 9,  h: 16 },
  { id: '1:1',  label: '1:1   Instagram', w: 1, h: 1  },
  { id: '4:5',  label: '4:5   Reels',   w: 4,  h: 5  },
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
  const parts = [
    `brightness(${bright}%)`,
    `contrast(${f.contrast}%)`,
    `saturate(${f.saturation}%)`,
    `hue-rotate(${f.hue}deg)`,
  ]
  if (f.blur > 0) parts.push(`blur(${f.blur * 0.5}px)`)
  return parts.join(' ')
}

function uid() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Slider({ label, value, min, max, step = 1, onChange }: {
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
        className="w-full h-1.5 rounded-full accent-green-500 cursor-pointer" />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Highlights() {
  const [clips, setClips] = useState<Clip[]>([])
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([])
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

  // Simple undo/redo
  const undoStack = useRef<Clip[][]>([])
  const redoStack = useRef<Clip[][]>([])

  const saveUndo = (prev: Clip[]) => {
    undoStack.current.push(prev.map(c => ({ ...c })))
    redoStack.current = []
  }
  const undo = () => {
    const prev = undoStack.current.pop()
    if (!prev) return
    redoStack.current.push(clips.map(c => ({ ...c })))
    setClips(prev)
  }
  const redo = () => {
    const next = redoStack.current.pop()
    if (!next) return
    undoStack.current.push(clips.map(c => ({ ...c })))
    setClips(next)
  }

  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const previewVideoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const voiceRecorderRef = useRef<MediaRecorder | null>(null)
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const selected = clips.find(c => c.id === selectedId) ?? null

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      clips.forEach(c => { try { URL.revokeObjectURL(c.url) } catch {} })
      audioTracks.forEach(a => { try { URL.revokeObjectURL(a.url) } catch {} })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo() }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') { e.preventDefault(); redo() }
      if (e.key === ' ') { e.preventDefault(); handleTogglePlay() }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) removeClip(selectedId)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  // ── Thumbnail from video file
  const generateThumbnail = (file: File): Promise<string> => {
    return new Promise(resolve => {
      try {
        const video = document.createElement('video')
        const objectUrl = URL.createObjectURL(file)
        video.src = objectUrl
        video.currentTime = 0.5
        video.onloadeddata = () => { video.currentTime = 0.5 }
        video.onseeked = () => {
          try {
            const canvas = document.createElement('canvas')
            canvas.width = 192; canvas.height = 108
            canvas.getContext('2d')!.drawImage(video, 0, 0, 192, 108)
            resolve(canvas.toDataURL('image/jpeg', 0.7))
          } catch {
            resolve('')
          } finally {
            URL.revokeObjectURL(objectUrl)
          }
        }
        video.onerror = () => { URL.revokeObjectURL(objectUrl); resolve('') }
        setTimeout(() => { URL.revokeObjectURL(objectUrl); resolve('') }, 5000)
      } catch {
        resolve('')
      }
    })
  }

  // ── Add video files
  const addFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('video/'))
    if (!arr.length) return

    for (const file of arr) {
      let duration = 30
      let thumbnail = ''
      try {
        const url = URL.createObjectURL(file)
        duration = await new Promise<number>(res => {
          const v = document.createElement('video')
          v.src = url
          v.onloadedmetadata = () => res(v.duration || 30)
          v.onerror = () => res(30)
          setTimeout(() => res(30), 5000)
        })
        URL.revokeObjectURL(url)
        thumbnail = await generateThumbnail(file)
      } catch {}

      const clipUrl = URL.createObjectURL(file)
      const clip: Clip = {
        id: uid(),
        file,
        url: clipUrl,
        name: file.name.replace(/\.[^.]+$/, ''),
        duration,
        startTime: 0,
        endTime: Math.min(duration, 300),
        thumbnail,
        volume: 1,
        muted: false,
        speed: 1,
        visible: true,
        filters: { ...DEFAULT_FILTERS },
        textOverlays: [],
        transition: 'fade',
      }

      setClips(prev => {
        saveUndo(prev)
        return [...prev, clip]
      })
      setSelectedId(clip.id)
    }
  }

  // ── Add audio
  const addAudio = async (file: File) => {
    const url = URL.createObjectURL(file)
    const track: AudioTrack = {
      id: uid(), file, url,
      name: file.name.replace(/\.[^.]+$/, ''),
      volume: 0.7,
    }
    setAudioTracks(prev => [...prev, track])
  }

  // ── Drag/drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    addFiles(files.filter(f => f.type.startsWith('video/')))
    files.filter(f => f.type.startsWith('audio/')).forEach(addAudio)
  }

  // ── Clip mutations
  const updateClip = (id: string, patch: Partial<Clip>) => {
    setClips(prev => {
      saveUndo(prev)
      return prev.map(c => c.id === id ? { ...c, ...patch } : c)
    })
  }

  const updateFilters = (id: string, patch: Partial<ClipFilters>) => {
    setClips(prev => prev.map(c => c.id === id ? { ...c, filters: { ...c.filters, ...patch } } : c))
  }

  const removeClip = (id: string) => {
    setClips(prev => {
      saveUndo(prev)
      const next = prev.filter(c => c.id !== id)
      setSelectedId(next[0]?.id ?? null)
      return next
    })
  }

  const duplicateClip = (id: string) => {
    setClips(prev => {
      const clip = prev.find(c => c.id === id)
      if (!clip) return prev
      saveUndo(prev)
      const copy: Clip = { ...clip, id: uid(), name: clip.name + ' (copy)', url: URL.createObjectURL(clip.file) }
      const idx = prev.findIndex(c => c.id === id)
      const arr = [...prev]
      arr.splice(idx + 1, 0, copy)
      setSelectedId(copy.id)
      return arr
    })
  }

  const splitClip = (id: string) => {
    setClips(prev => {
      const clip = prev.find(c => c.id === id)
      if (!clip) return prev
      saveUndo(prev)
      const mid = clip.startTime + (clip.endTime - clip.startTime) / 2
      const a: Clip = { ...clip, endTime: mid }
      const b: Clip = { ...clip, id: uid(), name: clip.name + ' (2)', startTime: mid, url: URL.createObjectURL(clip.file) }
      const arr = [...prev]
      const idx = arr.findIndex(c => c.id === id)
      arr.splice(idx, 1, a, b)
      return arr
    })
  }

  const moveClip = (id: string, dir: -1 | 1) => {
    setClips(prev => {
      const idx = prev.findIndex(c => c.id === id)
      const nIdx = idx + dir
      if (nIdx < 0 || nIdx >= prev.length) return prev
      saveUndo(prev)
      const arr = [...prev]
      ;[arr[idx], arr[nIdx]] = [arr[nIdx], arr[idx]]
      return arr
    })
  }

  // ── Playback
  const handleTogglePlay = () => {
    const v = previewVideoRef.current
    if (!selected || !v) return
    if (isPlaying) {
      v.pause()
      setIsPlaying(false)
      if (playIntervalRef.current) clearInterval(playIntervalRef.current)
      return
    }
    v.src = selected.url
    v.currentTime = selected.startTime
    v.playbackRate = selected.speed
    v.volume = selected.volume
    v.muted = selected.muted
    v.style.filter = filtersToCSS(selected.filters)
    v.play().catch(() => {})
    setIsPlaying(true)
    setPlayTime(0)
    playIntervalRef.current = setInterval(() => {
      if (!previewVideoRef.current) return
      const elapsed = previewVideoRef.current.currentTime - selected.startTime
      setPlayTime(Math.max(0, elapsed))
      if (previewVideoRef.current.currentTime >= selected.endTime) {
        previewVideoRef.current.pause()
        setIsPlaying(false)
        if (playIntervalRef.current) clearInterval(playIntervalRef.current)
      }
    }, 50)
  }

  // ── Voice over
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
        addAudio(new File([blob], 'voiceover.webm', { type: 'audio/webm' }))
        stream.getTracks().forEach(t => t.stop())
      }
      recorder.start()
      voiceRecorderRef.current = recorder
      setIsRecordingVoice(true)
    } catch {
      alert('Microphone access denied')
    }
  }

  // ── Text overlay
  const addTextOverlay = () => {
    if (!selected || !newTextVal.trim()) return
    const overlay: TextOverlay = {
      id: uid(), text: newTextVal,
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

  // ── Export
  const exportReel = async () => {
    const visible = clips.filter(c => c.visible)
    if (!visible.length) return
    setIsExporting(true); setExportProgress(0)

    const ratio = ASPECT_RATIOS.find(r => r.id === exportAspect)!
    const canvas = canvasRef.current!
    const W = 1280
    const H = Math.round(W * ratio.h / ratio.w)
    canvas.width = W; canvas.height = H

    const ctx = canvas.getContext('2d')!
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm'
    const stream = canvas.captureStream(30)
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6_000_000 })
    const chunks: Blob[] = []
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
    recorder.start(100)

    const totalDur = visible.reduce((s, c) => s + (c.endTime - c.startTime) / c.speed, 0)
    let elapsed = 0

    for (const clip of visible) {
      const clipDur = (clip.endTime - clip.startTime) / clip.speed
      await new Promise<void>(resolve => {
        const video = document.createElement('video')
        video.src = clip.url
        video.muted = true
        video.playbackRate = clip.speed
        video.currentTime = clip.startTime

        const onCanPlay = async () => {
          try { await video.play() } catch {}
          const startWall = performance.now()

          const draw = () => {
            if (!isExporting) { video.pause(); resolve(); return }
            const wallSec = (performance.now() - startWall) / 1000
            const videoT = clip.startTime + wallSec * clip.speed

            if (videoT >= clip.endTime || video.ended) {
              video.pause()
              elapsed += clipDur
              resolve()
              return
            }

            ctx.fillStyle = '#000'
            ctx.fillRect(0, 0, W, H)
            ctx.save()
            ctx.filter = filtersToCSS(clip.filters)

            const vAR = video.videoWidth / (video.videoHeight || 1)
            const cAR = W / H
            let dx = 0, dy = 0, dw = W, dh = H
            if (vAR > cAR) { dh = H; dw = dh * vAR; dx = (W - dw) / 2 }
            else { dw = W; dh = dw / vAR; dy = (H - dh) / 2 }
            if (video.readyState >= 2) ctx.drawImage(video, dx, dy, dw, dh)
            ctx.restore()

            for (const t of clip.textOverlays) {
              if (wallSec < t.startAt || wallSec > t.endAt) continue
              const x = (t.x / 100) * W
              const y = (t.y / 100) * H
              const fs = t.fontSize * (W / 1280)
              if (t.style === 'scoreboard') {
                ctx.fillStyle = 'rgba(0,0,0,0.75)'
                ctx.fillRect(x - 8, y - fs - 4, t.text.length * fs * 0.6 + 16, fs + 14)
                ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2
                ctx.strokeRect(x - 8, y - fs - 4, t.text.length * fs * 0.6 + 16, fs + 14)
              } else if (t.style === 'nametag') {
                ctx.fillStyle = 'rgba(34,197,94,0.9)'
                ctx.fillRect(x - 6, y - fs - 2, t.text.length * fs * 0.58 + 12, fs + 10)
              } else if (t.style === 'title') {
                ctx.fillStyle = 'rgba(0,0,0,0.55)'
                ctx.fillRect(0, y - fs - 6, W, fs + 20)
              }
              ctx.font = `${t.bold ? 'bold' : ''} ${t.italic ? 'italic' : ''} ${fs}px sans-serif`.trim()
              ctx.fillStyle = t.color
              ctx.textAlign = t.style === 'title' ? 'center' : 'left'
              ctx.fillText(t.text, t.style === 'title' ? W / 2 : x, y)
            }

            setExportProgress(Math.round(((elapsed + wallSec) / totalDur) * 100))
            requestAnimationFrame(draw)
          }
          requestAnimationFrame(draw)
        }

        video.oncanplay = onCanPlay
        video.onerror = () => { elapsed += clipDur; resolve() }
        setTimeout(() => { video.pause(); elapsed += clipDur; resolve() }, (clipDur + 5) * 1000)
      })
    }

    recorder.stop()
    await new Promise<void>(r => { recorder.onstop = () => r() })
    const blob = new Blob(chunks, { type: 'video/webm' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `highlight-reel.webm`; a.click()
    URL.revokeObjectURL(url)
    setIsExporting(false); setExportProgress(0)
  }

  const totalDuration = clips.filter(c => c.visible).reduce((s, c) => s + (c.endTime - c.startTime) / c.speed, 0)
  const TPXSCALE = 80 * timelineZoom

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col bg-slate-950 text-white" style={{ height: 'calc(100vh - 3.5rem)', marginTop: '-1rem' }}>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-2 bg-slate-950 flex-shrink-0 flex-wrap">
        <div className="flex items-center gap-2 mr-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-600">
            <Film className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-white">Highlight Editor</span>
        </div>

        <div className="h-4 w-px bg-slate-800" />

        <button onClick={undo} disabled={undoStack.current.length === 0} title="Undo (Ctrl+Z)"
          className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-25 transition-all">
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <button onClick={redo} disabled={redoStack.current.length === 0} title="Redo (Ctrl+Y)"
          className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-25 transition-all">
          <RotateCw className="h-3.5 w-3.5" />
        </button>

        {selected && (
          <>
            <div className="h-4 w-px bg-slate-800" />
            <button onClick={() => splitClip(selected.id)}
              className="flex items-center gap-1 h-7 px-2 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
              <Scissors className="h-3.5 w-3.5" /> Split
            </button>
            <button onClick={() => duplicateClip(selected.id)}
              className="flex items-center gap-1 h-7 px-2 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
              <Copy className="h-3.5 w-3.5" /> Duplicate
            </button>
            <button onClick={() => removeClip(selected.id)}
              className="flex items-center gap-1 h-7 px-2 rounded text-xs text-red-500 hover:text-red-400 hover:bg-red-950/30 transition-all">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </>
        )}

        <div className="flex-1" />

        <button onClick={toggleVoiceRecord}
          className={`flex items-center gap-1.5 h-7 px-2.5 rounded text-xs font-medium transition-all ${
            isRecordingVoice ? 'bg-red-600 text-white animate-pulse' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}>
          {isRecordingVoice ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          {isRecordingVoice ? 'Stop' : 'Voice'}
        </button>

        <button onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 h-7 px-2.5 rounded text-xs font-medium text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 transition-all">
          <Plus className="h-3.5 w-3.5" /> Add Clip
        </button>

        <button onClick={() => audioInputRef.current?.click()}
          className="flex items-center gap-1.5 h-7 px-2.5 rounded text-xs font-medium text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 transition-all">
          <Music className="h-3.5 w-3.5" /> Add Music
        </button>

        <button onClick={exportReel} disabled={!clips.length || isExporting}
          className="flex items-center gap-1.5 h-7 px-3 rounded text-xs font-semibold bg-green-600 hover:bg-green-500 disabled:opacity-40 transition-all text-white">
          <Download className="h-3.5 w-3.5" />
          {isExporting ? `${exportProgress}%` : 'Export'}
        </button>

        <input ref={fileInputRef} type="file" accept="video/*" multiple className="hidden"
          onChange={e => e.target.files && addFiles(e.target.files)} />
        <input ref={audioInputRef} type="file" accept="audio/*" className="hidden"
          onChange={e => e.target.files?.[0] && addAudio(e.target.files[0])} />
      </div>

      {/* ── Main area ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: clip list */}
        <div className="w-40 flex-shrink-0 border-r border-slate-800 bg-slate-900/50 flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-800">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Clips ({clips.length})</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {clips.map((clip, i) => (
              <div key={clip.id} onClick={() => setSelectedId(clip.id)}
                className={`relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                  selectedId === clip.id ? 'border-green-500' : 'border-transparent hover:border-slate-600'
                } ${!clip.visible ? 'opacity-40' : ''}`}>
                {clip.thumbnail
                  ? <img src={clip.thumbnail} alt="" className="w-full aspect-video object-cover" />
                  : <div className="w-full aspect-video bg-slate-800 flex items-center justify-center">
                      <Film className="h-4 w-4 text-slate-600" />
                    </div>
                }
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 px-1.5 py-1">
                  <p className="text-xs text-white truncate">{clip.name}</p>
                  <p className="text-xs text-slate-400">{fmt(clip.endTime - clip.startTime)}</p>
                </div>
                <div className="absolute top-1 left-1">
                  <span className="text-xs bg-black/60 px-1 py-0.5 rounded font-mono">{i + 1}</span>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); updateClip(clip.id, { visible: !clip.visible }) }}
                  className="absolute top-1 right-1 h-5 w-5 flex items-center justify-center rounded bg-black/60 text-slate-300 hover:text-white">
                  {clip.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </button>
              </div>
            ))}

            <div onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed py-4 cursor-pointer transition-all ${
                dragOver ? 'border-green-500 bg-green-600/10' : 'border-slate-700 hover:border-slate-500'
              }`}>
              <Upload className="h-5 w-5 text-slate-600" />
              <p className="text-xs text-slate-600 text-center">Drop or click</p>
            </div>
          </div>
        </div>

        {/* Center: preview */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden">
            {selected ? (
              <>
                <video ref={previewVideoRef} src={selected.url}
                  className="max-h-full max-w-full object-contain"
                  style={{ filter: filtersToCSS(selected.filters) }}
                  onEnded={() => setIsPlaying(false)} playsInline />

                {selected.textOverlays.map(t => (
                  <div key={t.id} style={{
                    position: 'absolute', left: `${t.x}%`, top: `${t.y}%`,
                    fontSize: t.fontSize, color: t.color,
                    fontWeight: t.bold ? 'bold' : 'normal',
                    fontStyle: t.italic ? 'italic' : 'normal',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                    padding: t.style === 'scoreboard' ? '4px 10px' : t.style === 'nametag' ? '2px 8px' : '0',
                    background: t.style === 'scoreboard' ? 'rgba(0,0,0,0.75)' : t.style === 'nametag' ? 'rgba(34,197,94,0.85)' : 'transparent',
                    border: t.style === 'scoreboard' ? '1px solid #22c55e' : 'none',
                    borderRadius: 4, pointerEvents: 'none',
                  }}>{t.text}</div>
                ))}

                {/* Playback controls overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8">
                  <div className="relative h-1 bg-slate-700 rounded-full mb-3 cursor-pointer"
                    onClick={e => {
                      if (!previewVideoRef.current) return
                      const rect = e.currentTarget.getBoundingClientRect()
                      const pct = (e.clientX - rect.left) / rect.width
                      const t = selected.startTime + pct * (selected.endTime - selected.startTime)
                      previewVideoRef.current.currentTime = t
                      setPlayTime(pct * (selected.endTime - selected.startTime))
                    }}>
                    <div className="h-full bg-green-500 rounded-full"
                      style={{ width: `${(playTime / Math.max(0.01, selected.endTime - selected.startTime)) * 100}%` }} />
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => { if (previewVideoRef.current) { previewVideoRef.current.currentTime = selected.startTime; setPlayTime(0) } }}>
                      <SkipBack className="h-4 w-4 text-slate-300" />
                    </button>
                    <button onClick={handleTogglePlay}
                      className="h-8 w-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-all">
                      {isPlaying ? <Pause className="h-4 w-4 text-white" /> : <Play className="h-4 w-4 text-white ml-0.5" />}
                    </button>
                    <button onClick={() => { if (previewVideoRef.current) { previewVideoRef.current.currentTime = selected.endTime } }}>
                      <SkipForward className="h-4 w-4 text-slate-300" />
                    </button>
                    <span className="text-xs font-mono text-slate-300">
                      {fmt(playTime)} / {fmt(selected.endTime - selected.startTime)}
                    </span>
                    <div className="flex-1" />
                    <span className="text-xs text-slate-500">Total {fmt(totalDuration)}</span>
                    <button onClick={() => updateClip(selected.id, { muted: !selected.muted })}>
                      {selected.muted ? <VolumeX className="h-4 w-4 text-slate-400" /> : <Volume2 className="h-4 w-4 text-slate-400" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800">
                  <Film className="h-8 w-8 text-slate-600" />
                </div>
                <p className="text-sm font-medium text-slate-400">No clip selected</p>
                <p className="text-xs text-slate-600">Upload a video to start editing</p>
                <button onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-xl bg-green-600 hover:bg-green-500 px-4 py-2 text-sm font-semibold text-white transition-all mt-1">
                  <Upload className="h-4 w-4" /> Upload Video
                </button>
              </div>
            )}

            {isExporting && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
                <div className="text-5xl font-black text-white">{exportProgress}%</div>
                <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${exportProgress}%` }} />
                </div>
                <p className="text-sm text-slate-400">Rendering highlight reel…</p>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="flex-shrink-0 border-t border-slate-800 bg-slate-900" style={{ minHeight: 110 }}>
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-xs font-semibold text-slate-500">TIMELINE</span>
                <span className="text-xs text-slate-700">{clips.length} clips · {fmt(totalDuration)}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setTimelineZoom(z => Math.max(0.25, +(z - 0.25).toFixed(2)))}
                  className="h-5 w-5 flex items-center justify-center rounded text-slate-500 hover:text-white hover:bg-slate-800">
                  <ChevronDown className="h-3 w-3" />
                </button>
                <span className="text-xs text-slate-400 w-8 text-center">{timelineZoom}x</span>
                <button onClick={() => setTimelineZoom(z => Math.min(4, +(z + 0.25).toFixed(2)))}
                  className="h-5 w-5 flex items-center justify-center rounded text-slate-500 hover:text-white hover:bg-slate-800">
                  <ChevronUp className="h-3 w-3" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto" style={{ height: 80 }}>
              <div className="flex items-center gap-1 px-3 h-full" style={{ minWidth: clips.length * 100 }}>
                {clips.length === 0 ? (
                  <p className="text-xs text-slate-700 pl-1">Add clips to see the timeline</p>
                ) : clips.map((clip, i) => {
                  const w = Math.max(60, (clip.endTime - clip.startTime) / clip.speed * TPXSCALE)
                  return (
                    <div key={clip.id} onClick={() => setSelectedId(clip.id)}
                      className={`relative flex-shrink-0 h-14 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                        selectedId === clip.id ? 'border-green-500 shadow-lg shadow-green-900/40' : 'border-slate-700 hover:border-slate-500'
                      } ${!clip.visible ? 'opacity-30' : ''}`}
                      style={{ width: w }}>
                      {clip.thumbnail
                        ? <img src={clip.thumbnail} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-slate-800" />
                      }
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 flex flex-col justify-end px-1.5 pb-1">
                        <p className="text-xs text-white truncate">{clip.name}</p>
                        <p className="text-xs text-slate-400">{fmt(clip.endTime - clip.startTime)}</p>
                      </div>
                      <span className="absolute top-1 left-1 text-xs bg-black/60 px-1 rounded font-mono">{i + 1}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {audioTracks.length > 0 && (
              <div className="border-t border-slate-800 px-3 py-2 flex items-center gap-2 flex-wrap">
                <Music className="h-3.5 w-3.5 text-purple-400 flex-shrink-0" />
                {audioTracks.map(t => (
                  <div key={t.id} className="flex items-center gap-2 rounded-lg bg-purple-600/10 border border-purple-600/20 px-2 py-1">
                    <span className="text-xs text-purple-300 max-w-24 truncate">{t.name}</span>
                    <input type="range" min={0} max={1} step={0.05} value={t.volume}
                      onChange={e => setAudioTracks(prev => prev.map(a => a.id === t.id ? { ...a, volume: parseFloat(e.target.value) } : a))}
                      className="w-14 accent-purple-500" />
                    <button onClick={() => setAudioTracks(prev => prev.filter(a => a.id !== t.id))}
                      className="text-slate-600 hover:text-red-400"><X className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: properties */}
        <div className="w-60 flex-shrink-0 border-l border-slate-800 bg-slate-900/50 flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center px-4">
              <p className="text-xs text-slate-600 text-center">Select a clip to edit its properties</p>
            </div>
          ) : (
            <>
              {/* Tab bar */}
              <div className="flex flex-wrap gap-1 p-2 border-b border-slate-800">
                {(['trim', 'color', 'text', 'audio', 'transition', 'speed', 'export'] as TabId[]).map(t => (
                  <button key={t} onClick={() => setActiveTab(t)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all capitalize ${
                      activeTab === t ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}>{t}</button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-4">

                {/* TRIM */}
                {activeTab === 'trim' && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Name</p>
                      <input value={selected.name}
                        onChange={e => updateClip(selected.id, { name: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-green-500" />
                    </div>
                    <Slider label="Start" value={+selected.startTime.toFixed(1)} min={0} max={Math.max(0, selected.duration - 0.5)} step={0.1}
                      onChange={v => { if (v < selected.endTime - 0.5) updateClip(selected.id, { startTime: v }) }} />
                    <Slider label="End" value={+selected.endTime.toFixed(1)} min={0.5} max={selected.duration} step={0.1}
                      onChange={v => { if (v > selected.startTime + 0.5) updateClip(selected.id, { endTime: v }) }} />
                    <div className="rounded-lg bg-slate-800 px-3 py-2 text-center">
                      <p className="text-xs text-slate-500">Duration</p>
                      <p className="text-lg font-bold text-white">{fmt(selected.endTime - selected.startTime)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => splitClip(selected.id)}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 py-2 text-xs text-slate-300 hover:text-white transition-all">
                        <Scissors className="h-3.5 w-3.5" /> Split
                      </button>
                      <button onClick={() => duplicateClip(selected.id)}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 py-2 text-xs text-slate-300 hover:text-white transition-all">
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => moveClip(selected.id, -1)}
                        className="flex-1 rounded-lg bg-slate-800 hover:bg-slate-700 py-2 text-xs text-slate-300 hover:text-white transition-all">← Left</button>
                      <button onClick={() => moveClip(selected.id, 1)}
                        className="flex-1 rounded-lg bg-slate-800 hover:bg-slate-700 py-2 text-xs text-slate-300 hover:text-white transition-all">Right →</button>
                    </div>
                  </div>
                )}

                {/* COLOR */}
                {activeTab === 'color' && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-2">Presets</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(Object.keys(PRESETS) as Preset[]).map(p => (
                          <button key={p} onClick={() => updateClip(selected.id, { filters: { ...PRESETS[p] } })}
                            className="rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-all capitalize">
                            {p === 'bw' ? 'B&W' : p}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="h-px bg-slate-800" />
                    <Slider label="Brightness" value={selected.filters.brightness} min={0} max={200}
                      onChange={v => updateFilters(selected.id, { brightness: v })} />
                    <Slider label="Contrast" value={selected.filters.contrast} min={0} max={200}
                      onChange={v => updateFilters(selected.id, { contrast: v })} />
                    <Slider label="Saturation" value={selected.filters.saturation} min={0} max={200}
                      onChange={v => updateFilters(selected.id, { saturation: v })} />
                    <Slider label="Exposure" value={selected.filters.exposure} min={-50} max={50}
                      onChange={v => updateFilters(selected.id, { exposure: v })} />
                    <Slider label="Hue Shift" value={selected.filters.hue} min={0} max={360}
                      onChange={v => updateFilters(selected.id, { hue: v })} />
                    <Slider label="Blur" value={selected.filters.blur} min={0} max={10} step={0.1}
                      onChange={v => updateFilters(selected.id, { blur: v })} />
                    <button onClick={() => updateClip(selected.id, { filters: { ...DEFAULT_FILTERS } })}
                      className="w-full rounded-lg bg-slate-800 hover:bg-slate-700 py-2 text-xs text-slate-400 hover:text-white transition-all">
                      Reset Filters
                    </button>
                  </div>
                )}

                {/* TEXT */}
                {activeTab === 'text' && (
                  <div className="space-y-3">
                    {!addingText ? (
                      <button onClick={() => setAddingText(true)}
                        className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 hover:border-green-600 py-3 text-sm text-slate-400 hover:text-white transition-all">
                        <Plus className="h-4 w-4" /> Add Text
                      </button>
                    ) : (
                      <div className="space-y-2 rounded-xl border border-slate-700 bg-slate-800/50 p-3">
                        <input value={newTextVal} onChange={e => setNewTextVal(e.target.value)}
                          placeholder="Enter text..."
                          onKeyDown={e => e.key === 'Enter' && addTextOverlay()}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-green-500" />
                        <div className="grid grid-cols-2 gap-1">
                          {(['plain', 'scoreboard', 'nametag', 'title', 'watermark'] as TextOverlay['style'][]).map(s => (
                            <button key={s} onClick={() => setNewTextStyle(s)}
                              className={`py-1 rounded text-xs font-medium transition-all capitalize ${
                                newTextStyle === s ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'
                              }`}>{s}</button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">Color</span>
                          <input type="color" value={newTextColor} onChange={e => setNewTextColor(e.target.value)}
                            className="h-7 w-10 rounded cursor-pointer bg-transparent border-0" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={addTextOverlay}
                            className="flex-1 rounded-lg bg-green-600 hover:bg-green-500 py-1.5 text-xs font-semibold text-white transition-all">Add</button>
                          <button onClick={() => setAddingText(false)}
                            className="flex-1 rounded-lg bg-slate-700 hover:bg-slate-600 py-1.5 text-xs text-slate-300 transition-all">Cancel</button>
                        </div>
                      </div>
                    )}
                    {selected.textOverlays.map(t => (
                      <div key={t.id} className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-white truncate">{t.text}</p>
                          <p className="text-xs text-slate-500 capitalize">{t.style}</p>
                        </div>
                        <button onClick={() => removeTextOverlay(selected.id, t.id)} className="text-slate-600 hover:text-red-400 ml-2">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    {!selected.textOverlays.length && !addingText && (
                      <p className="text-xs text-slate-600 text-center py-3">No overlays yet</p>
                    )}
                  </div>
                )}

                {/* AUDIO */}
                {activeTab === 'audio' && (
                  <div className="space-y-4">
                    <Slider label="Clip Volume" value={Math.round(selected.volume * 100)} min={0} max={100}
                      onChange={v => updateClip(selected.id, { volume: v / 100 })} />
                    <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2">
                      <span className="text-xs text-slate-300">Mute clip</span>
                      <button onClick={() => updateClip(selected.id, { muted: !selected.muted })}
                        className={`relative h-5 w-9 rounded-full transition-all ${selected.muted ? 'bg-green-600' : 'bg-slate-700'}`}>
                        <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${selected.muted ? 'left-4' : 'left-0.5'}`} />
                      </button>
                    </div>
                    <div className="h-px bg-slate-800" />
                    <button onClick={() => audioInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 hover:border-purple-600 py-3 text-xs text-slate-400 hover:text-purple-300 transition-all">
                      <Music className="h-4 w-4" /> Add Background Music
                    </button>
                    <button onClick={toggleVoiceRecord}
                      className={`w-full flex items-center justify-center gap-2 rounded-xl border py-3 text-xs font-medium transition-all ${
                        isRecordingVoice ? 'border-red-600 bg-red-900/20 text-red-400 animate-pulse' : 'border-slate-700 text-slate-400 hover:text-red-300'
                      }`}>
                      {isRecordingVoice ? <><MicOff className="h-4 w-4" /> Stop Recording</> : <><Mic className="h-4 w-4" /> Record Voice Over</>}
                    </button>
                  </div>
                )}

                {/* TRANSITION */}
                {activeTab === 'transition' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500">Transition after this clip</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {TRANSITIONS.map(t => (
                        <button key={t.id} onClick={() => updateClip(selected.id, { transition: t.id })}
                          className={`rounded-lg py-2 text-xs font-medium transition-all ${
                            selected.transition === t.id
                              ? 'bg-green-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                          }`}>{t.label}</button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-600">Applied during export</p>
                  </div>
                )}

                {/* SPEED */}
                {activeTab === 'speed' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500">Playback Speed</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {SPEED_OPTIONS.map(s => (
                        <button key={s} onClick={() => updateClip(selected.id, { speed: s })}
                          className={`rounded-lg py-2 text-xs font-bold transition-all ${
                            selected.speed === s ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                          }`}>{s}x</button>
                      ))}
                    </div>
                    <div className="rounded-lg bg-slate-800 px-3 py-2">
                      <p className="text-xs text-slate-500">At {selected.speed}x speed, clip plays in:</p>
                      <p className="text-sm font-bold text-white">{fmt((selected.endTime - selected.startTime) / selected.speed)}</p>
                    </div>
                    <p className="text-xs text-slate-600">
                      {selected.speed < 1 ? 'Slow motion' : selected.speed > 1 ? 'Speed up' : 'Normal speed'}
                    </p>
                  </div>
                )}

                {/* EXPORT */}
                {activeTab === 'export' && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-2">Aspect Ratio</p>
                      {ASPECT_RATIOS.map(r => (
                        <button key={r.id} onClick={() => setExportAspect(r.id)}
                          className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm mb-1.5 transition-all ${
                            exportAspect === r.id
                              ? 'bg-green-600/20 border border-green-600/50 text-white'
                              : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white'
                          }`}>
                          <span className="font-medium">{r.label}</span>
                          <span className="text-xs text-slate-500">{r.id}</span>
                        </button>
                      ))}
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-3 space-y-1 text-xs">
                      <p className="text-slate-300">Format: <span className="text-white">WebM</span></p>
                      <p className="text-slate-300">Quality: <span className="text-white">6 Mbps</span></p>
                      <p className="text-slate-300">Clips: <span className="text-white">{clips.filter(c => c.visible).length}</span></p>
                      <p className="text-slate-300">Total: <span className="text-white">{fmt(totalDuration)}</span></p>
                    </div>
                    <button onClick={exportReel} disabled={!clips.length || isExporting}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-40 py-3 text-sm font-semibold text-white transition-all">
                      <Download className="h-4 w-4" />
                      {isExporting ? `Exporting ${exportProgress}%` : 'Export Reel'}
                    </button>
                    {isExporting && (
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${exportProgress}%` }} />
                      </div>
                    )}
                  </div>
                )}

              </div>
            </>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
