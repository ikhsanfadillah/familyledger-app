import {
  type Component,
  createSignal,
  createResource,
  For,
  Show,
  createEffect,
  untrack,
} from "solid-js";
import { createForm } from "@tanstack/solid-form";
import { getCategories, type TransactionInput } from "~/db/queries";
import { createTransaction, editTransaction, createTransfer } from "~/stores/transaction.store";
import { useAccounts } from "~/stores/account.store";
import { todayISO } from "~/utils/date";
import type { Category, Transaction, Account } from "~/db/schema";
import { useDrawerContext } from "@ark-ui/solid/drawer";
import {
  DrawerBody,
  DrawerContent,
  DrawerContentInner,
  DrawerFooter,
  DrawerHeader,
} from "../ui/drawer";
import { Button } from "../ui/button";
import { cn } from "tailwind-variants";

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
  const [type, setType] = createSignal<"expense" | "income" | "transfer">(
    props.editingTransaction?.type ?? "expense",
  );
  const [categories] = createResource(
    () => {
      const t = type();
      return t === "transfer" ? null : t;
    },
    (t) => (t ? getCategories(t) : Promise.resolve([])),
  );

  const accounts = useAccounts();

  const isEditing = () => !!props.editingTransaction;

  // Sync type and form fields when editingTransaction changes
  createEffect(() => {
    const tx = props.editingTransaction;
    if (tx) {
      // Detect transfer mode from transferId
      if (tx.transferId) {
        setType("transfer");
      } else {
        setType(tx.type);
      }
      untrack(() => {
        form.setFieldValue("amount", tx.amount?.toString() ?? "");
        form.setFieldValue("categoryId", tx.categoryId ?? "");
        form.setFieldValue("accountId", tx.accountId ?? "");
        form.setFieldValue("note", tx.note ?? "");
        form.setFieldValue("date", tx.date ?? todayISO());
        if (tx.transferId && tx.transferAccountId) {
          // For transfer editing, set the accounts
          if (tx.type === "expense") {
            form.setFieldValue("fromAccountId", tx.accountId ?? "");
            form.setFieldValue("toAccountId", tx.transferAccountId ?? "");
          } else {
            form.setFieldValue("fromAccountId", tx.transferAccountId ?? "");
            form.setFieldValue("toAccountId", tx.accountId ?? "");
          }
        }
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
      accountId: props.editingTransaction?.accountId ?? "",
      note: props.editingTransaction?.note ?? "",
      date: props.editingTransaction?.date ?? todayISO(),
      fromAccountId: "",
      toAccountId: "",
    },
    onSubmit: async ({ value }) => {
      const parsed = parseInt(value.amount, 10);
      if (!parsed || parsed <= 0) return;

      const currentType = type();

      if (currentType === "transfer") {
        // Transfer mode
        if (!value.fromAccountId || !value.toAccountId) return;
        if (value.fromAccountId === value.toAccountId) return;

        await createTransfer({
          amount: parsed,
          fromAccountId: value.fromAccountId,
          toAccountId: value.toAccountId,
          note: value.note,
          date: value.date,
        });
      } else {
        // Expense/Income mode
        if (!value.categoryId) return;

        const input: TransactionInput = {
          amount: parsed,
          type: currentType,
          categoryId: value.categoryId,
          note: value.note,
          date: value.date,
          accountId: value.accountId || undefined,
        };

        if (isEditing()) {
          await editTransaction(props.editingTransaction!.id, input);
        } else {
          await createTransaction(input);
        }
      }

      form.reset();
      setType("expense");
      drawerCtx().setOpen(false);
      props.onDone?.();
    },
  }));

  return (
    <DrawerContent placement="right" variant="inset">
      <form
        class="min-h-full"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <DrawerContentInner
          class="grid grid-rows-[auto_1fr_auto] min-h-full"
        >
          <DrawerHeader
            title={isEditing() ? "Edit Transaksi" : "Tambah Transaksi"}
            description={
              <div class="flex rounded divide-x">
                {[
                  { icon: "i-lucide-trending-down", label: "Pengeluaran", type: "expense" },
                  { icon: "i-lucide-trending-up", label: "Pemasukan", type: "income" },
                  { icon: "i-lucide-arrow-right-left", label: "Transfer", type: "transfer" },
                ].map((item) => (
                  <button
                    type="button"
                    class={cn(
                      "flex-1 py-2.5 rounded-lg border-y text-sm font-semibold transition-all flex items-center justify-center gap-1.5",
                      type() === item.type && "text-primary",
                    )}
                    onClick={() => setType(item.type as any)}
                  >
                    <div class={item.icon + " text-base"} />
                    {item.label}
                  </button>
                ))}
              </div>
            }
          />
          <DrawerBody class="p-4 flex-1">
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
                      onInput={(e) => field().handleChange(e.currentTarget.value)}
                      class="w-full text-2xl font-bold py-3.5 pl-12 pr-4 rounded-xl border-2 outline-none transition-all"
                      style={{
                        "border-color": field().state.value ? "#3B82F6" : "#e5e7eb",
                        "background-color": field().state.value ? "#EFF6FF" : "#fff",
                      }}
                      required
                    />
                  </div>
                </label>
              )}
            />

            {/* Transfer: From / To Account */}
            <Show when={type() === "transfer"}>
              <form.Field
                name="fromAccountId"
                children={(field) => (
                  <div class="mb-5">
                    <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">
                      Dari Akun
                    </span>
                    <AccountSelector
                      accounts={accounts() ?? []}
                      value={field().state.value}
                      onChange={(id) => field().handleChange(id)}
                      excludeId={untrack(() => form.getFieldValue("toAccountId"))}
                    />
                  </div>
                )}
              />

              <div class="flex justify-center mb-3">
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #3B82F6, #2563EB)",
                    "box-shadow": "0 2px 8px rgba(59,130,246,0.3)",
                  }}
                >
                  <div class="i-lucide-arrow-down text-white text-lg" />
                </div>
              </div>

              <form.Field
                name="toAccountId"
                children={(field) => (
                  <div class="mb-5">
                    <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">
                      Ke Akun
                    </span>
                    <AccountSelector
                      accounts={accounts() ?? []}
                      value={field().state.value}
                      onChange={(id) => field().handleChange(id)}
                      excludeId={untrack(() => form.getFieldValue("fromAccountId"))}
                    />
                  </div>
                )}
              />
            </Show>

            {/* Category (only for expense/income) */}
            <Show when={type() !== "transfer"}>
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
                                field().state.value === cat.id ? cat.color + "15" : "#f8fafc",
                              border:
                                field().state.value === cat.id
                                  ? `2px solid ${cat.color}`
                                  : "2px solid transparent",
                              transform:
                                field().state.value === cat.id ? "scale(1.05)" : "scale(1)",
                            }}
                            onClick={() => {
                              field().handleChange(cat.id);
                            }}
                          >
                            <span class="text-xl">{cat.icon}</span>
                            <span
                              class="truncate w-full text-center font-medium"
                              style={{
                                color: field().state.value === cat.id ? cat.color : "#6b7280",
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
            </Show>

            {/* Account (for expense/income — optional) */}
            <Show when={type() !== "transfer"}>
              <form.Field
                name="accountId"
                children={(field) => (
                  <div class="mb-5">
                    <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">
                      Akun
                      <span class="text-gray-300 ml-1 normal-case font-normal">(opsional)</span>
                    </span>
                    <AccountSelector
                      accounts={accounts() ?? []}
                      value={field().state.value}
                      onChange={(id) => field().handleChange(id)}
                      allowClear
                    />
                  </div>
                )}
              />
            </Show>

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
                      onInput={(e) => field().handleChange(e.currentTarget.value)}
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
                      onInput={(e) => field().handleChange(e.currentTarget.value)}
                      class="w-full py-3 pl-10 pr-4 rounded-xl border-2 border-gray-100 outline-none text-sm transition-all focus:border-primary-300"
                    />
                  </div>
                </label>
              )}
            />
          </DrawerBody>
          <DrawerFooter class="p-2 border-t mt-auto">
            {/* Submit */}
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={(state) => (
                <Button
                  type="submit"
                  size="xl"
                  disabled={state()[1] as boolean}
                  class={cn(
                    "w-full rounded-xl h-11 text-white font-semibold text-sm transition-all active:scale-98 flex items-center justify-center gap-2",
                    "bg-primary",
                  )}
                >
                  <div
                    class={
                      type() === "transfer"
                        ? "i-lucide-arrow-left-right text-lg"
                        : "i-lucide-check text-lg"
                    }
                  />
                  {(state()[1] as boolean)
                    ? "Menyimpan..."
                    : isEditing()
                      ? "Simpan Perubahan"
                      : type() === "transfer"
                        ? "Transfer Sekarang"
                        : "Simpan Transaksi"}
                </Button>
              )}
            />
          </DrawerFooter>
        </DrawerContentInner>
      </form>
    </DrawerContent>
  );
};

