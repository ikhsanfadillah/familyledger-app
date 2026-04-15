# AGENT.md — Family Budget PWA (Offline-First, P2P)

## Project identity

- **Name**: FamilyLedger (or rename freely)
- **Purpose**: Personal family money budgeting app — halal, private, no cloud dependency
- **Owner device**: Master (full read/write + sync host)
- **Family devices**: Clients (full read/write, sync as peers)
- **Principle**: Offline-first. App must be 100% functional with zero internet, zero server.

---

## Hard rules (never break these)

1. **Offline-first always** — every feature must work without network. Network is enhancement, not requirement.
2. **No cloud storage** — no Firebase, no Supabase, no external DB. Data stays on device.
3. **No tracking, no analytics** — no Google Analytics, no Sentry, no third-party scripts that phone home.
4. **SolidJS only** — do not introduce React, Vue, or other UI frameworks.
5. **Single codebase** — master and client behaviour is controlled by a runtime flag, not separate builds.
6. **CRDT-based sync** — never use last-write-wins for conflict resolution on list data. Use Yjs or Automerge.
7. **IndexedDB via Dexie.js** — do not use localStorage for anything except tiny UI preferences.
8. **No unnecessary dependencies** — if it can be done in 20 lines of vanilla JS, do not add a library.
9. **TypeScript strict mode** — `"strict": true` in tsconfig. No `any` without a comment explaining why.
10. **Mobile-first UI** — design for 375px width first, scale up. No desktop-only layouts.

---

## Tech stack (locked)

| Layer                     | Library / Tool                              | Version target |
| ------------------------- | ------------------------------------------- | -------------- |
| UI framework              | SolidJS                                     | ^1.9           |
| Base UI components        | Ark UI (`@ark-ui/solid`)                    | ^5.35          |
| Build tool                | Vite                                        | ^8             |
| PWA / Service Worker      | vite-plugin-pwa + Workbox                   | latest         |
| Local database            | Dexie.js (IndexedDB)                        | ^4             |
| P2P transport             | PeerJS (WebRTC wrapper)                     | ^1.5           |
| CRDT / sync               | Yjs                                         | ^13            |
| Styling                   | UnoCSS (utility-first, Tailwind-compatible) | latest         |
| Component variants        | tailwind-variants                           | ^3.2           |
| Icons                     | unplugin-icons + iconify                    | latest         |
| Charts                    | Chart.js (loaded lazily via solid wrapper)  | ^4             |
| QR pairing                | qrcode + html5-qrcode                       | latest         |
| Date handling             | date-fns                                    | ^4             |
| Currency format           | Intl.NumberFormat (built-in, no library)    | —              |
| Runtime / package manager | Bun                                         | latest         |
| Testing                   | Bun test (built-in)                         | —              |

---

## Project structure

```
familyledger/
├── AGENT.md                  ← this file, always read first
├── package.json
├── bun.lockb                 ← Bun lockfile, commit this
├── vite.config.ts
├── tsconfig.json
├── index.html
├── public/
│   ├── manifest.json         ← PWA manifest
│   └── icons/                ← app icons (192, 512, maskable)
└── src/
    ├── main.tsx              ← SolidJS entry
    ├── App.tsx               ← root component + router
    ├── db/
    │   ├── schema.ts         ← Dexie schema + migrations
    │   ├── queries.ts        ← all DB read/write helpers
    │   └── sync-log.ts       ← CRDT operation log table
    ├── sync/
    │   ├── ydoc.ts           ← Yjs document setup
    │   ├── peer.ts           ← PeerJS connection manager
    │   ├── signalling.ts     ← local QR / manual ID pairing
    │   └── background-sync.ts← Service Worker sync handler
    ├── stores/
    │   ├── budget.store.ts   ← SolidJS reactive store for budgets
    │   ├── transaction.store.ts
    │   └── device.store.ts   ← master/client role, peer list
    ├── components/
    │   ├── layout/
    │   ├── budget/
    │   ├── transaction/
    │   ├── sync/
    │   └── shared/
    ├── pages/
    │   ├── Dashboard.tsx
    │   ├── Transactions.tsx
    │   ├── Budgets.tsx
    │   ├── Reports.tsx
    │   └── Settings.tsx
    ├── sw/
    │   └── sw.ts             ← custom service worker additions
    └── utils/
        ├── currency.ts
        ├── date.ts
        └── crypto.ts         ← device ID generation
```

---

## Data model

### Transaction

```ts
interface Transaction {
  id: string; // nanoid, client-generated
  amount: number; // always positive, in smallest currency unit (cents/fils)
  type: "income" | "expense";
  categoryId: string;
  note: string;
  date: string; // ISO 8601 date string YYYY-MM-DD
  createdAt: number; // Unix timestamp ms
  updatedAt: number;
  deviceId: string; // which device created it
  deleted: boolean; // soft delete only, never hard delete synced records
}
```

### Budget

```ts
interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  period: "monthly" | "weekly";
  startDate: string;
  createdAt: number;
  updatedAt: number;
  deleted: boolean;
}
```

### Category

```ts
interface Category {
  id: string;
  name: string;
  icon: string; // iconify icon name
  color: string; // hex
  type: "income" | "expense" | "both";
  order: number;
  deleted: boolean;
}
```

### Device

```ts
interface Device {
  id: string; // nanoid, permanent, stored in IndexedDB
  name: string; // human label e.g. "Ayah's phone"
  role: "master" | "client";
  lastSeen: number;
}
```

---

## Sync protocol

### Pairing flow

1. Master opens "Add device" — generates PeerJS peer ID, shows as QR code
2. Client scans QR → gets peer ID → connects via PeerJS
3. On connect: master sends full Yjs state vector → client merges
4. Pairing saved to IndexedDB — reconnects automatically next time

