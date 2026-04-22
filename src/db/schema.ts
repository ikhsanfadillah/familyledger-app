import Dexie, { type EntityTable } from "dexie";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { applyEncryptionMiddleware, ENCRYPT_LIST } from "dexie-encrypted";

// ── Interfaces ──────────────────────────────────────────────────────────

export interface Transaction {
  id: string;
  amount: number;
  type: "income" | "expense";
  categoryId: string;
  note: string;
  date: string;
  createdAt: number;
  updatedAt: number;
  deviceId: string;
  deleted: boolean;
  /** FK → Account.id. Optional — transactions created before accounts feature won't have this. */
  accountId?: string;
  /** Shared ID linking two transfer legs. When set, this transaction is part of a transfer. */
  transferId?: string;
  /**
   * Denormalized cache of the "other" account in a transfer.
   * Source of truth is querying by transferId — this exists for read performance.
   */
  transferAccountId?: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  period: "monthly" | "weekly";
  startDate: string;
  createdAt: number;
  updatedAt: number;
  deleted: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "income" | "expense" | "both";
  order: number;
  deleted: boolean;
}

export interface AccountGroup {
  id: string; // snake_case for built-in, nanoid for user-created
  name: string; // Display label, e.g. "Tunai", "Rekening"
  icon: string;
  color: string;
  isStatic: boolean; // true = built-in (can only edit label/icon/color), false = user-created (full CRUD)
  order: number;
  deleted: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Account {
  id: string;
  name: string; // e.g. "BCA", "Mandiri", "Dompet"
  groupId: string; // FK → AccountGroup.id
  icon: string;
  color: string;
  initialBalance: number; // Starting balance when account was added
  order: number;
  deleted: boolean;
  createdAt: number;
  updatedAt: number;
  deviceId: string;
}

export interface Device {
  id: string;
  name: string;
  role: "master" | "client";
  lastSeen: number;
}

export interface User {
  id: string;
  fullName: string;
  gender: string;
  createdAt: number;
  defaultLedgerId?: string;
}

export interface Ledger {
  id: string;
  name: string;
  key: string;
  themeColor: string;
  createdAt: number;
  updatedAt: number;
}

export interface LedgerMember {
  id: string;
  ledgerId: string;
  deviceId: string;
  role: "owner" | "member";
  joinedAt: number;
}

// ── Database Classes ────────────────────────────────────────────────────

export class CoreDB extends Dexie {
  devices!: EntityTable<Device, "id">;
  users!: EntityTable<User, "id">;
  ledgers!: EntityTable<Ledger, "id">;
  ledgerMembers!: EntityTable<LedgerMember, "id">;

  constructor() {
    super("FamilyLedger_Core");
    this.version(1).stores({
      devices: "id, role",
      users: "id",
      ledgers: "id",
      ledgerMembers: "id, ledgerId, deviceId",
    });
  }
}

export class LedgerDB extends Dexie {
  transactions!: EntityTable<Transaction, "id">;
  budgets!: EntityTable<Budget, "id">;
  categories!: EntityTable<Category, "id">;
  accountGroups!: EntityTable<AccountGroup, "id">;
  accounts!: EntityTable<Account, "id">;

  constructor(ledgerId: string) {
    super(`FamilyLedger_Ledger_${ledgerId}`);
    this.version(1).stores({
      transactions: "id, date, type, categoryId, deviceId, deleted",
      budgets: "id, categoryId, deleted",
      categories: "id, type, order, deleted",
    });
    this.version(2).stores({
      transactions: "id, date, type, categoryId, accountId, deviceId, deleted, transferId",
      budgets: "id, categoryId, deleted",
      categories: "id, type, order, deleted",
      accountGroups: "id, isStatic, order, deleted",
      accounts: "id, groupId, order, deleted",
    });
  }
}

// ── Singletons & State ──────────────────────────────────────────────────

export const coreDb = new CoreDB();

let _activeLedgerDb: LedgerDB | null = null;
let _masterKey: Uint8Array | null = null;
let isInitialized = false;

export function getActiveLedgerDb(): LedgerDB {
  if (!_activeLedgerDb) {
    throw new Error("Active Ledger DB is not initialized. Please call switchLedgerDb first.");
  }
  return _activeLedgerDb;
}

/**
 * Derives a 32-byte encryption key from the user's PIN, applies encryption to coreDb,
 * and pre-upgrades any existing ledgers.
 */
export async function initDb(pin: string) {
  if (isInitialized) return;

  // 1. Derive 32-byte key from PIN
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );

  const salt = encoder.encode("familyledger-salt-v1");

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );

  _masterKey = new Uint8Array(derivedBits);

  // 2. Apply Encryption Middleware to CoreDB
  applyEncryptionMiddleware(
    coreDb,
    _masterKey,
    {
      ledgers: {
        type: ENCRYPT_LIST,
        fields: ["key"],
      },
    },
    async () => {},
  );

  // 3. Open CoreDB
  await coreDb.open();

  // 4. Pre-upgrade all ledger DBs
  const ledgers = await coreDb.ledgers.toArray();

  for (const ledger of ledgers) {
    const tempDb = new LedgerDB(ledger.id);
    applyEncryptionMiddleware(
      tempDb,
      _masterKey,
      {
        transactions: {
          type: ENCRYPT_LIST,
          fields: ["amount", "note"],
        },
        budgets: {
          type: ENCRYPT_LIST,
          fields: ["amount"],
        },
      },
      async () => {},
    );
    // Open triggers schema upgrades if any, then close immediately
    await tempDb.open();
    tempDb.close();
  }
  isInitialized = true;
}

/**
 * Switches the active memory instance of the LedgerDB.
 */
export async function switchLedgerDb(ledgerId: string) {
  if (!_masterKey) {
    throw new Error("Database is not unlocked. Call initDb first.");
  }

  if (_activeLedgerDb) {
    _activeLedgerDb.close();
    _activeLedgerDb = null;
  }

  const newDb = new LedgerDB(ledgerId);
  applyEncryptionMiddleware(
    newDb,
    _masterKey,
    {
      transactions: {
        type: ENCRYPT_LIST,
        fields: ["amount", "note"],
      },
      budgets: {
        type: ENCRYPT_LIST,
        fields: ["amount"],
      },
    },
    async () => {},
  );

  await newDb.open();
  _activeLedgerDb = newDb;
}
