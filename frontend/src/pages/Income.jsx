import { useCallback, useEffect, useState } from 'react'
import { Plus, Search, Pencil, Trash2, ArrowDownCircle, AlertCircle, RefreshCw } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import IncomeFormModal from '../components/incomes/IncomeFormModal'
import { useToast } from '../context/ToastContext'
import incomeService from '../services/incomeService'
import categoryService from '../services/categoryService'
import { formatMoney, formatDate } from '../utils/formatters'
import { PAYMENT_METHODS } from '../constants'

const PAGE_SIZE = 15

const paymentLabel = (value) => PAYMENT_METHODS.find((p) => p.value === value)?.label?.replace(/^\S+\s/, '') || '—'

function monthEndDate(month) {
  const [y, m] = month.split('-').map(Number)
  const last = new Date(y, m, 0).getDate()
  return `${y}-${String(m).padStart(2, '0')}-${String(last).padStart(2, '0')}`
}

export default function Income() {
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

  const [categories, setCategories] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Load category options once
  useEffect(() => {
    categoryService.list('income').then(setCategories).catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await incomeService.list({
        search,
        categoryId: categoryId || undefined,
        startDate: month ? `${month}-01` : undefined,
        endDate: month ? monthEndDate(month) : undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      setItems(data.items)
      setTotal(data.total)
      setPages(data.pages)
    } catch {
      setError('Could not load your income records.')
    } finally {
      setLoading(false)
    }
  }, [search, categoryId, month, page])

  useEffect(() => {
    const timer = setTimeout(load, search ? 400 : 0)
    return () => clearTimeout(timer)
  }, [load, search])

  const openCreate = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (inc) => { setEditing(inc); setModalOpen(true) }

  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      await incomeService.remove(deleting.id)
      toast.success('Income deleted')
      setDeleting(null)
      if (items.length === 1 && page > 1) setPage((p) => p - 1)
      else load()
    } catch {
      toast.error('Could not delete income')
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
          <h1 className="text-xl font-bold">Income</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {total > 0 ? `${total} record${total === 1 ? '' : 's'} total` : 'Track the money you receive'}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Add Income
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              placeholder="Search income..."
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
        </div>
      </Card>

      {/* List */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Spinner className="h-7 w-7" />
            <p className="text-sm text-slate-500">Loading income…</p>
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
            icon={ArrowDownCircle}
            title="No income found"
            description={search || categoryId || month
              ? 'No records match your filters. Try clearing them.'
              : 'Add your first income record — salary, freelance work, gifts and more.'}
            actionLabel="Add Income"
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
                  <th className="px-5 py-3 font-medium text-right">Amount</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {items.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(inc.income_date)}</td>
                    <td className="px-5 py-3 font-medium">
                      {inc.title}
                      {inc.notes && <p className="text-xs text-slate-400 font-normal truncate max-w-[220px]">{inc.notes}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="success">
                        {categories.find((c) => c.id === inc.category_id)?.name || 'Uncategorized'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{paymentLabel(inc.payment_method)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      +{formatMoney(inc.amount, inc.currency_code)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(inc)}
                          title="Edit"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleting(inc)}
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
      <IncomeFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        income={editing}
        categories={categories}
        onSaved={load}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete this income?"
        message={deleting ? `"${deleting.title}" will be permanently removed.` : ''}
        confirmLabel={deleteLoading ? 'Deleting…' : 'Delete'}
        danger
      />
    </div>
  )
}
