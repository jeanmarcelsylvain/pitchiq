import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Activity, ClipboardList, Target, User,
  LogOut, Menu, X, Zap, ChevronRight, Bell, Sparkles, Trophy, FileText, Film
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import type { ReactNode } from 'react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/matches', icon: ClipboardList, label: 'Matches' },
  { to: '/analytics', icon: Activity, label: 'Analytics' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/ai-coach', icon: Sparkles, label: 'AI Coach', highlight: true },
  { to: '/highlights', icon: Film, label: 'Highlights' },
  { to: '/achievements', icon: Trophy, label: 'Achievements' },
  { to: '/recruit', icon: FileText, label: 'Recruit Profile' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export function Layout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, isDemoMode, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const displayName = isDemoMode ? 'Alex Rivera' : (user?.displayName ?? 'Player')
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="flex h-screen bg-slate-950 font-sans">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 transition-transform duration-300 lg:relative lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pitch-600">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-base font-bold text-white tracking-tight">MyFutbolPro</span>
            <p className="text-xs text-slate-500 leading-none mt-0.5">Performance Analytics</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto text-slate-500 hover:text-white lg:hidden">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-widest text-slate-600">Menu</p>
          {navItems.map(({ to, icon: Icon, label, highlight }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-pitch-600/20 text-pitch-400 border border-pitch-600/30'
                  : highlight
                  ? 'text-purple-400 hover:bg-purple-600/10 hover:text-purple-300 border border-purple-600/20'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              )}
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-pitch-400' : highlight ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-300')} />
                  {label}
                  {highlight && !isActive && <span className="ml-auto text-xs font-bold bg-purple-600/20 text-purple-400 px-1.5 py-0.5 rounded-md">NEW</span>}
                  {isActive && <ChevronRight className="ml-auto h-3 w-3 text-pitch-500" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-slate-800 p-3">
          {isDemoMode && (
            <div className="mb-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-3 py-2">
              <p className="text-xs text-yellow-400 font-medium">Demo Mode — Sample Data</p>
            </div>
          )}
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pitch-600/30 text-pitch-400 text-sm font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-200">{displayName}</p>
              <p className="truncate text-xs text-slate-500">{isDemoMode ? 'Demo Account' : user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="text-slate-600 hover:text-slate-300 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center gap-4 border-b border-slate-800 bg-slate-950/80 px-4 backdrop-blur-sm lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <button className="relative text-slate-500 hover:text-slate-300 transition-colors">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-pitch-500" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-4 lg:p-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
