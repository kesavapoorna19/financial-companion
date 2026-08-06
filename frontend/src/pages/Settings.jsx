import { useEffect, useState } from 'react'
import { Globe, Palette, Wallet, CheckCircle } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useCurrency } from '../context/CurrencyContext'
import Card from '../components/ui/Card'
import Select from '../components/ui/Select'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import userService from '../services/userService'
import { CURRENCIES } from '../constants'

export default function Settings() {
  const { theme, toggleTheme } = useTheme()
  const { currencyCode } = useCurrency()

  const [settings, setSettings] = useState(null)
  const [currency, setCurrency] = useState('INR')
  const [budget, setBudget] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Fetch current settings on mount
  useEffect(() => {
    userService.getSettings()
      .then((s) => {
        setSettings(s)
        setCurrency(s.currency_code)
        setBudget(s.monthly_income_budget?.toString() || '')
      })
      .catch(() => {}) // settings endpoint may not be reachable yet
  }, [])

  const handleSaveCurrency = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const updated = await userService.updateSettings({ currency_code: currency })
      setSettings(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch { /* handled by apiClient 401 */ }
    finally { setSaving(false) }
  }

  const handleSaveBudget = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const val = budget ? parseFloat(budget) : null
      const updated = await userService.updateSettings({ monthly_income_budget: val })
      setSettings(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch { /* handled */ }
    finally { setSaving(false) }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Choose your display currency, switch themes and set a budget.
        </p>
      </div>

      {/* Currency */}
      <Card title="Display Currency" subtitle="All money in the app shows in this currency." icon={Globe}>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Select
              options={CURRENCIES}
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            />
          </div>
          <Button onClick={handleSaveCurrency} disabled={saving || currency === settings?.currency_code} size="md">
            {saving ? <Spinner className="h-4 w-4" /> : 'Save'}
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Transactions keep their own currency. This just changes how amounts are displayed to you.
        </p>
      </Card>

      {/* Theme */}
      <Card title="Appearance" subtitle="Switch between light and dark mode." icon={Palette}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Current: {theme === 'dark' ? '🌙 Dark mode' : '☀️ Light mode'}</p>
            <p className="text-xs text-slate-400 mt-0.5">Click the button or the moon icon in the top bar to switch.</p>
          </div>
          <Button onClick={toggleTheme} variant="secondary" size="sm">
            Switch to {theme === 'dark' ? 'Light' : 'Dark'}
          </Button>
        </div>
      </Card>

      {/* Monthly budget */}
      <Card title="Monthly Income Budget" subtitle="Set a rough monthly income target for the dashboard." icon={Wallet}>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Input
              type="number"
              placeholder={`e.g. 50000 (${currency})`}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              min="0"
              step="100"
            />
          </div>
          <Button onClick={handleSaveBudget} disabled={saving} size="md">
            {saving ? <Spinner className="h-4 w-4" /> : 'Save'}
          </Button>
        </div>
        {saved && (
          <span className="text-sm text-emerald-600 flex items-center gap-1 mt-2">
            <CheckCircle size={14} /> Saved
          </span>
        )}
      </Card>
    </div>
  )
}
