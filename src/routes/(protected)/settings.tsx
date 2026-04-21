import { createFileRoute } from "@tanstack/solid-router";
import { createResource, Show } from "solid-js";
import ThemeSwitcher from "~/components/shared/theme-switcher";
import { coreDb, type Ledger, type User } from "~/db/schema";

export const Route = createFileRoute("/(protected)/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [ledgers] = createResource<Ledger[]>(() => coreDb.ledgers.toArray());
  const [user, { mutate: mutateUser }] = createResource<User | undefined>(async () => {
    const users = await coreDb.users.toArray();
    return users[0];
  });

  const handleDefaultLedgerChange = async (e: Event) => {
    const select = e.currentTarget as HTMLSelectElement;
    const ledgerId = select.value;
    const currentUser = user();
    if (currentUser) {
      await coreDb.users.update(currentUser.id, { defaultLedgerId: ledgerId });
      mutateUser({ ...currentUser, defaultLedgerId: ledgerId });
      alert("Ledger utama berhasil diperbarui!");
    }
  };

  return (
    <div class="">
      <div class="flex items-center gap-2 mb-5">
        <div class="i-lucide-settings text-blue-600 text-xl" />
        <h1 class="text-xl font-bold text-gray-900">Pengaturan</h1>
      </div>

      {/* Default Ledger Section */}
      <section class="mb-6">
        <div class="flex items-center gap-2 mb-3">
          <div class="i-lucide-home text-lg text-blue-600" />
          <h2 class="text-sm font-semibold text-gray-900">Ledger Utama</h2>
        </div>
        <div class="p-4 bg-white rounded border">
          <p class="text-xs text-gray-500 mb-3">
            Pilih ledger yang akan dibuka secara otomatis saat aplikasi dijalankan.
          </p>
          <Show when={ledgers() && user()}>
            <select
              value={user()?.defaultLedgerId || ""}
              onChange={handleDefaultLedgerChange}
              class="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="" disabled>
                Pilih Ledger Default...
              </option>
              {ledgers()?.map((l) => (
                <option value={l.id}>{l.name}</option>
              ))}
            </select>
          </Show>
        </div>
      </section>

      {/* Theme Section */}
      <section class="mb-6">
        <div class="flex items-center gap-2 mb-3">
          <div class="i-lucide-palette text-lg text-blue-600" />
          <h2 class="text-sm font-semibold text-gray-900">Tema Tampilan</h2>
        </div>
        <ThemeSwitcher />
      </section>

      {/* Placeholder for future settings */}
      <section>
        <div class="flex items-center gap-2 mb-3">
          <div class="i-lucide-bell text-lg" style={{ color: "hsl(var(--primary))" }} />
          <h2 class="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            Lainnya
          </h2>
        </div>
        <div
          class="p-6 text-center"
          style={{
            background: "hsl(var(--card))",
            "border-radius": "var(--radius)",
            border: "1px solid hsl(var(--border))",
          }}
        >
          <div
            class="i-lucide-construction text-4xl mx-auto mb-3"
            style={{ color: "hsl(var(--muted-foreground))" }}
          />
          <p class="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            Segera hadir
          </p>
        </div>
      </section>
    </div>
  );
}
