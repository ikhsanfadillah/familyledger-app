import 'virtual:uno.css'
import '~/stores/theme.store' // Apply persisted theme on load
import { render } from 'solid-js/web'
import { createRouter, RouterProvider } from '@tanstack/solid-router'
import { routeTree } from './routeTree.gen'

// ── Router ──────────────────────────────────────────────────────────────

const router = createRouter({ 
  routeTree,
  basepath: import.meta.env.BASE_URL,
})

declare module '@tanstack/solid-router' {
  interface Register {
    router: typeof router
  }
}

// ── Mount ───────────────────────────────────────────────────────────────

const root = document.getElementById('root')
if (root) {
  render(() => <RouterProvider router={router} />, root)
}

// ── PWA Service Worker registration ─────────────────────────────────────

if ('serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true })
  })
}
