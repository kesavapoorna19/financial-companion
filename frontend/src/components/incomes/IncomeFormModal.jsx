import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { ArrowDownCircle } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import incomeService from '../../services/incomeService'
import { CURRENCIES, PAYMENT_METHODS } from '../../constants'
import { todayLocal } from '../../utils/formatters'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import Spinner from '../ui/Spinner'

export default function IncomeFormModal({ open, onClose, income, categories, onSaved }) {
  const toast = useToast()
  const isEdit = Boolean(income)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  useEffect(() => {
    if (open) {
      setError(null)
      reset({
        title: income?.title || '',
        amount: income?.amount || '',
        currency_code: income?.currency_code || 'INR',
        income_date: income?.income_date || todayLocal(),
        category_id: income?.category_id || categories[0]?.id || '',
        payment_method: income?.payment_method || 'cash',
        notes: income?.notes || '',
      })
    }
  }, [open, income, reset, categories])

  const onSubmit = async (values) => {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        title: values.title.trim(),
        amount: parseFloat(values.amount),
        currency_code: values.currency_code,
        income_date: values.income_date,
        category_id: values.category_id || null,
        payment_method: values.payment_method,
        notes: values.notes.trim() || null,
      }
      if (isEdit) {
        await incomeService.update(income.id, payload)
        toast.success('Income updated')
      } else {
        await incomeService.create(payload)
        toast.success('Income added')
      }
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to save income')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Income' : 'Add Income'}>
      {error && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-xs text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Title"
          placeholder="e.g. Monthly salary, Freelance project"
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
            error={errors.income_date?.message}
            {...register('income_date', { required: 'Date is required' })}
          />
          <Select
            label="Category"
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Select category"
            {...register('category_id')}
          />
        </div>

        <Select
          label="Payment Method"
          options={PAYMENT_METHODS}
          {...register('payment_method', { required: 'Payment method is required' })}
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Notes
          </label>
          <textarea
            rows={3}
            placeholder="Add any notes about this income (optional)"
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
              <><ArrowDownCircle size={16} /> {isEdit ? 'Update' : 'Add'} Income</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
