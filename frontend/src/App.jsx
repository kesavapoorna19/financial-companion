import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'

// Pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Income from './pages/Income'
import Expenses from './pages/Expenses'
import SavingsGoals from './pages/SavingsGoals'
import Notes from './pages/Notes'
import Reports from './pages/Reports'
import RoleModule from './pages/RoleModule'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'

/**
 * Route structure.
 *
 * Phase 3 ships with open routes so the full shell is navigable for review.
 * Phase 4 adds a ProtectedRoute wrapper around DashboardLayout so only
 * authenticated users can access the app shell.
 */
export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Authenticated shell — ProtectedRoute redirects to /login if not logged in */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/income" element={<Income />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/savings" element={<SavingsGoals />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/role" element={<RoleModule />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
