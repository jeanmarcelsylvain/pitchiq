/* ═══ Video Analysis Studio — data layer ════════════════════════════════════
   Athletes link video they already have (a Hudl/YouTube/Vimeo URL, or a
   direct video file URL) rather than PitchIQ hosting footage — there's no
   video storage backend, and pretending otherwise would be dishonest. What
   IS real: markers, annotations, a synced notebook, clips (in/out points
   into the source video, not a re-encoded file), playlists, and search —
   all stored per-athlete and all genuinely functional. */

export type VideoType = 'match' | 'training' | 'highlight' | 'skill' | 'recovery'

export const VIDEO_TYPE_LABEL: Record<VideoType, string> = {
  match: 'Match Recording', training: 'Training Session', highlight: 'Highlight Clip',
  skill: 'Skill Session', recovery: 'Recovery Session',
}

export type VideoSource = 'youtube' | 'vimeo' | 'direct'

export interface VideoAsset {
  id: string
  title: string
  type: VideoType
  url: string
  source: VideoSource
  embedId?: string
  date: string
  opponent?: string
  competition?: string
  tags: string[]
  matchId?: string
  createdAt: string
}

export function detectSource(url: string): { source: VideoSource; embedId?: string } {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/)
  if (yt) return { source: 'youtube', embedId: yt[1] }
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vm) return { source: 'vimeo', embedId: vm[1] }
  return { source: 'direct' }
}

export type MarkerType = 'goal' | 'assist' | 'defensive' | 'training' | 'note' | 'bookmark'

export const MARKER_META: Record<MarkerType, { label: string; color: string }> = {
  goal: { label: 'Goal', color: '#2dd4a0' },
  assist: { label: 'Assist', color: '#4d9fff' },
  defensive: { label: 'Defensive Action', color: '#ffba08' },
  training: { label: 'Training Moment', color: '#a78bfa' },
  note: { label: 'Note', color: '#9a97b8' },
  bookmark: { label: 'Bookmark', color: '#ff5a3c' },
}

export interface Marker {
  id: string
  videoId: string
  time: number
  type: MarkerType
  label: string
  createdAt: string
}

export type AnnotationShape = 'arrow' | 'circle' | 'text'
export type AnnotationCategory =
  | 'good_decision' | 'poor_positioning' | 'excellent_touch' | 'late_recovery' | 'great_passing_lane' | 'other'

export const ANNOTATION_CATEGORY_LABEL: Record<AnnotationCategory, string> = {
  good_decision: 'Good Decision', poor_positioning: 'Poor Positioning', excellent_touch: 'Excellent First Touch',
  late_recovery: 'Late Recovery Run', great_passing_lane: 'Great Passing Lane', other: 'Other',
}

export interface Annotation {
  id: string
  videoId: string
  time: number
  shape: AnnotationShape
  x: number   // 0–1 normalized
  y: number
  x2?: number // arrow end point
  y2?: number
  text?: string
  category: AnnotationCategory
  color: string
  createdAt: string
}

export interface VideoNote {
  id: string
  videoId: string
  time: number
  text: string
  createdAt: string
}

export interface Clip {
  id: string
  videoId: string
  title: string
  description: string
  tags: string[]
  startTime: number
  endTime: number
  createdAt: string
}

export interface Playlist {
  id: string
  name: string
  clipIds: string[]
  videoIds: string[]
  createdAt: string
}

export type VideoAudience = 'coach' | 'recruiter' | 'private' | 'public'

export const VIDEO_AUDIENCE_META: Record<VideoAudience, { label: string; description: string }> = {
  coach: { label: 'Coach', description: 'Shareable with your coach — includes notebook.' },
  recruiter: { label: 'Recruiter', description: 'Shareable with recruiters — clip and markers only.' },
  private: { label: 'Private', description: 'Not shareable — visible only to you.' },
  public: { label: 'Public', description: 'Shareable anywhere — clip only, no notes.' },
}

export interface VideoShareLink {
  id: string
  videoId: string
  clipId?: string
  audience: VideoAudience
  encoded: string
  createdAt: string
}

/* ── Persistence — one localStorage row set per athlete (uid) ────────────── */
const K = {
  videos: (uid: string) => `video_studio_assets_${uid}`,
  markers: (uid: string) => `video_studio_markers_${uid}`,
  annotations: (uid: string) => `video_studio_annotations_${uid}`,
  notes: (uid: string) => `video_studio_notes_${uid}`,
  clips: (uid: string) => `video_studio_clips_${uid}`,
  playlists: (uid: string) => `video_studio_playlists_${uid}`,
  shares: (uid: string) => `video_studio_shares_${uid}`,
}

