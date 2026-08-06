import { useState } from 'react'
import { Download, CheckCircle, AlertCircle } from 'lucide-react'
import Modal from '../ui/Modal'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Select from '../ui/Select'
import Spinner from '../ui/Spinner'
import reportService, { readDownloadError } from '../../services/reportService'
import { cn } from '../../utils/cn'

const MONTH_OPTIONS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

const FORMATS = [
  { value: 'pdf', label: 'PDF', icon: '📄' },
  { value: 'csv', label: 'CSV', icon: '📊' },
]

/**
 * Financial Data Export.
 *
 * variant="modal" → popup (used on the Dashboard).
 * variant="card"  → inline panel (used on the Reports page).
 */
export default function ExportReport({ open, onClose, variant = 'modal' }) {
  const now = new Date()
  const [month, setMonth] = useState(String(now.getMonth() + 1))
  const [year, setYear] = useState(String(now.getFullYear()))
  const [format, setFormat] = useState('pdf')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null) // { type, text }

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = now.getFullYear() - i
    return { value: String(y), label: String(y) }
  })

  const handleDownload = async () => {
    setLoading(true)
    setMessage(null)
    try {
      await reportService.downloadReport(format, {
        year: parseInt(year, 10),
        month: parseInt(month, 10),
      })
      setMessage({ type: 'success', text: 'Report downloaded — check your downloads folder.' })
    } catch (err) {
      const detail = await readDownloadError(err)
      setMessage({ type: 'error', text: detail })
    } finally {
      setLoading(false)
    }
  }

  const content = (
    <div className="space-y-5">
      {/* Period selectors */}
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Month"
          options={MONTH_OPTIONS}
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
        <Select
          label="Year"
          options={yearOptions}
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />
      </div>

      {/* Format selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Format
        </label>
        <div className="grid grid-cols-2 gap-2">
          {FORMATS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFormat(f.value)}
              className={cn(
                'py-3 rounded-xl border text-sm font-medium transition-colors flex items-center justify-center gap-2',
                format === f.value
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-indigo-300',
              )}
            >
              <span>{f.icon}</span> {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={cn(
            'px-3 py-2 rounded-lg text-xs flex items-center gap-2',
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
          )}
        >
          {message.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {message.text}
        </div>
      )}

      <Button onClick={handleDownload} disabled={loading} className="w-full">
        {loading ? <Spinner className="h-4 w-4" /> : <Download size={16} />} Download Report
      </Button>

      <p className="text-xs text-slate-400 leading-relaxed">
        Your report includes income and expense records, totals, balance, savings amount and an
        expense category summary — only for your own account.
      </p>
    </div>
  )

  if (variant === 'card') {
    return <Card title="⬇ Export Report" subtitle="Download your financial records as PDF or CSV">{content}</Card>
  }

  return (
    <Modal open={open} onClose={onClose} title="Export Report">
      {content}
    </Modal>
  )
}
