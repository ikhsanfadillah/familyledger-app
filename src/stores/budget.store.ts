import { createResource, onCleanup } from 'solid-js'
import { liveQuery } from 'dexie'
import {
  getBudgets,
  addBudget,
  updateBudget,
  deleteBudget,
  type BudgetInput,
  getCategorySpendAmount,
} from '~/db/queries'

// ── Live Query Helper ──────────────────────────────────────────────────
// Bridges Dexie liveQuery (Observable) to Solid signal.
function fromLiveQuery<T>(querier: () => T | Promise<T>) {
  const [data, { mutate }] = createResource(async () => {
    return await querier();
  });

  const subscription = liveQuery(querier).subscribe({
    next: (val) => mutate(() => val),
    error: (err) => console.error("Dexie liveQuery error:", err),
  });
  onCleanup(() => subscription.unsubscribe());
  return data;
}

// ── Budget store ────────────────────────────────────────────────────────

export function useBudgets() {
  return fromLiveQuery(() => getBudgets())
}

export async function createBudget(input: BudgetInput) {
  await addBudget(input)
}

export async function editBudget(id: string, input: BudgetInput) {
  await updateBudget(id, {
    amount: input.amount,
    categoryId: input.categoryId,
    period: input.period,
    startDate: input.startDate,
  })
}

export async function removeBudget(id: string) {
  await deleteBudget(id)
}

/**
 * Hook to get real-time spending tracking for a single category over a period.
 */
export function useCategorySpend(categoryId: () => string, startDate: () => string, endDate: () => string) {
  return fromLiveQuery(() => getCategorySpendAmount(categoryId(), startDate(), endDate()))
}
