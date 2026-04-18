import { type Component, createSignal, onMount, Show } from "solid-js";
import type { Transaction } from "~/db/schema";
import { formatCurrency } from "~/utils/currency";
import { getDeviceMap } from "~/db/queries";

// Global cache for devices across all transaction items
const [devices, setDevices] = createSignal<Map<string, string>>(new Map());
let devicesLoaded = false;

interface Props {
  transaction: Transaction;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  onEdit?: (tx: Transaction) => void;
  onDelete?: (id: string) => void;
}

const SWIPE_THRESHOLD = 80;

const TransactionItem: Component<Props> = (props) => {
  const isIncome = () => props.transaction.type === "income";

  onMount(() => {
    if (!devicesLoaded) {
      devicesLoaded = true;
      getDeviceMap().then(setDevices);
    }
  });

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Swipe state
  const [offsetX, setOffsetX] = createSignal(0);
  const [swiping, setSwiping] = createSignal(false);
  let startX = 0;
  let startY = 0;
  let isHorizontalSwipe: boolean | null = null;

  function onTouchStart(e: TouchEvent) {
    const touch = e.touches[0]!;
    startX = touch.clientX;
    startY = touch.clientY;
    isHorizontalSwipe = null;
    setSwiping(true);
  }

  function onTouchMove(e: TouchEvent) {
    if (!swiping()) return;
    const touch = e.touches[0]!;
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;

    // Determine swipe direction on first significant movement
    if (isHorizontalSwipe === null) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        isHorizontalSwipe = Math.abs(dx) > Math.abs(dy);
      }
      return;
    }

    if (!isHorizontalSwipe) return;

    e.preventDefault();
    // Only allow left swipe (negative), clamp
    const clamped = Math.min(0, Math.max(-120, dx));
    setOffsetX(clamped);
  }

  function onTouchEnd() {
    setSwiping(false);
    if (Math.abs(offsetX()) >= SWIPE_THRESHOLD) {
      // Stay open to show delete button
      setOffsetX(-SWIPE_THRESHOLD);
    } else {
      setOffsetX(0);
    }
    isHorizontalSwipe = null;
  }

  function handleDelete() {
    props.onDelete?.(props.transaction.id);
    setOffsetX(0);
  }

  function handleClick() {
    // Don't trigger edit if swiped
    if (Math.abs(offsetX()) > 5) return;
    props.onEdit?.(props.transaction);
  }

  return (
    <div class="relative overflow-hidden" role="listitem">
      {/* Delete button behind */}
      <div
        class="absolute inset-y-0 right-0 flex items-center justify-center"
        style={{
          width: `${SWIPE_THRESHOLD}px`,
          background: "linear-gradient(135deg, #EF4444, #DC2626)",
        }}
      >
        <button
          type="button"
          class="flex flex-col items-center gap-0.5 text-white"
          onClick={handleDelete}
        >
          <div class="i-lucide-trash-2 text-lg" />
          <span style={{ "font-size": "0.6rem", "font-weight": "600" }}>Hapus</span>
        </button>
      </div>

      {/* Main content (slides) */}
      <div
        class="flex items-center gap-3 py-3.5 px-3 bg-white cursor-pointer active:bg-gray-50/80"
        style={{
          transform: `translateX(${offsetX()}px)`,
          transition: swiping() ? "none" : "transform 0.25s ease-out",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={handleClick}
      >
        {/* Category icon */}
        <div
          class="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-xl"
          style={{
            "background-color": props.categoryColor + "15",
          }}
        >
          {props.categoryIcon}
        </div>

        {/* Details */}
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold text-gray-800 truncate">{props.categoryName}</div>
          {props.transaction.note && (
            <div class="text-xs text-gray-600 truncate mt-0.5">{props.transaction.note}</div>
          )}
          <div class="text-[0.65rem] text-gray-400 mt-1.5 flex flex-col gap-0.5 leading-tight">
            <span>
              Dibuat: {formatDate(props.transaction.createdAt)} oleh{" "}
              {devices().get(props.transaction.deviceId) ?? "..."}
            </span>
            <Show when={props.transaction.updatedAt !== props.transaction.createdAt}>
              <span>Diedit: {formatDate(props.transaction.updatedAt)}</span>
            </Show>
          </div>
        </div>

        {/* Amount */}
        <div
          class="flex-shrink-0 text-sm font-bold tabular-nums"
          style={{
            color: isIncome() ? "#10B981" : "#374151",
          }}
        >
          {isIncome() ? "+" : "-"}
          {formatCurrency(props.transaction.amount)}
        </div>
      </div>
    </div>
  );
};

export default TransactionItem;
