import { useAuth } from '@/hooks/useAuth'
import { useAppData } from '@/hooks/useAppData'
import { computeBadges } from '@/lib/badges'
import { cn } from '@/lib/utils'

export default function Achievements() {
  const { user, isDemoMode } = useAuth()
  const { matches, profile } = useAppData()
  const uid = isDemoMode ? 'demo' : user?.uid ?? ''
  const badges = computeBadges(uid)
  const earned = badges.filter(b => b.earned)
  const locked = badges.filter(b => !b.earned)

  const matchesRaw = isDemoMode ? matches : JSON.parse(localStorage.getItem(`matches_${uid}`) ?? '[]')
  const totalGoals = matchesRaw.reduce((s: number, m: { goals: number }) => s + (m.goals ?? 0), 0)
  const streakRaw = localStorage.getItem(`streak_${uid}`)
  const streak = streakRaw ? JSON.parse(streakRaw) as { count: number } : { count: 0 }

  return (
    <div className="space-y-8 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-white">Achievements</h1>
        <p className="mt-1 text-sm text-slate-500">
          {earned.length} of {badges.length} badges earned · Keep logging to unlock more
        </p>
      </div>

      {/* Streak + stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Matches Logged', value: matchesRaw.length, icon: '📋' },
          { label: 'Goals Scored', value: totalGoals, icon: '⚽' },
          { label: 'Current Streak', value: `${streak.count} days`, icon: '🔥' },
          { label: 'Badges Earned', value: `${earned.length}/${badges.length}`, icon: '🏅' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
            <div className="text-2xl mb-1">{icon}</div>
            <p className="text-xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Earned badges */}
      {earned.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500 mb-4">Earned</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {earned.map(badge => (
              <div
                key={badge.id}
                className="relative rounded-xl border border-pitch-600/30 bg-pitch-600/10 p-4 text-center"
              >
                <div className="text-3xl mb-2">{badge.icon}</div>
                <p className="text-sm font-bold text-white">{badge.name}</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{badge.description}</p>
                <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-pitch-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked badges */}
      {locked.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500 mb-4">Locked</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {locked.map(badge => (
              <div
                key={badge.id}
                className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-center opacity-50"
              >
                <div className="text-3xl mb-2 grayscale">{badge.icon}</div>
                <p className="text-sm font-bold text-slate-400">{badge.name}</p>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{badge.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {earned.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">🏅</div>
          <h2 className="text-lg font-bold text-white mb-2">No badges yet</h2>
          <p className="text-slate-500 text-sm max-w-xs">
            Start logging matches and setting goals to earn your first badge.
          </p>
        </div>
      )}
    </div>
  )
}
