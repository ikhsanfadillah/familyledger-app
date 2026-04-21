import { createRootRoute, Outlet, useNavigate } from "@tanstack/solid-router";
import { type Component, Show, createEffect } from "solid-js";
import "./root.css";
import { ledgerStore } from "~/stores/ledgerStore";
import { PinScreen } from "~/components/PinScreen";

const RootLayout: Component = () => {
  const navigate = useNavigate();

  // After DB is unlocked, redirect based on whether user exists
  createEffect(() => {
    if (!ledgerStore.isDbUnlocked()) return;
    if (!ledgerStore.hasUser()) {
      navigate({ to: "/onboarding" });
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
