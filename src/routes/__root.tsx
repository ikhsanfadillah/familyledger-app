import { createRootRoute, Outlet } from "@tanstack/solid-router";
import { type Component, Show } from "solid-js";
import "./root.css";
import { ledgerStore } from "~/stores/ledgerStore";
import { PinScreen } from "~/components/PinScreen";

const RootLayout: Component = () => {
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
