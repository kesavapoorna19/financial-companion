/**
 * Period helpers for the Reports page.
 * Maps a period label to an inclusive { startDate, endDate } range (YYYY-MM-DD).
 */

const pad = (n) => String(n).padStart(2, '0')
const startOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export function getPeriodRange(period) {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() // 0-based

  switch (period) {
    case 'thisWeek': {
      const day = now.getDay() || 7 // Sun=7 so Monday=1
      const monday = new Date(now)
      monday.setDate(now.getDate() - day + 1)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      return { startDate: startOf(monday), endDate: startOf(sunday) }
    }
    case 'lastWeek': {
      const day = now.getDay() || 7
      const monday = new Date(now)
      monday.setDate(now.getDate() - day - 6)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      return { startDate: startOf(monday), endDate: startOf(sunday) }
    }
    case 'thisMonth':
      return { startDate: `${y}-${pad(m + 1)}-01`, endDate: startOf(now) }
    case 'lastMonth': {
      const last = new Date(y, m, 0)
      const first = new Date(y, m - 1, 1)
      return { startDate: startOf(first), endDate: startOf(last) }
    }
    case 'thisYear':
      return { startDate: `${y}-01-01`, endDate: startOf(now) }
    case 'lastYear':
      return { startDate: `${y - 1}-01-01`, endDate: `${y - 1}-12-31` }
    case 'all':
      return { startDate: '2000-01-01', endDate: startOf(now) }
    default:
      throw new Error(`Unknown period: ${period}`)
  }
}

export const PERIOD_OPTIONS = [
  { value: 'thisWeek', label: 'This week' },
  { value: 'lastWeek', label: 'Last week' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'lastMonth', label: 'Last month' },
  { value: 'thisYear', label: 'This year' },
  { value: 'lastYear', label: 'Last year' },
  { value: 'all', label: 'All time' },
]
