import { forwardRef } from 'react'
import { cn } from '../../utils/cn'

const Input = forwardRef(function Input(
  { label, error, icon: Icon, className, id, ...props },
  ref,
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-lg border bg-white px-3 py-2 text-sm placeholder-slate-400',
            'border-slate-300 dark:border-slate-600 dark:bg-slate-800',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
            'transition-colors',
            Icon && 'pl-9',
            error && 'border-rose-500 focus:ring-rose-500',
            className,
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  )
})

export default Input
