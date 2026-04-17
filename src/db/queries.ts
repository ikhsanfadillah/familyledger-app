import { coreDb, getActiveLedgerDb, type Transaction, type User, type Category, type Budget } from './schema'
import { nanoid } from 'nanoid'

// ── User Identity ───────────────────────────────────────────────────────

export async function getUser(): Promise<User | undefined> {
  const users = await coreDb.users.toArray()
  return users.length > 0 ? users[0] : undefined
}

export async function createUser(fullName: string, gender: string): Promise<User> {
  const existing = await getUser()
  if (existing) return existing

  const user: User = {
    id: nanoid(),
    fullName,
    gender,
    createdAt: Date.now(),
  }
  await coreDb.users.add(user)
  return user
}

// ── Device ID ───────────────────────────────────────────────────────────

let _deviceId: string | null = null

export async function getDeviceId(): Promise<string> {
  if (_deviceId) return _deviceId

  const devices = await coreDb.devices.toArray()
  if (devices.length > 0) {
    _deviceId = devices[0]!.id
    return _deviceId
  }

  const id = nanoid()
  await coreDb.devices.add({
    id,
    name: 'Perangkat ini',
    role: 'master',
    lastSeen: Date.now(),
  })
  _deviceId = id
  return id
}

export async function getDeviceMap(): Promise<Map<string, string>> {
  const devices = await coreDb.devices.toArray()
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

  const db = getActiveLedgerDb()
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

  const tx = await db.transactions.get(id)
  if (tx) {
    // We defer syncService import to avoid circular dependency issues at top level
    const { syncService } = await import('~/services/sync.service')
    syncService.pushTransaction(tx)
  }

  return id
}

export async function updateTransaction(
  id: string,
  changes: Partial<Omit<Transaction, 'id' | 'createdAt' | 'deviceId'>>,
): Promise<void> {
  const db = getActiveLedgerDb()
  await db.transactions.update(id, {
    ...changes,
    updatedAt: Date.now(),
  })
  const tx = await db.transactions.get(id)
  if (tx) {
    const { syncService } = await import('~/services/sync.service')
    syncService.pushTransaction(tx)
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = getActiveLedgerDb()
  await db.transactions.update(id, {
    deleted: true,
    updatedAt: Date.now(),
  })
  const { syncService } = await import('~/services/sync.service')
  syncService.deleteTransaction(id)
}

export async function getTransactions(): Promise<Transaction[]> {
  const all = await getActiveLedgerDb().transactions.toArray()
  return all.filter((t) => !t.deleted).sort((a, b) => b.date.localeCompare(a.date))
}

export async function getTransactionsByDateRange(
  startDate: string,
  endDate: string,
): Promise<Transaction[]> {
  const txs = await getActiveLedgerDb().transactions.toArray()
  
  return txs
    .filter((t) => !t.deleted && t.date >= startDate && t.date <= endDate)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export async function getTransactionById(
  id: string,
): Promise<Transaction | undefined> {
  return getActiveLedgerDb().transactions.get(id)
}

export async function getRecentTransactions(
  limit = 5,
): Promise<Transaction[]> {
  const txs = await getTransactions()
  return txs.slice(0, limit)
}

export interface MonthlyTotals {
  income: number
  expense: number
  balance: number
}

export async function getMonthlyTotals(
  startDate: string,
  endDate: string,
): Promise<MonthlyTotals> {
  const txs = await getTransactionsByDateRange(startDate, endDate)
  let income = 0
  let expense = 0
  for (const tx of txs) {
    if (tx.type === 'income') income += tx.amount
    else expense += tx.amount
  }
  return { income, expense, balance: income - expense }
}

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
  const txs = await getTransactionsByDateRange(startDate, endDate)
  const filtered = txs.filter((t) => t.type === type)
  const catMap = await getCategoryMap()

  const totals = new Map<string, number>()
  let grandTotal = 0
  for (const tx of filtered) {
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

export interface DailySpending {
  date: string
  amount: number
}

export async function getDailySpending(
  startDate: string,
  endDate: string,
): Promise<DailySpending[]> {
  const txs = await getTransactionsByDateRange(startDate, endDate)
  const filtered = txs.filter(t => t.type === 'expense')

  const map = new Map<string, number>()
  for (const tx of filtered) {
    map.set(tx.date, (map.get(tx.date) ?? 0) + tx.amount)
  }

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
  const cats = await getActiveLedgerDb().categories.toArray()
  return cats
    .filter((c) => {
      if (c.deleted) return false
      if (!type) return true
      return c.type === type || c.type === 'both'
    })
    .sort((a, b) => a.order - b.order)
}

export async function saveCategories(categories: Omit<Category, 'id' | 'deleted'>[]): Promise<void> {
  const fullCats: Category[] = categories.map(c => ({
    ...c,
    id: nanoid(),
    deleted: false
  }))
  await getActiveLedgerDb().categories.bulkPut(fullCats)
}

export async function getCategoryMap(): Promise<
  Map<string, { name: string; icon: string; color: string }>
> {
  const cats = await getActiveLedgerDb().categories.toArray()
  const map = new Map<string, { name: string; icon: string; color: string }>()

  for (const c of cats) {
    map.set(c.id, { name: c.name, icon: c.icon, color: c.color })
  }

  return map
}

// ── Budgets ─────────────────────────────────────────────────────────────

export type BudgetInput = Pick<
  Budget,
  'categoryId' | 'amount' | 'period' | 'startDate'
>

export async function addBudget(input: BudgetInput): Promise<string> {
  const now = Date.now()
  const id = nanoid()

  const db = getActiveLedgerDb()
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

  const b = await db.budgets.get(id)
  if (b) {
    const { syncService } = await import('~/services/sync.service')
    syncService.pushBudget(b)
  }

  return id
}

export async function updateBudget(
  id: string,
  changes: Partial<Omit<Budget, 'id' | 'createdAt'>>,
): Promise<void> {
  const db = getActiveLedgerDb()
  await db.budgets.update(id, {
    ...changes,
    updatedAt: Date.now(),
  })
  const b = await db.budgets.get(id)
  if (b) {
    const { syncService } = await import('~/services/sync.service')
    syncService.pushBudget(b)
  }
}

export async function deleteBudget(id: string): Promise<void> {
  const db = getActiveLedgerDb()
  await db.budgets.update(id, {
    deleted: true,
    updatedAt: Date.now(),
  })
  const { syncService } = await import('~/services/sync.service')
  syncService.deleteBudget(id)
}

export async function getBudgets() {
  const all = await getActiveLedgerDb().budgets.toArray()
  return all.filter((b) => !b.deleted)
}

export async function getCategorySpendAmount(
  categoryId: string,
  startDate: string,
  endDate: string
): Promise<number> {
  const txs = await getTransactionsByDateRange(startDate, endDate)
  const filtered = txs.filter((t) => t.categoryId === categoryId && t.type === 'expense')

  let total = 0
  for (const tx of filtered) {
    total += tx.amount
  }

  return total
}
