import { useCallback, useEffect, useState } from 'react'
import { Plus, Search, Pencil, Trash2, ArrowUpCircle, AlertCircle, RefreshCw } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ExpenseFormModal from '../components/expenses/ExpenseFormModal'
import { useToast } from '../context/ToastContext'
import expenseService from '../services/expenseService'
import categoryService from '../services/categoryService'
import { formatMoney, formatDate } from '../utils/formatters'
import { PAYMENT_METHODS, RECURRING_FREQUENCIES } from '../constants'

const PAGE_SIZE = 15

const paymentLabel = (value) => PAYMENT_METHODS.find((p) => p.value === value)?.label?.replace(/^\S+\s/, '') || '—'
const frequencyLabel = (value) => RECURRING_FREQUENCIES.find((f) => f.value === value)?.label || 'Recurring'

function monthEndDate(month) {
  const [y, m] = month.split('-').map(Number)
  const last = new Date(y, m, 0).getDate()
  return `${y}-${String(m).padStart(2, '0')}-${String(last).padStart(2, '0')}`
}

export default function Expenses() {
  const toast = useToast()

  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [month, setMonth] = useState('')
  const [recurringOnly, setRecurringOnly] = useState(false)

  const [categories, setCategories] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Load category options once
  useEffect(() => {
    categoryService.list('expense').then(setCategories).catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await expenseService.list({
        search,
        categoryId: categoryId || undefined,
        isRecurring: recurringOnly || undefined,
        startDate: month ? `${month}-01` : undefined,
        endDate: month ? monthEndDate(month) : undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      setItems(data.items)
      setTotal(data.total)
      setPages(data.pages)
    } catch {
      setError('Could not load your expenses.')
    } finally {
      setLoading(false)
    }
  }, [search, categoryId, month, recurringOnly, page])

  useEffect(() => {
    const timer = setTimeout(load, search ? 400 : 0)
    return () => clearTimeout(timer)
  }, [load, search])

  const openCreate = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (exp) => { setEditing(exp); setModalOpen(true) }

  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      await expenseService.remove(deleting.id)
      toast.success('Expense deleted')
      setDeleting(null)
      if (items.length === 1 && page > 1) setPage((p) => p - 1)
      else load()
    } catch {
      toast.error('Could not delete expense')
      setDeleting(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Expenses</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {total > 0 ? `${total} record${total === 1 ? '' : 's'} total` : 'Track the money you spend'}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Add Expense
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 pl-8 pr-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
          </div>
          <select
            value={categoryId}
            onChange={(e) => { setCategoryId(e.target.value); setPage(1) }}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input
            type="month"
            value={month}
            onChange={(e) => { setMonth(e.target.value); setPage(1) }}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          />
          <button
            onClick={() => { setRecurringOnly((v) => !v); setPage(1) }}
            className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              recurringOnly
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-indigo-300'
            }`}
          >
            🔁 Recurring only
          </button>
        </div>
      </Card>

      {/* List */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Spinner className="h-7 w-7" />
            <p className="text-sm text-slate-500">Loading expenses…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle size={36} className="text-slate-300 mb-3" />
            <p className="font-medium">{error}</p>
            <Button onClick={load} className="mt-4" variant="secondary" size="sm">
              <RefreshCw size={14} /> Try again
            </Button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={ArrowUpCircle}
            title="No expenses found"
            description={search || categoryId || month || recurringOnly
              ? 'No records match your filters. Try clearing them.'
              : 'Add your first expense — rent, food, travel, bills and more.'}
            actionLabel="Add Expense"
            onAction={openCreate}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100 dark:border-slate-700">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Payment</th>
                  <th className="px-5 py-3 font-medium">Recurring</th>
                  <th className="px-5 py-3 font-medium text-right">Amount</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {items.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(exp.expense_date)}</td>
                    <td className="px-5 py-3 font-medium">
                      {exp.title}
                      {(exp.merchant || exp.notes) && (
                        <p className="text-xs text-slate-400 font-normal truncate max-w-[220px]">
                          {[exp.merchant, exp.notes].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="warning">{categories.find((c) => c.id === exp.category_id)?.name || 'Uncategorized'}</Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{paymentLabel(exp.payment_method)}</td>
                    <td className="px-5 py-3">
                      {exp.is_recurring ? (
                        <Badge variant="info">🔁 {frequencyLabel(exp.recurring_frequency)}</Badge>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                      −{formatMoney(exp.amount, exp.currency_code)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(exp)}
                          title="Edit"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleting(exp)}
                          title="Delete"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-700 text-sm">
            <span className="text-slate-400">
              Page {page} of {pages}
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add/Edit modal */}
      <ExpenseFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        expense={editing}
        categories={categories}
        onSaved={load}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete this expense?"
        message={deleting ? `"${deleting.title}" will be permanently removed.` : ''}
        confirmLabel={deleteLoading ? 'Deleting…' : 'Delete'}
        danger
      />
    </div>
  )
}
