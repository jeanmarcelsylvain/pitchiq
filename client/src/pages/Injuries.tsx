import { useState, useRef, useEffect } from 'react'
import { Send, Activity, Plus, ChevronRight, AlertTriangle, CheckCircle, Clock, Trash2, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useApi } from '@/hooks/useApi'

const RAILWAY_URL = 'https://pitchiq-production-facc.up.railway.app'

interface Message {
  id: string
  role: 'ai' | 'user'
  content: string
}

interface InjuryRecord {
  id: string
  date: string
  type: string
  severity: 'mild' | 'moderate' | 'severe' | 'unknown'
  bodyPart: string
  status: 'active' | 'recovering' | 'cleared'
  plan: string
  conversation: { role: 'user' | 'assistant'; content: string }[]
}

const INJURY_TYPES = [
  { id: 'hamstring', label: 'Hamstring', icon: '🦵', desc: 'Pull, strain, or tear' },
  { id: 'ankle', label: 'Ankle', icon: '🦶', desc: 'Sprain, roll, or twist' },
  { id: 'knee', label: 'Knee', icon: '🦵', desc: 'ACL, MCL, meniscus, patella' },
  { id: 'groin', label: 'Groin', icon: '⚡', desc: 'Strain or pull' },
  { id: 'calf', label: 'Calf', icon: '🦵', desc: 'Strain or cramp-related' },
  { id: 'quadriceps', label: 'Quad', icon: '🦵', desc: 'Contusion or strain' },
  { id: 'shin', label: 'Shin Splints', icon: '⚡', desc: 'Tibia stress or overuse' },
  { id: 'shoulder', label: 'Shoulder', icon: '💪', desc: 'Dislocation or strain' },
  { id: 'back', label: 'Lower Back', icon: '🔙', desc: 'Muscle strain or disc' },
  { id: 'head', label: 'Head / Concussion', icon: '🧠', desc: 'Impact or collision' },
  { id: 'foot', label: 'Foot', icon: '🦶', desc: 'Metatarsal, toe, or heel' },
  { id: 'other', label: 'Other', icon: '❓', desc: 'Describe your injury' },
]

function STORAGE_KEY(uid: string) { return `injuries_${uid}` }

function parseSeverity(text: string): InjuryRecord['severity'] {
  const lower = text.toLowerCase()
  if (lower.includes('severity**: severe') || lower.includes('severity: severe')) return 'severe'
  if (lower.includes('severity**: moderate') || lower.includes('severity: moderate')) return 'moderate'
  if (lower.includes('severity**: mild') || lower.includes('severity: mild')) return 'mild'
  return 'unknown'
}

function renderMessage(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>')
    .replace(/^- (.+)/gm, '• $1')
}

