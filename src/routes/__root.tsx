import {
  createRootRoute,
  Outlet,
  Link,
  useMatches,
} from "@tanstack/solid-router";
import { type Component, createMemo, createSignal, onMount } from "solid-js";
import { syncService } from "~/services/sync.service";
import FabMenu, { type FabMenuItem } from "~/components/shared/fab-menu";
import TransactionModal from "~/components/transaction/TransactionModal";
import BudgetModal from "~/components/budget/BudgetModal";
import { Drawer } from "~/components/ui/drawer";
import type { Transaction, Budget } from "~/db/schema";
import "./root.css";

const navItems = [
  {
    to: "/" as const,
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

const RootLayout: Component = () => {
  return <Outlet />;
};

export const Route = createRootRoute({
  component: RootLayout,
});
