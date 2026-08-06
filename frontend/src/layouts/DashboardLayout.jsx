import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import Topbar from '../components/layout/Topbar'

/**
 * Main app shell: sidebar + topbar + <Outlet/> for the active page.
 * Used for every authenticated screen.
 */
export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        <Topbar />
        <Outlet />
      </main>
    </div>
  )
}
