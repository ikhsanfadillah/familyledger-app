# 🚀 Brainstorming: Scaling up to Multi-Ledger

## 1. Goal & Concept

Currently, FamilyLedger assumes a single default dataset. To support multiple ledgers (e.g., 1 Private, 1 Family, 1 Office), we need to introduce a "Workspace" or "Ledger" boundary. This will securely scope all transactions, categories, budgets, and—most importantly—the **P2P synchronization**.

## 2. Database Schema Changes (Dexie)

We need to introduce the concept of ledgers and link our existing data to them.

### New Tables

- **`ledgers`**: Stores the metadata of the ledger.
  - `{ id, name, type (private | shared), icon, themeColor, createdAt, updatedAt }`
- **`ledger_members`**: Maps which device/user has access to which ledger. This is crucial for P2P security.
  - `{ id, ledgerId, deviceId, role, joinedAt }`

### Modified Tables

All data entities must be scoped to a ledger:

- **`transactions`**: add `ledgerId: string`
- **`budgets`**: add `ledgerId: string`
- **`categories`**: add `ledgerId: string` _(Office ledgers have different categories than Family ledgers)_.

**Index Update needed:**
On Dexie `.version(3)`, we'll need to update indexes (e.g., `transactions: 'id, ledgerId, date, ...'`).

## 3. P2P Synchronization Adjustments (Crucial!)

Right now (`sync.service.ts`), `exportSyncData()` simply dumps all `transactions` and `budgets` arrays to anyone connected. **This would leak your private transactions to your office friends.**

- **Scoping Sync:** When a `SYNC_REQUEST` is received, the app must look up `deviceId` in `ledger_members`. It should only export data where `ledgerId` matches the allowed ledgers for that specific Peer.
- **QR Code Pairing:** When scanning a QR code, the user flow should change. Instead of "just pairing", it should be "Invite to Ledger". The QR code could contain `peerId` + `ledgerId`.
- **New Sync Payloads:** Introduce `LEDGER_INVITE`, `LEDGER_JOIN_ACCEPT` to establish connections specifically related to a shared workspace.

## 4. UI / UX Implications

- **Ledger Switcher / Workspace Context**: A dropdown or sidebar menu allowing users to switch contexts (like Notion workspaces or Slack servers).
- **Global State**: A SolidJS store (e.g., `useLedgerStore()`) holding `activeLedgerId`. Every view (Dashboard, Transactions list, Reports) automatically filters based on `activeLedgerId`.
- **Ledger Settings**: Each ledger has its own settings tab. A "Shared with" section to see the connected Peers and manage access.
- **Color/Theme Mapping**: Allow each Ledger to have a specific theme color so users instantly know if they are logging an expense in "Private" or "Office".

## 5. Migration Strategy for Existing Data

To prevent breaking current users:

1.  Upon app upgrade, create a default ledger called **"Personal Ledger"**.
2.  Run a Dexie migration script `upgrade()` that loops through all existing `transactions`, `budgets`, and `categories`, setting their `ledgerId` to the Personal Ledger's ID.
3.  Automatically map any previously paired devices in the `devices` table to have access to this new Personal Ledger so existing sync setups do not break.

## 6. Recommended Implementation Phases

- **Phase 1: DB & State foundation.** Update schemas, write migration scripts, and add `activeLedgerId` global state. Break no UI, but enforce everything goes to a default ledger behind the scenes.
- **Phase 2: UI Overhaul.** Build the Ledger Switcher component, creation forms, and update all `db.<table...>` queries in components to filter by active ledger.
- **Phase 3: The Sync Layer.** Rewrite `sync.service.ts` to isolate sharing. Implement scoped payload building and "Invite to Ledger" QR concepts.
