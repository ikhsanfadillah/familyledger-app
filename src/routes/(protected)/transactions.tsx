import { createFileRoute } from "@tanstack/solid-router";
import { Show, For, Suspense, createSignal, createMemo } from "solid-js";
import {
  useTransactions,
  useCategoryMap,
  useCategories,
  groupByDate,
  removeTransaction,
} from "~/stores/transaction.store";
import TransactionItem from "~/components/transaction/TransactionItem";
import { formatDateLabel } from "~/utils/date";
import { formatCurrency } from "~/utils/currency";
import type { Transaction, Category } from "~/db/schema";
import { setEditingTransaction } from "./route";
import { cn } from "tailwind-variants";

function TransactionsPage() {
  const transactions = useTransactions();
  const categoryMap = useCategoryMap();

  // ── Filters ─────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = createSignal("");
  const [filterType, setFilterType] = createSignal<
    "all" | "income" | "expense"
  >("all");
  const [filterCategoryId, setFilterCategoryId] = createSignal<string | null>(
    null,
  );
  const [showFilters, setShowFilters] = createSignal(false);
  const allCategories = useCategories();
  console.log("allCategories()", allCategories());

  const filtered = createMemo(() => {
    let txs = transactions() ?? [];
    const query = searchQuery().toLowerCase().trim();
    const type = filterType();
    const catId = filterCategoryId();

    if (query) {
      txs = txs.filter((tx) => tx.note.toLowerCase().includes(query));
    }
    if (type !== "all") {
      txs = txs.filter((tx) => tx.type === type);
    }
    if (catId) {
      txs = txs.filter((tx) => tx.categoryId === catId);
    }
    return txs;
  });

  const groups = () => groupByDate(filtered());

  const isFiltering = createMemo(
    () =>
      searchQuery().trim() !== "" ||
      filterType() !== "all" ||
      filterCategoryId() !== null,
  );

  // ── Actions ─────────────────────────────────────────────────────────

  function handleEdit(tx: Transaction) {
    setEditingTransaction(tx);
  }

  async function handleDelete(id: string) {
    await removeTransaction(id);
  }

  return (
    <div>
      {/* Header */}
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <div class="i-lucide-receipt-text text-primary-500 text-xl" />
          <h1 class="text-xl font-bold text-gray-900">Transaksi</h1>
        </div>
        <button
          type="button"
          class={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
            showFilters()
              ? "text-primary bg-gray-100"
              : "text-muted-foregroun bg-transparent",
          )}
          onClick={() => setShowFilters(!showFilters())}
          aria-label="Toggle filter"
        >
          <div class="i-lucide-sliders-horizontal text-lg" />
        </button>
      </div>

      {/* Search + Filters */}
      <Show when={showFilters()}>
        <div class="flex flex-col gap-3 mb-4 animate-fade-in">
          {/* Search */}
          <div class="relative">
            <div class="i-lucide-search text-gray-300 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari catatan..."
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
              class="w-full py-2.5 pl-9 pr-4 rounded-xl border border-gray-200 outline-none text-sm transition-all focus:border-primary-300 bg-white"
            />
          </div>

          {/* Type filter */}
          <div class="flex gap-2">
            {(
              [
                { value: "all", label: "Semua" },
                { value: "expense", label: "Pengeluaran" },
                { value: "income", label: "Pemasukan" },
              ] as const
            ).map((opt) => (
              <button
                type="button"
                class={cn(
                  "flex-1 py-2 rounded-lg text-xs font-semibold transition-all",
                  filterType() === opt.value
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600",
                )}
                onClick={() => setFilterType(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Category chips */}
          <div class="flex flex-wrap gap-1.5">
            <button
              type="button"
              class={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                filterCategoryId() === null
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600",
              )}
              onClick={() => setFilterCategoryId(null)}
            >
              Semua
            </button>
            <For each={allCategories() ?? []}>
              {(cat: Category) => (
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1"
                  style={{
                    "background-color":
                      filterCategoryId() === cat.id
                        ? cat.color + "20"
                        : "#F3F4F6",
                    color:
                      filterCategoryId() === cat.id ? cat.color : "#6B7280",
                    border:
                      filterCategoryId() === cat.id
                        ? `1px solid ${cat.color}40`
                        : "1px solid transparent",
                  }}
                  onClick={() =>
                    setFilterCategoryId(
                      filterCategoryId() === cat.id ? null : cat.id,
                    )
                  }
                >
                  <span>{cat.icon}</span>
                  {cat.name}
                </button>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* Result count when filtering */}
      <Show when={isFiltering()}>
        <p class="text-xs text-gray-400 mb-3 px-1">
          {filtered().length} transaksi ditemukan
        </p>
      </Show>

      <Suspense
        fallback={
          <div class="text-center py-12">
            <div class="i-lucide-loader-2 text-3xl text-primary-300 animate-spin mx-auto mb-3" />
            <p class="text-sm text-gray-400">Memuat...</p>
          </div>
        }
      >
        <Show
          when={groups().length > 0}
          fallback={
            <div class="text-center py-16">
              <div
                class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ "background-color": "#EFF6FF" }}
              >
                <div class="i-lucide-receipt text-3xl text-primary-400" />
              </div>
              <p class="text-sm font-medium text-gray-500">
                {isFiltering() ? "Tidak ada hasil" : "Belum ada transaksi"}
              </p>
              <Show when={!isFiltering()}>
                <p class="text-xs text-gray-300 mt-1">
                  Tekan tombol <span class="text-primary-400 font-bold">+</span>{" "}
                  untuk menambah
                </p>
              </Show>
            </div>
          }
        >
          <div class="flex flex-col gap-4">
            <For each={groups()}>
              {(group) => {
                const catMap = categoryMap();
                return (
                  <div>
                    {/* Date header */}
                    <div class="flex items-center justify-between mb-2 px-1">
                      <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        {formatDateLabel(group.date)}
                      </span>
                      <span
                        class="text-xs font-bold tabular-nums px-2 py-0.5 rounded-full"
                        style={{
                          color: group.total >= 0 ? "#10B981" : "#EF4444",
                          "background-color":
                            group.total >= 0 ? "#ECFDF5" : "#FEF2F2",
                        }}
                      >
                        {group.total >= 0 ? "+" : ""}
                        {formatCurrency(group.total)}
                      </span>
                    </div>

                    {/* Transaction items */}
                    <div
                      class="bg-white rounded-2xl overflow-hidden border border-gray-100"
                      style={{ "box-shadow": "0 1px 3px rgba(0,0,0,0.04)" }}
                      role="list"
                    >
                      <For each={group.transactions}>
                        {(tx) => {
                          const cat = catMap?.get(tx.categoryId);
                          return (
                            <TransactionItem
                              transaction={tx}
                              categoryName={cat?.name ?? "Lainnya"}
                              categoryIcon={cat?.icon ?? "📦"}
                              categoryColor={cat?.color ?? "#95A5A6"}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                            />
                          );
                        }}
                      </For>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </Show>
      </Suspense>
    </div>
  );
}

export const Route = createFileRoute("/(protected)/transactions")({
  component: TransactionsPage,
});
