import {
  Outlet,
  Link,
  useMatches,
  createFileRoute,
  useNavigate,
} from "@tanstack/solid-router";
import { type Component, createMemo, createSignal, onMount } from "solid-js";
import { syncService } from "~/services/sync.service";
import FabMenu from "~/components/shared/fab-menu";
import TransactionModal from "~/components/transaction/TransactionModal";
import BudgetModal from "~/components/budget/BudgetModal";
import { Drawer } from "~/components/ui/drawer";
import type { Transaction, Budget } from "~/db/schema";
import "../root.css";
import { getUser } from "~/db/queries";

const navItems = [
  {
    to: "/dashboard" as const,
    label: "Dashboard",
    icon: "i-lucide-layout-dashboard",
    iconActive: "i-lucide-layout-dashboard",
  },
  {
    to: "/transactions" as const,
    label: "Transaksi",
    icon: "i-lucide-receipt-text",
    iconActive: "i-lucide-receipt-text",
  },
  {
    to: "/budgets" as const,
    label: "Anggaran",
    icon: "i-lucide-wallet",
    iconActive: "i-lucide-wallet",
  },
  {
    to: "/reports" as const,
    label: "Laporan",
    icon: "i-lucide-bar-chart-3",
    iconActive: "i-lucide-bar-chart-3",
  },
  {
    to: "/settings" as const,
    label: "Pengaturan",
    icon: "i-lucide-settings",
    iconActive: "i-lucide-settings",
  },
  {
    to: "/sync" as const,
    label: "Sinkron",
    icon: "i-lucide-refresh-cw",
    iconActive: "i-lucide-refresh-cw",
  },
];

// ── Global edit states ──────────────────────────────────────────────────
// Lifted here so pages and the FAB can share them.

const [editingTransaction, setEditingTransaction] =
  createSignal<Transaction | null>(null);
const [isTransactionCreateOpen, setIsTransactionCreateOpen] =
  createSignal(false);

const [editingBudget, setEditingBudget] = createSignal<Budget | null>(null);
const [isBudgetCreateOpen, setIsBudgetCreateOpen] = createSignal(false);

export {
  editingTransaction,
  setEditingTransaction,
  editingBudget,
  setEditingBudget,
};

const RootLayout: Component = () => {
  const matches = useMatches();
  const navigate = useNavigate();

  const currentPath = createMemo(() => {
    const m = matches();
    const last = m[m.length - 1];
    return last?.fullPath ?? "/";
  });

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

  onMount(async () => {
    const user = await getUser();
    if (!user) {
      navigate({ to: "/" });
    }
  });

  return (
    <div class="min-h-screen bg-gray-50 font-sans text-gray-900 pb-18">
      {/* Page content */}
      <main class="px-4 pt-4 max-w-lg mx-auto">
        <Outlet />
      </main>

      {/* Bottom navigation — glass morphism */}
      <nav
        class="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-white/20"
        style={{
          height: "4rem",
          background: "rgba(255, 255, 255, 0.85)",
          "backdrop-filter": "blur(12px)",
          "-webkit-backdrop-filter": "blur(12px)",
        }}
      >
        {navItems.map((item) => {
          const isActive = createMemo(() => currentPath() === item.to);
          return (
            <Link
              to={item.to}
              class="flex flex-col items-center justify-center gap-0.5 no-underline transition-all"
              classList={{
                "text-primary": isActive(),
              }}
              style={{
                transform: isActive() ? "translateY(-1px)" : "none",
              }}
            >
              <div
                class={`${isActive() ? item.iconActive : item.icon} text-xl transition-all`}
                style={{
                  opacity: isActive() ? "1" : "0.6",
                }}
              />
              <span
                class="text-xs transition-all"
                style={{
                  "font-weight": isActive() ? "600" : "400",
                  "font-size": "0.65rem",
                }}
              >
                {item.label}
              </span>
              {/* Active indicator dot */}
              <div
                class="w-1 h-1 rounded-full transition-all"
                classList={{
                  "bg-primary": isActive(),
                }}
                style={{
                  transform: isActive() ? "scale(1)" : "scale(0)",
                }}
              />
            </Link>
          );
        })}
      </nav>

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
    </div>
  );
};

export const Route = createFileRoute("/(protected)")({
  component: RootLayout,
});
