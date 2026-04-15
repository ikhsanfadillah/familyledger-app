import { createFileRoute } from "@tanstack/solid-router";
import ThemeSwitcher from "~/components/shared/theme-switcher";

export const Route = createFileRoute("/(protected)/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div>
      <div class="flex items-center gap-2 mb-5">
        <div class="i-lucide-settings text-primary text-xl" />
        <h1 class="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>
          Pengaturan
        </h1>
      </div>

      {/* Theme Section */}
      <section class="mb-6">
        <div class="flex items-center gap-2 mb-3">
          <div class="i-lucide-palette text-lg" style={{ color: "hsl(var(--primary))" }} />
          <h2 class="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            Tema Tampilan
          </h2>
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
          <div class="i-lucide-construction text-4xl mx-auto mb-3" style={{ color: "hsl(var(--muted-foreground))" }} />
          <p class="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>Segera hadir</p>
        </div>
      </section>
    </div>
  );
}
