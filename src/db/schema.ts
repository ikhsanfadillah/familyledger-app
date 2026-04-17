import Dexie, { type EntityTable } from 'dexie'
import { nanoid } from 'nanoid'
import { applyEncryptionMiddleware, ENCRYPT_LIST } from 'dexie-encrypted'

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
  defaultLedgerId?: string
}

export interface Ledger {
  id: string
  name: string
  key: string
  themeColor: string
  createdAt: number
  updatedAt: number
}

export interface LedgerMember {
  id: string
  ledgerId: string
  deviceId: string
  role: 'owner' | 'member'
  joinedAt: number
}

// ── Database Classes ────────────────────────────────────────────────────

export class CoreDB extends Dexie {
  devices!: EntityTable<Device, 'id'>
  users!: EntityTable<User, 'id'>
  ledgers!: EntityTable<Ledger, 'id'>
  ledgerMembers!: EntityTable<LedgerMember, 'id'>

  constructor() {
    super('FamilyLedger_Core')
    this.version(1).stores({
      devices: 'id, role',
      users: 'id',
      ledgers: 'id',
      ledgerMembers: 'id, ledgerId, deviceId',
    })
  }
}

export class LedgerDB extends Dexie {
  transactions!: EntityTable<Transaction, 'id'>
  budgets!: EntityTable<Budget, 'id'>
  categories!: EntityTable<Category, 'id'>

  constructor(ledgerId: string) {
    super(`FamilyLedger_Ledger_${ledgerId}`)
    this.version(1).stores({
      transactions: 'id, date, type, categoryId, deviceId, deleted',
      budgets: 'id, categoryId, deleted',
      categories: 'id, type, order, deleted',
    })
  }
}

// ── Singletons & State ──────────────────────────────────────────────────

export const coreDb = new CoreDB()

let _activeLedgerDb: LedgerDB | null = null
let _masterKey: Uint8Array | null = null
let isInitialized = false

export function getActiveLedgerDb(): LedgerDB {
  if (!_activeLedgerDb) {
    throw new Error('Active Ledger DB is not initialized. Please call switchLedgerDb first.')
  }
  return _activeLedgerDb
}

/**
 * Derives a 32-byte encryption key from the user's PIN, applies encryption to coreDb,
 * and pre-upgrades any existing ledgers.
 */
export async function initDb(pin: string) {
  if (isInitialized) return
  
  // 1. Derive 32-byte key from PIN
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    "raw", 
    encoder.encode(pin), 
    { name: "PBKDF2" }, 
    false, 
    ["deriveBits"]
  )
  
  const salt = encoder.encode("familyledger-salt-v1")
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  )
  
  _masterKey = new Uint8Array(derivedBits)

  // 2. Apply Encryption Middleware to CoreDB
  applyEncryptionMiddleware(coreDb, _masterKey, {
    ledgers: {
      type: ENCRYPT_LIST,
      fields: ['key']
    }
  }, async (db) => {})

  // 3. Open CoreDB
  await coreDb.open()

  // 4. Pre-upgrade all ledger DBs
  const ledgers = await coreDb.ledgers.toArray()
  for (const ledger of ledgers) {
    const tempDb = new LedgerDB(ledger.id)
    applyEncryptionMiddleware(tempDb, _masterKey, {
      transactions: {
        type: ENCRYPT_LIST,
        fields: ['amount', 'note']
      },
      budgets: {
        type: ENCRYPT_LIST,
        fields: ['amount']
      }
    }, async (db) => {})
    // Open triggers schema upgrades if any, then close immediately
    await tempDb.open()
    tempDb.close()
  }

  isInitialized = true
}

/**
 * Switches the active memory instance of the LedgerDB.
 */
export async function switchLedgerDb(ledgerId: string) {
  if (!_masterKey) {
    throw new Error('Database is not unlocked. Call initDb first.')
  }

  if (_activeLedgerDb) {
    _activeLedgerDb.close()
    _activeLedgerDb = null
  }

  const newDb = new LedgerDB(ledgerId)
  applyEncryptionMiddleware(newDb, _masterKey, {
    transactions: {
      type: ENCRYPT_LIST,
      fields: ['amount', 'note']
    },
    budgets: {
      type: ENCRYPT_LIST,
      fields: ['amount']
    }
  }, async (db) => {})

  await newDb.open()
  _activeLedgerDb = newDb
}
