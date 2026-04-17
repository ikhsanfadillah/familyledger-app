import { createSignal, createResource, Show, type Component } from "solid-js";
import { coreDb, type Ledger } from "~/db/schema";
import { ledgerStore } from "~/stores/ledgerStore";
import { Drawer } from "~/components/ui/drawer";

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
      <div class="p-6 pb-12 flex flex-col max-h-[80vh]">
        <header class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-gray-900">Pilih Ledger</h2>
          <button 
            onClick={() => {
              props.onClose();
              props.onCreateNewClick();
            }}
            class="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
          >
            + Baru
          </button>
        </header>
        
        <p class="text-sm text-gray-500 mb-6">Pindah context (workspace) ke ledger lain.</p>

        <div class="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
          <Show when={ledgers()} fallback={<div class="flex justify-center p-4"><div class="i-lucide-loader-2 animate-spin text-gray-400" /></div>}>
            {(data) => data().map((ledger) => {
              const isActive = ledger.id === ledgerStore.activeLedgerId();
              return (
                <button
                  onClick={() => handleSwitch(ledger.id)}
                  class="w-full text-left p-4 rounded-2xl flex items-center justify-between transition-all border border-transparent active:scale-[0.98]"
                  classList={{
                    "bg-gray-50 border-gray-100 hover:bg-gray-100": !isActive,
                    "bg-white shadow-sm ring-2 ring-blue-500/20 border-blue-100": isActive,
                  }}
                >
                  <div class="flex items-center gap-4">
                    <div 
                      class="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
                      style={{ "background-color": ledger.themeColor || "#3b82f6" }}
                    >
                      {ledger.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="flex flex-col">
                      <span class="font-bold text-gray-900">{ledger.name}</span>
                      <span class="text-xs text-gray-500">
                        {isActive ? "Saat ini aktif" : "Ketuk untuk beralih"}
                      </span>
                    </div>
                  </div>
                  <Show when={isActive}>
                    <div class="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                      <div class="i-lucide-check text-sm" />
                    </div>
                  </Show>
                </button>
              );
            })}
          </Show>
        </div>
      </div>
    </Drawer>
  );
};
