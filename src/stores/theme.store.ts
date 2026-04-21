import { createSignal } from "solid-js";

/**
 * Available theme identifiers.
 *
 * - professional : Sharp edges, muted corporate palette (MS Office-like)
 * - oceanic      : Deep sea-blue-to-teal gradient palette
 * - rosewood     : Warm rose / dusty pink accent tones
 * - emerald      : Rich green & gold finance aesthetic
 * - amethyst     : Purple-violet with subtle lilac highlights
 */
export type ThemeId = "professional" | "oceanic" | "rosewood" | "emerald" | "amethyst";

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  description: string;
  /** Preview swatch colours (for the theme picker UI) */
  swatches: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
  };
}

export const themes: ThemeDefinition[] = [
  {
    id: "professional",
    label: "Professional",
    description: "Sharp, no-frills corporate look — inspired by MS Office",
    swatches: {
      primary: "#2B579A",
      secondary: "#E6E9ED",
      accent: "#217346",
      bg: "#F5F5F5",
    },
  },
  {
    id: "oceanic",
    label: "Oceanic",
    description: "Deep sea blues with refreshing teal accents",
    swatches: {
      primary: "#0EA5E9",
      secondary: "#164E63",
      accent: "#2DD4BF",
      bg: "#F0FDFA",
    },
  },
  {
    id: "rosewood",
    label: "Rosewood",
    description: "Warm & elegant rose tones with dusty pink highlights",
    swatches: {
      primary: "#E11D48",
      secondary: "#FFF1F2",
      accent: "#FB923C",
      bg: "#FFFBFB",
    },
  },
  {
    id: "emerald",
    label: "Emerald",
    description: "Rich green & gold — classic finance aesthetic",
    swatches: {
      primary: "#059669",
      secondary: "#ECFDF5",
      accent: "#D97706",
      bg: "#F8FDF9",
    },
  },
  {
    id: "amethyst",
    label: "Amethyst",
    description: "Regal purple palette with lilac highlights",
    swatches: {
      primary: "#7C3AED",
      secondary: "#EDE9FE",
      accent: "#EC4899",
      bg: "#FAFAFF",
    },
  },
];

// ── Persistence ──────────────────────────────────────────────────────────

const STORAGE_KEY = "familyledger-theme";

function loadTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && themes.some((t) => t.id === stored)) {
      return stored as ThemeId;
    }
  } catch {
    // SSR or private-browsing fallback
  }
  return "oceanic"; // default theme
}

function persistTheme(id: ThemeId) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // ignore
  }
}

// ── Reactive signal ─────────────────────────────────────────────────────

const [currentTheme, setCurrentThemeRaw] = createSignal<ThemeId>(loadTheme());

function applyTheme(id: ThemeId) {
  document.documentElement.setAttribute("data-theme", id);
}

// Apply on initial load
applyTheme(currentTheme());

export function setTheme(id: ThemeId) {
  setCurrentThemeRaw(id);
  persistTheme(id);
  applyTheme(id);
}

export { currentTheme };
