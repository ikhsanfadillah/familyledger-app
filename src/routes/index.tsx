import { createFileRoute, useNavigate } from "@tanstack/solid-router";
import { onMount } from "solid-js";
import { ledgerStore } from "~/stores/ledgerStore";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

/**
 * Index route (`/`) is a pure redirect:
 * - If DB is unlocked and user exists → go to /transactions
 * - If DB is unlocked and no user → go to /onboarding
 * - If DB is not unlocked → __root.tsx shows PinScreen (we never get here)
 */
function IndexRedirect() {
  const navigate = useNavigate();

  onMount(() => {
    if (ledgerStore.isDbUnlocked()) {
      if (ledgerStore.hasUser()) {
        navigate({ to: "/transactions" });
      } else {
        navigate({ to: "/onboarding" });
      }
    }
  });

  return null;
}
