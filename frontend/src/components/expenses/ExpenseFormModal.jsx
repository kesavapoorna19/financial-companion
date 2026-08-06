import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { ArrowUpCircle } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import expenseService from '../../services/expenseService'
import { CURRENCIES, PAYMENT_METHODS, RECURRING_FREQUENCIES } from '../../constants'
import { todayLocal } from '../../utils/formatters'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import Spinner from '../ui/Spinner'
import { cn } from '../../utils/cn'

export default function ExpenseFormModal({ open, onClose, expense, categories, onSaved }) {
  const toast = useToast()
  const isEdit = Boolean(expense)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm()

  const isRecurring = watch('is_recurring')

  useEffect(() => {
    if (open) {
      setError(null)
      reset({
        title: expense?.title || '',
        amount: expense?.amount || '',
        currency_code: expense?.currency_code || 'INR',
        expense_date: expense?.expense_date || todayLocal(),
        category_id: expense?.category_id || categories[0]?.id || '',
        payment_method: expense?.payment_method || 'cash',
        merchant: expense?.merchant || '',
        is_recurring: expense?.is_recurring ?? false,
        recurring_frequency: expense?.recurring_frequency || 'monthly',
        notes: expense?.notes || '',
      })
    }
  }, [open, expense, reset, categories])

  const onSubmit = async (values) => {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        title: values.title.trim(),
        amount: parseFloat(values.amount),
        currency_code: values.currency_code,
        expense_date: values.expense_date,
        category_id: values.category_id || null,
        payment_method: values.payment_method,
        merchant: values.merchant?.trim() || null,
        is_recurring: Boolean(values.is_recurring),
        recurring_frequency: values.is_recurring ? values.recurring_frequency : null,
        notes: values.notes?.trim() || null,
      }
      if (isEdit) {
        await expenseService.update(expense.id, payload)
        toast.success('Expense updated')
      } else {
        await expenseService.create(payload)
        toast.success('Expense added')
      }
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to save expense')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Expense' : 'Add Expense'}>
      {error && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-xs text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Title"
          placeholder="e.g. Groceries, Rent, Electricity bill"
          error={errors.title?.message}
          {...register('title', { required: 'Title is required' })}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0"
            error={errors.amount?.message}
            {...register('amount', { required: 'Amount is required', min: { value: 0.01, message: 'Must be greater than 0' } })}
          />
          <Select
            label="Currency"
            options={CURRENCIES}
            {...register('currency_code', { required: 'Currency is required' })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date"
            type="date"
            error={errors.expense_date?.message}
            {...register('expense_date', { required: 'Date is required' })}
          />
          <Select
            label="Category"
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Select category"
            {...register('category_id')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Payment Method"
            options={PAYMENT_METHODS}
            {...register('payment_method', { required: 'Payment method is required' })}
          />
          <Input
            label="Merchant"
            placeholder="e.g. Big Bazaar"
            {...register('merchant')}
          />
        </div>

        {/* Recurring toggle */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-600 px-3 py-2.5">
          <div>
            <p className="text-sm font-medium">Recurring expense</p>
            <p className="text-xs text-slate-400">Rent, subscriptions, bills that repeat</p>
          </div>
          <input type="checkbox" className="hidden" {...register('is_recurring')} />
          <button
            type="button"
            onClick={() => setValue('is_recurring', !isRecurring, { shouldValidate: true })}
            className={cn(
              'w-11 h-6 rounded-full relative transition-colors',
              isRecurring ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all',
                isRecurring ? 'left-[22px]' : 'left-0.5',
              )}
            />
          </button>
        </div>

        {isRecurring && (
          <Select
            label="Recurring Frequency"
            options={RECURRING_FREQUENCIES}
            {...register('recurring_frequency', { required: 'Choose a frequency' })}
          />
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Notes
          </label>
          <textarea
            rows={3}
            placeholder="Add any notes about this expense (optional)"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors resize-none"
            {...register('notes')}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <><ArrowUpCircle size={16} /> {isEdit ? 'Update' : 'Add'} Expense</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
