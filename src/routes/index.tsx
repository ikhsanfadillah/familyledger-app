import { createFileRoute, useLocation, useNavigate } from "@tanstack/solid-router";
import { onMount } from "solid-js";
import { Spinner } from "~/components/ui/spinner";
import { ledgerStore } from "~/stores/ledgerStore";

export const Route = createFileRoute("/")({
  component: Component,
});

function Component() {
  const navigate = useNavigate();
  const location = useLocation(); // Ambil info lokasi saat ini

  // After DB is unlocked, redirect based on whether user exists
  onMount(() => {
    if (!ledgerStore.isDbUnlocked()) return;
    console.log("ledgerStore.hasUser()", ledgerStore.hasUser());
    console.log("location().pathname", location().pathname);
    if (!ledgerStore.hasUser()) {
      navigate({
        to: "/onboarding",
        replace: true, // Gunakan replace agar tidak memenuhi history browser
      });
    } else if (ledgerStore.hasUser()) {
      navigate({
        to: "/transactions",
        replace: true, // Gunakan replace agar tidak memenuhi history browser
      });
    }
  });

  return <Spinner />;
}
