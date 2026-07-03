/* ═══ Video Analysis Studio ═══════════════════════════════════════════════
   Video becomes another source of insight alongside logged match data —
   not a media viewer. Every marker, annotation and note exists to answer
   "what can this athlete learn from reviewing this moment?" No automated
   video understanding is implemented yet; the AI panel says so plainly and
   separates Manual Notes, Evidence-Based Insights (from logged match stats)
   and clearly-labeled Future Capabilities. */
import { useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Film, Plus, Search, X, Bookmark as BookmarkIcon, MessageSquare, Sparkles,
  Scissors, ListVideo, Share2, Trash2, Pencil, ArrowRight, Circle as CircleIcon, Type,
  Copy, Check, Link2,
} from 'lucide-react'
import { color, font, ease } from '@/design/tokens'
import { useAuth } from '@/hooks/useAuth'
import { useCareerMatches } from '@/hooks/useCareerMatches'
import { generateMatchSummary } from '@/lib/matchIntel'
import {
  type VideoAsset, type VideoType, type Marker, type MarkerType, type Annotation, type AnnotationShape,
  type AnnotationCategory, type VideoNote, type Clip, type Playlist, type VideoAudience,
  VIDEO_TYPE_LABEL, MARKER_META, ANNOTATION_CATEGORY_LABEL, VIDEO_AUDIENCE_META,
  detectSource, formatTime, searchVideos,
  loadVideos, saveVideos, loadMarkers, saveMarkers, loadAnnotations, saveAnnotations,
  loadNotes, saveNotes, loadClips, saveClips, loadPlaylists, savePlaylists, loadShares, saveShares,
  buildVideoSharePayload, encodeVideoShare,
} from '@/lib/videoStudio'
import { VideoPlayer, type VideoPlayerHandle } from '@/components/video/VideoPlayer'
import { AnnotationOverlay } from '@/components/video/AnnotationOverlay'

const BC = { fontFamily: font.display }
const B = { fontFamily: font.ui }
const MONO = { fontFamily: font.mono }
const sectionLabel = { ...BC, fontSize: '0.65rem', letterSpacing: '0.22em', color: color.inkMuted } as const

const ANNOTATION_COLORS = ['#ff5a3c', '#2dd4a0', '#4d9fff', '#ffba08', '#a78bfa']
const FUTURE_CAPABILITIES = [
  'Movement Analysis', 'Positioning Review', 'Passing Network Detection', 'Decision Timeline', 'Sprint Review',
]

type Tab = 'notebook' | 'markers' | 'annotations' | 'ai' | 'clip' | 'playlists' | 'share'

