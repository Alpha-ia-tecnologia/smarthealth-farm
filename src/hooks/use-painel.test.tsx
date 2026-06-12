import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { usePainelGerencial, usePainelOperacional } from "@/hooks/use-painel"

function criarAmbiente() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { wrapper }
}

describe("hooks de painel", () => {
  it("usePainelGerencial carrega o dashboard gerencial", async () => {
    const { wrapper } = criarAmbiente()
    const { result } = renderHook(() => usePainelGerencial(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.serieAgregada.medicamentoNome).toBe("Ceftriaxona 1g")
  })

  it("usePainelOperacional carrega o painel operacional", async () => {
    const { wrapper } = criarAmbiente()
    const { result } = renderHook(() => usePainelOperacional(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.unidades.length).toBeGreaterThan(0)
  })
})
