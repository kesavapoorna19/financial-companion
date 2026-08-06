/**
 * Multi-currency and date formatting helpers.
 * Uses Intl.NumberFormat so the output respects each currency's conventions
 * (e.g. Indian grouping ₹1,00,000 vs US grouping $100,000).
 */

const CURRENCY_LOCALES = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  JPY: 'ja-JP',
  AED: 'ar-AE',
  SGD: 'en-SG',
  CAD: 'en-CA',
  AUD: 'en-AU',
  MYR: 'ms-MY',
}

export function formatMoney(amount, currencyCode = 'INR') {
  const locale = CURRENCY_LOCALES[currencyCode] || 'en-IN'
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(amount))
  } catch {
    // Fallback for unknown currency codes
    return `${currencyCode} ${Number(amount).toLocaleString()}`
  }
}

export function formatDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Today's date as YYYY-MM-DD in local time (avoids toISOString UTC shifts). */
export function todayLocal() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}
