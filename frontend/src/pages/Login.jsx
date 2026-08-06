import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mail, Lock, LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: 'onBlur' })

  const onSubmit = async (values) => {
    setError(null)
    setLoading(true)
    try {
      await login(values)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xl font-bold">₹</div>
          <p className="font-bold text-lg">Financial Companion</p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 shadow-sm">
          <h1 className="text-xl font-bold mb-1">Welcome back</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Log in to see your money in action.</p>

          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              icon={Mail}
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
              })}
            />
            <Input
              label="Password"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'At least 8 characters' },
              })}
            />
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Spinner className="h-4 w-4" /> : <><LogIn size={16} /> Login</>}
            </Button>
          </form>

          <p className="text-xs text-center text-slate-400 mt-5">
            New here?{' '}
            <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
