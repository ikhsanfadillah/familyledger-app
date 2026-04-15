import {
  type Component,
  createSignal,
  createResource,
  For,
  createEffect,
  untrack,
} from "solid-js";
import { createForm } from "@tanstack/solid-form";
import { getCategories, type TransactionInput } from "~/db/queries";
import { createTransaction, editTransaction } from "~/stores/transaction.store";
import { todayISO } from "~/utils/date";
import type { Category, Transaction } from "~/db/schema";
import { useDrawerContext } from "@ark-ui/solid/drawer";
import {
  DrawerBody,
  DrawerContent,
  DrawerContentInner,
  DrawerHeader,
} from "../ui/drawer";

interface Props {
  /** When set, the modal switches to edit mode */
  editingTransaction?: Transaction | null;
  /** Called after successful submit to clear edit state */
  onDone?: () => void;
}

const TransactionModal: Component<Props> = (props) => {
  const drawerCtx = useDrawerContext();

  // `type` is kept as a standalone signal because it controls which
  // categories are fetched — a side-effect that lives outside the form.
  const [type, setType] = createSignal<"expense" | "income">(
    props.editingTransaction?.type ?? "expense",
  );
  const [categories] = createResource(type, (t) => getCategories(t));

  const isEditing = () => !!props.editingTransaction;

  // Sync type and form fields when editingTransaction changes
  createEffect(() => {
    const tx = props.editingTransaction;
    if (tx) {
      // It's important to set type first so categories query updates
      setType(tx.type);
      untrack(() => {
        form.setFieldValue("amount", tx.amount?.toString() ?? "");
        form.setFieldValue("categoryId", tx.categoryId ?? "");
        form.setFieldValue("note", tx.note ?? "");
        form.setFieldValue("date", tx.date ?? todayISO());
      });
    } else {
      untrack(() => {
        form.reset();
      });
      setType("expense");
    }
  });

  // Auto-select first category when categories load, ONLY if not editing
  createEffect(() => {
    const cats = categories();
    if (!cats?.length) return;

    const current = untrack(() => form.getFieldValue("categoryId"));

    if (!current && !isEditing()) {
      form.setFieldValue("categoryId", cats[0]!.id);
    }
  });

  const form = createForm(() => ({
    defaultValues: {
      amount: props.editingTransaction?.amount?.toString() ?? "",
      categoryId: props.editingTransaction?.categoryId ?? "",
      note: props.editingTransaction?.note ?? "",
      date: props.editingTransaction?.date ?? todayISO(),
    },
    onSubmit: async ({ value }) => {
      const parsed = parseInt(value.amount, 10);
      if (!parsed || parsed <= 0 || !value.categoryId) return;

      const input: TransactionInput = {
        amount: parsed,
        type: type(),
        categoryId: value.categoryId,
        note: value.note,
        date: value.date,
      };

      if (isEditing()) {
        await editTransaction(props.editingTransaction!.id, input);
      } else {
        await createTransaction(input);
      }

      form.reset();
      setType("expense");
      drawerCtx().setOpen(false);
      props.onDone?.();
    },
  }));

  return (
    <DrawerContent variant="inset">
      <DrawerContentInner>
        <DrawerHeader
          title={isEditing() ? "Edit Transaksi" : "Tambah Transaksi"}
          description={
            <div class="flex gap-2 p-1 bg-gray-100 rounded-xl">
              <button
                type="button"
                class="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
                style={{
                  "background-color":
                    type() === "expense" ? "#fff" : "transparent",
                  color: type() === "expense" ? "#EF4444" : "#9ca3af",
                  "box-shadow":
                    type() === "expense" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                }}
                onClick={() => setType("expense")}
              >
                <div class="i-lucide-trending-down text-base" />
                Pengeluaran
              </button>
              <button
                type="button"
                class="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
                style={{
                  "background-color":
                    type() === "income" ? "#fff" : "transparent",
                  color: type() === "income" ? "#10B981" : "#9ca3af",
                  "box-shadow":
                    type() === "income" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                }}
                onClick={() => setType("income")}
              >
                <div class="i-lucide-trending-up text-base" />
                Pemasukan
              </button>
            </div>
          }
        />
        <DrawerBody>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            class="px-5 pb-8"
          >
            {/* Amount */}
            <form.Field
              name="amount"
              children={(field) => (
                <label class="block mb-5">
                  <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">
                    Jumlah
                  </span>
                  <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base font-medium">
                      Rp
                    </span>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="0"
                      name={field().name}
                      value={field().state.value}
                      onBlur={field().handleBlur}
                      onInput={(e) =>
                        field().handleChange(e.currentTarget.value)
                      }
                      class="w-full text-2xl font-bold py-3.5 pl-12 pr-4 rounded-xl border-2 outline-none transition-all"
                      style={{
                        "border-color": field().state.value
                          ? "#3B82F6"
                          : "#e5e7eb",
                        "background-color": field().state.value
                          ? "#EFF6FF"
                          : "#fff",
                      }}
                      required
                    />
                  </div>
                </label>
              )}
            />

            {/* Category */}
            <form.Field
              name="categoryId"
              children={(field) => (
                <div class="mb-5">
                  <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">
                    Kategori
                  </span>
                  <div class="grid grid-cols-5 gap-2">
                    <For each={categories() ?? []}>
                      {(cat: Category) => (
                        <button
                          type="button"
                          class="flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-xs transition-all"
                          style={{
                            "background-color":
                              field().state.value === cat.id
                                ? cat.color + "15"
                                : "#f8fafc",
                            border:
                              field().state.value === cat.id
                                ? `2px solid ${cat.color}`
                                : "2px solid transparent",
                            transform:
                              field().state.value === cat.id
                                ? "scale(1.05)"
                                : "scale(1)",
                          }}
                          onClick={() => {
                            field().handleChange(cat.id);
                          }}
                        >
                          <span class="text-xl">{cat.icon}</span>
                          <span
                            class="truncate w-full text-center font-medium"
                            style={{
                              color:
                                field().state.value === cat.id
                                  ? cat.color
                                  : "#6b7280",
                              "font-size": "0.6rem",
                            }}
                          >
                            {cat.name}
                          </span>
                        </button>
                      )}
                    </For>
                  </div>
                </div>
              )}
            />

            {/* Note */}
            <form.Field
              name="note"
              children={(field) => (
                <label class="block mb-4">
                  <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">
                    Catatan
                  </span>
                  <div class="relative">
                    <div class="i-lucide-message-square text-gray-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Opsional..."
                      name={field().name}
                      value={field().state.value}
                      onBlur={field().handleBlur}
                      onInput={(e) =>
                        field().handleChange(e.currentTarget.value)
                      }
                      class="w-full py-3 pl-10 pr-4 rounded-xl border-2 border-gray-100 outline-none text-sm transition-all focus:border-primary-300"
                    />
                  </div>
                </label>
              )}
            />

            {/* Date */}
            <form.Field
              name="date"
              children={(field) => (
                <label class="block mb-6">
                  <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">
                    Tanggal
                  </span>
                  <div class="relative">
                    <div class="i-lucide-calendar text-gray-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      name={field().name}
                      value={field().state.value}
                      onBlur={field().handleBlur}
                      onInput={(e) =>
                        field().handleChange(e.currentTarget.value)
                      }
                      class="w-full py-3 pl-10 pr-4 rounded-xl border-2 border-gray-100 outline-none text-sm transition-all focus:border-primary-300"
                    />
                  </div>
                </label>
              )}
            />

            {/* Submit */}
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={(state) => (
                <button
                  type="submit"
                  disabled={state()[1] as boolean}
                  class="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all active:scale-98 flex items-center justify-center gap-2"
                  style={{
                    background:
                      "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
                    "box-shadow": "0 4px 16px rgba(59, 130, 246, 0.3)",
                    opacity: (state()[1] as boolean) ? "0.7" : "1",
                  }}
                >
                  <div class="i-lucide-check text-lg" />
                  {(state()[1] as boolean)
                    ? "Menyimpan..."
                    : isEditing()
                      ? "Simpan Perubahan"
                      : "Simpan Transaksi"}
                </button>
              )}
            />
          </form>
        </DrawerBody>
      </DrawerContentInner>
    </DrawerContent>
  );
};

export default TransactionModal;
