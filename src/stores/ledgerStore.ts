import { createSignal, createRoot } from "solid-js";
import { coreDb, switchLedgerDb, type Ledger } from "~/db/schema";
import { seedAccountGroups, seedAccounts } from "~/db/queries";
import { DEFAULT_ACCOUNT_GROUPS, DEFAULT_ACCOUNTS } from "~/constants/accounts";
import { nanoid } from "nanoid";
import { syncService } from "~/services/sync.service";

function createLedgerStore() {
  const [activeLedgerId, setActiveLedgerId] = createSignal<string | null>(null);
  const [activeLedger, setActiveLedger] = createSignal<Ledger | null>(null);
  const [isDbUnlocked, setIsDbUnlocked] = createSignal(false);
  const [connectedPeers, setConnectedPeers] = createSignal(0); // Will be updated by Yjs layer
  console.log("activeLedgerId", activeLedgerId());
  const switchLedger = async (ledgerId: string) => {
    setActiveLedgerId(ledgerId);
    console.log("ledgerId", ledgerId);
    await switchLedgerDb(ledgerId);
    const ledger = await coreDb.ledgers.get(ledgerId);
    if (ledger) {
      setActiveLedger(ledger);
      syncService.initForLedger(ledgerId, ledger.key);
    }
  };

  const [hasUser, setHasUser] = createSignal(false);

  const unlockDb = async () => {
    try {
      console.log("777", 777);
      const users = await coreDb.users.toArray();
      console.log("888", 888);

      const user = users.length > 0 ? users[0] : null;
      setHasUser(!!user);

      const ledgers = await coreDb.ledgers.toArray();
      console.log("999", 999, ledgers);

      if (ledgers.length > 0) {
        if (user?.defaultLedgerId && ledgers.find((l) => l.id === user.defaultLedgerId)) {
          await switchLedger(user.defaultLedgerId);
          console.log("101010", 101010);
        } else {
          await switchLedger(ledgers[0].id);
          console.log("111111", 111111);
        }
      } else {
        const defaultId = nanoid();
        await coreDb.ledgers.add({
          id: defaultId,
          name: "Personal Ledger",
          key: nanoid(32),
          themeColor: "#3b82f6",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        console.log("create", "1", 1);
        await switchLedger(defaultId);

        console.log("create", "2", 2);
        // Seed default account groups and accounts for the new ledger
        await seedAccountGroups(DEFAULT_ACCOUNT_GROUPS);
        console.log("create", "3", 3);

        await seedAccounts(DEFAULT_ACCOUNTS);
        console.log("create", "4", 4);
      }

      // IMPORTANT: Only set unlocked AFTER switchLedger has fully completed.
      // This prevents protected routes from rendering before getActiveLedgerDb() is ready.
      setIsDbUnlocked(true);
    } catch (error) {
      console.log("error", error);
    }
  };

  return {
    activeLedgerId,
    activeLedger,
    isDbUnlocked,
    hasUser,
    connectedPeers,
    setConnectedPeers,
    switchLedger,
    unlockDb,
  };
}

export const ledgerStore = createRoot(createLedgerStore);
