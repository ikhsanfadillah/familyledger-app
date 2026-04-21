import { createFileRoute } from "@tanstack/solid-router";
import { For, Show, Suspense } from "solid-js";
import { useBudgets, removeBudget } from "~/stores/budget.store";
import { useCategoryMap } from "~/stores/transaction.store";
import { getCategorySpendAmount } from "~/db/queries";
import BudgetItem from "~/components/budget/BudgetItem";
import type { Budget } from "~/db/schema";
import { getMonthRange } from "~/utils/date";
import { createResource } from "solid-js";
import { setEditingBudget } from "./route";

// Helper component to resolve spend dynamically without breaking hook rules
function BudgetItemWrapper(props: {
  budget: Budget;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  onEdit: (b: Budget) => void;
  onDelete: (id: string) => void;
}) {
  // Determine start/end of current period. For simplicity, assume current month.
  const now = new Date();
  const range = getMonthRange(now.getFullYear(), now.getMonth() + 1);

  const [spend] = createResource(
    () => props.budget,
    (b) => getCategorySpendAmount(b.categoryId, range.start, range.end),
  );

  return (
    <BudgetItem
      budget={props.budget}
      categoryName={props.categoryName}
      categoryIcon={props.categoryIcon}
      categoryColor={props.categoryColor}
      amountSpent={spend() ?? 0}
      onEdit={props.onEdit}
      onDelete={props.onDelete}
    />
  );
}

function BudgetsPage() {
  const budgets = useBudgets();
  const categoryMap = useCategoryMap();

  function handleEdit(b: Budget) {
    setEditingBudget(b);
  }

  async function handleDelete(id: string) {
    if (confirm("Hapus anggaran ini?")) {
      await removeBudget(id);
    }
  }

  return (
    <div>
      {/* Header */}
      <div class="flex items-center gap-2 mb-5">
        <div class="i-lucide-wallet text-primary-500 text-xl" />
        <h1 class="text-xl font-bold text-gray-900">Anggaran</h1>
      </div>

      {/* List */}
      <Suspense
        fallback={
          <div class="text-center py-12">
            <div class="i-lucide-loader-2 text-3xl text-primary-300 animate-spin mx-auto mb-3" />
            <p class="text-sm text-gray-400">Memuat...</p>
          </div>
        }
      >
        <Show
          when={budgets() && budgets()!.length > 0}
          fallback={
            <div class="text-center py-16">
              <div
                class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ "background-color": "#EFF6FF" }}
              >
                <div class="i-lucide-wallet text-3xl text-primary-400" />
              </div>
              <p class="text-sm font-medium text-gray-500">Belum ada anggaran</p>
              <p class="text-xs text-gray-300 mt-1">
                Tekan tombol <span class="text-primary-400 font-bold">+</span> untuk menambah
              </p>
            </div>
          }
        >
          <div class="flex flex-col">
            <For each={budgets()}>
              {(budget) => {
                const catInfo = categoryMap()?.get(budget.categoryId);
                return (
                  <BudgetItemWrapper
                    budget={budget}
                    categoryName={catInfo?.name ?? "Lainnya"}
                    categoryIcon={catInfo?.icon ?? "📦"}
                    categoryColor={catInfo?.color ?? "#95A5A6"}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                );
              }}
            </For>
          </div>
        </Show>
      </Suspense>
    </div>
  );
}

export const Route = createFileRoute("/(protected)/budgets")({
  component: BudgetsPage,
});
