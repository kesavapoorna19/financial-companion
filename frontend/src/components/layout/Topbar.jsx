import { Search } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import UserMenu from './UserMenu'
import { useAuth } from '../../context/AuthContext'

export default function Topbar() {
  const { user } = useAuth()

  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  const firstName = user?.full_name?.split(' ')[0] || 'there'

  return (
    <header className="flex items-center justify-between gap-4 mb-6">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {greeting}, {firstName} 👋
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative hidden sm:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            placeholder="Search transactions..."
            className="w-52 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-8 pr-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          />
        </div>
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
