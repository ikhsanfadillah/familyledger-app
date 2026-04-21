import { Link, useMatches } from "@tanstack/solid-router";
import { For } from "solid-js";

const navItems = [
  // {
  //   to: "/dashboard" as const,
  //   label: "Dashboard",
  //   icon: "i-lucide-layout-dashboard",
  //   iconActive: "i-lucide-layout-dashboard",
  // },
  {
    to: "/transactions" as const,
    label: "Transaksi",
    icon: "i-lucide-receipt-text",
  },
  {
    to: "/budgets" as const,
    label: "Anggaran",
    icon: "i-lucide-wallet",
  },
  {
    to: "/reports" as const,
    label: "Laporan",
    icon: "i-lucide-bar-chart-3",
  },
  {
    to: "/ledgers" as const,
    label: "Ledger",
    icon: "i-lucide-users",
  },
  {
    to: "/settings" as const,
    label: "Pengaturan",
    icon: "i-lucide-settings",
  },
];
export default function BottomNavbar() {
  const matches = useMatches();

  const currentPath = () => {
    const m = matches();
    const last = m[m.length - 1];
    return last?.fullPath ?? "/";
  };

  return (
    <nav
      class="fixed bottom-0 left-0 right-0 z-40 py-3 flex items-center justify-around border-t"
      style={{
        background: "rgba(255, 255, 255, 0.85)",
        "backdrop-filter": "blur(12px)",
        "-webkit-backdrop-filter": "blur(12px)",
      }}
    >
      <For each={navItems}>
        {(item) => {
          const isActive = () => currentPath() === item.to;
          return (
            <Link
              to={item.to}
              class={`flex flex-col items-center justify-center gap-0.5 no-underline transition-all ${isActive() && "text-primary"}`}
              style={{
                transform: isActive() ? "translateY(-1px)" : "none",
              }}
            >
              <div
                class={`text-xl transition-all ${item.icon} `}
                style={{
                  opacity: isActive() ? "1" : "0.6",
                }}
              />
              <span class="text-sm">{item.label}</span>
            </Link>
          );
        }}
      </For>
    </nav>
  );
}
