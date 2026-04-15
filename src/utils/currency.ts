/**
 * Format an integer amount as a localized currency string.
 * IDR has no decimal subdivision — amounts are stored as integer rupiah.
 */
export function formatCurrency(
  amount: number,
  currency = 'IDR',
  locale = 'id-ID',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format with sign prefix for display:
 *  income  → "+Rp 500.000"
 *  expense → "-Rp 500.000"
 */
export function formatSignedCurrency(
  amount: number,
  type: 'income' | 'expense',
  currency = 'IDR',
): string {
  const formatted = formatCurrency(amount, currency)
  return type === 'income' ? `+${formatted}` : `-${formatted}`
}
