import { createSignal, For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { Button } from "../ui/button";

export interface FabMenuItem {
  id: string;
  label: string;
  icon: string;
  color: string;
  iconColor?: string;
  onClick: () => void;
}

export default function FabMenu(props: { items: FabMenuItem[] }) {
  const [isOpen, setIsOpen] = createSignal(false);

  return (
    <>
      {/* Backdrop */}
      <Show when={isOpen()}>
        <Portal>
          <div
            class="fixed inset-0 z-40 transition-opacity duration-300"
            style={{
              background: "rgba(255,255,255,0.6)",
              "backdrop-filter": "blur(4px)",
              "-webkit-backdrop-filter": "blur(4px)",
            }}
            onClick={() => setIsOpen(false)}
          />
        </Portal>
      </Show>

      {/* Speed Dial Container */}
      <div
        class="fixed z-50 flex flex-col items-end"
        style={{ bottom: "5.5rem", right: "1.25rem" }}
      >
        <div
          class="relative flex flex-col items-end gap-3 mb-4"
          style={{ "pointer-events": isOpen() ? "auto" : "none" }}
        >
          <For each={props.items}>
            {(item, index) => (
              <div
                class="flex items-center gap-3 transition-all duration-300 ease-out"
                style={{
                  opacity: isOpen() ? "1" : "0",
                  transform: isOpen() ? "translateY(0) scale(1)" : "translateY(20px) scale(0.8)",
                  "transition-delay": isOpen()
                    ? `${(props.items.length - index() - 1) * 40}ms`
                    : "0ms",
                }}
              >
                <span
                  class="text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm"
                  style={{
                    "background-color": "white",
                    color: item.color,
                    "box-shadow": "0 2px 8px rgba(0,0,0,0.05)",
                  }}
                >
                  {item.label}
                </span>
                <Button
                  type="button"
                  size="icon-lg"
                  style={{
                    background: item.color,
                    color: item.iconColor ?? "white",
                    "box-shadow": `0 4px 12px ${item.color}40`,
                  }}
                  onClick={() => {
                    setIsOpen(false);
                    item.onClick();
                  }}
                  aria-label={item.label}
                >
                  <div class={`${item.icon} text-xl`} />
                </Button>
              </div>
            )}
          </For>
        </div>

        {/* Main FAB */}
        <Button
          type="button"
          size="icon-xl"
          style={{
            "box-shadow": isOpen()
              ? "0 12px 28px rgba(59, 130, 246, 0.4)"
              : "0 8px 24px rgba(59, 130, 246, 0.4)",
          }}
          onClick={() => setIsOpen(!isOpen())}
          aria-label="Menu Utama"
        >
          <div class="i-lucide-plus text-2xl" />
        </Button>
      </div>
    </>
  );
}
