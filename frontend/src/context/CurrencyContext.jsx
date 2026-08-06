import { createContext, useCallback, useContext } from 'react'
import { formatMoney } from '../utils/formatters'

const CurrencyContext = createContext(null)

/**
 * Multi-currency context.
 *
 * Phase 3: hardcoded INR default. Phase 4 wires this to the user's
 * settings API response so each person sees their chosen display currency.
 */
export function CurrencyProvider({ children }) {
  // Phase 4: read currency from authenticated user settings
  const currencyCode = 'INR'

  const format = useCallback(
    (amount, code) => formatMoney(amount, code || currencyCode),
    [currencyCode],
  )

  return (
    <CurrencyContext.Provider value={{ currencyCode, formatMoney: format }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within <CurrencyProvider>')
  return ctx
}
