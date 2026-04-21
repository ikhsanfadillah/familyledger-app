import { createRootRoute, Outlet, useNavigate, useLocation } from "@tanstack/solid-router";
import { type Component, Show, createEffect } from "solid-js";
import "./root.css";
import { ledgerStore } from "~/stores/ledgerStore";
import { PinScreen } from "~/components/PinScreen";

const RootLayout: Component = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Ambil info lokasi saat ini
  // After DB is unlocked, redirect based on whether user exists
  createEffect(() => {
    if (!ledgerStore.isDbUnlocked()) return;
    if (!ledgerStore.hasUser() && location().pathname !== "/onboarding") {
      navigate({
        to: "/onboarding",
        replace: true, // Gunakan replace agar tidak memenuhi history browser
      });
    }
  });

  return (
    <div class="max-w-md mx-auto shadow-lg min-h-screen bg-slate-50">
      <Show when={ledgerStore.isDbUnlocked()} fallback={<PinScreen />}>
        <Outlet />
      </Show>
    </div>
  );
};

export const Route = createRootRoute({
  component: RootLayout,
});
