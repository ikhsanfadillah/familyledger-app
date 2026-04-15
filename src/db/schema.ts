import Dexie, { type EntityTable } from 'dexie'
import { nanoid } from 'nanoid'

// ── Interfaces ──────────────────────────────────────────────────────────

export interface Transaction {
  id: string
  amount: number
  type: 'income' | 'expense'
  categoryId: string
  note: string
  date: string
  createdAt: number
  updatedAt: number
  deviceId: string
  deleted: boolean
}

export interface Budget {
  id: string
  categoryId: string
  amount: number
  period: 'monthly' | 'weekly'
  startDate: string
  createdAt: number
  updatedAt: number
  deleted: boolean
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  type: 'income' | 'expense' | 'both'
  order: number
  deleted: boolean
}

export interface Device {
  id: string
  name: string
  role: 'master' | 'client'
  lastSeen: number
}

export interface User {
  id: string
  fullName: string
  gender: string
  createdAt: number
}

// ── Database ────────────────────────────────────────────────────────────

class FamilyLedgerDB extends Dexie {
  transactions!: EntityTable<Transaction, 'id'>
  budgets!: EntityTable<Budget, 'id'>
  categories!: EntityTable<Category, 'id'>
  devices!: EntityTable<Device, 'id'>
  users!: EntityTable<User, 'id'>

  constructor() {
    super('FamilyLedgerDB')

    this.version(2).stores({
      transactions: 'id, date, type, categoryId, deviceId, deleted',
      budgets: 'id, categoryId, deleted',
      categories: 'id, type, order, deleted',
      devices: 'id, role',
      users: 'id',
    }).upgrade(async (tx) => {
      // Data migration if needed
    })
  }
}



// ── Singleton export ────────────────────────────────────────────────────

export const db = new FamilyLedgerDB()
