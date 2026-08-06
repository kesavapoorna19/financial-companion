import { Link } from 'react-router-dom'
import {
  Wallet,
  TrendingUp,
  Target,
  ShieldCheck,
  BarChart3,
  Smartphone,
} from 'lucide-react'

const features = [
  { icon: Wallet, title: 'Track everything', desc: 'Income, expenses, savings — all in one place.' },
  { icon: TrendingUp, title: 'Know your money', desc: 'Monthly summaries, profit/loss, and insights.' },
  { icon: Target, title: 'Savings goals', desc: 'Set a goal and watch your progress grow.' },
  { icon: ShieldCheck, title: 'Safe and private', desc: 'Your data stays yours, protected with encryption.' },
  { icon: BarChart3, title: 'Beautiful reports', desc: 'Export to PDF and CSV anytime you need.' },
  { icon: Smartphone, title: 'Works everywhere', desc: 'Phone, tablet, laptop — designed for all screens.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 transition-colors">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg font-bold">₹</div>
          <p className="font-bold">Financial Companion</p>
        </div>
        <div className="flex items-center gap-3 text-sm font-medium">
          <Link to="/login" className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            Login
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            Get started — it's free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto text-center px-6 pt-20 pb-16">
        <p className="inline-block px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-5">
          Built for real people, not accountants
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
          Your money,{' '}
          <span className="text-indigo-600 dark:text-indigo-400">managed simply.</span>
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 mt-5 max-w-2xl mx-auto leading-relaxed">
          Whether you're a student, employee, freelancer, investor, or shop owner — Financial
          Companion helps you understand where your money goes, in words everyone can follow.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link
            to="/register"
            className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Create free account
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            I already have an account
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mb-3">
                <f.icon size={20} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="font-semibold">{f.title}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-6 border-t border-slate-200 dark:border-slate-800">
        Financial Companion · Your money, managed simply.
      </footer>
    </div>
  )
}
