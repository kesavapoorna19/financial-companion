import { useCallback, useEffect, useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, Scale, PiggyBank, Download, AlertCircle, RefreshCw } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import CashflowChart from '../components/dashboard/CashflowChart'
import ExpenseBreakdown from '../components/dashboard/ExpenseBreakdown'
import { useToast } from '../context/ToastContext'
import reportService, { readDownloadError } from '../services/reportService'
import { getPeriodRange, PERIOD_OPTIONS } from '../utils/periods'
import { formatMoney } from '../utils/formatters'
import { useCurrency } from '../context/CurrencyContext'

const PERIODS = [...PERIOD_OPTIONS, { value: 'custom', label: 'Custom range…' }]

const BREAKDOWN_COLORS = ['#f97316', '#3b82f6', '#a855f7', '#14b8a6', '#ef4444', '#eab308', '#ec4899', '#06b6d4', '#84cc16', '#6366f1', '#f43f5e', '#64748b']

function BreakdownList({ items }) {
  if (!items.length) return <p className="text-sm text-slate-400 py-10 text-center">No data in this period.</p>
  return (
    <ul className="space-y-2.5">
      {items.map((b, i) => (
        <li key={b.category}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium truncate">{b.category}</span>
            <span className="text-slate-400">{b.percentage}%</span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full">
            <div
              className="h-2 rounded-full"
              style={{ width: `${Math.min(b.percentage, 100)}%`, background: BREAKDOWN_COLORS[i % BREAKDOWN_COLORS.length] }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

export default function Reports() {
  const toast = useToast()
  const { currencyCode } = useCurrency()

  const [period, setPeriod] = useState('thisMonth')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(null) // 'pdf' | 'csv'

  const range = useMemo(() => {
    if (period === 'custom') {
      if (customStart && customEnd) return { startDate: customStart, endDate: customEnd }
      return null
    }
    return getPeriodRange(period)
  }, [period, customStart, customEnd])

  const load = useCallback(async () => {
    if (!range) return
    setLoading(true)
    setError(null)
    try {
      const d = await reportService.getOverview(range.startDate, range.endDate)
      setData(d)
    } catch {
      setError('Could not load this report.')
    } finally {
      setLoading(false)
    }
  }, [range?.startDate, range?.endDate])

  useEffect(() => { load() }, [load])

  const handleDownload = async (format) => {
    if (!range) return
    setDownloading(format)
    try {
      await reportService.downloadReport(format, { start_date: range.startDate, end_date: range.endDate })
      toast.success(`${format.toUpperCase()} report downloaded`)
    } catch (err) {
      toast.error(await readDownloadError(err))
    } finally {
      setDownloading(null)
    }
  }

  const summaryCards = data ? [
    { label: 'Total Income', value: data.total_income, icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Total Expenses', value: data.total_expenses, icon: TrendingDown, color: 'text-rose-600 dark:text-rose-400' },
    {
      label: 'Profit / Loss', value: data.balance, icon: Scale,
      color: data.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
    },
    { label: 'Savings', value: data.savings_amount, icon: PiggyBank, color: 'text-slate-800 dark:text-slate-100' },
  ] : []

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {data ? data.period_label : 'Income, expenses, profit/loss and savings for any period'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" disabled={!range || downloading !== null} onClick={() => handleDownload('pdf')}>
            {downloading === 'pdf' ? <Spinner className="h-3.5 w-3.5" /> : <Download size={14} />} PDF
          </Button>
          <Button variant="secondary" size="sm" disabled={!range || downloading !== null} onClick={() => handleDownload('csv')}>
            {downloading === 'csv' ? <Spinner className="h-3.5 w-3.5" /> : <Download size={14} />} CSV
          </Button>
        </div>
      </div>

      {/* Period selector */}
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            >
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          {period === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">From</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">To</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Loading / error */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Spinner className="h-7 w-7" />
          <p className="text-sm text-slate-500">Crunching the numbers…</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle size={36} className="text-slate-300 mb-3" />
          <p className="font-medium">{error}</p>
          <Button onClick={load} className="mt-4" variant="secondary" size="sm">
            <RefreshCw size={14} /> Try again
          </Button>
        </div>
      ) : !data ? (
        <Card className="py-16 text-center text-slate-400 text-sm">
          {period === 'custom' ? 'Choose a start and end date.' : 'Pick a period to view the report.'}
        </Card>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {summaryCards.map((s) => (
              <Card key={s.label} className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-500 dark:text-slate-400">{s.label}</p>
                  <s.icon size={18} className="text-slate-400" />
                </div>
                <p className={`text-2xl font-bold ${s.color}`}>{formatMoney(s.value, currencyCode)}</p>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card title="Income vs Expenses" subtitle={data.monthly_series.length > 1 ? 'Per month' : 'Selected period'} className="lg:col-span-2">
              <CashflowChart monthly={data.monthly_series} />
            </Card>
            <Card title="Expense Breakdown" subtitle="By category">
              <ExpenseBreakdown breakdown={data.expense_by_category} />
            </Card>
          </div>

          {/* Income breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card title="Income Breakdown" subtitle="By category">
              <BreakdownList items={data.income_by_category} />
            </Card>
            <Card title="Expense Category Summary" subtitle="Where your money went">
              {data.expense_by_category.length ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-100 dark:border-slate-700">
                      <th className="pb-2 font-medium">Category</th>
                      <th className="pb-2 font-medium text-right">Amount</th>
                      <th className="pb-2 font-medium text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {data.expense_by_category.map((c) => (
                      <tr key={c.category}>
                        <td className="py-2.5">{c.category}</td>
                        <td className="py-2.5 text-right font-medium">{formatMoney(c.total, currencyCode)}</td>
                        <td className="py-2.5 text-right text-slate-400">{c.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-slate-400 py-8 text-center">No expenses in this period.</p>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
