import { createResource, onCleanup } from "solid-js";
import { liveQuery } from "dexie";
import {
  getTransactions,
  addTransaction,
  deleteTransaction,
  updateTransaction,
  getRecentTransactions,
  getMonthlyTotals,
  getDailySpending,
  addTransfer,
  type TransactionInput,
  type TransferInput,
  getCategoryMap,
  getCategories,
} from "~/db/queries";
import type { Transaction } from "~/db/schema";
import { getMonthRange, getLastNDays } from "~/utils/date";

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

// ── Transactions store ──────────────────────────────────────────────────

export function useTransactions() {
  return fromLiveQuery(() => getTransactions());
}

export function useCategories(type?: "income" | "expense" | "both") {
  return fromLiveQuery(() => getCategories(type));
}

export function useCategoryMap() {
  return fromLiveQuery(() => getCategoryMap());
}

// ── Recent transactions (for dashboard) ─────────────────────────────────

export function useRecentTransactions(limit = 5) {
  return fromLiveQuery(() => getRecentTransactions(limit));
}

// ── Monthly totals (for dashboard) ──────────────────────────────────────

export function useCurrentMonthTotals() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const range = getMonthRange(year, month);

  return fromLiveQuery(() => getMonthlyTotals(range.start, range.end));
}

// ── Daily spending (for 7-day chart) ────────────────────────────────────

export function useDailySpending(days = 7) {
  const dayList = getLastNDays(days);
  const startDate = dayList[0]!;
  const endDate = dayList[dayList.length - 1]!;

  return fromLiveQuery(() => getDailySpending(startDate, endDate));
}

export async function createTransaction(input: TransactionInput) {
  await addTransaction(input);
}

export async function editTransaction(id: string, input: TransactionInput) {
  await updateTransaction(id, {
    amount: input.amount,
    type: input.type,
    categoryId: input.categoryId,
    note: input.note,
    date: input.date,
    accountId: input.accountId,
  });
}

export async function removeTransaction(id: string) {
  await deleteTransaction(id);
}

export async function createTransfer(input: TransferInput) {
  await addTransfer(input);
}

// ── Group by date helper ────────────────────────────────────────────────

export interface TransactionGroup {
  date: string;
  transactions: Transaction[];
  total: number; // net: income - expense
}

export function groupByDate(transactions: Transaction[]): TransactionGroup[] {
  const map = new Map<string, Transaction[]>();

  for (const tx of transactions) {
    const existing = map.get(tx.date);
    if (existing) {
      existing.push(tx);
    } else {
      map.set(tx.date, [tx]);
    }
  }

  // Sort groups by date descending
  const groups: TransactionGroup[] = [];
  const sortedDates = [...map.keys()].sort((a, b) => b.localeCompare(a));

  for (const date of sortedDates) {
    const txs = map.get(date)!;
    let total = 0;
    for (const tx of txs) {
      total += tx.type === "income" ? tx.amount : -tx.amount;
    }
    groups.push({ date, transactions: txs, total });
  }

  return groups;
}
