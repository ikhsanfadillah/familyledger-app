import { createResource, For, Show, type Component } from "solid-js";
import { coreDb, type Ledger } from "~/db/schema";
import { ledgerStore } from "~/stores/ledgerStore";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerContentInner,
  DrawerHeader,
} from "~/components/ui/drawer";
import { Button } from "../ui/button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreateNewClick: () => void;
}

export const LedgerSwitcherDrawer: Component<Props> = (props) => {
  const [ledgers] = createResource<Ledger[]>(() => coreDb.ledgers.toArray());

  const handleSwitch = async (id: string) => {
    if (ledgerStore.activeLedgerId() !== id) {
      await ledgerStore.switchLedger(id);
    }
    props.onClose();
  };

  return (
    <Drawer
      open={props.isOpen}
      onOpenChange={(details) => {
        if (!details.open) props.onClose();
      }}
    >
      <DrawerContentInner class="p-4">
        <DrawerContent class="flex flex-col">
          <DrawerHeader
            title="Pilih Ledger"
            description="Pindah context (workspace) ke ledger lain."
            class="border-b relative flex items-start justify-center"
          >
            <Button
              onClick={() => {
                props.onClose();
                props.onCreateNewClick();
              }}
              size="icon-lg"
              class="absolute right-2"
            >
              <div class="i-lucide-plus" />
            </Button>
          </DrawerHeader>

          <DrawerBody class="flex-1 overflow-y-auto space-y-3 custom-scrollbar p-4">
            <For
              each={ledgers()}
              fallback={
                <div class="flex justify-center p-4">
                  <div class="i-lucide-loader-2 animate-spin text-gray-400" />
                </div>
              }
            >
              {(ledger) => {
                const isActive = () => ledger.id === ledgerStore.activeLedgerId();
                return (
                  <button
                    onClick={() => handleSwitch(ledger.id)}
                    class="w-full text-left p-4 rounded-2xl flex items-center justify-between transition-all border"
                  >
                    <div class="flex items-center gap-4">
                      <div
                        class="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
                        style={{ "background-color": ledger.themeColor || "var(--color-primary)" }}
                      >
                        {ledger.name.charAt(0).toUpperCase()}
                      </div>
                      <div class="flex flex-col">
                        <span class="font-bold text-gray-900">{ledger.name}</span>
                        <span class="text-xs text-gray-500">
                          {isActive() ? "Saat ini aktif" : "Ketuk untuk beralih"}
                        </span>
                      </div>
                    </div>
                    <Show when={isActive()}>
                      <div class="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <div class="i-lucide-check text-sm" />
                      </div>
                    </Show>
                  </button>
                );
              }}
            </For>
          </DrawerBody>
        </DrawerContent>
      </DrawerContentInner>
    </Drawer>
  );
};
