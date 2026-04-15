import { createFileRoute, Link } from "@tanstack/solid-router";
import { For, Show, Suspense } from "solid-js";
import BalanceCard from "~/components/dashboard/BalanceCard";
import SavingsRing from "~/components/dashboard/SavingsRing";
import SpendingChart from "~/components/dashboard/SpendingChart";
import TransactionItem from "~/components/transaction/TransactionItem";
import {
  useCategoryMap,
  useCurrentMonthTotals,
  useDailySpending,
  useRecentTransactions,
} from "~/stores/transaction.store";
import { formatMonthYear, getGreeting } from "~/utils/date";

export const Route = createFileRoute("/(protected)/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  const totals = useCurrentMonthTotals();
  const spending = useDailySpending(7);
  const recent = useRecentTransactions(5);
  const categoryMap = useCategoryMap();

  const now = new Date();
  const greeting = getGreeting();
  const monthLabel = formatMonthYear(now.getFullYear(), now.getMonth() + 1);

  return (
    <div class="flex flex-col gap-5">
      {/* Greeting */}
      <div>
        <h1 class="text-xl font-bold text-gray-900">{greeting} 👋</h1>
        <p class="text-sm text-gray-400 mt-0.5">{monthLabel}</p>
      </div>

      <Suspense
        fallback={
          <div class="text-center py-12">
            <div class="i-lucide-loader-2 text-3xl text-primary-300 animate-spin mx-auto mb-3" />
            <p class="text-sm text-gray-400">Memuat dashboard...</p>
          </div>
        }
      >
        {/* Balance Hero Card */}
        <BalanceCard totals={totals()} />

        {/* 7-Day Spending + Savings Ring */}
        <div class="flex flex-col gap-4">
          <SpendingChart data={spending()} />
          <SavingsRing totals={totals()} />
        </div>

        {/* Recent Transactions */}
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-semibold text-gray-700">
              Transaksi Terbaru
            </span>
            <Link
              to="/transactions"
              class="text-xs font-semibold no-underline flex items-center gap-1 text-primary"
            >
              Lihat semua
              <div class="i-lucide-chevron-right text-xs" />
            </Link>
          </div>

          <Show
            when={recent() && recent()!.length > 0}
            fallback={
              <div class="card p-6 text-center">
                <div
                  class="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ "background-color": "#EFF6FF" }}
                >
                  <div class="i-lucide-receipt text-2xl text-primary-400" />
                </div>
                <p class="text-sm text-gray-400">Belum ada transaksi</p>
              </div>
            }
          >
            <div
              class="bg-white rounded-2xl overflow-hidden border border-gray-100"
              style={{ "box-shadow": "0 1px 3px rgba(0,0,0,0.04)" }}
              role="list"
            >
              <For each={recent()}>
                {(tx) => {
                  const catMap = categoryMap();
                  const cat = catMap?.get(tx.categoryId);
                  return (
                    <TransactionItem
                      transaction={tx}
                      categoryName={cat?.name ?? "Lainnya"}
                      categoryIcon={cat?.icon ?? "📦"}
                      categoryColor={cat?.color ?? "#95A5A6"}
                    />
                  );
                }}
              </For>
            </div>
          </Show>
        </div>
      </Suspense>
    </div>
  );
}