function load<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]') } catch { return [] }
}
function save<T>(key: string, rows: T[]) {
  localStorage.setItem(key, JSON.stringify(rows))
}

export const loadVideos = (uid: string) => load<VideoAsset>(K.videos(uid))
export const saveVideos = (uid: string, rows: VideoAsset[]) => save(K.videos(uid), rows)
export const loadMarkers = (uid: string) => load<Marker>(K.markers(uid))
export const saveMarkers = (uid: string, rows: Marker[]) => save(K.markers(uid), rows)
export const loadAnnotations = (uid: string) => load<Annotation>(K.annotations(uid))
export const saveAnnotations = (uid: string, rows: Annotation[]) => save(K.annotations(uid), rows)
export const loadNotes = (uid: string) => load<VideoNote>(K.notes(uid))
export const saveNotes = (uid: string, rows: VideoNote[]) => save(K.notes(uid), rows)
export const loadClips = (uid: string) => load<Clip>(K.clips(uid))
export const saveClips = (uid: string, rows: Clip[]) => save(K.clips(uid), rows)
export const loadPlaylists = (uid: string) => load<Playlist>(K.playlists(uid))
export const savePlaylists = (uid: string, rows: Playlist[]) => save(K.playlists(uid), rows)
export const loadShares = (uid: string) => load<VideoShareLink>(K.shares(uid))
export const saveShares = (uid: string, rows: VideoShareLink[]) => save(K.shares(uid), rows)

/* ── Search ────────────────────────────────────────────────────────────── */
export function searchVideos(videos: VideoAsset[], notes: VideoNote[], query: string): VideoAsset[] {
  const q = query.trim().toLowerCase()
  if (!q) return videos
  const notesByVideo = new Map<string, string>()
  notes.forEach(n => notesByVideo.set(n.videoId, `${notesByVideo.get(n.videoId) ?? ''} ${n.text}`.toLowerCase()))
  return videos.filter(v =>
    v.title.toLowerCase().includes(q) ||
    (v.opponent ?? '').toLowerCase().includes(q) ||
    (v.competition ?? '').toLowerCase().includes(q) ||
    v.date.includes(q) ||
    v.tags.some(t => t.toLowerCase().includes(q)) ||
    (notesByVideo.get(v.id) ?? '').includes(q)
  )
}

/* ── Shareable payload — mirrors the base64url pattern used for Recruit
   Profile share links, so a shared clip is a real, openable URL even
   though no video bytes are hosted by PitchIQ itself. */
export interface VideoSharePayload {
  v: 1
  title: string
  type: VideoType
  url: string
  source: VideoSource
  embedId?: string
  date: string
  opponent?: string
  competition?: string
  audience: VideoAudience
  startTime?: number
  endTime?: number
  markers?: { time: number; type: MarkerType; label: string }[]
  notes?: { time: number; text: string }[]
}

function toBase64Url(s: string) {
  return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function fromBase64Url(s: string) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  return decodeURIComponent(escape(atob(b64)))
}

export function encodeVideoShare(payload: VideoSharePayload): string {
  return toBase64Url(JSON.stringify(payload))
}
export function decodeVideoShare(encoded: string): VideoSharePayload | null {
  try { return JSON.parse(fromBase64Url(encoded)) as VideoSharePayload } catch { return null }
}

export function buildVideoSharePayload(
  video: VideoAsset, audience: VideoAudience, clip?: Clip, markers: Marker[] = [], notes: VideoNote[] = []
): VideoSharePayload {
  const includeNotes = audience === 'coach'
  const includeMarkers = audience !== 'public'
  return {
    v: 1, title: clip?.title ?? video.title, type: video.type, url: video.url, source: video.source, embedId: video.embedId,
    date: video.date, opponent: video.opponent, competition: video.competition, audience,
    startTime: clip?.startTime, endTime: clip?.endTime,
    markers: includeMarkers ? markers.filter(m => m.videoId === video.id).map(m => ({ time: m.time, type: m.type, label: m.label })) : undefined,
    notes: includeNotes ? notes.filter(n => n.videoId === video.id).map(n => ({ time: n.time, text: n.text })) : undefined,
  }
}

export function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) sec = 0
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
