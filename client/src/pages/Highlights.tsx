import { useState, useRef, useCallback } from 'react'
import { Upload, Play, Pause, Trash2, GripVertical, Download, Film, Plus, ChevronUp, ChevronDown, Type, Music, X } from 'lucide-react'

interface Clip {
  id: string
  file: File
  url: string
  name: string
  duration: number
  startTime: number
  endTime: number
  thumbnail: string
}

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function Highlights() {
  const [clips, setClips] = useState<Clip[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [titleText, setTitleText] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [showTitleInput, setShowTitleInput] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewVideoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const selected = clips.find(c => c.id === selectedId) ?? null

  const generateThumbnail = (file: File, time = 0.5): Promise<string> => {
    return new Promise(resolve => {
      const video = document.createElement('video')
      video.src = URL.createObjectURL(file)
      video.currentTime = time
      video.onloadeddata = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 160
        canvas.height = 90
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(video, 0, 0, 160, 90)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
        URL.revokeObjectURL(video.src)
      }
    })
  }

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('video/'))
    if (arr.length === 0) return
    if (clips.length + arr.length > 10) {
      alert('Maximum 10 clips allowed')
      return
    }

    for (const file of arr) {
      const url = URL.createObjectURL(file)
      const duration = await new Promise<number>(res => {
        const v = document.createElement('video')
        v.src = url
        v.onloadedmetadata = () => res(v.duration)
      })
      const thumbnail = await generateThumbnail(file)
      const clip: Clip = {
        id: crypto.randomUUID(),
        file,
        url,
        name: file.name.replace(/\.[^.]+$/, ''),
        duration,
        startTime: 0,
        endTime: duration,
        thumbnail,
      }
      setClips(prev => [...prev, clip])
      if (!selectedId) setSelectedId(clip.id)
    }
  }, [clips.length, selectedId])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }

  const removeClip = (id: string) => {
    setClips(prev => {
      const updated = prev.filter(c => c.id !== id)
      if (selectedId === id) setSelectedId(updated[0]?.id ?? null)
      return updated
    })
  }

  const moveClip = (id: string, dir: -1 | 1) => {
    setClips(prev => {
      const idx = prev.findIndex(c => c.id === id)
      const newIdx = idx + dir
      if (newIdx < 0 || newIdx >= prev.length) return prev
      const arr = [...prev]
      ;[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]
      return arr
    })
  }

  const updateClip = (id: string, patch: Partial<Clip>) => {
    setClips(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c))
  }

  // Preview selected clip
  const playSelected = () => {
    const v = previewVideoRef.current
    if (!v || !selected) return
    if (isPlaying) {
      v.pause()
      setIsPlaying(false)
      return
    }
    v.src = selected.url
    v.currentTime = selected.startTime
    v.play()
    setIsPlaying(true)
    const check = setInterval(() => {
      if (v.currentTime >= selected.endTime || v.paused) {
        v.pause()
        setIsPlaying(false)
        clearInterval(check)
      }
    }, 100)
  }

  // Export using canvas + MediaRecorder
  const exportReel = async () => {
    if (clips.length === 0) return
    setIsExporting(true)
    setExportProgress(0)

    const canvas = canvasRef.current!
    canvas.width = 1280
    canvas.height = 720
    const ctx = canvas.getContext('2d')!

    const stream = canvas.captureStream(30)
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' })
    const chunks: Blob[] = []
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }

    recorder.start(100)

    const totalDuration = clips.reduce((s, c) => s + (c.endTime - c.startTime), 0)
    let elapsed = 0

    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i]
      const clipDur = clip.endTime - clip.startTime

      await new Promise<void>(resolve => {
        const video = document.createElement('video')
        video.src = clip.url
        video.currentTime = clip.startTime
        video.muted = true

        video.oncanplay = async () => {
          await video.play()

          const startWall = performance.now()
          const draw = () => {
            const wallElapsed = (performance.now() - startWall) / 1000
            const videoTime = clip.startTime + wallElapsed

            if (videoTime >= clip.endTime || video.paused || video.ended) {
              video.pause()
              elapsed += clipDur
              resolve()
              return
            }

            ctx.fillStyle = '#000'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

            // Title overlay on first clip
            if (titleText && i === 0 && wallElapsed < 3) {
              ctx.fillStyle = 'rgba(0,0,0,0.5)'
              ctx.fillRect(0, canvas.height - 120, canvas.width, 120)
              ctx.fillStyle = '#ffffff'
              ctx.font = 'bold 48px sans-serif'
              ctx.textAlign = 'center'
              ctx.fillText(titleText, canvas.width / 2, canvas.height - 50)
            }

            // Clip number indicator
            ctx.fillStyle = 'rgba(0,0,0,0.6)'
            ctx.fillRect(20, 20, 80, 36)
            ctx.fillStyle = '#22c55e'
            ctx.font = 'bold 16px sans-serif'
            ctx.textAlign = 'left'
            ctx.fillText(`${i + 1}/${clips.length}`, 30, 44)

            setExportProgress(Math.round(((elapsed + wallElapsed) / totalDuration) * 100))
            requestAnimationFrame(draw)
          }
          requestAnimationFrame(draw)
        }
      })
    }

    recorder.stop()
    await new Promise<void>(r => { recorder.onstop = () => r() })

    const blob = new Blob(chunks, { type: 'video/webm' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${titleText || 'highlight-reel'}.webm`
    a.click()
    URL.revokeObjectURL(url)

    setIsExporting(false)
    setExportProgress(0)
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Highlight Reel</h1>
          <p className="mt-1 text-sm text-slate-500">Upload clips, trim them, arrange the order, and export your reel</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTitleInput(v => !v)}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm font-medium text-slate-200 hover:border-slate-500 transition-all"
          >
            <Type className="h-4 w-4" />
            {titleText ? 'Edit title' : 'Add title'}
          </button>
          <button
            onClick={exportReel}
            disabled={clips.length === 0 || isExporting}
            className="flex items-center gap-2 rounded-xl bg-pitch-600 hover:bg-pitch-500 disabled:opacity-40 px-4 py-2 text-sm font-semibold text-white transition-all"
          >
            <Download className="h-4 w-4" />
            {isExporting ? `Exporting ${exportProgress}%` : 'Export Reel'}
          </button>
        </div>
      </div>

      {/* Title input */}
      {showTitleInput && (
        <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3">
          <Type className="h-4 w-4 text-slate-500 flex-shrink-0" />
          <input
            value={titleText}
            onChange={e => setTitleText(e.target.value)}
            placeholder="Reel title (shown in first 3 seconds)..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-600 outline-none"
          />
          {titleText && (
            <button onClick={() => setTitleText('')} className="text-slate-600 hover:text-slate-400">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Clip list */}
        <div className="lg:col-span-2 space-y-3">
          {/* Upload zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-all ${
              dragOver ? 'border-pitch-500 bg-pitch-600/10' : 'border-slate-700 hover:border-slate-500 bg-slate-900/40'
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800">
              <Upload className="h-5 w-5 text-slate-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-300">Drop video clips here</p>
              <p className="text-xs text-slate-600 mt-0.5">MP4, MOV, WebM · Max 10 clips</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-pitch-400 font-medium">
              <Plus className="h-3.5 w-3.5" /> Add clips
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={e => e.target.files && addFiles(e.target.files)}
          />

          {/* Clip cards */}
          {clips.map((clip, i) => (
            <div
              key={clip.id}
              onClick={() => setSelectedId(clip.id)}
              className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                selectedId === clip.id
                  ? 'border-pitch-600/50 bg-pitch-600/10'
                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
              }`}
            >
              {/* Thumbnail */}
              <div className="relative flex-shrink-0">
                <img src={clip.thumbnail} alt="" className="h-14 w-24 rounded-lg object-cover" />
                <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-0.5 text-xs text-white">
                  {formatTime(clip.endTime - clip.startTime)}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{clip.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatTime(clip.startTime)} – {formatTime(clip.endTime)}
                </p>
              </div>

              {/* Controls */}
              <div className="flex flex-col items-center gap-1">
                <button onClick={e => { e.stopPropagation(); moveClip(clip.id, -1) }} disabled={i === 0} className="text-slate-600 hover:text-slate-300 disabled:opacity-20 transition-colors">
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <span className="text-xs text-slate-600 font-mono">{i + 1}</span>
                <button onClick={e => { e.stopPropagation(); moveClip(clip.id, 1) }} disabled={i === clips.length - 1} className="text-slate-600 hover:text-slate-300 disabled:opacity-20 transition-colors">
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
              <button onClick={e => { e.stopPropagation(); removeClip(clip.id) }} className="text-slate-700 hover:text-red-400 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {clips.length === 0 && (
            <div className="text-center py-6">
              <Film className="h-8 w-8 text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-600">Your clips will appear here</p>
            </div>
          )}
        </div>

        {/* Preview + trim */}
        <div className="lg:col-span-3 space-y-4">
          {/* Video preview */}
          <div className="relative rounded-xl bg-black overflow-hidden aspect-video flex items-center justify-center border border-slate-800">
            {selected ? (
              <>
                <video
                  ref={previewVideoRef}
                  src={selected.url}
                  className="w-full h-full object-contain"
                  onEnded={() => setIsPlaying(false)}
                />
                <button
                  onClick={playSelected}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/20 transition-all group"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm group-hover:bg-white/30 transition-all">
                    {isPlaying
                      ? <Pause className="h-6 w-6 text-white" />
                      : <Play className="h-6 w-6 text-white ml-1" />
                    }
                  </div>
                </button>
              </>
            ) : (
              <div className="text-center">
                <Film className="h-12 w-12 text-slate-800 mx-auto mb-3" />
                <p className="text-sm text-slate-600">Select a clip to preview</p>
              </div>
            )}
          </div>

          {/* Trim controls */}
          {selected && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Trim: {selected.name}</p>
                <p className="text-xs text-slate-500">
                  Clip length: <span className="text-white">{formatTime(selected.endTime - selected.startTime)}</span>
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Start</span>
                    <span className="text-white font-mono">{formatTime(selected.startTime)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={selected.duration}
                    step={0.1}
                    value={selected.startTime}
                    onChange={e => {
                      const v = parseFloat(e.target.value)
                      if (v < selected.endTime - 0.5) updateClip(selected.id, { startTime: v })
                    }}
                    className="w-full accent-pitch-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>End</span>
                    <span className="text-white font-mono">{formatTime(selected.endTime)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={selected.duration}
                    step={0.1}
                    value={selected.endTime}
                    onChange={e => {
                      const v = parseFloat(e.target.value)
                      if (v > selected.startTime + 0.5) updateClip(selected.id, { endTime: v })
                    }}
                    className="w-full accent-pitch-500"
                  />
                </div>
              </div>

              {/* Visual trim bar */}
              <div className="relative h-8 bg-slate-800 rounded-lg overflow-hidden">
                <div
                  className="absolute top-0 h-full bg-pitch-600/40 border-x-2 border-pitch-500"
                  style={{
                    left: `${(selected.startTime / selected.duration) * 100}%`,
                    width: `${((selected.endTime - selected.startTime) / selected.duration) * 100}%`,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs text-slate-400 font-mono">
                    {formatTime(selected.startTime)} → {formatTime(selected.endTime)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Reel summary */}
          {clips.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-500">{clips.length} clip{clips.length !== 1 ? 's' : ''}</span>
                <span className="text-slate-700">·</span>
                <span className="text-white font-medium">
                  Total: {formatTime(clips.reduce((s, c) => s + (c.endTime - c.startTime), 0))}
                </span>
              </div>
              {isExporting && (
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-32 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-pitch-500 transition-all duration-300"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">{exportProgress}%</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hidden canvas for export */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
