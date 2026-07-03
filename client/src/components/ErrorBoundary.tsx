/* ═══ Error Boundary ══════════════════════════════════════════════════════
   A render crash anywhere below this should never show a blank white
   screen. Catches, logs to console for diagnosis, and offers a real
   recovery path instead of a dead app. */
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshCw, Home } from 'lucide-react'
import { color, font } from '@/design/tokens'

const BC = { fontFamily: font.display }
const B = { fontFamily: font.ui }

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[PitchIQ] Unhandled render error:', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: color.bg }}>
        <div className="text-center max-w-sm">
          <p style={{ ...BC, fontSize: '0.65rem', letterSpacing: '0.2em', color: color.danger }} className="uppercase mb-2">Something went wrong</p>
          <h1 className="font-display text-xl font-extrabold text-white">This screen hit a snag.</h1>
          <p className="mt-2 text-sm" style={{ ...B, color: color.inkMuted }}>
            Your data is safe — it's saved as you go. Reloading usually fixes this.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <a href="/dashboard" className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold"
              style={{ ...BC, background: color.surface, color: color.inkDim, border: `1px solid ${color.border}` }}>
              <Home className="h-4 w-4" /> Player HQ
            </a>
            <button onClick={() => window.location.reload()}
              className="flex items-center gap-1.5 rounded-xl bg-pitch-600 hover:bg-pitch-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors">
              <RefreshCw className="h-4 w-4" /> Reload
            </button>
          </div>
        </div>
      </div>
    )
  }
}
