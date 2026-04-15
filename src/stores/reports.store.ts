import { createSignal, createResource } from 'solid-js'
import {
  getMonthlyTotals,
  getCategoryTotals,
  type MonthlyTotals,
  type CategoryTotal,
} from '~/db/queries'
import { getMonthRange } from '~/utils/date'

// ── Selected month ──────────────────────────────────────────────────────

const now = new Date()
const [selectedYear, setSelectedYear] = createSignal(now.getFullYear())
const [selectedMonth, setSelectedMonth] = createSignal(now.getMonth() + 1)

export { selectedYear, selectedMonth }

export function goToPreviousMonth() {
  if (selectedMonth() === 1) {
    setSelectedMonth(12)
    setSelectedYear((y) => y - 1)
  } else {
    setSelectedMonth((m) => m - 1)
  }
}

export function goToNextMonth() {
  if (selectedMonth() === 12) {
    setSelectedMonth(1)
    setSelectedYear((y) => y + 1)
  } else {
    setSelectedMonth((m) => m + 1)
  }
}

// ── Report data ─────────────────────────────────────────────────────────

export function useReportTotals() {
  const [totals] = createResource(
    () => ({ year: selectedYear(), month: selectedMonth() }),
    async ({ year, month }) => {
      const range = getMonthRange(year, month)
      return getMonthlyTotals(range.start, range.end)
    },
  )
  return totals
}

export function usePreviousMonthTotals() {
  const [totals] = createResource(
    () => ({ year: selectedYear(), month: selectedMonth() }),
    async ({ year, month }) => {
      // Get previous month
      const prevMonth = month === 1 ? 12 : month - 1
      const prevYear = month === 1 ? year - 1 : year
      const range = getMonthRange(prevYear, prevMonth)
      return getMonthlyTotals(range.start, range.end)
    },
  )
  return totals
}

export function useReportCategoryTotals() {
  const [totals] = createResource(
    () => ({ year: selectedYear(), month: selectedMonth() }),
    async ({ year, month }) => {
      const range = getMonthRange(year, month)
      return getCategoryTotals(range.start, range.end, 'expense')
    },
  )
  return totals
}
