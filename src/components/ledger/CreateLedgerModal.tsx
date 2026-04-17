import { createSignal, Show, type Component } from "solid-js";
import { coreDb } from "~/db/schema";
import { ledgerStore } from "~/stores/ledgerStore";
import { nanoid } from "nanoid";
import { Drawer } from "~/components/ui/drawer";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const THEME_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#14b8a6", // Teal
  "#64748b", // Slate
];

export const CreateLedgerModal: Component<Props> = (props) => {
  const [name, setName] = createSignal("");
  const [themeColor, setThemeColor] = createSignal(THEME_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!name().trim()) return;

    setIsSubmitting(true);
    try {
      const newLedgerId = nanoid();
      const newLedgerKey = nanoid(32); // Secure key

      await coreDb.ledgers.add({
        id: newLedgerId,
        name: name().trim(),
        key: newLedgerKey,
        themeColor: themeColor(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await ledgerStore.switchLedger(newLedgerId);
      
      // Reset & Close
      setName("");
      setThemeColor(THEME_COLORS[0]);
      props.onClose();
    } catch (err) {
      console.error(err);
      alert("Gagal membuat ledger baru.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      open={props.isOpen}
      onOpenChange={(details) => {
        if (!details.open) props.onClose();
      }}
    >
      <div class="p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-6">Buat Ledger Baru</h2>
        
        <form onSubmit={handleSubmit} class="space-y-6">
          <div class="space-y-2">
            <label class="text-sm font-semibold text-gray-700">Nama Ledger</label>
            <input
              type="text"
              value={name()}
              onInput={(e) => setName(e.currentTarget.value)}
              placeholder="Contoh: Dompet Rahasia"
              class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              required
            />
          </div>

          <div class="space-y-3">
            <label class="text-sm font-semibold text-gray-700">Warna Tema</label>
            <div class="flex flex-wrap gap-3">
              {THEME_COLORS.map((color) => (
                <button
                  type="button"
                  onClick={() => setThemeColor(color)}
                  class="w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90"
                  style={{ "background-color": color }}
                  classList={{
                    "ring-2 ring-offset-2 ring-gray-400 scale-110": themeColor() === color,
                  }}
                >
                  <Show when={themeColor() === color}>
                    <div class="i-lucide-check text-white" />
                  </Show>
                </button>
              ))}
            </div>
          </div>

          <div class="pt-4 flex gap-3">
            <button
              type="button"
              onClick={props.onClose}
              class="flex-1 py-3 text-gray-600 font-semibold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!name().trim() || isSubmitting()}
              class="flex-1 py-3 text-white font-semibold rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
              style={{ "background-color": themeColor() }}
            >
              {isSubmitting() ? <div class="i-lucide-loader-2 animate-spin" /> : "Buat Ledger"}
            </button>
          </div>
        </form>
      </div>
    </Drawer>
  );
};
