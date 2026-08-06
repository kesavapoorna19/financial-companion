import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { useTheme } from '../../context/ThemeContext'

ChartJS.register(ArcElement, Tooltip, Legend)

const PALETTE = [
  '#f97316', '#3b82f6', '#a855f7', '#14b8a6',
  '#ef4444', '#eab308', '#ec4899', '#06b6d4',
  '#84cc16', '#6366f1', '#f43f5e', '#64748b',
]

/**
 * Doughnut chart showing how expenses split across categories.
 */
export default function ExpenseBreakdown({ breakdown = [] }) {
  const { theme } = useTheme()
  const tickColor = theme === 'dark' ? '#94a3b8' : '#64748b'

  const data = {
    labels: breakdown.map((b) => b.category),
    datasets: [
      {
        data: breakdown.map((b) => Number(b.total)),
        backgroundColor: breakdown.map((_, i) => PALETTE[i % PALETTE.length]),
        borderWidth: 2,
        borderColor: theme === 'dark' ? '#1e293b' : '#ffffff',
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 10, padding: 12, color: tickColor },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.label}: ${Number(ctx.raw).toLocaleString('en-IN')}`,
        },
      },
    },
  }

  return (
    <div className="h-56">
      <Doughnut data={data} options={options} />
    </div>
  )
}