export default function Injuries() {
  const { user, isDemoMode } = useAuth()
  const { apiFetch } = useApi()
  const uid = isDemoMode ? 'demo' : user?.uid ?? ''

  const [injuries, setInjuries] = useState<InjuryRecord[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY(uid)) ?? '[]') } catch { return [] }
  })
  const [view, setView] = useState<'list' | 'new' | 'chat' | 'detail'>('list')
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentConversation, setCurrentConversation] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [planComplete, setPlanComplete] = useState(false)
  const [selectedInjury, setSelectedInjury] = useState<InjuryRecord | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY(uid), JSON.stringify(injuries))
  }, [injuries, uid])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const startChat = (injuryType: string) => {
    setSelectedType(injuryType)
    const typeName = INJURY_TYPES.find(t => t.id === injuryType)?.label ?? injuryType
    const opening: Message = {
      id: 'intro',
      role: 'ai',
      content: `I'm Dr. Reid, your sports medicine advisor. I'll help assess your **${typeName}** injury and create a personalized recovery plan.\n\nFirst — on a scale of **1 to 10**, how would you rate your current pain level? (1 = barely noticeable, 10 = severe)`,
    }
    setMessages([opening])
    setCurrentConversation([{ role: 'assistant', content: opening.content }])
    setPlanComplete(false)
    setView('chat')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')

    const newMsg: Message = { id: Date.now().toString(), role: 'user', content: userMsg }
    setMessages(prev => [...prev, newMsg])
    setLoading(true)

    const updatedHistory = [...currentConversation, { role: 'user' as const, content: userMsg }]
    setCurrentConversation(updatedHistory)

    const aiId = Date.now().toString() + '_ai'
    setMessages(prev => [...prev, { id: aiId, role: 'ai', content: '' }])

    try {
      const res = await fetch(`${RAILWAY_URL}/api/injury/assess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: currentConversation,
          injuryType: selectedType,
        }),
      })

      if (!res.ok) throw new Error('Server error')
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        const lines = decoder.decode(value).split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            if (parsed.text) {
              fullText += parsed.text
              setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: fullText } : m))
            }
          } catch {}
        }
      }

      const newHistory = [...updatedHistory, { role: 'assistant' as const, content: fullText }]
      setCurrentConversation(newHistory)

      if (fullText.includes('ASSESSMENT COMPLETE')) {
        setPlanComplete(true)
        const severity = parseSeverity(fullText)
        const typeName = INJURY_TYPES.find(t => t.id === selectedType)?.label ?? selectedType ?? 'Unknown'
        const record: InjuryRecord = {
          id: Date.now().toString(),
          date: new Date().toISOString().slice(0, 10),
          type: typeName,
          bodyPart: typeName,
          severity,
          status: 'active',
          plan: fullText,
          conversation: newHistory,
        }
        setInjuries(prev => [record, ...prev])
        if (!isDemoMode) {
          apiFetch('/api/injuries-db', { method: 'POST', body: JSON.stringify({
            date: record.date, type: record.type, bodyPart: record.bodyPart,
            severity: record.severity, status: record.status, plan: record.plan,
            conversation: record.conversation,
          })}).catch(() => {})
        }
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === aiId ? {
        ...m, content: "I'm having trouble connecting right now. Make sure the server is running and try again.",
      } : m))
    } finally {
      setLoading(false)
    }
  }

  const deleteInjury = (id: string) => {
    setInjuries(prev => prev.filter(i => i.id !== id))
    if (selectedInjury?.id === id) { setSelectedInjury(null); setView('list') }
  }

  const updateStatus = (id: string, status: InjuryRecord['status']) => {
    setInjuries(prev => prev.map(i => i.id === id ? { ...i, status } : i))
    if (selectedInjury?.id === id) setSelectedInjury(prev => prev ? { ...prev, status } : null)
    if (!isDemoMode) {
      apiFetch(`/api/injuries-db/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }).catch(() => {})
    }
  }

  const severityColor = (s: InjuryRecord['severity']) => ({
    mild: 'text-green-400 bg-green-400/10 border-green-400/20',
    moderate: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    severe: 'text-red-400 bg-red-400/10 border-red-400/20',
    unknown: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
  }[s])

  const statusColor = (s: InjuryRecord['status']) => ({
    active: 'text-red-400 bg-red-400/10',
    recovering: 'text-yellow-400 bg-yellow-400/10',
    cleared: 'text-green-400 bg-green-400/10',
  }[s])

  // ─── Injury List ───────────────────────────────────────────────────────────

  if (view === 'list') return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Injury Tracker</h1>
          <p className="mt-1 text-sm text-slate-500">AI-powered injury assessment and recovery planning</p>
        </div>
        <button onClick={() => setView('new')}
          className="flex items-center gap-2 rounded-xl bg-green-600 hover:bg-green-500 px-4 py-2.5 text-sm font-semibold text-white transition-all">
          <Plus className="h-4 w-4" /> Log New Injury
        </button>
      </div>

      {injuries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 mb-4">
            <Activity className="h-7 w-7 text-slate-600" />
          </div>
          <p className="text-slate-400 font-medium">No injuries logged</p>
          <p className="text-slate-600 text-sm mt-1 mb-5">Log an injury to get a personalized AI recovery plan</p>
          <button onClick={() => setView('new')}
            className="flex items-center gap-2 rounded-xl bg-green-600 hover:bg-green-500 px-4 py-2 text-sm font-semibold text-white transition-all">
            <Plus className="h-4 w-4" /> Log Injury
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {injuries.map(injury => (
            <div key={injury.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-700 transition-all cursor-pointer"
              onClick={() => { setSelectedInjury(injury); setView('detail') }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-white">{injury.type} Injury</h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${severityColor(injury.severity)} capitalize`}>
                      {injury.severity}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusColor(injury.status)}`}>
                      {injury.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{new Date(injury.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // ─── Detail View ───────────────────────────────────────────────────────────

  if (view === 'detail' && selectedInjury) return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('list')} className="text-slate-400 hover:text-white transition-colors">
          ← Back
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">{selectedInjury.type} Injury</h1>
          <p className="text-sm text-slate-500">{new Date(selectedInjury.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <button onClick={() => deleteInjury(selectedInjury.id)}
          className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-400 transition-colors">
          <Trash2 className="h-4 w-4" /> Delete
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${severityColor(selectedInjury.severity)} capitalize`}>
          {selectedInjury.severity} severity
        </span>
        {(['active', 'recovering', 'cleared'] as InjuryRecord['status'][]).map(s => (
          <button key={s} onClick={() => updateStatus(selectedInjury.id, s)}
            className={`text-xs font-semibold px-3 py-1 rounded-full capitalize transition-all ${
              selectedInjury.status === s ? statusColor(s) + ' ring-1 ring-current' : 'text-slate-500 bg-slate-800 hover:text-white'
            }`}>{s}</button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Recovery Plan</h2>
        <div className="text-sm text-slate-300 leading-relaxed space-y-2"
          dangerouslySetInnerHTML={{ __html: renderMessage(selectedInjury.plan) }} />
      </div>
    </div>
  )

  // ─── Injury Type Picker ────────────────────────────────────────────────────

  if (view === 'new') return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('list')} className="text-slate-400 hover:text-white transition-colors">← Back</button>
        <div>
          <h1 className="text-xl font-bold text-white">What's the injury?</h1>
          <p className="text-sm text-slate-500">Select the area affected to begin your assessment</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {INJURY_TYPES.map(type => (
          <button key={type.id} onClick={() => startChat(type.id)}
            className="flex flex-col items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-green-600/50 hover:bg-slate-900 transition-all text-center group">
            <span className="text-3xl">{type.icon}</span>
            <p className="text-sm font-semibold text-white group-hover:text-green-400 transition-colors">{type.label}</p>
            <p className="text-xs text-slate-600">{type.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )

  // ─── Chat View ─────────────────────────────────────────────────────────────

  if (view === 'chat') return (
    <div className="flex flex-col animate-slide-up" style={{ height: 'calc(100vh - 8rem)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setView('list')} className="text-slate-400 hover:text-white transition-colors">← Back</button>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-600/20 border border-red-600/30">
          <Activity className="h-4 w-4 text-red-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Dr. Reid — Injury Assessment</p>
          <p className="text-xs text-slate-500">{INJURY_TYPES.find(t => t.id === selectedType)?.label} injury</p>
        </div>
        {planComplete && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-1 rounded-full">
            <CheckCircle className="h-3.5 w-3.5" /> Plan saved
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'ai' && (
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-red-600/20 border border-red-600/30 mt-0.5">
                <Activity className="h-4 w-4 text-red-400" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'ai'
                ? 'bg-slate-900 border border-slate-800 text-slate-200'
                : 'bg-green-600 text-white'
            }`}>
              {msg.role === 'ai' && msg.content
                ? <div dangerouslySetInnerHTML={{ __html: renderMessage(msg.content) }} />
                : msg.role === 'ai' && !msg.content
                  ? <div className="flex gap-1"><span className="animate-bounce">●</span><span className="animate-bounce" style={{animationDelay:'0.1s'}}>●</span><span className="animate-bounce" style={{animationDelay:'0.2s'}}>●</span></div>
                  : msg.content
              }
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Warning banner if plan complete */}
      {planComplete && (
        <div className="my-3 flex items-start gap-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-yellow-300">This AI assessment is for guidance only and does not replace professional medical evaluation. For severe injuries, see a doctor or physiotherapist.</p>
        </div>
      )}

      {/* Input */}
      {!planComplete && (
        <div className="flex gap-2 mt-3">
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Describe your symptoms..."
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-green-500 disabled:opacity-50 transition-colors" />
          <button onClick={sendMessage} disabled={loading || !input.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-40 transition-all">
            <Send className="h-4 w-4 text-white" />
          </button>
        </div>
      )}

      {planComplete && (
        <button onClick={() => setView('list')}
          className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-500 py-3 text-sm font-semibold text-white transition-all">
          <CheckCircle className="h-4 w-4" /> View Saved Plan
        </button>
      )}
    </div>
  )

  return null
}
