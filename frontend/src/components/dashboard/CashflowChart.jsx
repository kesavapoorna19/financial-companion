import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { useTheme } from '../../context/ThemeContext'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

/**
 * Income vs expenses bar chart for the last 6 months.
 */
export default function CashflowChart({ monthly = [] }) {
  const { theme } = useTheme()
  const gridColor = theme === 'dark' ? 'rgba(148,163,184,0.15)' : 'rgba(100,116,139,0.15)'
  const tickColor = theme === 'dark' ? '#94a3b8' : '#64748b'

  const data = {
    labels: monthly.map((m) => m.month),
    datasets: [
      {
        label: 'Income',
        data: monthly.map((m) => Number(m.income)),
        backgroundColor: '#34d399',
        borderRadius: 6,
      },
      {
        label: 'Expenses',
        data: monthly.map((m) => Number(m.expenses)),
        backgroundColor: '#fb7185',
        borderRadius: 6,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, color: tickColor } },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${Number(ctx.raw).toLocaleString('en-IN')}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: tickColor } },
      y: { grid: { color: gridColor }, ticks: { color: tickColor } },
    },
  }

  return (
    <div className="h-64">
      <Bar data={data} options={options} />
    </div>
  )
}
