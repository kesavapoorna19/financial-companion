import { useMemo } from 'react'

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

function dayOfWeek(year, month, day) {
  const d = new Date(year, month - 1, day).getDay()
  return d === 0 ? 6 : d - 1 // Monday = 0
}

/**
 * Compact month calendar. Green dot = income, red dot = expense.
 * `daily_totals` keys are "YYYY-MM-DD".
 */
export default function CalendarView({ year, month, daily_totals = {} }) {
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month

  const cells = useMemo(() => {
    const total = daysInMonth(year, month)
    const start = dayOfWeek(year, month, 1)
    const arr = []
    for (let i = 0; i < start; i++) arr.push({ day: 0 })
    for (let d = 1; d <= total; d++) {
      const key = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      arr.push({ day: d, key, isToday: isCurrentMonth && d === today.getDate() })
    }
    return arr
  }, [year, month, isCurrentMonth])

  const label = new Date(year, month - 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="text-sm">
      <p className="font-semibold mb-3">{label}</p>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <span key={w} className="text-[10px] text-slate-400 font-medium pb-1">
            {w}
          </span>
        ))}
        {cells.map((c, i) => {
          if (!c.day) return <span key={i} />
          const data = daily_totals[c.key]
          const hasIncome = data && data.income > 0
          const hasExpense = data && data.expenses > 0

          return (
            <span
              key={c.day}
              className={`relative inline-flex items-center justify-center w-7 h-7 rounded-full text-xs ${
                c.isToday
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {c.day}
              {(hasIncome || hasExpense) && !c.isToday && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex gap-[2px]">
                  {hasIncome && <span className="w-[4px] h-[4px] rounded-full bg-emerald-500" />}
                  {hasExpense && <span className="w-[4px] h-[4px] rounded-full bg-rose-500" />}
                </span>
              )}
            </span>
          )
        })}
      </div>
      <div className="flex gap-3 mt-3 text-[10px] text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Income
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Expense
        </span>
      </div>
    </div>
  )
}
