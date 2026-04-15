import { For, createMemo, type Component } from "solid-js";
import {
  currentTheme,
  setTheme,
  themes,
  type ThemeDefinition,
} from "~/stores/theme.store";

/* ── Individual theme card ───────────────────────────────────────────── */

const ThemeCard: Component<{
  theme: ThemeDefinition;
  isActive: boolean;
}> = (props) => {
  return (
    <button
      type="button"
      onClick={() => setTheme(props.theme.id)}
      class="group relative w-full text-left transition-all duration-200"
      style={{
        padding: "0",
        background: "none",
        border: "none",
        cursor: "pointer",
      }}
      aria-label={`Switch to ${props.theme.label} theme`}
      aria-pressed={props.isActive}
    >
      <div
        class="overflow-hidden transition-all duration-200 rounded"
        style={{
          border: props.isActive
            ? `2px solid ${props.theme.swatches.primary}`
            : "2px solid hsl(var(--border))",
          "box-shadow": props.isActive
            ? `0 0 0 3px ${props.theme.swatches.primary}25, 0 4px 14px ${props.theme.swatches.primary}15`
            : "0 1px 3px rgba(0,0,0,0.06)",
          transform: props.isActive ? "scale(1.02)" : "scale(1)",
        }}
      >
        {/* Mini preview — simulates a tiny app screen */}
        <div
          style={{
            background: props.theme.swatches.bg,
            padding: "10px",
            "min-height": "96px",
          }}
        >
          {/* Fake top bar */}
          <div
            style={{
              display: "flex",
              "align-items": "center",
              gap: "6px",
              "margin-bottom": "8px",
            }}
          >
            <div
              style={{
                width: "18px",
                height: "18px",
                "border-radius":
                  props.theme.id === "professional" ? "0px" : "4px",
                background: props.theme.swatches.primary,
              }}
            />
            <div
              style={{
                flex: "1",
                height: "6px",
                "border-radius": "3px",
                background: props.theme.swatches.secondary,
              }}
            />
          </div>

          {/* Fake content rows */}
          <div
            style={{
              display: "flex",
              gap: "4px",
              "margin-bottom": "6px",
            }}
          >
            <div
              style={{
                flex: "1",
                height: "24px",
                "border-radius":
                  props.theme.id === "professional" ? "0px" : "6px",
                background: `${props.theme.swatches.primary}18`,
                border: `1px solid ${props.theme.swatches.primary}30`,
              }}
            />
            <div
              style={{
                flex: "1",
                height: "24px",
                "border-radius":
                  props.theme.id === "professional" ? "0px" : "6px",
                background: props.theme.swatches.secondary,
              }}
            />
          </div>

          {/* Fake button row */}
          <div style={{ display: "flex", gap: "4px" }}>
            <div
              style={{
                height: "16px",
                width: "48px",
                "border-radius":
                  props.theme.id === "professional" ? "0px" : "4px",
                background: props.theme.swatches.primary,
              }}
            />
            <div
              style={{
                height: "16px",
                width: "28px",
                "border-radius":
                  props.theme.id === "professional" ? "0px" : "4px",
                background: props.theme.swatches.accent,
              }}
            />
          </div>
        </div>

        {/* Label bar */}
        <div
          style={{
            padding: "8px 10px",
            display: "flex",
            "align-items": "center",
            "justify-content": "space-between",
            "background-color": "hsl(var(--card))",
            "border-top": "1px solid hsl(var(--border))",
          }}
        >
          <div>
            <div
              style={{
                "font-weight": "600",
                "font-size": "0.8rem",
                color: "hsl(var(--foreground))",
                "line-height": "1.2",
              }}
            >
              {props.theme.label}
            </div>
            <div
              class="line-clamp-2"
              style={{
                "font-size": "0.65rem",
                color: "hsl(var(--muted-foreground))",
                "margin-top": "1px",
              }}
            >
              {props.theme.description}
            </div>
          </div>

          {/* Active check mark */}
          {props.isActive && (
            <div
              class="absolute top-2 right-2"
              style={{
                width: "20px",
                height: "20px",
                "border-radius": "50%",
                background: props.theme.swatches.primary,
                display: "flex",
                "align-items": "center",
                "justify-content": "center",
                "flex-shrink": "0",
                "margin-left": "8px",
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

/* ── Theme Switcher (exported) ───────────────────────────────────────── */

const ThemeSwitcher: Component = () => {
  return (
    <div>
      <div
        style={{
          display: "grid",
          "grid-template-columns": "1fr 1fr",
          gap: "10px",
        }}
      >
        <For each={themes}>
          {(theme) => {
            const isActive = createMemo(() => currentTheme() === theme.id);
            return <ThemeCard theme={theme} isActive={isActive()} />;
          }}
        </For>
      </div>
    </div>
  );
};

export default ThemeSwitcher;
