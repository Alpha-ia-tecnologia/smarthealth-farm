import type { ReactElement, ReactNode } from "react"
import { render, type RenderOptions } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { QueryClientProvider } from "@tanstack/react-query"
import userEvent from "@testing-library/user-event"
import { ThemeProvider } from "@/hooks/use-theme"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/context/auth"
import { criarQueryClient } from "@/lib/query-client"

interface OpcoesRender extends Omit<RenderOptions, "wrapper"> {
  /** Rota inicial do MemoryRouter (default "/"). */
  rota?: string
}

/**
 * Renderiza um componente dentro da mesma árvore de providers do app (tema, Query, tooltip,
 * roteador, auth). Devolve também um `usuario` (user-event) já configurado.
 */
export function renderizar(ui: ReactElement, { rota = "/", ...opcoes }: OpcoesRender = {}) {
  const queryClient = criarQueryClient()

  function Providers({ children }: { children: ReactNode }) {
    return (
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <MemoryRouter initialEntries={[rota]}>
              <AuthProvider>{children}</AuthProvider>
            </MemoryRouter>
            <Toaster position="top-right" />
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    )
  }

  return { usuario: userEvent.setup(), ...render(ui, { wrapper: Providers, ...opcoes }) }
}

export * from "@testing-library/react"
export { default as userEvent } from "@testing-library/user-event"
