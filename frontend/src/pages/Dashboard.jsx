import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  ArrowDownCircle,
  ArrowUpCircle,
  Download,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import CashflowChart from '../components/dashboard/CashflowChart'
import ExpenseBreakdown from '../components/dashboard/ExpenseBreakdown'
import CalendarView from '../components/dashboard/CalendarView'
import ExportReport from '../components/reports/ExportReport'
import dashboardService from '../services/dashboardService'
import { formatMoney, formatDate } from '../utils/formatters'
import { useCurrency } from '../context/CurrencyContext'

export default function Dashboard() {
  const navigate = useNavigate()
  const { currencyCode } = useCurrency()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exportOpen, setExportOpen] = useState(false)

  const load = () => {
    setLoading(true)
    setError(null)
    dashboardService
      .getSummary()
      .then(setData)
      .catch(() => setError('Could not load your dashboard. Is the backend running?'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Spinner className="h-8 w-8" />
        <p className="text-sm text-slate-500">Loading your money…</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle size={40} className="text-slate-300 mb-3" />
        <p className="font-semibold">{error || 'Something went wrong'}</p>
        <Button onClick={load} className="mt-4" variant="secondary">
          <RefreshCw size={16} /> Try again
        </Button>
      </div>
    )
  }

  const { totals, monthly, expense_breakdown, income_breakdown, recent_transactions, goals, daily_totals, insights } = data
  const today = new Date()

  const stats = [
    {
      label: 'Total Income', value: totals.total_income, icon: TrendingUp,
      color: 'text-emerald-600 dark:text-emerald-400',
      footer: income_breakdown.length ? `Top: ${income_breakdown[0].category}` : 'No income yet',
    },
    {
      label: 'Total Expenses', value: totals.total_expenses, icon: TrendingDown,
      color: 'text-rose-600 dark:text-rose-400',
      footer: expense_breakdown.length ? `Top: ${expense_breakdown[0].category}` : 'No expenses yet',
    },
    {
      label: 'Current Balance', value: totals.balance, icon: Wallet,
      color: totals.balance >= 0 ? 'text-slate-800 dark:text-slate-100' : 'text-rose-600',
      footer: 'This month',
    },
    {
      label: 'Savings Goal', value: goals[0]?.percentage ?? null, icon: Target,
      color: 'text-slate-800 dark:text-slate-100',
      footer: goals[0] ? goals[0].name : 'No goals yet',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header row with export */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Here's how your money is doing this month.
        </p>
        <div className="flex items-center gap-2">
          <Button onClick={() => setExportOpen(true)} variant="secondary" size="sm">
            <Download size={14} /> Export Report
          </Button>
          <Button onClick={() => navigate('/income')} variant="secondary" size="sm">
            <ArrowDownCircle size={14} /> Income
          </Button>
          <Button onClick={() => navigate('/expenses')} variant="danger" size="sm">
            <ArrowUpCircle size={14} /> Expense
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500 dark:text-slate-400">{s.label}</p>
              <s.icon size={18} className="text-slate-400" />
            </div>
            {s.value !== null ? (
              <p className={`text-2xl font-bold ${s.color}`}>
                {formatMoney(s.value, currencyCode)}
              </p>
            ) : (
              <>
                <p className="text-2xl font-bold">—</p>
              </>
            )}
            <p className="text-xs text-slate-400 mt-1.5 truncate">{s.footer}</p>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Income vs Expenses" subtitle="Last 6 months" className="lg:col-span-2">
          <CashflowChart monthly={monthly} />
        </Card>
        <Card title="Expense Breakdown" subtitle="This month">
          {expense_breakdown.length ? (
            <ExpenseBreakdown breakdown={expense_breakdown} />
          ) : (
            <p className="text-sm text-slate-400 py-16 text-center">No expenses this month.</p>
          )}
        </Card>
      </div>

      {/* Calendar + Insights + Goals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Calendar" subtitle="Your activity this month">
          <CalendarView year={today.getFullYear()} month={today.getMonth() + 1} daily_totals={daily_totals} />
        </Card>
        <Card title="💡 Insights" subtitle="Simple tips for now — AI comes later">
          {insights?.message ? (
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {insights.message}
            </p>
          ) : (
            <p className="text-sm text-slate-400">
              Add some income and expenses and we'll start giving you tips here.
            </p>
          )}
        </Card>
        <Card title="🎯 Savings Goals" subtitle="Your progress">
          {goals.length ? (
            <div className="space-y-4">
              {goals.map((g) => (
                <div key={g.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium truncate">{g.name}</span>
                    <span className="text-slate-400">{g.percentage}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full">
                    <div className="h-2 bg-indigo-500 rounded-full" style={{ width: `${Math.min(g.percentage, 100)}%` }} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {formatMoney(g.saved_amount, g.currency_code)} of {formatMoney(g.target_amount, g.currency_code)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No savings goals yet.</p>
          )}
        </Card>
      </div>

      {/* Recent transactions */}
      <Card
        title="Recent Transactions"
        action={
          <button className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
            View all →
          </button>
        }
      >
        {recent_transactions.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100 dark:border-slate-700">
                  <th className="pb-2 font-medium">Title</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium text-right">Amount</th>
                  <th className="pb-2 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {recent_transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="py-3">{t.title}</td>
                    <td>
                      <Badge variant={t.type === 'income' ? 'success' : 'warning'}>{t.category || 'Uncategorized'}</Badge>
                    </td>
                    <td className={`text-right font-medium ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {t.type === 'income' ? '+' : '−'}{formatMoney(t.amount, t.currency_code)}
                    </td>
                    <td className="text-right text-slate-400">{formatDate(t.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-400 py-8 text-center">No transactions yet. Add your first income or expense!</p>
        )}
      </Card>

      {/* Export modal */}
      <ExportReport open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  )
}
