import { Outlet, createFileRoute, useNavigate } from "@tanstack/solid-router";
import { type Component, createSignal, onMount } from "solid-js";
import { syncService } from "~/services/sync.service";
import FabMenu from "~/components/shared/fab-menu";
import TransactionModal from "~/components/transaction/TransactionModal";
import BudgetModal from "~/components/budget/BudgetModal";
import { Drawer } from "~/components/ui/drawer";
import type { Transaction, Budget } from "~/db/schema";
import "../root.css";
import { ledgerStore } from "~/stores/ledgerStore";
import { LedgerSwitcherDrawer } from "~/components/ledger/LedgerSwitcherDrawer";
import BottomNavbar from "~/components/shared/bottom-navbar";

// ── Global edit states ──────────────────────────────────────────────────
// Lifted here so pages and the FAB can share them.

const [editingTransaction, setEditingTransaction] = createSignal<Transaction | null>(null);
const [isTransactionCreateOpen, setIsTransactionCreateOpen] = createSignal(false);

const [editingBudget, setEditingBudget] = createSignal<Budget | null>(null);
const [isBudgetCreateOpen, setIsBudgetCreateOpen] = createSignal(false);
const [isSwitcherOpen, setIsSwitcherOpen] = createSignal(false);

export { editingTransaction, setEditingTransaction, editingBudget, setEditingBudget };

const RootLayout: Component = () => {
  const navigate = useNavigate();

  onMount(() => {
    syncService.init();

    // Listen for Service Worker messages
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "SYNC_TRIGGER") {
          syncService.notifyChange(); // Or perform a pull
        }
      });
    }
  });

  return (
    <div class="min-h-screen bg-gray-50 font-sans text-gray-900 pb-18">
      {/* Top Header */}
      <header
        class="bg-white px-4 py-3 shadow flex items-center justify-between sticky top-0 z-30 cursor-pointer"
        onClick={() => setIsSwitcherOpen(true)}
      >
        <div class="flex items-center gap-2">
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
            style={{ "background-color": ledgerStore.activeLedger()?.themeColor || "#3b82f6" }}
          >
            {ledgerStore.activeLedger()?.name.charAt(0) || "L"}
          </div>
          <div class="flex flex-col">
            <div class="flex items-center gap-1">
              <span class="text-sm font-semibold leading-tight text-slate-800">
                {ledgerStore.activeLedger()?.name || "Loading..."}
              </span>
              <div class="i-lucide-chevron-down text-slate-400 text-xs" />
            </div>
            <span class="text-[0.65rem] text-gray-500">Ketuk untuk ubah ledger</span>
          </div>
        </div>

        <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200">
          <div
            class={`w-2 h-2 rounded-full ${ledgerStore.connectedPeers() > 0 ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}
          />
          <span class="text-[0.7rem] font-medium text-slate-600">
            {ledgerStore.connectedPeers()} peer{ledgerStore.connectedPeers() !== 1 ? "s" : ""}
          </span>
        </div>
      </header>

      {/* Page content */}
      <main class="px-4 pt-4 max-w-lg mx-auto">
        <Outlet />
      </main>

      <BottomNavbar />

      {/* Global Modals */}
      <Drawer
        preventDragOnScroll={true}
        open={isTransactionCreateOpen() || !!editingTransaction()}
        onOpenChange={(details) => {
          if (!details.open) {
            setIsTransactionCreateOpen(false);
            setEditingTransaction(null);
          }
        }}
      >
        <TransactionModal
          editingTransaction={editingTransaction()}
          onDone={() => {
            setIsTransactionCreateOpen(false);
            setEditingTransaction(null);
          }}
        />
      </Drawer>

      <Drawer
        preventDragOnScroll={true}
        open={isBudgetCreateOpen() || !!editingBudget()}
        onOpenChange={(details) => {
          if (!details.open) {
            setIsBudgetCreateOpen(false);
            setEditingBudget(null);
          }
        }}
      >
        <BudgetModal
          editingBudget={editingBudget()}
          onDone={() => {
            setIsBudgetCreateOpen(false);
            setEditingBudget(null);
          }}
        />
      </Drawer>

      {/* FAB Menu */}
      <FabMenu
        items={[
          {
            id: "transaction",
            label: "Transaksi Baru",
            icon: "i-lucide-receipt-text",
            color: "#10B981", // Emerald 500
            onClick: () => setIsTransactionCreateOpen(true),
          },
          {
            id: "budget",
            label: "Anggaran Baru",
            icon: "i-lucide-wallet",
            color: "#F59E0B", // Amber 500
            onClick: () => setIsBudgetCreateOpen(true),
          },
        ]}
      />

      {/* Ledger Switcher */}
      <LedgerSwitcherDrawer
        isOpen={isSwitcherOpen()}
        onClose={() => setIsSwitcherOpen(false)}
        onCreateNewClick={() => {
          setIsSwitcherOpen(false);
          navigate({ to: "/ledgers" });
        }}
      />
    </div>
  );
};

export const Route = createFileRoute("/(protected)")({
  component: RootLayout,
});
