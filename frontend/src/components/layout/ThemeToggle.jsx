import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export default function ThemeToggle({ className }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className={`w-9 h-9 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${className || ''}`}
    >
      {theme === 'dark' ? (
        <Sun size={16} className="text-amber-500" />
      ) : (
        <Moon size={16} className="text-slate-500" />
      )}
    </button>
  )
}