// ── Account Selector Sub-component ──────────────────────────────────────

interface AccountSelectorProps {
  accounts: Account[];
  value: string;
  onChange: (id: string) => void;
  excludeId?: string;
  allowClear?: boolean;
}

const AccountSelector: Component<AccountSelectorProps> = (props) => {
  const filtered = () => props.accounts.filter((a) => !props.excludeId || a.id !== props.excludeId);

  return (
    <div class="flex flex-wrap gap-2">
      {/* Clear / "Tanpa Akun" button */}
      <Show when={props.allowClear}>
        <button
          type="button"
          class="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs transition-all"
          style={{
            "background-color": !props.value ? "#f0f9ff" : "#f8fafc",
            border: !props.value ? "2px solid #93c5fd" : "2px solid transparent",
            transform: !props.value ? "scale(1.02)" : "scale(1)",
          }}
          onClick={() => props.onChange("")}
        >
          <span class="text-base">🚫</span>
          <span
            class="font-medium"
            style={{
              color: !props.value ? "#3B82F6" : "#6b7280",
              "font-size": "0.65rem",
            }}
          >
            Tanpa Akun
          </span>
        </button>
      </Show>

      <For each={filtered()}>
        {(acc: Account) => (
          <button
            type="button"
            class="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs transition-all"
            style={{
              "background-color": props.value === acc.id ? acc.color + "15" : "#f8fafc",
              border: props.value === acc.id ? `2px solid ${acc.color}` : "2px solid transparent",
              transform: props.value === acc.id ? "scale(1.02)" : "scale(1)",
            }}
            onClick={() => props.onChange(acc.id)}
          >
            <span class="text-base">{acc.icon}</span>
            <span
              class="font-medium"
              style={{
                color: props.value === acc.id ? acc.color : "#6b7280",
                "font-size": "0.65rem",
              }}
            >
              {acc.name}
            </span>
          </button>
        )}
      </For>
    </div>
  );
};

export default TransactionModal;
