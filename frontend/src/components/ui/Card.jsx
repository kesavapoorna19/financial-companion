import { cn } from '../../utils/cn'

export default function Card({ title, subtitle, action, icon: Icon, className, children }) {
  const hasHeader = title || action

  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-card',
        className,
      )}
    >
      {hasHeader && (
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            {Icon && (
              <span className="mt-0.5 shrink-0 text-slate-400">
                <Icon size={18} />
              </span>
            )}
            <div className="min-w-0">
              {title && <p className="font-semibold text-slate-800 dark:text-slate-100">{title}</p>}
              {subtitle && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
