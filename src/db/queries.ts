import { db, type Transaction, type User, type Category } from './schema'
import { nanoid } from 'nanoid'
import { DEFAULT_CATEGORIES } from '~/constants/categories'

// ── User Identity ───────────────────────────────────────────────────────

export async function getUser(): Promise<User | undefined> {
  const users = await db.users.toArray()
  return users.length > 0 ? users[0] : undefined
}

export async function createUser(fullName: string, gender: string): Promise<User> {
  const existing = await getUser()
  if (existing) return existing

  const deviceId = await getDeviceId() // optionally can replace device ID with user ID
  // But let's create a User with a unique id
  const user: User = {
    id: nanoid(),
    fullName,
    gender,
    createdAt: Date.now(),
  }
  await db.users.add(user)
  return user
}

// ── Device ID ───────────────────────────────────────────────────────────
// Lazily resolved device ID — stored in the devices table.
// For now we use a simple localStorage fallback until device setup is built.

let _deviceId: string | null = null

export async function getDeviceId(): Promise<string> {
  if (_deviceId) return _deviceId

  const devices = await db.devices.toArray()
  if (devices.length > 0) {
    _deviceId = devices[0]!.id
    return _deviceId
  }

  // First launch — create a device record
  const id = nanoid()
  await db.devices.add({
    id,
    name: 'Perangkat ini',
    role: 'master',
    lastSeen: Date.now(),
  })
  _deviceId = id
  return id
}

export async function getDeviceMap(): Promise<Map<string, string>> {
  const devices = await db.devices.toArray()
  const map = new Map<string, string>()
  for (const d of devices) {
    map.set(d.id, d.name)
  }
  return map
}

// ── Transactions ────────────────────────────────────────────────────────

export type TransactionInput = Pick<
  Transaction,
  'amount' | 'type' | 'categoryId' | 'note' | 'date'
>

export async function addTransaction(input: TransactionInput): Promise<string> {
  const deviceId = await getDeviceId()
  const now = Date.now()
  const id = nanoid()

  await db.transactions.add({
    id,
    amount: input.amount,
    type: input.type,
    categoryId: input.categoryId,
    note: input.note,
    date: input.date,
    createdAt: now,
    updatedAt: now,
    deviceId,
    deleted: false,
  })

  return id
}

export async function updateTransaction(
  id: string,
  changes: Partial<Omit<Transaction, 'id' | 'createdAt' | 'deviceId'>>,
): Promise<void> {
  await db.transactions.update(id, {
    ...changes,
    updatedAt: Date.now(),
  })
}

export async function deleteTransaction(id: string): Promise<void> {
  await db.transactions.update(id, {
    deleted: true,
    updatedAt: Date.now(),
  })
}

export async function getTransactions(): Promise<Transaction[]> {
  const all = await db.transactions
    .orderBy('date')
    .reverse()
    .toArray()
  return all.filter((t) => !t.deleted)
}

export async function getTransactionsByDateRange(
  startDate: string,
  endDate: string,
): Promise<Transaction[]> {
  return db.transactions
    .where('date')
    .between(startDate, endDate, true, true)
    .and((t) => !t.deleted)
    .reverse()
    .sortBy('date')
}

// ── Single transaction ──────────────────────────────────────────────────

export async function getTransactionById(
  id: string,
): Promise<Transaction | undefined> {
  return db.transactions.get(id)
}

// ── Recent transactions ─────────────────────────────────────────────────

export async function getRecentTransactions(
  limit = 5,
): Promise<Transaction[]> {
  const all = await db.transactions
    .orderBy('date')
    .reverse()
    .toArray()
  return all.filter((t) => !t.deleted).slice(0, limit)
}

// ── Monthly totals ──────────────────────────────────────────────────────

export interface MonthlyTotals {
  income: number
  expense: number
  balance: number
}

export async function getMonthlyTotals(
  startDate: string,
  endDate: string,
): Promise<MonthlyTotals> {
  const txs = await db.transactions
    .where('date')
    .between(startDate, endDate, true, true)
    .and((t) => !t.deleted)
    .toArray()

  let income = 0
  let expense = 0
  for (const tx of txs) {
    if (tx.type === 'income') income += tx.amount
    else expense += tx.amount
  }
  return { income, expense, balance: income - expense }
}

// ── Category totals (for donut chart) ───────────────────────────────────

