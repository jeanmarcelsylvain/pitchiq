import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Home, Activity, BookOpen, Target, Settings, Plus,
  LogOut, Menu, X, ChevronRight, Bell, Sparkles,
  Trophy, FileText, Film, HeartPulse, Calendar, TrendingUp,
  Dumbbell, Sun, Moon, Clapperboard,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { useSubscription } from '@/hooks/useSubscription'
import type { ReactNode } from 'react'

/* The athlete's operating system — eight spaces, one per job-to-be-done.
   Routes are unchanged; only naming and grouping evolve. */
const navGroups = [
  {
    label: 'Command',
    items: [
      { to: '/dashboard', icon: Home, label: 'Player HQ' },
    ],
  },
  {
    label: 'The Season',
    items: [
      { to: '/matches',   icon: BookOpen, label: 'Match Journal' },
      { to: '/calendar',  icon: Calendar, label: 'Fixtures' },
      { to: '/analytics', icon: Activity, label: 'Performance Intel' },
      { to: '/goals',     icon: Target,   label: 'Goals' },
    ],
  },
  {
    label: 'Performance Lab',
    items: [
      { to: '/ai-coach',  icon: Sparkles,   label: 'Performance Lab', highlight: true },
      { to: '/video',     icon: Clapperboard, label: 'Video Studio', highlight: true },
      { to: '/training',  icon: Dumbbell,   label: 'Training Plans', highlight: true },
      { to: '/injuries',  icon: HeartPulse, label: 'Recovery' },
    ],
  },
  {
    label: 'The Career',
    items: [
      { to: '/seasons',      icon: TrendingUp, label: 'Career Timeline' },
      { to: '/achievements', icon: Trophy,     label: 'Trophy Room' },
      { to: '/recruit',      icon: FileText,   label: 'Recruit Profile' },
      { to: '/highlights',   icon: Film,       label: 'Highlights' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/profile', icon: Settings, label: 'Settings' },
    ],
  },
]

/* Hexagonal soccer-ball-inspired logo mark */
function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="16,1 29,8 29,24 16,31 3,24 3,8" fill="#e03c20" stroke="#ff7a60" strokeWidth="1"/>
      <polygon points="16,6 24,10.5 24,21.5 16,26 8,21.5 8,10.5" fill="#b22c12" />
      <circle cx="16" cy="16" r="4" fill="#ff7a60" opacity="0.9"/>
      <line x1="16" y1="6" x2="16" y2="10" stroke="#ff7a60" strokeWidth="1" opacity="0.6"/>
      <line x1="24" y1="10.5" x2="20.5" y2="12.5" stroke="#ff7a60" strokeWidth="1" opacity="0.6"/>
      <line x1="24" y1="21.5" x2="20.5" y2="19.5" stroke="#ff7a60" strokeWidth="1" opacity="0.6"/>
      <line x1="16" y1="26" x2="16" y2="22" stroke="#ff7a60" strokeWidth="1" opacity="0.6"/>
      <line x1="8" y1="21.5" x2="11.5" y2="19.5" stroke="#ff7a60" strokeWidth="1" opacity="0.6"/>
      <line x1="8" y1="10.5" x2="11.5" y2="12.5" stroke="#ff7a60" strokeWidth="1" opacity="0.6"/>
    </svg>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, isDemoMode, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { isPro, startCheckout } = useSubscription()
  const navigate = useNavigate()

  const handleSignOut = async () => { await signOut(); navigate('/') }

  const displayName = isDemoMode ? 'Alex Rivera' : (user?.displayName ?? 'Player')
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="flex h-screen bg-slate-950 font-sans">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-60 flex-col transition-transform duration-300 lg:relative lg:translate-x-0',
        'bg-slate-900 sidebar-texture border-r border-slate-800/80',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-800/80">
          <LogoMark size={30} />
          <div className="min-w-0">
            <p className="text-sm font-bold text-white tracking-tight leading-none">PitchIQ</p>
            <p className="text-[10px] text-pitch-600 mt-0.5 uppercase tracking-widest font-medium">Performance Analytics</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto text-slate-500 hover:text-white lg:hidden flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {navGroups.map(group => (
            <div key={group.label}>
              <p className="px-3 pb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(({ to, icon: Icon, label, highlight }) => (
                  <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => cn(
                      'group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-pitch-600/15 text-pitch-400 border-l-2 border-pitch-500 pl-[10px]'
                        : highlight
                        ? 'text-purple-400 hover:bg-purple-600/10 hover:text-purple-300'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    )}>
                    {({ isActive }) => (
                      <>
                        <Icon className={cn('h-4 w-4 flex-shrink-0',
                          isActive ? 'text-pitch-400' : highlight ? 'text-purple-400' : 'text-slate-600 group-hover:text-slate-400'
                        )} />
                        <span className="truncate">{label}</span>
                        {highlight && !isActive && (
                          <span className="ml-auto text-[9px] font-bold bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded uppercase tracking-wide flex-shrink-0">AI</span>
                        )}
                        {isActive && <ChevronRight className="ml-auto h-3 w-3 text-pitch-600 flex-shrink-0" />}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Upgrade banner */}
        {!isPro && !isDemoMode && (
          <div className="px-2 pb-2">
            <button onClick={startCheckout}
              className="w-full rounded-xl bg-gradient-to-br from-pitch-600 to-pitch-700 hover:from-pitch-500 hover:to-pitch-600 p-3 text-left transition-all group glow-green-sm">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-3.5 w-3.5 text-pitch-100" />
                <span className="text-xs font-bold text-white">Upgrade to Pro</span>
              </div>
              <p className="text-[11px] text-pitch-100/70">Unlock AI Coach, Training Plans & more</p>
              <p className="text-xs font-semibold text-pitch-300 mt-1">$4.99 / month →</p>
            </button>
          </div>
        )}

        {isPro && !isDemoMode && (
          <div className="px-2 pb-2">
            <NavLink to="/pricing"
              className="flex items-center gap-2 w-full rounded-xl border border-pitch-600/30 bg-pitch-600/10 px-3 py-2">
              <Sparkles className="h-3.5 w-3.5 text-pitch-400" />
              <span className="text-xs font-semibold text-pitch-400">Pro Member</span>
            </NavLink>
          </div>
        )}

        {/* User footer */}
        <div className="border-t border-slate-800/80 p-3 space-y-2">
          {isDemoMode && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
              <p className="text-xs text-amber-400 font-medium">Demo Mode — Sample Data</p>
            </div>
          )}
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-pitch-600/20 border border-pitch-600/30 text-pitch-400 text-xs font-bold">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-200 leading-none">{displayName}</p>
              <p className="truncate text-[10px] text-slate-500 mt-0.5">{isDemoMode ? 'Demo Account' : user?.email}</p>
            </div>
            <button onClick={handleSignOut} title="Sign out" className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="glass-nav flex h-14 items-center gap-3 px-4 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} aria-label="Open navigation" className="text-slate-500 hover:text-white lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <button onClick={() => navigate('/matches')}
            className="flex items-center gap-1.5 rounded-lg bg-pitch-600 hover:bg-pitch-500 px-3 py-1.5 text-xs font-bold text-white transition-all active:scale-95 shadow-glow-accent">
            <Plus className="h-3.5 w-3.5" /> New Entry
          </button>
          <button onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-all">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button aria-label="Notifications" className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-all">
            <Bell className="h-4 w-4" />
            <span aria-hidden className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-pitch-500" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-4 lg:p-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
