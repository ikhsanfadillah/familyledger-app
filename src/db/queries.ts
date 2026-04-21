import {
  coreDb,
  getActiveLedgerDb,
  type Transaction,
  type User,
  type Category,
  type Budget,
  type AccountGroup,
  type Account,
} from "./schema";
import { nanoid } from "nanoid";

// ── User Identity ───────────────────────────────────────────────────────

export async function getUser(): Promise<User | undefined> {
  const users = await coreDb.users.toArray();
  return users.length > 0 ? users[0] : undefined;
}

export async function createUser(fullName: string, gender: string): Promise<User> {
  const existing = await getUser();
  if (existing) return existing;

  const user: User = {
    id: nanoid(),
    fullName,
    gender,
    createdAt: Date.now(),
  };
  await coreDb.users.add(user);
  return user;
}

// ── Device ID ───────────────────────────────────────────────────────────

let _deviceId: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (_deviceId) return _deviceId;

  const devices = await coreDb.devices.toArray();
  if (devices.length > 0) {
    _deviceId = devices[0]!.id;
    return _deviceId;
  }

  const id = nanoid();
  await coreDb.devices.add({
    id,
    name: "Perangkat ini",
    role: "master",
    lastSeen: Date.now(),
  });
  _deviceId = id;
  return id;
}

export async function getDeviceMap(): Promise<Map<string, string>> {
  const devices = await coreDb.devices.toArray();
  const map = new Map<string, string>();
  for (const d of devices) {
    map.set(d.id, d.name);
  }
  return map;
}

// ── Transactions ────────────────────────────────────────────────────────

export type TransactionInput = Pick<
  Transaction,
  "amount" | "type" | "categoryId" | "note" | "date"
> & {
  accountId?: string;
};

export async function addTransaction(input: TransactionInput): Promise<string> {
  const deviceId = await getDeviceId();
  const now = Date.now();
  const id = nanoid();

  const db = getActiveLedgerDb();
  await db.transactions.add({
    id,
    amount: input.amount,
    type: input.type,
    categoryId: input.categoryId,
    note: input.note,
    date: input.date,
    accountId: input.accountId,
    createdAt: now,
    updatedAt: now,
    deviceId,
    deleted: false,
  });

  const tx = await db.transactions.get(id);
  if (tx) {
    // We defer syncService import to avoid circular dependency issues at top level
    const { syncService } = await import("~/services/sync.service");
    syncService.pushTransaction(tx);
  }

  return id;
}

