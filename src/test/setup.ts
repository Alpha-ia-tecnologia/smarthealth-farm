import "@testing-library/jest-dom/vitest"
import { afterAll, afterEach, beforeAll } from "vitest"
import { cleanup, configure } from "@testing-library/react"
import { server } from "./server"

// findBy*/waitFor: o default de 1s estoura de forma intermitente quando a suíte
// inteira roda em paralelo em máquina modesta; 5s mantém falha rápida em bug real.
configure({ asyncUtilTimeout: 5_000 })

// Polyfills do jsdom para APIs usadas por Radix (ponteiro/scroll) e pelo tema (matchMedia).
beforeAll(() => {
  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }),
    })
  }

  const proto = Element.prototype as unknown as Record<string, unknown>
  proto.hasPointerCapture ??= () => false
  proto.setPointerCapture ??= () => {}
  proto.releasePointerCapture ??= () => {}
  proto.scrollIntoView ??= () => {}

  if (!("ResizeObserver" in globalThis)) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver
  }

  // Falha o teste se algum request não tiver handler — nada de chamada silenciosa à rede.
  server.listen({ onUnhandledRequest: "error" })
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
  localStorage.clear()
  sessionStorage.clear()
})

afterAll(() => server.close())
