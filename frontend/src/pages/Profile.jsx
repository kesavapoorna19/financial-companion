import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { User, Save, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import userService from '../services/userService'

const roleLabels = {
  student: '🎓 Student',
  employee: '💼 Employee',
  freelancer: '🎨 Freelancer',
  investor: '📈 Investor',
  shop_owner: '🏪 Shop Owner',
}

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: {
      full_name: user?.full_name || '',
      avatar_url: user?.avatar_url || '',
    },
  })

  const onSubmit = async (values) => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await userService.updateProfile(values)
      await refreshUser()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold">Your Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your account details.
        </p>
      </div>

      {/* Account info (read-only) */}
      <Card title="Account">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Email</span>
            <span className="font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">Role</span>
            <Badge variant="info">{roleLabels[user?.role] || user?.role}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Member since</span>
            <span className="font-medium">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
            </span>
          </div>
        </div>
      </Card>

      {/* Edit form */}
      <Card title="Edit Profile">
        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full name"
            icon={User}
            error={errors.full_name?.message}
            {...register('full_name', { required: 'Name is required', minLength: { value: 2, message: 'At least 2 characters' } })}
          />
          <Input
            label="Avatar URL (optional)"
            placeholder="https://example.com/avatar.jpg"
            {...register('avatar_url')}
          />
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving || !isDirty}>
              {saving ? <Spinner className="h-4 w-4" /> : <><Save size={16} /> Save changes</>}
            </Button>
            {saved && (
              <span className="text-sm text-emerald-600 flex items-center gap-1">
                <CheckCircle size={14} /> Saved
              </span>
            )}
          </div>
        </form>
      </Card>
    </div>
  )
}
