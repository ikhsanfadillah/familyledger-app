import type { Component } from 'solid-js'
import { Show } from 'solid-js'
import type { MonthlyTotals } from '~/db/queries'
import { formatCurrency } from '~/utils/currency'

interface Props {
  current: MonthlyTotals | undefined
  previous: MonthlyTotals | undefined
}

function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

const MonthComparison: Component<Props> = (props) => {
  const incomeChange = () =>
    percentChange(props.current?.income ?? 0, props.previous?.income ?? 0)
  const expenseChange = () =>
    percentChange(props.current?.expense ?? 0, props.previous?.expense ?? 0)

  const maxValue = () => {
    const vals = [
      props.current?.income ?? 0,
      props.current?.expense ?? 0,
      props.previous?.income ?? 0,
      props.previous?.expense ?? 0,
    ]
    return Math.max(...vals, 1) // avoid 0 division
  }

  function barWidth(value: number): string {
    return `${Math.max(4, (value / maxValue()) * 100)}%`
  }

  return (
    <div class="flex flex-col gap-4">
      {/* Income comparison */}
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-600">Pemasukan</span>
          <ChangeIndicator value={incomeChange()} inverted={false} />
        </div>
        <div class="flex flex-col gap-1.5">
          <BarRow
            label="Bulan ini"
            value={props.current?.income ?? 0}
            width={barWidth(props.current?.income ?? 0)}
            color="#10B981"
          />
          <BarRow
            label="Bulan lalu"
            value={props.previous?.income ?? 0}
            width={barWidth(props.previous?.income ?? 0)}
            color="#10B98140"
          />
        </div>
      </div>

      {/* Expense comparison */}
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-600">Pengeluaran</span>
          <ChangeIndicator value={expenseChange()} inverted={true} />
        </div>
        <div class="flex flex-col gap-1.5">
          <BarRow
            label="Bulan ini"
            value={props.current?.expense ?? 0}
            width={barWidth(props.current?.expense ?? 0)}
            color="#EF4444"
          />
          <BarRow
            label="Bulan lalu"
            value={props.previous?.expense ?? 0}
            width={barWidth(props.previous?.expense ?? 0)}
            color="#EF444440"
          />
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────

const BarRow: Component<{
  label: string
  value: number
  width: string
  color: string
}> = (props) => (
  <div class="flex items-center gap-2">
    <span class="text-xs text-gray-400 w-16 flex-shrink-0">{props.label}</span>
    <div class="flex-1 h-3 rounded-full overflow-hidden bg-gray-100">
      <div
        class="h-full rounded-full transition-all"
        style={{
          width: props.width,
          'background-color': props.color,
        }}
      />
    </div>
    <span class="text-xs font-bold text-gray-600 tabular-nums w-24 text-right flex-shrink-0">
      {formatCurrency(props.value)}
    </span>
  </div>
)

const ChangeIndicator: Component<{
  value: number
  /** When true, positive change is bad (expense went up) */
  inverted: boolean
}> = (props) => {
  const isPositive = () => props.value > 0
  const isGood = () => (props.inverted ? !isPositive() : isPositive())

  return (
    <Show when={props.value !== 0}>
      <span
        class="text-xs font-bold flex items-center gap-0.5 px-2 py-0.5 rounded-full"
        style={{
          color: isGood() ? '#10B981' : '#EF4444',
          'background-color': isGood() ? '#ECFDF5' : '#FEF2F2',
        }}
      >
        <div
          class={isPositive() ? 'i-lucide-trending-up' : 'i-lucide-trending-down'}
          style={{ 'font-size': '0.7rem' }}
        />
        {Math.abs(props.value)}%
      </span>
    </Show>
  )
}

export default MonthComparison
