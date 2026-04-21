import type { AccountGroup, Account } from "~/db/schema";

/**
 * Default account groups seeded on new ledger creation.
 * Static groups (isStatic: true) can only have their label/icon/color edited.
 * Non-static groups use snake_case IDs for idempotent seeding via bulkPut.
 */
export const DEFAULT_ACCOUNT_GROUPS: Omit<AccountGroup, "createdAt" | "updatedAt">[] = [
  {
    id: "cash",
    name: "Tunai",
    icon: "💵",
    color: "#27AE60",
    isStatic: true,
    order: 1,
    deleted: false,
  },
  {
    id: "bank_account",
    name: "Rekening",
    icon: "🏦",
    color: "#3498DB",
    isStatic: true,
    order: 2,
    deleted: false,
  },
  {
    id: "credit_card",
    name: "Kartu Kredit",
    icon: "💳",
    color: "#E74C3C",
    isStatic: true,
    order: 3,
    deleted: false,
  },
  {
    id: "savings",
    name: "Tabungan",
    icon: "🐷",
    color: "#F39C12",
    isStatic: true,
    order: 4,
    deleted: false,
  },
  {
    id: "top_up",
    name: "Top-up",
    icon: "📱",
    color: "#9B59B6",
    isStatic: false,
    order: 5,
    deleted: false,
  },
  {
    id: "loan",
    name: "Pinjaman",
    icon: "🤝",
    color: "#E67E22",
    isStatic: false,
    order: 6,
    deleted: false,
  },
  {
    id: "other",
    name: "Lainnya",
    icon: "📦",
    color: "#95A5A6",
    isStatic: false,
    order: 7,
    deleted: false,
  },
];

/**
 * Default accounts seeded on new ledger creation.
 * These use nanoid() at seed time — not hardcoded IDs.
 */
export const DEFAULT_ACCOUNTS: Omit<
  Account,
  "id" | "createdAt" | "updatedAt" | "deviceId" | "deleted"
>[] = [
  { name: "Dompet", groupId: "cash", icon: "👛", color: "#27AE60", initialBalance: 0, order: 1 },
  {
    name: "Rekening Utama",
    groupId: "bank_account",
    icon: "🏦",
    color: "#3498DB",
    initialBalance: 0,
    order: 2,
  },
];
