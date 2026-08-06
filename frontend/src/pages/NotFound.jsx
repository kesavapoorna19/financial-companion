import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'
import Button from '../components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 text-center transition-colors">
      <p className="text-7xl font-extrabold text-indigo-600">404</p>
      <p className="text-xl font-semibold mt-4">Page not found</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/dashboard" className="mt-6">
        <Button>
          <Home size={16} /> Back to Dashboard
        </Button>
      </Link>
    </div>
  )
}
