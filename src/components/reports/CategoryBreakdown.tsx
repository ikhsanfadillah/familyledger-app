import type { Component } from 'solid-js'
import { For, Show } from 'solid-js'
import type { CategoryTotal } from '~/db/queries'
import { formatCurrency } from '~/utils/currency'

interface Props {
  data: CategoryTotal[] | undefined
}

const CategoryBreakdown: Component<Props> = (props) => {
  return (
    <div class="flex flex-col gap-2">
      <Show when={!props.data || props.data.length === 0}>
        <p class="text-sm text-gray-400 text-center py-4">Belum ada data</p>
      </Show>
      <For each={props.data ?? []}>
        {(cat) => (
          <div class="flex items-center gap-3 py-2">
            {/* Icon */}
            <div
              class="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ 'background-color': cat.color + '15' }}
            >
              {cat.icon}
            </div>

            {/* Name + progress bar */}
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-medium text-gray-700 truncate">
                  {cat.name}
                </span>
                <span class="text-xs font-bold text-gray-500 tabular-nums ml-2">
                  {cat.percentage.toFixed(1)}%
                </span>
              </div>
              <div
                class="h-1.5 rounded-full overflow-hidden"
                style={{ 'background-color': '#F3F4F6' }}
              >
                <div
                  class="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, cat.percentage)}%`,
                    'background-color': cat.color,
                  }}
                />
              </div>
            </div>

            {/* Amount */}
            <span class="text-sm font-bold text-gray-800 tabular-nums flex-shrink-0 ml-1">
              {formatCurrency(cat.amount)}
            </span>
          </div>
        )}
      </For>
    </div>
  )
}

export default CategoryBreakdown
