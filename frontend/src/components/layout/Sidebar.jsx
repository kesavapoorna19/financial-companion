import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  StickyNote,
  Target,
  BarChart3,
  Briefcase,
  TrendingUp,
  Store,
  Settings,
  User,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/income', label: 'Income', icon: ArrowDownCircle },
  { to: '/expenses', label: 'Expenses', icon: ArrowUpCircle },
  { to: '/notes', label: 'Notes', icon: StickyNote },
  { to: '/savings', label: 'Savings Goals', icon: Target },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
]

const roleItems = [
  { to: '/role', label: 'Role Tools', icon: Briefcase },
]

export default function Sidebar() {
  const { user } = useAuth()
  const role = user?.role

  // Add a second role-specific item based on the user's role
  const dynamicRoleItem = (() => {
    switch (role) {
      case 'investor': return { to: '/role', label: 'Investments', icon: TrendingUp }
      case 'shop_owner': return { to: '/role', label: 'My Shop', icon: Store }
      default: return null
    }
  })()

  const accountItems = [
    { to: '/settings', label: 'Settings', icon: Settings },
    { to: '/profile', label: 'Profile', icon: User },
  ]

  return (
    <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-5 hidden lg:flex flex-col shrink-0 h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8 px-1">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg font-bold">
          ₹
        </div>
        <div className="leading-tight">
          <p className="font-bold text-sm">Financial</p>
          <p className="font-bold text-sm text-indigo-600 dark:text-indigo-400">Companion</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 text-sm font-medium">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}

        {/* Role tools section */}
        <p className="pt-5 pb-1 px-3 text-xs uppercase tracking-wide text-slate-400 font-semibold">
          Role tools
        </p>
        {roleItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
        {dynamicRoleItem && <NavItem {...dynamicRoleItem} />}
      </nav>

      {/* Account section */}
      <div className="space-y-1 text-sm font-medium">
        <p className="pt-4 pb-1 px-3 text-xs uppercase tracking-wide text-slate-400 font-semibold">
          Account
        </p>
        {accountItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </div>
    </aside>
  )
}

function NavItem({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors ${
          isActive
            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/60 hover:text-slate-800 dark:hover:text-slate-200'
        }`
      }
    >
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  )
}
