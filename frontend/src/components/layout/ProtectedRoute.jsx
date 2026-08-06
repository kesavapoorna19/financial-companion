import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/**
 * Wraps authenticated routes. Redirects to /login if the user is not
 * logged in. Wrap this around <DashboardLayout /> in App.jsx.
 */
export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

/**
 * Role-restricted route. Renders children only if the user has one of the
 * allowed roles. Otherwise shows the 403-style empty state.
 *
 * Usage in App.jsx:
 *   <Route element={<RoleGuard allowed={['shop_owner']} />}>
 *     <Route path="/shop" element={<ShopPage />} />
 *   </Route>
 */
export function RoleGuard({ allowed = [] }) {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!allowed.includes(user?.role)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-5xl font-extrabold text-indigo-600">403</p>
        <p className="text-lg font-semibold mt-3">Not allowed</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
          This page is for {allowed.join(' or ')} users only.
        </p>
      </div>
    )
  }

  return <Outlet />
}
