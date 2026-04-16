// unocss.config.ts
import { defineConfig, presetIcons } from 'unocss'
import { presetWind4 } from '@unocss/preset-wind4'
import presetAnimations from 'unocss-preset-animations'

export default defineConfig({
  presets: [
    presetWind4(),
    presetAnimations(),
    presetIcons({
      scale: 1.2,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],

  // Override theme colors directly with hsl(var(--xxx)) so UnoCSS
  // never double-wraps the CSS variable (e.g. oklch(var(--primary))).
  // This is the fix for: background-color: oklch(var(--primary)) being invalid.
  theme: {
    colors: {
      border: 'hsl(var(--border))',
      input: 'hsl(var(--input))',
      ring: 'hsl(var(--ring))',
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
      
      /* --- Shadcn & Daisy Integration --- */
      primary: {
        DEFAULT: 'hsl(var(--color-primary))',
        content: 'hsl(var(--color-primary-content))',
        foreground: 'hsl(var(--primary-foreground))',
      },
      secondary: {
        DEFAULT: 'hsl(var(--color-secondary))',
        content: 'hsl(var(--color-secondary-content))',
        foreground: 'hsl(var(--secondary-foreground))',
      },
      accent: {
        DEFAULT: 'hsl(var(--color-accent))',
        content: 'hsl(var(--color-accent-content))',
        foreground: 'hsl(var(--accent-foreground))',
      },

      /* --- DaisyUI Specific --- */
      neutral: {
        DEFAULT: 'hsl(var(--color-neutral))',
        content: 'hsl(var(--color-neutral-content))',
      },
      base: {
        100: 'hsl(var(--color-base-100))',
        200: 'hsl(var(--color-base-200))',
        300: 'hsl(var(--color-base-300))',
        content: 'hsl(var(--color-base-content))',
      },
      info: {
        DEFAULT: 'hsl(var(--color-info))',
        content: 'hsl(var(--color-info-content))',
      },
      success: {
        DEFAULT: 'hsl(var(--color-success))',
        content: 'hsl(var(--color-success-content))',
      },
      warning: {
        DEFAULT: 'hsl(var(--color-warning))',
        content: 'hsl(var(--color-warning-content))',
      },
      error: {
        DEFAULT: 'hsl(var(--color-error))',
        content: 'hsl(var(--color-error-content))',
      },

      /* --- Remaining Shadcn Fallbacks --- */
      destructive: {
        DEFAULT: 'hsl(var(--destructive))',
        foreground: 'hsl(var(--destructive-foreground))',
      },
      muted: {
        DEFAULT: 'hsl(var(--muted))',
        foreground: 'hsl(var(--muted-foreground))',
      },
      popover: {
        DEFAULT: 'hsl(var(--popover))',
        foreground: 'hsl(var(--popover-foreground))',
      },
      card: {
        DEFAULT: 'hsl(var(--card))',
        foreground: 'hsl(var(--card-foreground))',
      },
      sidebar: {
        DEFAULT: 'hsl(var(--sidebar))',
        foreground: 'hsl(var(--sidebar-foreground))',
        primary: 'hsl(var(--sidebar-primary))',
        'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
        accent: 'hsl(var(--sidebar-accent))',
        'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
        border: 'hsl(var(--sidebar-border))',
        ring: 'hsl(var(--sidebar-ring))',
      },
    },
    radius: {
      DEFAULT: 'var(--radius)',
      sm: 'var(--radius-sm)',
      md: 'var(--radius-md)',
      lg: 'var(--radius-lg)',
      xl: 'var(--radius-xl)',
      card: 'var(--radius-card)',
    },
    shadow: {
      paper: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px'
    }
  },

  content: {
    pipeline: {
      include: [
        /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
        '(components|src)/**/*.{js,ts}',
      ],
    },
  },
})