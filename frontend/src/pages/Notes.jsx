import { useCallback, useEffect, useState } from 'react'
import { Search, StickyNote, Pencil, AlertCircle, RefreshCw } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import EditNoteModal from '../components/notes/EditNoteModal'
import notesService from '../services/notesService'
import { formatMoney, formatDate } from '../utils/formatters'

const PAGE_SIZE = 12

function monthEndDate(month) {
  const [y, m] = month.split('-').map(Number)
  const last = new Date(y, m, 0).getDate()
  return `${y}-${String(m).padStart(2, '0')}-${String(last).padStart(2, '0')}`
}

export default function Notes() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [month, setMonth] = useState('')

  const [editing, setEditing] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await notesService.list({
        search,
        type: type || undefined,
        startDate: month ? `${month}-01` : undefined,
        endDate: month ? monthEndDate(month) : undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      setItems(data.items)
      setTotal(data.total)
      setPages(data.pages)
    } catch {
      setError('Could not load your notes.')
    } finally {
      setLoading(false)
    }
  }, [search, type, month, page])

  useEffect(() => {
    const timer = setTimeout(load, search ? 400 : 0)
    return () => clearTimeout(timer)
  }, [load, search])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Notes</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {total > 0 ? `${total} note${total === 1 ? '' : 's'} attached to your records` : 'Notes attached to your income and expenses'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              placeholder="Search notes & titles..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 pl-8 pr-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
          </div>
          <select
            value={type}
            onChange={(e) => { setType(e.target.value); setPage(1) }}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          >
            <option value="">Income & expenses</option>
            <option value="income">Income only</option>
            <option value="expense">Expenses only</option>
          </select>
          <input
            type="month"
            value={month}
            onChange={(e) => { setMonth(e.target.value); setPage(1) }}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          />
        </div>
      </Card>

      {/* Note cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Spinner className="h-7 w-7" />
          <p className="text-sm text-slate-500">Loading notes…</p>
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
          icon={StickyNote}
          title="No notes yet"
          description={search || type || month
            ? 'No notes match your filters. Try clearing them.'
            : 'Add a note when you log an income or expense — it will show up here.'}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((n) => (
              <div
                key={`${n.type}-${n.id}`}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-card flex flex-col"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={n.type === 'income' ? 'success' : 'warning'}>
                    {n.type === 'income' ? 'Income' : 'Expense'}
                  </Badge>
                  <span className="text-xs text-slate-400">{formatDate(n.date)}</span>
                </div>

                <p className="font-semibold truncate">{n.title}</p>
                <div className="flex items-center justify-between mt-1 mb-3">
                  <span className="text-xs text-slate-400">
                    {n.category_name || 'Uncategorized'}
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      n.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {n.type === 'income' ? '+' : '−'}{formatMoney(n.amount, n.currency_code)}
                  </span>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed flex-1 bg-slate-50 dark:bg-slate-700/40 rounded-lg px-3 py-2.5 border-l-4 border-indigo-300 dark:border-indigo-500">
                  "{n.note}"
                </p>

                <button
                  onClick={() => setEditing(n)}
                  className="mt-3 flex items-center justify-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline py-1"
                >
                  <Pencil size={14} /> Edit note
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Page {page} of {pages}</span>
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
        </>
      )}

      {/* Edit modal */}
      <EditNoteModal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        note={editing}
        onSaved={load}
      />
    </div>
  )
}
