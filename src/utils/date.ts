import {
  format,
  isToday,
  isYesterday,
  parseISO,
  startOfMonth,
  endOfMonth,
  subDays,
} from 'date-fns'
import { id } from 'date-fns/locale'

/**
 * Format an ISO date string (YYYY-MM-DD) into a human-friendly label.
 * "Hari ini", "Kemarin", or "Senin, 7 Apr 2026"
 */
export function formatDateLabel(dateStr: string): string {
  if (typeof dateStr !== 'string') return String(dateStr)
  const date = parseISO(dateStr)
  if (isNaN(date.getTime())) return dateStr
  if (isToday(date)) return 'Hari ini'
  if (isYesterday(date)) return 'Kemarin'
  return format(date, 'EEEE, d MMM yyyy', { locale: id })
}

/**
 * Get today's date as YYYY-MM-DD string.
 */
export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

/**
 * Get start/end date strings for a given month.
 * @returns { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }
 */
export function getMonthRange(
  year: number,
  month: number,
): { start: string; end: string } {
  const date = new Date(year, month - 1, 1)
  return {
    start: format(startOfMonth(date), 'yyyy-MM-dd'),
    end: format(endOfMonth(date), 'yyyy-MM-dd'),
  }
}

/**
 * Time-based Indonesian greeting.
 */
export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 18) return 'Selamat sore'
  return 'Selamat malam'
}

/**
 * Format a year/month into a human-readable label like "April 2026".
 */
export function formatMonthYear(year: number, month: number): string {
  const date = new Date(year, month - 1, 1)
  return format(date, 'MMMM yyyy', { locale: id })
}

/**
 * Get an array of the last N days as ISO date strings (most recent last).
 */
export function getLastNDays(n = 7): string[] {
  const today = new Date()
  const days: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    days.push(format(subDays(today, i), 'yyyy-MM-dd'))
  }
  return days
}

/**
 * Short day label for chart axes: "Sen", "Sel", "Rab", ...
 */
export function shortDayLabel(dateStr: string): string {
  const date = parseISO(dateStr)
  if (isToday(date)) return 'Hari ini'
  return format(date, 'EEE', { locale: id })
}