export default function VideoStudio() {
  const { user, isDemoMode } = useAuth()
  const uid = isDemoMode ? 'demo' : user?.uid ?? ''
  const { careerMatches } = useCareerMatches()
  const playerRef = useRef<VideoPlayerHandle>(null)

  const [videos, setVideos] = useState<VideoAsset[]>(() => loadVideos(uid))
  const [markers, setMarkers] = useState<Marker[]>(() => loadMarkers(uid))
  const [annotations, setAnnotations] = useState<Annotation[]>(() => loadAnnotations(uid))
  const [notes, setNotes] = useState<VideoNote[]>(() => loadNotes(uid))
  const [clips, setClips] = useState<Clip[]>(() => loadClips(uid))
  const [playlists, setPlaylists] = useState<Playlist[]>(() => loadPlaylists(uid))
  const [shares, setShares] = useState(() => loadShares(uid))

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<VideoType | 'all'>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [tab, setTab] = useState<Tab>('notebook')
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const [placing, setPlacing] = useState<{ shape: AnnotationShape; color: string } | null>(null)
  const [pendingCategory, setPendingCategory] = useState<AnnotationCategory>('good_decision')
  const [newNote, setNewNote] = useState('')
  const [clipTitle, setClipTitle] = useState('')
  const [clipDesc, setClipDesc] = useState('')
  const [clipTags, setClipTags] = useState('')
  const [markIn, setMarkIn] = useState<number | null>(null)
  const [markOut, setMarkOut] = useState<number | null>(null)
  const [copiedShare, setCopiedShare] = useState(false);

  const persist = {
    videos: (v: VideoAsset[]) => { setVideos(v); saveVideos(uid, v) },
    markers: (v: Marker[]) => { setMarkers(v); saveMarkers(uid, v) },
    annotations: (v: Annotation[]) => { setAnnotations(v); saveAnnotations(uid, v) },
    notes: (v: VideoNote[]) => { setNotes(v); saveNotes(uid, v) },
    clips: (v: Clip[]) => { setClips(v); saveClips(uid, v) },
    playlists: (v: Playlist[]) => { setPlaylists(v); savePlaylists(uid, v) },
    shares: (v: typeof shares) => { setShares(v); saveShares(uid, v) },
  }

  const filtered = useMemo(() => {
    const bySearch = searchVideos(videos, notes, query)
    return typeFilter === 'all' ? bySearch : bySearch.filter(v => v.type === typeFilter)
  }, [videos, notes, query, typeFilter])

  const selected = videos.find(v => v.id === selectedId) ?? null
  const videoMarkers = markers.filter(m => m.videoId === selectedId).sort((a, b) => a.time - b.time)
  const videoAnnotations = annotations.filter(a => a.videoId === selectedId)
  const videoNotes = notes.filter(n => n.videoId === selectedId).sort((a, b) => a.time - b.time)
  const videoClips = clips.filter(c => c.videoId === selectedId)
  const linkedMatch = selected?.matchId ? careerMatches.find(m => m.id === selected.matchId) : undefined

  const addVideo = (draft: Omit<VideoAsset, 'id' | 'createdAt' | 'source' | 'embedId'>) => {
    const { source, embedId } = detectSource(draft.url)
    const v: VideoAsset = { ...draft, id: crypto.randomUUID(), createdAt: new Date().toISOString(), source, embedId }
    persist.videos([v, ...videos])
    setSelectedId(v.id)
    setShowAdd(false)
  }
  const deleteVideo = (id: string) => {
    persist.videos(videos.filter(v => v.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const addMarker = (type: MarkerType, label: string) => {
    if (!selectedId) return
    const m: Marker = { id: crypto.randomUUID(), videoId: selectedId, time, type, label, createdAt: new Date().toISOString() }
    persist.markers([...markers, m].sort((a, b) => a.time - b.time))
  }
  const removeMarker = (id: string) => persist.markers(markers.filter(m => m.id !== id))

  const placeAnnotation = (a: { shape: AnnotationShape; x: number; y: number; x2?: number; y2?: number; text?: string }) => {
    if (!selectedId || !placing) return
    const ann: Annotation = {
      id: crypto.randomUUID(), videoId: selectedId, time, category: pendingCategory, color: placing.color,
      createdAt: new Date().toISOString(), ...a,
    }
    persist.annotations([...annotations, ann])
    setPlacing(null)
  }
  const removeAnnotation = (id: string) => persist.annotations(annotations.filter(a => a.id !== id))

  const addNote = () => {
    if (!selectedId || !newNote.trim()) return
    const n: VideoNote = { id: crypto.randomUUID(), videoId: selectedId, time, text: newNote.trim(), createdAt: new Date().toISOString() }
    persist.notes([...notes, n].sort((a, b) => a.time - b.time))
    setNewNote('')
  }
  const removeNote = (id: string) => persist.notes(notes.filter(n => n.id !== id))

  const saveClip = () => {
    if (!selectedId || markIn === null || markOut === null || markOut <= markIn || !clipTitle.trim()) return
    const c: Clip = {
      id: crypto.randomUUID(), videoId: selectedId, title: clipTitle.trim(), description: clipDesc.trim(),
      tags: clipTags.split(',').map(t => t.trim()).filter(Boolean), startTime: markIn, endTime: markOut, createdAt: new Date().toISOString(),
    }
    persist.clips([c, ...clips])
    setClipTitle(''); setClipDesc(''); setClipTags(''); setMarkIn(null); setMarkOut(null)
  }
  const deleteClip = (id: string) => persist.clips(clips.filter(c => c.id !== id))

  const [newPlaylistName, setNewPlaylistName] = useState('')
  const createPlaylist = () => {
    if (!newPlaylistName.trim()) return
    const p: Playlist = { id: crypto.randomUUID(), name: newPlaylistName.trim(), clipIds: [], videoIds: [], createdAt: new Date().toISOString() }
    persist.playlists([p, ...playlists])
    setNewPlaylistName('')
  }
  const toggleVideoInPlaylist = (playlistId: string, videoId: string) => {
    persist.playlists(playlists.map(p => p.id === playlistId
      ? { ...p, videoIds: p.videoIds.includes(videoId) ? p.videoIds.filter(id => id !== videoId) : [...p.videoIds, videoId] }
      : p))
  }
  const deletePlaylist = (id: string) => persist.playlists(playlists.filter(p => p.id !== id))

  const [shareAudience, setShareAudience] = useState<VideoAudience>('coach')
  const generateShare = () => {
    if (!selected) return
    const payload = buildVideoSharePayload(selected, shareAudience, undefined, markers, notes)
    const encoded = encodeVideoShare(payload)
    persist.shares([{ id: crypto.randomUUID(), videoId: selected.id, audience: shareAudience, encoded, createdAt: new Date().toISOString() }, ...shares])
  }
  const copyShareUrl = (encoded: string, id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/watch/${encoded}`)
    setCopiedShare(true); setTimeout(() => setCopiedShare(false), 1800)
  }

  /* ── Detail view ─────────────────────────────────────────────────────── */
  if (selected) {
    return (
      <div className="space-y-5 animate-slide-up">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button onClick={() => setSelectedId(null)} className="text-xs font-semibold flex items-center gap-1" style={{ ...BC, color: color.inkMuted }}>
            ← Video Library
          </button>
          <button onClick={() => deleteVideo(selected.id)} className="flex items-center gap-1.5 text-xs font-semibold" style={{ ...BC, color: color.danger }}>
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </button>
        </div>

        <div>
          <h1 className="font-display text-2xl font-extrabold text-white">{selected.title}</h1>
          <p style={{ ...B, fontSize: '0.8rem', color: color.inkMuted }} className="mt-1">
            {VIDEO_TYPE_LABEL[selected.type]} · {selected.date}{selected.opponent ? ` · vs ${selected.opponent}` : ''}{selected.competition ? ` · ${selected.competition}` : ''}
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-5">
          <div>
            <VideoPlayer
              ref={playerRef}
              video={selected}
              markers={videoMarkers}
              onTimeUpdate={(t, d) => { setTime(t); setDuration(d) }}
              overlay={<AnnotationOverlay annotations={videoAnnotations} currentTime={time} placing={placing} onPlace={placeAnnotation} />}
            />

            {/* quick marker + annotation toolbar */}
            <div className="mt-4 flex flex-wrap gap-2">
              {(Object.keys(MARKER_META) as MarkerType[]).map(t => (
                <button key={t} onClick={() => addMarker(t, MARKER_META[t].label)}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                  style={{ ...BC, background: color.surface, color: color.inkDim, border: `1px solid ${color.border}` }}>
                  <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: MARKER_META[t].color }} /> {MARKER_META[t].label}
                </button>
              ))}
            </div>
          </div>

          {/* sidebar tabs */}
          <div className="rounded-2xl p-5" style={{ background: color.surface, border: `1px solid ${color.border}` }}>
            <div className="flex flex-wrap gap-1 mb-4 print:hidden" role="tablist">
              {([
                ['notebook', 'Notebook', MessageSquare], ['markers', 'Timeline', BookmarkIcon], ['annotations', 'Annotations', Pencil],
                ['ai', 'AI Panel', Sparkles], ['clip', 'Clip Creator', Scissors], ['playlists', 'Playlists', ListVideo], ['share', 'Share', Share2],
              ] as [Tab, string, typeof MessageSquare][]).map(([key, label, Icon]) => (
                <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold"
                  style={{ ...BC, background: tab === key ? 'rgba(255,90,60,0.14)' : 'transparent', color: tab === key ? color.accentSoft : color.inkMuted }}>
                  <Icon className="h-3 w-3" /> {label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                {tab === 'notebook' && (
                  <div>
                    <div className="flex gap-2 mb-3">
                      <input value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNote()}
                        placeholder={`Note at ${formatTime(time)}…`} className="flex-1 rounded-lg px-2.5 py-2 text-xs outline-none"
                        style={{ ...B, background: color.bg, color: color.ink, border: `1px solid ${color.border}` }} />
                      <button onClick={addNote} className="rounded-lg px-3 text-xs font-bold" style={{ ...BC, background: color.accent, color: color.bg }}>Add</button>
                    </div>
                    {videoNotes.length === 0 ? <Empty text="Notes stay linked to their timestamp — click one to jump straight there." /> : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {videoNotes.map(n => (
                          <div key={n.id} className="flex items-start gap-2 rounded-lg p-2.5" style={{ background: color.bg, border: `1px solid ${color.border}` }}>
                            <button onClick={() => playerRef.current?.seek(n.time)} style={{ ...MONO, fontSize: '0.65rem', color: color.accentSoft }} className="shrink-0 font-bold">{formatTime(n.time)}</button>
                            <p style={{ ...B, fontSize: '0.76rem', color: color.inkDim, flex: 1 }}>{n.text}</p>
                            <button onClick={() => removeNote(n.id)} aria-label="Delete note"><X className="h-3 w-3" style={{ color: color.inkMuted }} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {tab === 'markers' && (
                  videoMarkers.length === 0 ? <Empty text="Use the marker buttons under the player to tag goals, assists, defensive actions and more." /> : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {videoMarkers.map(m => (
                        <div key={m.id} className="flex items-center gap-2 rounded-lg p-2.5" style={{ background: color.bg, border: `1px solid ${color.border}` }}>
                          <span aria-hidden className="h-2 w-2 rounded-full shrink-0" style={{ background: MARKER_META[m.type].color }} />
                          <button onClick={() => playerRef.current?.seek(m.time)} style={{ ...MONO, fontSize: '0.65rem', color: color.accentSoft }} className="font-bold shrink-0">{formatTime(m.time)}</button>
                          <p style={{ ...B, fontSize: '0.76rem', color: color.inkDim, flex: 1 }}>{m.label}</p>
                          <button onClick={() => removeMarker(m.id)} aria-label="Delete marker"><X className="h-3 w-3" style={{ color: color.inkMuted }} /></button>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {tab === 'annotations' && (
                  <div>
                    <p style={{ ...B, fontSize: '0.72rem', color: color.inkMuted }} className="mb-2">Click a tool, choose a category, then click the video frame.</p>
                    <div className="flex gap-1.5 mb-2">
                      {([['circle', CircleIcon], ['arrow', ArrowRight], ['text', Type]] as [AnnotationShape, typeof CircleIcon][]).map(([shape, Icon]) => (
                        <button key={shape} onClick={() => setPlacing(p => p?.shape === shape ? null : { shape, color: ANNOTATION_COLORS[0] })}
                          aria-pressed={placing?.shape === shape}
                          className="rounded-lg p-2" style={{ background: placing?.shape === shape ? 'rgba(255,90,60,0.16)' : color.bg, border: `1px solid ${placing?.shape === shape ? color.accentSoft : color.border}` }}>
                          <Icon className="h-3.5 w-3.5" style={{ color: placing?.shape === shape ? color.accentSoft : color.inkMuted }} />
                        </button>
                      ))}
                      <div className="flex items-center gap-1 ml-1">
                        {ANNOTATION_COLORS.map(c => (
                          <button key={c} onClick={() => setPlacing(p => p ? { ...p, color: c } : p)} aria-label={`Color ${c}`}
                            className="h-5 w-5 rounded-full" style={{ background: c, border: placing?.color === c ? '2px solid white' : 'none' }} />
                        ))}
                      </div>
                    </div>
                    <select value={pendingCategory} onChange={e => setPendingCategory(e.target.value as AnnotationCategory)}
                      className="w-full rounded-lg px-2.5 py-1.5 text-xs mb-3" style={{ ...B, background: color.bg, color: color.ink, border: `1px solid ${color.border}` }}>
                      {(Object.keys(ANNOTATION_CATEGORY_LABEL) as AnnotationCategory[]).map(c => <option key={c} value={c}>{ANNOTATION_CATEGORY_LABEL[c]}</option>)}
                    </select>
                    {videoAnnotations.length === 0 ? <Empty text="No annotations yet on this video." /> : (
                      <div className="space-y-2 max-h-72 overflow-y-auto">
                        {videoAnnotations.map(a => (
                          <div key={a.id} className="flex items-center gap-2 rounded-lg p-2.5" style={{ background: color.bg, border: `1px solid ${color.border}` }}>
                            <span aria-hidden className="h-2 w-2 rounded-full shrink-0" style={{ background: a.color }} />
                            <button onClick={() => playerRef.current?.seek(a.time)} style={{ ...MONO, fontSize: '0.65rem', color: color.accentSoft }} className="font-bold shrink-0">{formatTime(a.time)}</button>
                            <p style={{ ...B, fontSize: '0.72rem', color: color.inkDim, flex: 1 }}>{ANNOTATION_CATEGORY_LABEL[a.category]}{a.text ? ` — ${a.text}` : ''}</p>
                            <button onClick={() => removeAnnotation(a.id)} aria-label="Delete annotation"><X className="h-3 w-3" style={{ color: color.inkMuted }} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {tab === 'ai' && (
                  <div className="space-y-4">
                    <div>
                      <p style={{ ...BC, fontSize: '0.6rem', letterSpacing: '0.1em', color: color.emerald }} className="uppercase mb-1.5">Manual Notes</p>
                      <p style={{ ...B, fontSize: '0.76rem', color: color.inkMuted }}>{videoNotes.length} note{videoNotes.length === 1 ? '' : 's'}, {videoAnnotations.length} annotation{videoAnnotations.length === 1 ? '' : 's'} logged by you on this video.</p>
                    </div>
                    <div>
                      <p style={{ ...BC, fontSize: '0.6rem', letterSpacing: '0.1em', color: color.ai }} className="uppercase mb-1.5">Evidence-Based Insights</p>
                      {linkedMatch ? (
                        <div className="space-y-1.5">
                          {generateMatchSummary(linkedMatch, careerMatches.filter(m => m.date < linkedMatch.date)).wentWell.map((t, i) => (
                            <p key={i} style={{ ...B, fontSize: '0.76rem', color: color.inkDim, lineHeight: 1.5 }}>● {t}</p>
                          ))}
                        </div>
                      ) : (
                        <p style={{ ...B, fontSize: '0.76rem', color: color.inkMuted }}>Link this video to a logged match to pull in evidence-based stats — no match linked yet.</p>
                      )}
                    </div>
                    <div>
                      <p style={{ ...BC, fontSize: '0.6rem', letterSpacing: '0.1em', color: color.inkMuted }} className="uppercase mb-1.5">Future Capabilities</p>
                      <div className="space-y-1.5">
                        {FUTURE_CAPABILITIES.map(f => (
                          <div key={f} className="flex items-center justify-between rounded-lg px-2.5 py-1.5" style={{ background: color.bg, border: `1px dashed ${color.border}` }}>
                            <span style={{ ...B, fontSize: '0.74rem', color: color.inkMuted }}>{f}</span>
                            <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold" style={{ ...BC, background: 'rgba(154,151,184,0.12)', color: color.inkMuted }}>COMING SOON</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {tab === 'clip' && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <button onClick={() => setMarkIn(time)} className="flex-1 rounded-lg py-1.5 text-xs font-bold" style={{ ...BC, background: markIn !== null ? 'rgba(45,212,160,0.14)' : color.bg, color: markIn !== null ? color.emerald : color.inkDim, border: `1px solid ${color.border}` }}>
                        Mark In {markIn !== null ? formatTime(markIn) : ''}
                      </button>
                      <button onClick={() => setMarkOut(time)} className="flex-1 rounded-lg py-1.5 text-xs font-bold" style={{ ...BC, background: markOut !== null ? 'rgba(255,90,60,0.14)' : color.bg, color: markOut !== null ? color.accentSoft : color.inkDim, border: `1px solid ${color.border}` }}>
                        Mark Out {markOut !== null ? formatTime(markOut) : ''}
                      </button>
                    </div>
                    <input value={clipTitle} onChange={e => setClipTitle(e.target.value)} placeholder="Clip title"
                      className="w-full rounded-lg px-2.5 py-2 text-xs outline-none" style={{ ...B, background: color.bg, color: color.ink, border: `1px solid ${color.border}` }} />
                    <textarea value={clipDesc} onChange={e => setClipDesc(e.target.value)} placeholder="Description" rows={2}
                      className="w-full rounded-lg px-2.5 py-2 text-xs outline-none resize-none" style={{ ...B, background: color.bg, color: color.ink, border: `1px solid ${color.border}` }} />
                    <input value={clipTags} onChange={e => setClipTags(e.target.value)} placeholder="Tags, comma separated"
                      className="w-full rounded-lg px-2.5 py-2 text-xs outline-none" style={{ ...B, background: color.bg, color: color.ink, border: `1px solid ${color.border}` }} />
                    <button onClick={saveClip} disabled={markIn === null || markOut === null || !clipTitle.trim()}
                      className="w-full rounded-lg py-2 text-xs font-bold disabled:opacity-40" style={{ ...BC, background: color.accent, color: color.bg }}>Save Clip</button>
                    <p style={{ ...B, fontSize: '0.65rem', color: color.inkMuted }}>Clips are saved in/out points into the source video, not a separately rendered file.</p>
                    {videoClips.length > 0 && (
                      <div className="space-y-2 pt-2" style={{ borderTop: `1px solid ${color.border}` }}>
                        {videoClips.map(c => (
                          <div key={c.id} className="flex items-center gap-2 rounded-lg p-2.5" style={{ background: color.bg, border: `1px solid ${color.border}` }}>
                            <div className="flex-1 min-w-0">
                              <p style={{ ...BC, fontSize: '0.76rem', fontWeight: 700, color: color.ink }} className="truncate">{c.title}</p>
                              <p style={{ ...MONO, fontSize: '0.62rem', color: color.inkMuted }}>{formatTime(c.startTime)} – {formatTime(c.endTime)}</p>
                            </div>
                            <button onClick={() => playerRef.current?.seek(c.startTime)} className="text-[10px] font-bold" style={{ ...BC, color: color.accentSoft }}>Play</button>
                            <button onClick={() => deleteClip(c.id)} aria-label="Delete clip"><X className="h-3 w-3" style={{ color: color.inkMuted }} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {tab === 'playlists' && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input value={newPlaylistName} onChange={e => setNewPlaylistName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createPlaylist()}
                        placeholder="New playlist name" className="flex-1 rounded-lg px-2.5 py-2 text-xs outline-none" style={{ ...B, background: color.bg, color: color.ink, border: `1px solid ${color.border}` }} />
                      <button onClick={createPlaylist} className="rounded-lg px-3 text-xs font-bold" style={{ ...BC, background: color.accent, color: color.bg }}>Create</button>
                    </div>
                    {playlists.length === 0 ? <Empty text="Try Goals, Mistakes, Training, or Recruiting Highlights." /> : (
                      <div className="space-y-2">
                        {playlists.map(p => (
                          <div key={p.id} className="rounded-lg p-2.5" style={{ background: color.bg, border: `1px solid ${color.border}` }}>
                            <div className="flex items-center justify-between mb-1.5">
                              <p style={{ ...BC, fontSize: '0.78rem', fontWeight: 700, color: color.ink }}>{p.name}</p>
                              <button onClick={() => deletePlaylist(p.id)} aria-label="Delete playlist"><Trash2 className="h-3 w-3" style={{ color: color.inkMuted }} /></button>
                            </div>
                            <button onClick={() => toggleVideoInPlaylist(p.id, selected.id)}
                              className="text-[10px] font-bold rounded-full px-2 py-0.5"
                              style={{ ...BC, background: p.videoIds.includes(selected.id) ? 'rgba(45,212,160,0.14)' : 'rgba(255,255,255,0.06)', color: p.videoIds.includes(selected.id) ? color.emerald : color.inkMuted }}>
                              {p.videoIds.includes(selected.id) ? '✓ In this playlist' : '+ Add this video'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {tab === 'share' && (
                  <div className="space-y-3">
                    <select value={shareAudience} onChange={e => setShareAudience(e.target.value as VideoAudience)}
                      className="w-full rounded-lg px-2.5 py-2 text-xs" style={{ ...B, background: color.bg, color: color.ink, border: `1px solid ${color.border}` }}>
                      {(Object.keys(VIDEO_AUDIENCE_META) as VideoAudience[]).filter(a => a !== 'private').map(a => (
                        <option key={a} value={a}>{VIDEO_AUDIENCE_META[a].label}</option>
                      ))}
                    </select>
                    <p style={{ ...B, fontSize: '0.68rem', color: color.inkMuted }}>{VIDEO_AUDIENCE_META[shareAudience].description}</p>
                    <button onClick={generateShare} className="w-full rounded-lg py-2 text-xs font-bold" style={{ ...BC, background: color.accent, color: color.bg }}>Generate Share Link</button>
                    <div className="space-y-2 pt-2" style={{ borderTop: `1px solid ${color.border}` }}>
                      {shares.filter(s => s.videoId === selected.id).map(s => (
                        <div key={s.id} className="flex items-center gap-2 rounded-lg p-2.5" style={{ background: color.bg, border: `1px solid ${color.border}` }}>
                          <Link2 className="h-3.5 w-3.5 shrink-0" style={{ color: color.inkMuted }} />
                          <span style={{ ...B, fontSize: '0.7rem', color: color.inkDim, flex: 1 }}>{VIDEO_AUDIENCE_META[s.audience].label}</span>
                          <button onClick={() => copyShareUrl(s.encoded, s.id)} className="flex items-center gap-1 text-[10px] font-bold" style={{ ...BC, color: copiedShare ? color.emerald : color.accentSoft }}>
                            {copiedShare ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} Copy
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    )
  }

  /* ── Library view ────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p style={sectionLabel} className="uppercase">Video Analysis Studio</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-white">Review like a professional analyst.</h1>
          <p className="mt-1 text-sm text-slate-500">Markers, annotations and a synced notebook — evidence, not just watching.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded-xl bg-pitch-600 hover:bg-pitch-500 px-4 py-2 text-sm font-semibold text-white transition-all">
          <Plus className="h-4 w-4" /> Add Video
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: color.inkMuted }} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search title, opponent, competition, tags, notes…"
            className="w-full rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none" style={{ ...B, background: color.surface, color: color.ink, border: `1px solid ${color.border}` }} />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as VideoType | 'all')}
          className="rounded-xl px-3 py-2.5 text-sm" style={{ ...B, background: color.surface, color: color.ink, border: `1px solid ${color.border}` }}>
          <option value="all">All Types</option>
          {(Object.keys(VIDEO_TYPE_LABEL) as VideoType[]).map(t => <option key={t} value={t}>{VIDEO_TYPE_LABEL[t]}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: color.surface, border: `1px dashed ${color.border}` }}>
          <Film className="h-8 w-8 mx-auto mb-3" style={{ color: color.inkMuted }} />
          <p style={{ ...B, fontSize: '0.85rem', color: color.inkMuted }}>
            {videos.length === 0 ? 'Link your first match recording, training clip, or highlight video to get started.' : 'No videos match your search.'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(v => (
            <motion.button key={v.id} onClick={() => setSelectedId(v.id)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}
              className="text-left rounded-2xl overflow-hidden" style={{ background: color.surface, border: `1px solid ${color.border}` }}>
              <div className="relative flex items-center justify-center" style={{ aspectRatio: '16/9', background: 'linear-gradient(135deg, #171c38, #0a0d1c)' }}>
                <Film className="h-8 w-8" style={{ color: color.inkMuted, opacity: 0.5 }} />
                <span className="absolute top-2 left-2 rounded-md px-1.5 py-0.5 text-[9px] font-bold" style={{ ...BC, background: 'rgba(10,13,28,0.8)', color: color.accentSoft }}>{VIDEO_TYPE_LABEL[v.type]}</span>
              </div>
              <div className="p-3.5">
                <p style={{ ...BC, fontSize: '0.85rem', fontWeight: 700, color: color.ink }} className="truncate">{v.title}</p>
                <p style={{ ...B, fontSize: '0.68rem', color: color.inkMuted }} className="mt-0.5">{v.date}{v.opponent ? ` · vs ${v.opponent}` : ''}</p>
                {v.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {v.tags.slice(0, 3).map(t => <span key={t} className="rounded-full px-1.5 py-0.5 text-[9px]" style={{ ...B, background: 'rgba(255,255,255,0.05)', color: color.inkMuted }}>{t}</span>)}
                  </div>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showAdd && <AddVideoModal onClose={() => setShowAdd(false)} onAdd={addVideo} careerMatches={careerMatches} />}
      </AnimatePresence>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <p style={{ ...B, fontSize: '0.78rem', color: color.inkMuted }}>{text}</p>
}

function AddVideoModal({ onClose, onAdd, careerMatches }: {
  onClose: () => void
  onAdd: (v: Omit<VideoAsset, 'id' | 'createdAt' | 'source' | 'embedId'>) => void
  careerMatches: { id: string; opponent: string; date: string }[]
}) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<VideoType>('match')
  const [url, setUrl] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [opponent, setOpponent] = useState('')
  const [competition, setCompetition] = useState('')
  const [tags, setTags] = useState('')
  const [matchId, setMatchId] = useState('')

  const submit = () => {
    if (!title.trim() || !url.trim()) return
    onAdd({ title: title.trim(), type, url: url.trim(), date, opponent: opponent.trim() || undefined, competition: competition.trim() || undefined, tags: tags.split(',').map(t => t.trim()).filter(Boolean), matchId: matchId || undefined })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-2xl p-6" style={{ background: color.surface, border: `1px solid ${color.border}` }}>
        <div className="flex items-center justify-between mb-4">
          <p style={{ ...BC, fontSize: '1rem', fontWeight: 700, color: color.ink }}>Add Video</p>
          <button onClick={onClose} aria-label="Close"><X className="h-4 w-4" style={{ color: color.inkMuted }} /></button>
        </div>
        <div className="space-y-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ ...B, background: color.bg, color: color.ink, border: `1px solid ${color.border}` }} />
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="YouTube, Vimeo, or direct video URL" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ ...B, background: color.bg, color: color.ink, border: `1px solid ${color.border}` }} />
          <div className="grid grid-cols-2 gap-2">
            <select value={type} onChange={e => setType(e.target.value as VideoType)} className="rounded-lg px-3 py-2 text-sm" style={{ ...B, background: color.bg, color: color.ink, border: `1px solid ${color.border}` }}>
              {(Object.keys(VIDEO_TYPE_LABEL) as VideoType[]).map(t => <option key={t} value={t}>{VIDEO_TYPE_LABEL[t]}</option>)}
            </select>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-lg px-3 py-2 text-sm" style={{ ...B, background: color.bg, color: color.ink, border: `1px solid ${color.border}` }} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={opponent} onChange={e => setOpponent(e.target.value)} placeholder="Opponent (optional)" className="rounded-lg px-3 py-2 text-sm outline-none" style={{ ...B, background: color.bg, color: color.ink, border: `1px solid ${color.border}` }} />
            <input value={competition} onChange={e => setCompetition(e.target.value)} placeholder="Competition (optional)" className="rounded-lg px-3 py-2 text-sm outline-none" style={{ ...B, background: color.bg, color: color.ink, border: `1px solid ${color.border}` }} />
          </div>
          <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags, comma separated" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ ...B, background: color.bg, color: color.ink, border: `1px solid ${color.border}` }} />
          {careerMatches.length > 0 && (
            <select value={matchId} onChange={e => setMatchId(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={{ ...B, background: color.bg, color: color.ink, border: `1px solid ${color.border}` }}>
              <option value="">Link to a logged match (optional)</option>
              {careerMatches.slice(0, 30).map(m => <option key={m.id} value={m.id}>{m.date} vs {m.opponent}</option>)}
            </select>
          )}
          <button onClick={submit} disabled={!title.trim() || !url.trim()} className="w-full rounded-lg py-2.5 text-sm font-bold disabled:opacity-40" style={{ ...BC, background: color.accent, color: color.bg }}>Add to Library</button>
        </div>
      </motion.div>
    </motion.div>
  )
}
