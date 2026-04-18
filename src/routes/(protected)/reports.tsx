import { createFileRoute } from "@tanstack/solid-router";
import { Show, Suspense } from "solid-js";
import {
  selectedYear,
  selectedMonth,
  goToPreviousMonth,
  goToNextMonth,
  useReportTotals,
  usePreviousMonthTotals,
  useReportCategoryTotals,
} from "~/stores/reports.store";
import { formatMonthYear } from "~/utils/date";
import { formatCurrency } from "~/utils/currency";
import DonutChart from "~/components/reports/DonutChart";
import CategoryBreakdown from "~/components/reports/CategoryBreakdown";
import MonthComparison from "~/components/reports/MonthComparison";

function ReportsPage() {
  const totals = useReportTotals();
  const prevTotals = usePreviousMonthTotals();
  const categoryTotals = useReportCategoryTotals();

  return (
    <div class="flex flex-col gap-5">
      {/* Header */}
      <div class="flex items-center gap-2">
        <div class="i-lucide-bar-chart-3 text-primary-500 text-xl" />
        <h1 class="text-xl font-bold text-gray-900">Laporan</h1>
      </div>

      {/* Month selector */}
      <div
        class="flex items-center justify-between bg-white rounded-2xl px-4 py-3 border border-gray-100"
        style={{ "box-shadow": "0 1px 3px rgba(0,0,0,0.04)" }}
      >
        <button
          type="button"
          class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-100"
          onClick={goToPreviousMonth}
        >
          <div class="i-lucide-chevron-left text-gray-500" />
        </button>
        <span class="text-sm font-semibold text-gray-700 capitalize">
          {formatMonthYear(selectedYear(), selectedMonth())}
        </span>
        <button
          type="button"
          class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-100"
          onClick={goToNextMonth}
        >
          <div class="i-lucide-chevron-right text-gray-500" />
        </button>
      </div>

      <Suspense
        fallback={
          <div class="text-center py-12">
            <div class="i-lucide-loader-2 text-3xl text-primary-300 animate-spin mx-auto mb-3" />
            <p class="text-sm text-gray-400">Memuat laporan...</p>
          </div>
        }
      >
        {/* Monthly summary */}
        <div class="card p-4">
          <div class="grid grid-cols-3 gap-3 text-center">
            <div>
              <p class="text-xs text-gray-400">Pemasukan</p>
              <p class="text-sm font-bold tabular-nums" style={{ color: "#10B981" }}>
                {formatCurrency(totals()?.income ?? 0)}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Pengeluaran</p>
              <p class="text-sm font-bold tabular-nums" style={{ color: "#EF4444" }}>
                {formatCurrency(totals()?.expense ?? 0)}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Saldo</p>
              <p
                class="text-sm font-bold tabular-nums"
                style={{
                  color: (totals()?.balance ?? 0) >= 0 ? "#10B981" : "#EF4444",
                }}
              >
                {formatCurrency(totals()?.balance ?? 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Donut chart */}
        <Show
          when={categoryTotals() && categoryTotals()!.length > 0}
          fallback={
            <div class="card p-6 text-center">
              <div class="i-lucide-pie-chart text-3xl text-gray-200 mx-auto mb-2" />
              <p class="text-sm text-gray-400">Belum ada pengeluaran</p>
            </div>
          }
        >
          <div class="card p-5">
            <h2 class="text-sm font-semibold text-gray-700 mb-4">Pengeluaran per Kategori</h2>
            <DonutChart data={categoryTotals()} totalExpense={totals()?.expense ?? 0} />
            <div class="mt-5">
              <CategoryBreakdown data={categoryTotals()} />
            </div>
          </div>
        </Show>

        {/* Month comparison */}
        <div class="card p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-4">Perbandingan Bulan</h2>
          <MonthComparison current={totals()} previous={prevTotals()} />
        </div>
      </Suspense>
    </div>
  );
}

export const Route = createFileRoute("/(protected)/reports")({
  component: ReportsPage,
});
