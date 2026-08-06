/**
 * Shared app constants (single source of truth for the UI).
 */

export const CURRENCIES = [
  { value: 'INR', label: '🇮🇳 INR — Indian Rupee' },
  { value: 'USD', label: '🇺🇸 USD — US Dollar' },
  { value: 'EUR', label: '🇪🇺 EUR — Euro' },
  { value: 'GBP', label: '🇬🇧 GBP — British Pound' },
  { value: 'JPY', label: '🇯🇵 JPY — Japanese Yen' },
  { value: 'AED', label: '🇦🇪 AED — UAE Dirham' },
  { value: 'SGD', label: '🇸🇬 SGD — Singapore Dollar' },
  { value: 'CAD', label: '🇨🇦 CAD — Canadian Dollar' },
  { value: 'AUD', label: '🇦🇺 AUD — Australian Dollar' },
  { value: 'MYR', label: '🇲🇾 MYR — Malaysian Ringgit' },
]

export const PAYMENT_METHODS = [
  { value: 'cash', label: '💵 Cash' },
  { value: 'bank_transfer', label: '🏦 Bank Transfer' },
  { value: 'upi', label: '📱 UPI' },
  { value: 'card', label: '💳 Card' },
  { value: 'cheque', label: '📄 Cheque' },
  { value: 'other', label: '… Other' },
]

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export const RECURRING_FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]
