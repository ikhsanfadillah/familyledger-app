import { type Component, createResource, For, createEffect, untrack } from "solid-js";
import { createForm } from "@tanstack/solid-form";
import { getCategories } from "~/db/queries";
import { createBudget, editBudget } from "~/stores/budget.store";
import { todayISO } from "~/utils/date";
import type { Category, Budget } from "~/db/schema";
import { useDrawerContext } from "@ark-ui/solid/drawer";
import { DrawerBody, DrawerContent, DrawerContentInner, DrawerHeader } from "../ui/drawer";

interface Props {
  /** When set, the modal switches to edit mode */
  editingBudget?: Budget | null;
  /** Called after successful submit to clear edit state */
  onDone?: () => void;
}

const BudgetModal: Component<Props> = (props) => {
  const drawerCtx = useDrawerContext();

  // Budgets generally apply to expense categories
  const [categories] = createResource("expense", getCategories);

  const isEditing = () => !!props.editingBudget;

  const form = createForm(() => ({
    defaultValues: {
      amount: props.editingBudget?.amount?.toString() ?? "",
      categoryId: props.editingBudget?.categoryId ?? "",
      period: props.editingBudget?.period ?? "monthly",
      startDate: props.editingBudget?.startDate ?? todayISO(),
    },
    onSubmit: async ({ value }) => {
      const parsed = parseInt(value.amount, 10);
      if (!parsed || parsed <= 0 || !value.categoryId) return;

      const input = {
        amount: parsed,
        categoryId: value.categoryId,
        period: value.period as "monthly" | "weekly",
        startDate: value.startDate,
      };

      if (isEditing()) {
        await editBudget(props.editingBudget!.id, input);
      } else {
        await createBudget(input);
      }

      form.reset();
      drawerCtx().setOpen(false);
      props.onDone?.();
    },
  }));

  createEffect(() => {
    const b = props.editingBudget;
    if (b) {
      untrack(() => {
        form.setFieldValue("amount", b.amount?.toString() ?? "");
        form.setFieldValue("categoryId", b.categoryId ?? "");
        form.setFieldValue("period", b.period ?? "monthly");
        form.setFieldValue("startDate", b.startDate ?? todayISO());
      });
    } else {
      untrack(() => {
        form.reset();
      });
    }
  });

  createEffect(() => {
    const cats = categories();
    if (!cats?.length) return;
    const current = untrack(() => form.getFieldValue("categoryId"));
    if (!current && !isEditing()) {
      form.setFieldValue("categoryId", cats[0]!.id);
    }
  });

  return (
    <DrawerContent variant="inset" class="shadow-lg">
      <DrawerContentInner>
        <DrawerHeader
          title={isEditing() ? "Edit Anggaran" : "Tambah Anggaran"}
          description="Tentukan batasan pengeluaran."
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
                    Total Anggaran
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

            {/* Category */}
            <form.Field
              name="categoryId"
              children={(field) => (
                <div class="mb-5">
                  <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">
                    Kategori Pengeluaran
                  </span>
                  <div class="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pb-2">
                    <For each={categories() ?? []}>
                      {(cat: Category) => (
                        <button
                          type="button"
                          class="flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-xs transition-all"
                          style={{
                            "background-color":
                              field().state.value === cat.id ? cat.color + "15" : "#f8fafc",
                            border:
                              field().state.value === cat.id
                                ? `2px solid ${cat.color}`
                                : "2px solid transparent",
                            transform: field().state.value === cat.id ? "scale(1.05)" : "scale(1)",
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

            {/* Period */}
            <form.Field
              name="period"
              children={(field) => (
                <div class="mb-5">
                  <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">
                    Periode
                  </span>
                  <div class="flex gap-2 p-1 bg-gray-100 rounded-xl">
                    <button
                      type="button"
                      class="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
                      style={{
                        "background-color":
                          field().state.value === "monthly" ? "#fff" : "transparent",
                        color: field().state.value === "monthly" ? "#3B82F6" : "#9ca3af",
                        "box-shadow":
                          field().state.value === "monthly" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                      }}
                      onClick={() => field().handleChange("monthly")}
                    >
                      Bulanan
                    </button>
                    <button
                      type="button"
                      class="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
                      style={{
                        "background-color":
                          field().state.value === "weekly" ? "#fff" : "transparent",
                        color: field().state.value === "weekly" ? "#3B82F6" : "#9ca3af",
                        "box-shadow":
                          field().state.value === "weekly" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                      }}
                      onClick={() => field().handleChange("weekly")}
                    >
                      Mingguan
                    </button>
                  </div>
                </div>
              )}
            />

            {/* Date */}
            <form.Field
              name="startDate"
              children={(field) => (
                <label class="block mb-6">
                  <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">
                    Mulai Tanggal
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

            {/* Submit */}
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={(state) => (
                <button
                  type="submit"
                  disabled={state()[1] as boolean}
                  class="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all active:scale-98 flex items-center justify-center gap-2"
                  style={{
                    background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
                    "box-shadow": "0 4px 16px rgba(59, 130, 246, 0.3)",
                    opacity: (state()[1] as boolean) ? "0.7" : "1",
                  }}
                >
                  <div class="i-lucide-check text-lg" />
                  {(state()[1] as boolean)
                    ? "Menyimpan..."
                    : isEditing()
                      ? "Simpan Perubahan"
                      : "Simpan Anggaran"}
                </button>
              )}
            />
          </form>
        </DrawerBody>
      </DrawerContentInner>
    </DrawerContent>
  );
};

export default BudgetModal;
