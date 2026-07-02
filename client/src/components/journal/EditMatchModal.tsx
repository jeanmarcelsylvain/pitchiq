/* ═══ Edit Match ══════════════════════════════════════════════════════════
   Inline editing for a previously-logged match. Single screen (no wizard —
   the athlete already knows this match), autosaves on Save, tags editable
   as chips. */
import { useState } from 'react'
import { Check, Plus, X as XIcon } from 'lucide-react'
import { color, font } from '@/design/tokens'
import { Field, ModalShell, ModalHeader, ModalFooter, PrimaryButton, NumberInput } from './JournalPrimitives'
import { PositionSelector } from './PositionSelector'
import type { Match } from '@/types'

const BC = { fontFamily: font.display }
const B  = { fontFamily: font.ui }
const fieldStyle: React.CSSProperties = { fontFamily: font.ui, fontSize: '0.85rem', color: color.ink, background: color.surface, border: `1px solid ${color.border}`, borderRadius: 8, padding: '9px 12px', width: '100%' }

export function EditMatchModal({ match, onClose, onSave }: { match: Match; onClose: () => void; onSave: (updated: Match) => void }) {
  const [form, setForm] = useState<Match>(match)
  const [tagInput, setTagInput] = useState('')

  const field = <K extends keyof Match>(k: K, v: Match[K]) => setForm(prev => ({ ...prev, [k]: v }))

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !(form.tags ?? []).includes(t)) field('tags', [...(form.tags ?? []), t])
    setTagInput('')
  }
  const removeTag = (t: string) => field('tags', (form.tags ?? []).filter(x => x !== t))

  return (
    <ModalShell onClose={onClose}>
      <ModalHeader title="Edit Journal Entry" subtitle={`vs ${match.opponent} — ${match.date}`} onClose={onClose} />
      <div className="p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Opponent"><input style={fieldStyle} value={form.opponent} onChange={e => field('opponent', e.target.value)} /></Field>
          <Field label="Competition"><input style={fieldStyle} value={form.competition} onChange={e => field('competition', e.target.value)} /></Field>
          <Field label="Goals"><NumberInput value={form.goals} onChange={v => field('goals', v)} /></Field>
          <Field label="Assists"><NumberInput value={form.assists} onChange={v => field('assists', v)} /></Field>
          <Field label="Pass Accuracy %"><NumberInput value={form.passAccuracy} onChange={v => field('passAccuracy', v)} max={100} /></Field>
          <Field label="Match Rating"><NumberInput value={form.rating} onChange={v => field('rating', v)} max={10} step={0.5} /></Field>
        </div>

        <PositionSelector value={form.position} onChange={p => field('position', p)} />

        <div>
          <label style={{ ...B, fontSize: '0.72rem', color: color.inkMuted, fontWeight: 500 }} className="block mb-1.5">Tags</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(form.tags ?? []).map(t => (
              <span key={t} className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: 'rgba(77,159,255,0.1)', color: color.ai }}>
                {t}
                <button onClick={() => removeTag(t)} aria-label={`Remove tag ${t}`}><XIcon className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={tagInput} onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
              placeholder="e.g. Cup Final, Captain, Trial" style={fieldStyle} />
            <button onClick={addTag} className="shrink-0 rounded-lg px-3" style={{ background: color.surface, border: `1px solid ${color.border}`, color: color.inkMuted }} aria-label="Add tag">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <Field label="Notes">
          <textarea rows={3} value={form.notes ?? ''} onChange={e => field('notes', e.target.value)}
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
            style={fieldStyle} />
        </Field>
      </div>
      <ModalFooter>
        <button onClick={onClose} style={{ ...B, color: color.inkMuted, fontSize: '0.85rem' }}>Cancel</button>
        <PrimaryButton onClick={() => onSave(form)}><Check className="h-4 w-4" /> Save Changes</PrimaryButton>
      </ModalFooter>
    </ModalShell>
  )
}