### Ongoing sync

- All data mutations go through Yjs Y.Map / Y.Array
- Yjs handles CRDT merge automatically
- On PeerJS connection: exchange Yjs state vectors, apply diffs
- Service Worker Background Sync API queues sync when offline → fires when back online
- Sync is always bidirectional (client can also add data offline)

### Conflict strategy

- Yjs CRDT resolves structural conflicts automatically
- `deletedAt` timestamp wins on soft-delete conflicts
- `updatedAt` is informational only, not used for conflict resolution

---

## PWA requirements

```json
// manifest.json must include
{
  "name": "FamilyLedger",
  "short_name": "Ledger",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#0f6e56",
  "start_url": "/",
  "scope": "/"
}
```

- Service Worker must cache: all JS/CSS/HTML, fonts, icons
- Cache strategy: **Cache First** for static assets, **Network First with offline fallback** for none
- App must load and be interactive with no network (install PWA → airplane mode → open = works)

---

## Currency & locale

- Default currency: **IDR (Indonesian Rupiah)** — display as `Rp 1.500.000`
- Support adding other currencies per-family preference in Settings
- Use `Intl.NumberFormat` — never a library
- Amounts stored as integer (smallest unit). IDR has no decimal subdivision — store as integer rupiah.

---

## UI conventions

- **Bottom navigation** (mobile): Dashboard | Transactions | Budgets | Reports | Settings
- **FAB** (floating action button): quick-add transaction from any screen
- **Color palette**: primary blue `#3B82F6`, accent `#06B6D4`, success `#10B981`, danger `#EF4444`
- **Dark mode**: supported via CSS media query, stored preference in localStorage
- **RTL**: not required initially, but avoid hardcoded left/right — use start/end
- **Language**: Indonesian (Bahasa) first, English as fallback

---

## Ark UI — base component library

All custom UI components are built on top of **Ark UI** (`@ark-ui/solid`). Ark UI provides headless, accessible primitives that we style with UnoCSS + tailwind-variants.

### Key patterns

- **Imports**: Always import from specific entry points, e.g. `@ark-ui/solid/drawer`, `@ark-ui/solid/field`, `@ark-ui/solid/factory`
- **Factory**: Use `ark` factory from `@ark-ui/solid/factory` for styled HTML elements that integrate with the Ark ecosystem
- **Props**: Use SolidJS `splitProps` + `mergeProps` to handle component props — never destructure directly (breaks reactivity)
- **Variants**: Use `tailwind-variants` (`tv()`) for component style variants, never ad-hoc class logic
- **Data attributes**: Use `data-slot`, `data-state`, `data-size`, `data-variant` for CSS targeting
- **asChild**: Supported on triggers and other composable parts
- **Context**: Access parent component state via `use*Context()` hooks (e.g. `useDrawerContext()`)

### Existing UI components (in `src/components/ui/`)

| Component     | File              | Ark UI base                                |
| ------------- | ----------------- | ------------------------------------------ |
| Button        | `button.tsx`      | `ark.button` (factory)                     |
| Drawer        | `drawer.tsx`      | `@ark-ui/solid/drawer`                     |
| Field / Label | `field.tsx`       | `@ark-ui/solid/field`, `fieldset`          |
| Input         | `input.tsx`       | `FieldInput` from `@ark-ui/solid/field`    |
| InputGroup    | `input-group.tsx` | `ark.div` + `Input` composition            |
| Textarea      | `textarea.tsx`    | `FieldTextarea` from `@ark-ui/solid/field` |
| Separator     | `separator.tsx`   | `ark.div`                                  |
| ScrollArea    | `scroll-area.tsx` | Custom                                     |
| Spinner       | `spinner.tsx`     | Custom SVG                                 |

### When building new components

1. Check if Ark UI has a headless primitive for the component (ref: https://ark-ui.com/llms-solid.txt)
2. If yes, wrap it with tailwind-variants styling following the pattern in existing components
3. If no, use `ark` factory elements for the base HTML
4. Always export from `~/components/ui/` and use in route/feature components

---

## What AI agents must do before writing code

1. **Read this file fully** before generating any code
2. Check `src/db/schema.ts` before adding new fields — never break existing migrations
3. All new DB fields need a migration version bump in Dexie schema
4. New components go in `src/components/` — never inline large components in pages
5. All async operations must handle offline errors gracefully — show user-friendly message, queue for retry
6. Never delete a synced record from IndexedDB — set `deleted: true` instead
7. Run `bun run typecheck` mentally before finalising — no TypeScript errors acceptable

---

## Commands

```bash
bun install         # install dependencies
bun dev             # dev server with PWA hot reload
bun run build       # production build
bun run preview     # preview production build locally
bun run typecheck   # tsc --noEmit
bun test            # bun built-in test runner
```

---

## Current build status

- [x] Project scaffolded
- [x] Dexie schema defined
- [x] SolidJS routing set up (TanStack Router, file-based)
- [x] PWA manifest + icons
- [x] Service Worker caching (via vite-plugin-pwa)
- [x] Basic transaction CRUD (create, list, soft-delete)
- [x] IDR currency formatting
- [x] Category seed data
- [x] Bottom navigation + FAB
- [x] Transaction creation modal (Drawer)
- [x] Transaction edit flow
- [x] Transaction search & filter
- [x] Dashboard (hero card, charts, recent)
- [x] Reports / charts (donut, category breakdown, month comparison)
- [x] Budget CRUD
- [x] Yjs CRDT setup
- [x] PeerJS pairing
- [x] Background sync
- [x] QR pairing UI
- [x] Dark mode

_Last updated: 2026-04-08_