export interface CategoryTotal {
  categoryId: string
  name: string
  icon: string
  color: string
  amount: number
  percentage: number
}

export async function getCategoryTotals(
  startDate: string,
  endDate: string,
  type: 'income' | 'expense' = 'expense',
): Promise<CategoryTotal[]> {
  const txs = await db.transactions
    .where('date')
    .between(startDate, endDate, true, true)
    .and((t) => !t.deleted && t.type === type)
    .toArray()

  const catMap = await getCategoryMap()

  const totals = new Map<string, number>()
  let grandTotal = 0
  for (const tx of txs) {
    totals.set(tx.categoryId, (totals.get(tx.categoryId) ?? 0) + tx.amount)
    grandTotal += tx.amount
  }

  const result: CategoryTotal[] = []
  for (const [catId, amount] of totals) {
    const cat = catMap.get(catId)
    result.push({
      categoryId: catId,
      name: cat?.name ?? 'Lainnya',
      icon: cat?.icon ?? '📦',
      color: cat?.color ?? '#95A5A6',
      amount,
      percentage: grandTotal > 0 ? (amount / grandTotal) * 100 : 0,
    })
  }

  return result.sort((a, b) => b.amount - a.amount)
}

// ── Daily spending (for bar chart) ──────────────────────────────────────

export interface DailySpending {
  date: string
  amount: number
}

export async function getDailySpending(
  startDate: string,
  endDate: string,
): Promise<DailySpending[]> {
  const txs = await db.transactions
    .where('date')
    .between(startDate, endDate, true, true)
    .and((t) => !t.deleted && t.type === 'expense')
    .toArray()

  const map = new Map<string, number>()
  for (const tx of txs) {
    map.set(tx.date, (map.get(tx.date) ?? 0) + tx.amount)
  }

  // Build a daily series (fill gaps with 0)
  const result: DailySpending[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10)
    result.push({ date: dateStr, amount: map.get(dateStr) ?? 0 })
  }

  return result
}

// ── Categories ──────────────────────────────────────────────────────────

export async function getCategories(type?: 'income' | 'expense' | 'both') {
  const cats = await db.categories.toArray()
  return cats
    .filter((c) => {
      if (c.deleted) return false
      if (!type) return true
      return c.type === type || c.type === 'both'
    })
    .sort((a, b) => a.order - b.order)
}

export async function saveCategories(categories: Category[]): Promise<void> {
  await db.categories.bulkPut(categories)
}

export async function getCategoryMap(): Promise<
  Map<string, { name: string; icon: string; color: string }>
> {
  const cats = await db.categories.toArray()
  const map = new Map<string, { name: string; icon: string; color: string }>()

  for (const c of cats) {
    map.set(c.id, { name: c.name, icon: c.icon, color: c.color })
  }

  return map
}

// ── Budgets ─────────────────────────────────────────────────────────────

export type BudgetInput = Pick<
  import('./schema').Budget,
  'categoryId' | 'amount' | 'period' | 'startDate'
>

export async function addBudget(input: BudgetInput): Promise<string> {
  const now = Date.now()
  const id = nanoid()

  await db.budgets.add({
    id,
    categoryId: input.categoryId,
    amount: input.amount,
    period: input.period,
    startDate: input.startDate,
    createdAt: now,
    updatedAt: now,
    deleted: false,
  })

  return id
}

export async function updateBudget(
  id: string,
  changes: Partial<Omit<import('./schema').Budget, 'id' | 'createdAt'>>,
): Promise<void> {
  await db.budgets.update(id, {
    ...changes,
    updatedAt: Date.now(),
  })
}

export async function deleteBudget(id: string): Promise<void> {
  await db.budgets.update(id, {
    deleted: true,
    updatedAt: Date.now(),
  })
}

export async function getBudgets() {
  const all = await db.budgets.toArray()
  return all.filter((b) => !b.deleted)
}

export async function getCategorySpendAmount(
  categoryId: string,
  startDate: string,
  endDate: string
): Promise<number> {
  const txs = await db.transactions
    .where('date')
    .between(startDate, endDate, true, true)
    .and((t) => !t.deleted && t.categoryId === categoryId && t.type === 'expense')
    .toArray()

  let total = 0
  for (const tx of txs) {
    total += tx.amount
  }

  return total
}
