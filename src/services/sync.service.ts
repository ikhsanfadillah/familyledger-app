import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { IndexeddbPersistence } from 'y-indexeddb'
import { getActiveLedgerDb, type Transaction, type Budget } from '~/db/schema'
import { ledgerStore } from '~/stores/ledgerStore'

class SyncService {
  private ydoc: Y.Doc | null = null
  private provider: WebrtcProvider | null = null
  private persistence: IndexeddbPersistence | null = null

  async initForLedger(ledgerId: string, ledgerKey: string) {
    this.disconnect()

    this.ydoc = new Y.Doc()
    
    // Offline persistence inside Yjs
    this.persistence = new IndexeddbPersistence(`yjs-ledger-${ledgerId}`, this.ydoc)
    
    // Wait for persistence to load local state into Y.Doc
    await new Promise<void>((resolve) => {
      this.persistence!.on('synced', () => resolve())
    })

    // WebRTC connection
    // We use the ledgerKey as the secure room name so only people with the key can find the room.
    this.provider = new WebrtcProvider(`fl-room-${ledgerKey}`, this.ydoc, {
      signaling: ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com']
    })

    this.provider.awareness.on('change', () => {
      if (!this.provider) return
      // The awareness list includes ourselves. So peers = size - 1
      const peersCount = Math.max(0, this.provider.awareness.getStates().size - 1)
      ledgerStore.setConnectedPeers(peersCount)
    })

    // Listen for remote changes to sync back to Dexie
    const yTransactions = this.ydoc.getMap<Transaction>('transactions')
    yTransactions.observe((event) => {
      if (event.transaction.local) return // Ignore our own changes
      
      const changesToApply: Transaction[] = []
      event.keysChanged.forEach(key => {
        const item = yTransactions.get(key)
        if (item) changesToApply.push(item)
      })

      if (changesToApply.length > 0) {
        getActiveLedgerDb().transactions.bulkPut(changesToApply)
      }
    })

    const yBudgets = this.ydoc.getMap<Budget>('budgets')
    yBudgets.observe((event) => {
      if (event.transaction.local) return // Ignore our own changes
      
      const changesToApply: Budget[] = []
      event.keysChanged.forEach(key => {
        const item = yBudgets.get(key)
        if (item) changesToApply.push(item)
      })

      if (changesToApply.length > 0) {
        getActiveLedgerDb().budgets.bulkPut(changesToApply)
      }
    })
  }

  // ── Sync Triggers (Called from Dexie Queries) ──────────────────────────

  pushTransaction(transaction: Transaction) {
    if (!this.ydoc) return
    const yTransactions = this.ydoc.getMap<Transaction>('transactions')
    yTransactions.set(transaction.id, transaction)
  }

  deleteTransaction(id: string) {
    if (!this.ydoc) return
    const yTransactions = this.ydoc.getMap<Transaction>('transactions')
    const item = yTransactions.get(id)
    if (item) {
      item.deleted = true
      item.updatedAt = Date.now()
      yTransactions.set(id, item)
    }
  }

  pushBudget(budget: Budget) {
    if (!this.ydoc) return
    const yBudgets = this.ydoc.getMap<Budget>('budgets')
    yBudgets.set(budget.id, budget)
  }

  deleteBudget(id: string) {
    if (!this.ydoc) return
    const yBudgets = this.ydoc.getMap<Budget>('budgets')
    const item = yBudgets.get(id)
    if (item) {
      item.deleted = true
      item.updatedAt = Date.now()
      yBudgets.set(id, item)
    }
  }

  disconnect() {
    this.provider?.destroy()
    this.persistence?.destroy()
    this.ydoc?.destroy()
    this.provider = null
    this.persistence = null
    this.ydoc = null
    ledgerStore.setConnectedPeers(0)
  }

  // Backwards compatibility for __root.tsx
  init() {
    // __root.tsx calls this onMount. We rely on ledgerStore reacting to activeLedger instead.
  }

  notifyChange() {
    // No-op for Yjs, it's automatic.
  }
}

export const syncService = new SyncService()
