import { createResource, onCleanup } from "solid-js";
import { liveQuery } from "dexie";
import {
  getAccountGroups,
  getAccounts,
  getAccountBalance,
  addAccountGroup,
  updateAccountGroup,
  deleteAccountGroup,
  addAccount,
  updateAccount,
  deleteAccount,
  type AccountGroupInput,
  type AccountInput,
} from "~/db/queries";

// ── Live Query Helper ──────────────────────────────────────────────────
// Same pattern as transaction.store.ts

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

// ── Account Groups ──────────────────────────────────────────────────────

export function useAccountGroups() {
  return fromLiveQuery(() => getAccountGroups());
}

// ── Accounts ────────────────────────────────────────────────────────────

export function useAccounts() {
  return fromLiveQuery(() => getAccounts());
}

export function useAccountBalance(accountId: () => string) {
  return fromLiveQuery(() => getAccountBalance(accountId()));
}

// ── Actions ─────────────────────────────────────────────────────────────

export async function createAccountGroup(input: AccountGroupInput) {
  return addAccountGroup(input);
}

export async function editAccountGroup(
  id: string,
  input: Partial<Pick<AccountGroupInput, "name" | "icon" | "color">>,
) {
  await updateAccountGroup(id, input);
}

export async function removeAccountGroup(id: string) {
  await deleteAccountGroup(id);
}

export async function createAccount(input: AccountInput) {
  return addAccount(input);
}

export async function editAccount(
  id: string,
  input: Partial<Pick<AccountInput, "name" | "groupId" | "icon" | "color" | "initialBalance">>,
) {
  await updateAccount(id, input);
}

export async function removeAccount(id: string) {
  await deleteAccount(id);
}
