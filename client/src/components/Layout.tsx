import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Activity, ClipboardList, Target, User,
  LogOut, Menu, X, Zap, ChevronRight, Bell, Sparkles,
  Trophy, FileText, Film, HeartPulse, Calendar, Archive,
  Dumbbell, Sun, Moon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import type { ReactNode } from 'react'

const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Performance',
    items: [
      { to: '/matches',   icon: ClipboardList, label: 'Matches' },
      { to: '/calendar',  icon: Calendar,      label: 'Calendar' },
      { to: '/analytics', icon: Activity,      label: 'Analytics' },
      { to: '/goals',     icon: Target,        label: 'Goals' },
    ],
  },
  {
    label: 'AI Tools',
    items: [
      { to: '/ai-coach',  icon: Sparkles,   label: 'AI Coach',      highlight: true },
      { to: '/training',  icon: Dumbbell,   label: 'Training Plan', highlight: true },
      { to: '/injuries',  icon: HeartPulse, label: 'Injury Tracker' },
    ],
  },
  {
    label: 'Career',
    items: [
      { to: '/achievements', icon: Trophy,    label: 'Achievements' },
      { to: '/seasons',      icon: Archive,   label: 'Season Archive' },
      { to: '/recruit',      icon: FileText,  label: 'Recruit Profile' },
      { to: '/highlights',   icon: Film,      label: 'Highlights' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/profile', icon: User, label: 'Profile' },
    ],
  },
]

export function Layout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, isDemoMode, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleSignOut = async () => { await signOut(); navigate('/') }

  const displayName = isDemoMode ? 'Alex Rivera' : (user?.displayName ?? 'Player')
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="flex h-screen bg-slate-950 font-sans">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 transition-transform duration-300 lg:relative lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pitch-600 flex-shrink-0">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white tracking-tight leading-none">MyFutbolPro</p>
            <p className="text-xs text-slate-500 mt-0.5">Performance Analytics</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto text-slate-500 hover:text-white lg:hidden flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {navGroups.map(group => (
            <div key={group.label}>
              <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-widest text-slate-600">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(({ to, icon: Icon, label, highlight }) => (
                  <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => cn(
                      'group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-pitch-600/20 text-pitch-400 border border-pitch-600/30'
                        : highlight
                        ? 'text-purple-400 hover:bg-purple-600/10 hover:text-purple-300'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    )}>
                    {({ isActive }) => (
                      <>
                        <Icon className={cn('h-4 w-4 flex-shrink-0',
                          isActive ? 'text-pitch-400' : highlight ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-300'
                        )} />
                        <span className="truncate">{label}</span>
                        {highlight && !isActive && (
                          <span className="ml-auto text-xs font-bold bg-purple-600/20 text-purple-400 px-1.5 py-0.5 rounded-md flex-shrink-0">AI</span>
                        )}
                        {isActive && <ChevronRight className="ml-auto h-3 w-3 text-pitch-500 flex-shrink-0" />}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-slate-800 p-3 space-y-2">
          {isDemoMode && (
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-3 py-2">
              <p className="text-xs text-yellow-400 font-medium">Demo Mode — Sample Data</p>
            </div>
          )}
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pitch-600/30 text-pitch-400 text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-200 leading-none">{displayName}</p>
              <p className="truncate text-xs text-slate-500 mt-0.5">{isDemoMode ? 'Demo Account' : user?.email}</p>
            </div>
            <button onClick={handleSignOut} title="Sign out" className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-3 border-b border-slate-800 bg-slate-950/80 px-4 backdrop-blur-sm lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-white lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <button onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button className="relative text-slate-500 hover:text-slate-300 transition-colors">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-pitch-500" />
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
