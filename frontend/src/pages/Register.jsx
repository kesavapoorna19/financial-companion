import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mail, Lock, User, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import { cn } from '../utils/cn'

const roles = [
  { value: 'student', label: '🎓 Student' },
  { value: 'employee', label: '💼 Employee' },
  { value: 'freelancer', label: '🎨 Freelancer' },
  { value: 'investor', label: '📈 Investor' },
  { value: 'shop_owner', label: '🏪 Small Shop Owner' },
]

export default function Register() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ mode: 'onBlur' })

  const selectedRole = watch('role')

  const onSubmit = async (values) => {
    setError(null)
    setLoading(true)
    try {
      await registerUser(values)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xl font-bold">₹</div>
          <p className="font-bold text-lg">Financial Companion</p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 shadow-sm">
          <h1 className="text-xl font-bold mb-1">Create your account</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Choose a role and you're ready to go.</p>

          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full name"
              icon={User}
              placeholder="Ravi Kumar"
              error={errors.full_name?.message}
              {...register('full_name', { required: 'Name is required', minLength: { value: 2, message: 'At least 2 characters' } })}
            />
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
              placeholder="At least 8 characters"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'At least 8 characters' },
              })}
            />

            {/* Role selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                What fits you best?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setValue('role', r.value, { shouldValidate: true })}
                    className={cn(
                      'py-2.5 rounded-xl border text-sm font-medium transition-colors',
                      selectedRole === r.value
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-indigo-300',
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <input type="hidden" {...register('role', { required: 'Please choose a role' })} />
              {errors.role && <p className="text-xs text-rose-600 mt-1">{errors.role.message}</p>}
              <p className="text-xs text-slate-400 mt-1.5">You can change this later in settings.</p>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Spinner className="h-4 w-4" /> : <><UserPlus size={16} /> Create account</>}
            </Button>
          </form>

          <p className="text-xs text-center text-slate-400 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
