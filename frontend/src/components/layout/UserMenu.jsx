import { useEffect, useRef, useState } from 'react'
import { ChevronDown, User, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!user) return null

  const initials = user.full_name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const handleNav = (path) => { navigate(path); setOpen(false) }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
          {initials}
        </div>
        <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">{user.full_name}</span>
        <ChevronDown size={14} className="text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg py-1 z-50">
          <button onClick={() => handleNav('/profile')} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <User size={14} className="text-slate-400" /> Profile
          </button>
          <button onClick={() => handleNav('/settings')} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <Settings size={14} className="text-slate-400" /> Settings
          </button>
          <hr className="my-1 border-slate-100 dark:border-slate-700" />
          <button onClick={() => { logout(); navigate('/login'); setOpen(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
            <LogOut size={14} /> Logout
          </button>
        </div>
      )}
    </div>
  )
}