export async function updateTransaction(
  id: string,
  changes: Partial<Omit<Transaction, "id" | "createdAt" | "deviceId">>,
): Promise<void> {
  const db = getActiveLedgerDb();
  await db.transactions.update(id, {
    ...changes,
    updatedAt: Date.now(),
  });
  const tx = await db.transactions.get(id);
  if (tx) {
    const { syncService } = await import("~/services/sync.service");
    syncService.pushTransaction(tx);
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = getActiveLedgerDb();
  const tx = await db.transactions.get(id);
  if (!tx) return;

  const now = Date.now();

  // Cascade soft-delete: if this is part of a transfer, delete both legs
  if (tx.transferId) {
    const allLegs = await db.transactions.where("transferId").equals(tx.transferId).toArray();
    for (const leg of allLegs) {
      await db.transactions.update(leg.id, { deleted: true, updatedAt: now });
      const { syncService } = await import("~/services/sync.service");
      syncService.pushTransaction({ ...leg, deleted: true, updatedAt: now });
    }
  } else {
    await db.transactions.update(id, { deleted: true, updatedAt: now });
    const { syncService } = await import("~/services/sync.service");
    syncService.deleteTransaction(id);
  }
}

export async function getTransactions(): Promise<Transaction[]> {
  const all = await getActiveLedgerDb().transactions.toArray();
  return all.filter((t) => !t.deleted).sort((a, b) => b.date.localeCompare(a.date));
}

export async function getTransactionsByDateRange(
  startDate: string,
  endDate: string,
): Promise<Transaction[]> {
  const txs = await getActiveLedgerDb().transactions.toArray();

  return txs
    .filter((t) => !t.deleted && t.date >= startDate && t.date <= endDate)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getTransactionById(id: string): Promise<Transaction | undefined> {
  return getActiveLedgerDb().transactions.get(id);
}

export async function getRecentTransactions(limit = 5): Promise<Transaction[]> {
  const txs = await getTransactions();
  return txs.slice(0, limit);
}

export interface MonthlyTotals {
  income: number;
  expense: number;
  balance: number;
}

export async function getMonthlyTotals(startDate: string, endDate: string): Promise<MonthlyTotals> {
  const txs = await getTransactionsByDateRange(startDate, endDate);
  let income = 0;
  let expense = 0;
  for (const tx of txs) {
    // Exclude transfers from income/expense summaries to avoid double-counting
    if (tx.transferId) continue;
    if (tx.type === "income") income += tx.amount;
    else expense += tx.amount;
  }
  return { income, expense, balance: income - expense };
}

export interface CategoryTotal {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
}

export async function getCategoryTotals(
  startDate: string,
  endDate: string,
  type: "income" | "expense" = "expense",
): Promise<CategoryTotal[]> {
  const txs = await getTransactionsByDateRange(startDate, endDate);
  // Exclude transfers from category totals to avoid double-counting
  const filtered = txs.filter((t) => t.type === type && !t.transferId);
  const catMap = await getCategoryMap();

  const totals = new Map<string, number>();
  let grandTotal = 0;
  for (const tx of filtered) {
    totals.set(tx.categoryId, (totals.get(tx.categoryId) ?? 0) + tx.amount);
    grandTotal += tx.amount;
  }

  const result: CategoryTotal[] = [];
  for (const [catId, amount] of totals) {
    const cat = catMap.get(catId);
    result.push({
      categoryId: catId,
      name: cat?.name ?? "Lainnya",
      icon: cat?.icon ?? "📦",
      color: cat?.color ?? "#95A5A6",
      amount,
      percentage: grandTotal > 0 ? (amount / grandTotal) * 100 : 0,
    });
  }

  return result.sort((a, b) => b.amount - a.amount);
}

export interface DailySpending {
  date: string;
  amount: number;
}

export async function getDailySpending(
  startDate: string,
  endDate: string,
): Promise<DailySpending[]> {
  const txs = await getTransactionsByDateRange(startDate, endDate);
  const filtered = txs.filter((t) => t.type === "expense");

  const map = new Map<string, number>();
  for (const tx of filtered) {
    map.set(tx.date, (map.get(tx.date) ?? 0) + tx.amount);
  }

  const result: DailySpending[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    result.push({ date: dateStr, amount: map.get(dateStr) ?? 0 });
  }

  return result;
}

// ── Categories ──────────────────────────────────────────────────────────

export async function getCategories(type?: "income" | "expense" | "both") {
  const cats = await getActiveLedgerDb().categories.toArray();
  return cats
    .filter((c) => {
      if (c.deleted) return false;
      if (!type) return true;
      return c.type === type || c.type === "both";
    })
    .sort((a, b) => a.order - b.order);
}

export async function saveCategories(
  categories: Omit<Category, "id" | "deleted">[],
): Promise<void> {
  const fullCats: Category[] = categories.map((c) => ({
    ...c,
    id: nanoid(),
    deleted: false,
  }));
  await getActiveLedgerDb().categories.bulkPut(fullCats);
}

export async function getCategoryMap(): Promise<
  Map<string, { name: string; icon: string; color: string }>
> {
  const cats = await getActiveLedgerDb().categories.toArray();
  const map = new Map<string, { name: string; icon: string; color: string }>();

  for (const c of cats) {
    map.set(c.id, { name: c.name, icon: c.icon, color: c.color });
  }

  return map;
}

// ── Budgets ─────────────────────────────────────────────────────────────

export type BudgetInput = Pick<Budget, "categoryId" | "amount" | "period" | "startDate">;

export async function addBudget(input: BudgetInput): Promise<string> {
  const now = Date.now();
  const id = nanoid();

  const db = getActiveLedgerDb();
  await db.budgets.add({
    id,
    categoryId: input.categoryId,
    amount: input.amount,
    period: input.period,
    startDate: input.startDate,
    createdAt: now,
    updatedAt: now,
    deleted: false,
  });

  const b = await db.budgets.get(id);
  if (b) {
    const { syncService } = await import("~/services/sync.service");
    syncService.pushBudget(b);
  }

  return id;
}

export async function updateBudget(
  id: string,
  changes: Partial<Omit<Budget, "id" | "createdAt">>,
): Promise<void> {
  const db = getActiveLedgerDb();
  await db.budgets.update(id, {
    ...changes,
    updatedAt: Date.now(),
  });
  const b = await db.budgets.get(id);
  if (b) {
    const { syncService } = await import("~/services/sync.service");
    syncService.pushBudget(b);
  }
}

export async function deleteBudget(id: string): Promise<void> {
  const db = getActiveLedgerDb();
  await db.budgets.update(id, {
    deleted: true,
    updatedAt: Date.now(),
  });
  const { syncService } = await import("~/services/sync.service");
  syncService.deleteBudget(id);
}

export async function getBudgets() {
  const all = await getActiveLedgerDb().budgets.toArray();
  return all.filter((b) => !b.deleted);
}

export async function getCategorySpendAmount(
  categoryId: string,
  startDate: string,
  endDate: string,
): Promise<number> {
  const txs = await getTransactionsByDateRange(startDate, endDate);
  const filtered = txs.filter((t) => t.categoryId === categoryId && t.type === "expense");

  let total = 0;
  for (const tx of filtered) {
    total += tx.amount;
  }

  return total;
}

// ── Account Groups ──────────────────────────────────────────────────────

export type AccountGroupInput = Pick<AccountGroup, "name" | "icon" | "color"> & {
  isStatic?: boolean;
};

export async function getAccountGroups(): Promise<AccountGroup[]> {
  const all = await getActiveLedgerDb().accountGroups.toArray();
  return all.filter((g) => !g.deleted).sort((a, b) => a.order - b.order);
}

export async function getAccountGroup(id: string): Promise<AccountGroup | undefined> {
  return getActiveLedgerDb().accountGroups.get(id);
}

export async function getAccountGroupMap(): Promise<
  Map<string, { name: string; icon: string; color: string }>
> {
  const groups = await getActiveLedgerDb().accountGroups.toArray();
  const map = new Map<string, { name: string; icon: string; color: string }>();
  for (const g of groups) {
    map.set(g.id, { name: g.name, icon: g.icon, color: g.color });
  }
  return map;
}

/**
 * Seed default account groups using bulkPut (upsert) for idempotent seeding.
 */
export async function seedAccountGroups(
  groups: Omit<AccountGroup, "createdAt" | "updatedAt">[],
): Promise<void> {
  const now = Date.now();
  const fullGroups: AccountGroup[] = groups.map((g) => ({
    ...g,
    createdAt: now,
    updatedAt: now,
  }));
  await getActiveLedgerDb().accountGroups.bulkPut(fullGroups);
}

export async function addAccountGroup(input: AccountGroupInput): Promise<string> {
  const now = Date.now();
  const db = getActiveLedgerDb();

  // Get next order value
  const existing = await db.accountGroups.toArray();
  const maxOrder = existing.reduce((max, g) => Math.max(max, g.order), 0);

  const id = nanoid();
  const group: AccountGroup = {
    id,
    name: input.name,
    icon: input.icon,
    color: input.color,
    isStatic: false,
    order: maxOrder + 1,
    deleted: false,
    createdAt: now,
    updatedAt: now,
  };

  await db.accountGroups.add(group);

  const saved = await db.accountGroups.get(id);
  if (saved) {
    const { syncService } = await import("~/services/sync.service");
    syncService.pushAccountGroup(saved);
  }

  return id;
}

export async function updateAccountGroup(
  id: string,
  changes: Partial<Pick<AccountGroup, "name" | "icon" | "color" | "order">>,
): Promise<void> {
  const db = getActiveLedgerDb();
  await db.accountGroups.update(id, {
    ...changes,
    updatedAt: Date.now(),
  });
  const saved = await db.accountGroups.get(id);
  if (saved) {
    const { syncService } = await import("~/services/sync.service");
    syncService.pushAccountGroup(saved);
  }
}

export async function deleteAccountGroup(id: string): Promise<void> {
  const db = getActiveLedgerDb();
  const group = await db.accountGroups.get(id);
  if (!group || group.isStatic) return; // Cannot delete static groups

  const now = Date.now();
  await db.accountGroups.update(id, { deleted: true, updatedAt: now });

  // Also soft-delete all accounts in this group
  const accounts = await db.accounts.where("groupId").equals(id).toArray();
  for (const acc of accounts) {
    await db.accounts.update(acc.id, { deleted: true, updatedAt: now });
  }

  const { syncService } = await import("~/services/sync.service");
  syncService.pushAccountGroup({ ...group, deleted: true, updatedAt: now });
}

// ── Accounts ────────────────────────────────────────────────────────────

export type AccountInput = Pick<Account, "name" | "groupId" | "icon" | "color" | "initialBalance">;

export async function getAccounts(): Promise<Account[]> {
  const all = await getActiveLedgerDb().accounts.toArray();
  return all.filter((a) => !a.deleted).sort((a, b) => a.order - b.order);
}

export async function getAccountsByGroup(groupId: string): Promise<Account[]> {
  const all = await getActiveLedgerDb().accounts.where("groupId").equals(groupId).toArray();
  return all.filter((a) => !a.deleted).sort((a, b) => a.order - b.order);
}

export async function getAccount(id: string): Promise<Account | undefined> {
  return getActiveLedgerDb().accounts.get(id);
}

export async function getAccountMap(): Promise<
  Map<string, { name: string; icon: string; color: string; groupId: string; deleted: boolean }>
> {
  const accounts = await getActiveLedgerDb().accounts.toArray();
  const map = new Map<
    string,
    { name: string; icon: string; color: string; groupId: string; deleted: boolean }
  >();
  for (const a of accounts) {
    map.set(a.id, {
      name: a.name,
      icon: a.icon,
      color: a.color,
      groupId: a.groupId,
      deleted: a.deleted,
    });
  }
  return map;
}

/**
 * Seed default accounts using bulkPut (upsert) for idempotent seeding.
 * Generates nanoid() for each account.
 */
export async function seedAccounts(
  accounts: Omit<Account, "id" | "createdAt" | "updatedAt" | "deviceId" | "deleted">[],
): Promise<void> {
  const deviceId = await getDeviceId();
  const now = Date.now();
  const fullAccounts: Account[] = accounts.map((a) => ({
    ...a,
    id: nanoid(),
    createdAt: now,
    updatedAt: now,
    deviceId,
    deleted: false,
  }));
  await getActiveLedgerDb().accounts.bulkPut(fullAccounts);
}

export async function addAccount(input: AccountInput): Promise<string> {
  const deviceId = await getDeviceId();
  const now = Date.now();
  const db = getActiveLedgerDb();

  // Get next order value
  const existing = await db.accounts.toArray();
  const maxOrder = existing.reduce((max, a) => Math.max(max, a.order), 0);

  const id = nanoid();
  const account: Account = {
    id,
    name: input.name,
    groupId: input.groupId,
    icon: input.icon,
    color: input.color,
    initialBalance: input.initialBalance,
    order: maxOrder + 1,
    deleted: false,
    createdAt: now,
    updatedAt: now,
    deviceId,
  };

  await db.accounts.add(account);

  const saved = await db.accounts.get(id);
  if (saved) {
    const { syncService } = await import("~/services/sync.service");
    syncService.pushAccount(saved);
  }

  return id;
}

export async function updateAccount(
  id: string,
  changes: Partial<
    Pick<Account, "name" | "groupId" | "icon" | "color" | "initialBalance" | "order">
  >,
): Promise<void> {
  const db = getActiveLedgerDb();
  await db.accounts.update(id, {
    ...changes,
    updatedAt: Date.now(),
  });
  const saved = await db.accounts.get(id);
  if (saved) {
    const { syncService } = await import("~/services/sync.service");
    syncService.pushAccount(saved);
  }
}

export async function deleteAccount(id: string): Promise<void> {
  const db = getActiveLedgerDb();
  const now = Date.now();
  await db.accounts.update(id, { deleted: true, updatedAt: now });

  const acc = await db.accounts.get(id);
  if (acc) {
    const { syncService } = await import("~/services/sync.service");
    syncService.pushAccount({ ...acc, deleted: true, updatedAt: now });
  }
}

/**
 * Calculate account balance from initialBalance + sum of transactions.
 * balance = initialBalance + Σ(income where accountId = X) - Σ(expense where accountId = X)
 * Transfers are naturally included since they are typed as income/expense.
 */
export async function getAccountBalance(accountId: string): Promise<number> {
  const db = getActiveLedgerDb();
  const account = await db.accounts.get(accountId);
  if (!account) return 0;

  const txs = await db.transactions.where("accountId").equals(accountId).toArray();

  let balance = account.initialBalance;
  for (const tx of txs) {
    if (tx.deleted) continue;
    if (tx.type === "income") balance += tx.amount;
    else balance -= tx.amount;
  }

  return balance;
}

// ── Transfers ───────────────────────────────────────────────────────────

export interface TransferInput {
  amount: number;
  fromAccountId: string;
  toAccountId: string;
  note: string;
  date: string;
}

/**
 * Create a transfer as two linked transactions (atomic).
 * - Expense leg on source account
 * - Income leg on destination account
 * Both share the same transferId.
 */
export async function addTransfer(input: TransferInput): Promise<string> {
  const db = getActiveLedgerDb();
  const deviceId = await getDeviceId();
  const now = Date.now();
  const transferId = nanoid();
  const expenseId = nanoid();
  const incomeId = nanoid();

  // Use a Dexie transaction for atomicity
  await db.transaction("rw", db.transactions, async () => {
    // Expense leg (from source)
    await db.transactions.add({
      id: expenseId,
      amount: input.amount,
      type: "expense",
      categoryId: "", // Transfers don't need a category
      note: input.note,
      date: input.date,
      accountId: input.fromAccountId,
      transferId,
      transferAccountId: input.toAccountId,
      createdAt: now,
      updatedAt: now,
      deviceId,
      deleted: false,
    });

    // Income leg (to destination)
    await db.transactions.add({
      id: incomeId,
      amount: input.amount,
      type: "income",
      categoryId: "", // Transfers don't need a category
      note: input.note,
      date: input.date,
      accountId: input.toAccountId,
      transferId,
      transferAccountId: input.fromAccountId,
      createdAt: now,
      updatedAt: now,
      deviceId,
      deleted: false,
    });
  });

  // Push both legs to sync
  const expenseTx = await db.transactions.get(expenseId);
  const incomeTx = await db.transactions.get(incomeId);
  if (expenseTx || incomeTx) {
    const { syncService } = await import("~/services/sync.service");
    if (expenseTx) syncService.pushTransaction(expenseTx);
    if (incomeTx) syncService.pushTransaction(incomeTx);
  }

  return transferId;
}
