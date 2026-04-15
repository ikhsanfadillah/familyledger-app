import { type Component, createSignal } from 'solid-js'
import type { Budget } from '~/db/schema'
import { formatCurrency } from '~/utils/currency'

interface Props {
  budget: Budget
  categoryName: string
  categoryIcon: string
  categoryColor: string
  amountSpent: number
  onEdit?: (b: Budget) => void
  onDelete?: (id: string) => void
}

const SWIPE_THRESHOLD = 80

const BudgetItem: Component<Props> = (props) => {
  // Swipe state
  const [offsetX, setOffsetX] = createSignal(0)
  const [swiping, setSwiping] = createSignal(false)
  let startX = 0
  let startY = 0
  let isHorizontalSwipe: boolean | null = null

  function onTouchStart(e: TouchEvent) {
    const touch = e.touches[0]!
    startX = touch.clientX
    startY = touch.clientY
    isHorizontalSwipe = null
    setSwiping(true)
  }

  function onTouchMove(e: TouchEvent) {
    if (!swiping()) return
    const touch = e.touches[0]!
    const dx = touch.clientX - startX
    const dy = touch.clientY - startY

    if (isHorizontalSwipe === null) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        isHorizontalSwipe = Math.abs(dx) > Math.abs(dy)
      }
      return
    }

    if (!isHorizontalSwipe) return

    e.preventDefault()
    const clamped = Math.min(0, Math.max(-120, dx))
    setOffsetX(clamped)
  }

  function onTouchEnd() {
    setSwiping(false)
    if (Math.abs(offsetX()) >= SWIPE_THRESHOLD) {
      setOffsetX(-SWIPE_THRESHOLD)
    } else {
      setOffsetX(0)
    }
    isHorizontalSwipe = null
  }

  function handleDelete() {
    props.onDelete?.(props.budget.id)
    setOffsetX(0)
  }

  function handleClick() {
    if (Math.abs(offsetX()) > 5) return
    props.onEdit?.(props.budget)
  }

  const limit = props.budget.amount
  const percent = Math.min(100, Math.max(0, (props.amountSpent / limit) * 100))
  
  const isOverBudget = props.amountSpent > limit
  const isNearLimit = percent >= 80 && !isOverBudget

  return (
    <div class="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm mb-3">
      {/* Delete button behind */}
      <div
        class="absolute inset-y-0 right-0 flex items-center justify-center rounded-r-2xl"
        style={{
          width: `${SWIPE_THRESHOLD}px`,
          background: 'linear-gradient(135deg, #EF4444, #DC2626)',
        }}
      >
        <button
          type="button"
          class="flex flex-col items-center gap-0.5 text-white"
          onClick={handleDelete}
        >
          <div class="i-lucide-trash-2 text-lg" />
          <span style={{ 'font-size': '0.6rem', 'font-weight': '600' }}>Hapus</span>
        </button>
      </div>

      {/* Main content (slides) */}
      <div
        class="bg-white cursor-pointer select-none py-4 px-4 active:bg-gray-50/80"
        style={{
          transform: `translateX(${offsetX()}px)`,
          transition: swiping() ? 'none' : 'transform 0.25s ease-out',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={handleClick}
      >
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-3">
            <div
              class="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{
                'background-color': props.categoryColor + '15',
              }}
            >
              {props.categoryIcon}
            </div>
            <div>
              <div class="text-sm font-bold text-gray-800">
                {props.categoryName}
              </div>
              <div class="text-[0.65rem] font-medium text-gray-400 capitalize">
                Anggaran {props.budget.period === 'monthly' ? 'Bulanan' : 'Mingguan'}
              </div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm font-bold text-gray-900 tabular-nums">
              {formatCurrency(props.amountSpent)}
            </div>
            <div class="text-[0.65rem] text-gray-400 tabular-nums font-medium">
              dari {formatCurrency(limit)}
            </div>
          </div>
        </div>

        {/* Progress Bar Container */}
        <div class="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden mb-1.5 relative">
          <div
            class="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${percent}%`,
              'background-color': isOverBudget
                ? '#EF4444' // Red if over
                : isNearLimit
                  ? '#F59E0B' // Orange if near
                  : props.categoryColor, // Normal category color
            }}
          />
        </div>
        
        {/* Status Text under progress bar */}
        <div class="flex justify-between items-center text-[0.65rem] font-bold">
          <span 
            style={{
              color: isOverBudget ? '#EF4444' : isNearLimit ? '#F59E0B' : '#9CA3AF'
            }}
          >
            {isOverBudget 
              ? 'Melebihi anggaran' 
              : isNearLimit 
                ? 'Hampir habis' 
                : 'Sisa anggaran'}
          </span>
          <span
            style={{
              color: isOverBudget ? '#EF4444' : '#10B981'
            }}
          >
            {isOverBudget 
              ? `-${formatCurrency(props.amountSpent - limit)}`
              : formatCurrency(limit - props.amountSpent)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default BudgetItem
