import { createSignal, createRoot } from 'solid-js'
import { coreDb, switchLedgerDb, type Ledger } from '~/db/schema'
import { nanoid } from 'nanoid'
import { syncService } from '~/services/sync.service'

function createLedgerStore() {
  const [activeLedgerId, setActiveLedgerId] = createSignal<string | null>(null)
  const [activeLedger, setActiveLedger] = createSignal<Ledger | null>(null)
  const [isDbUnlocked, setIsDbUnlocked] = createSignal(false)
  const [connectedPeers, setConnectedPeers] = createSignal(0) // Will be updated by Yjs layer

  const switchLedger = async (ledgerId: string) => {
    setActiveLedgerId(ledgerId)
    await switchLedgerDb(ledgerId)
    const ledger = await coreDb.ledgers.get(ledgerId)
    if (ledger) {
      setActiveLedger(ledger)
      syncService.initForLedger(ledgerId, ledger.key)
    }
  }

  const unlockDb = async () => {
    setIsDbUnlocked(true)
    const users = await coreDb.users.toArray()
    const user = users.length > 0 ? users[0] : null
    
    const ledgers = await coreDb.ledgers.toArray()
    if (ledgers.length > 0) {
      if (user?.defaultLedgerId && ledgers.find(l => l.id === user.defaultLedgerId)) {
        await switchLedger(user.defaultLedgerId)
      } else {
        await switchLedger(ledgers[0].id)
      }
    } else {
      const defaultId = nanoid()
      await coreDb.ledgers.add({
        id: defaultId,
        name: 'Personal Ledger',
        key: nanoid(32),
        themeColor: '#3b82f6',
        createdAt: Date.now(),
        updatedAt: Date.now()
      })
      await switchLedger(defaultId)
    }
  }

  return {
    activeLedgerId,
    activeLedger,
    isDbUnlocked,
    connectedPeers,
    setConnectedPeers,
    switchLedger,
    unlockDb
  }
}

export const ledgerStore = createRoot(createLedgerStore)
