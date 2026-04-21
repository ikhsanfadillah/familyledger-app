import type { Component } from "solid-js";
import type { MonthlyTotals } from "~/db/queries";
import { formatCurrency } from "~/utils/currency";

interface Props {
  totals: MonthlyTotals | undefined;
}

const BalanceCard: Component<Props> = (props) => {
  const balance = () => props.totals?.balance ?? 0;
  const income = () => props.totals?.income ?? 0;
  const expense = () => props.totals?.expense ?? 0;

  return (
    <div
      class="relative overflow-hidden rounded p-5 text-white bg-linear-to-br from-primary to-primary/80"
      style={{
        "box-shadow": "0 12px 40px rgba(59, 130, 246, 0.35)",
      }}
    >
      {/* Glass circles for decoration */}
      <div
        class="absolute -top-8 -right-8 w-32 h-32 rounded-full"
        style={{
          background: "rgba(255,255,255,0.08)",
        }}
      />
      <div
        class="absolute -bottom-6 -left-6 w-24 h-24 rounded-full"
        style={{
          background: "rgba(255,255,255,0.06)",
        }}
      />

      {/* Balance */}
      <div class="relative z-10">
        <p class="text-xs font-medium tracking-wide" style={{ color: "rgba(255,255,255,0.7)" }}>
          Saldo Bulan Ini
        </p>
        <p
          class="text-3xl font-extrabold mt-1 tabular-nums"
          style={{ "text-shadow": "0 2px 8px rgba(0,0,0,0.15)" }}
        >
          {formatCurrency(balance())}
        </p>
      </div>

      {/* Income / Expense row */}
      <div class="relative z-10 flex gap-4 mt-5">
        {/* Income */}
        <div
          class="flex-1 flex items-center gap-2.5 py-2.5 px-3 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.12)",
            "backdrop-filter": "blur(8px)",
          }}
        >
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(16, 185, 129, 0.3)" }}
          >
            <div class="i-lucide-trending-up text-base" style={{ color: "#6EE7B7" }} />
          </div>
          <div>
            <p class="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
              Pemasukan
            </p>
            <p class="text-sm font-bold tabular-nums">{formatCurrency(income())}</p>
          </div>
        </div>

        {/* Expense */}
        <div
          class="flex-1 flex items-center gap-2.5 py-2.5 px-3 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.12)",
            "backdrop-filter": "blur(8px)",
          }}
        >
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(239, 68, 68, 0.3)" }}
          >
            <div class="i-lucide-trending-down text-base" style={{ color: "#FCA5A5" }} />
          </div>
          <div>
            <p class="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
              Pengeluaran
            </p>
            <p class="text-sm font-bold tabular-nums">{formatCurrency(expense())}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
