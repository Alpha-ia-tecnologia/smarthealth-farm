import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { useAlertas, useTratarAlerta, alertasKeys } from "@/hooks/use-alertas"
import { alertasTeste } from "@/test/handlers"

function criarAmbiente() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, wrapper }
}

describe("useAlertas / useTratarAlerta", () => {
  it("carrega os alertas paginados", async () => {
    const { wrapper } = criarAmbiente()
    const { result } = renderHook(() => useAlertas(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.itens).toHaveLength(alertasTeste.length)
  })

  it("tratar um alerta invalida o cache do domínio (lista + resumo)", async () => {
    const { qc, wrapper } = criarAmbiente()
    const invalidar = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useTratarAlerta(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ id: "ale-1", status: "Em tratamento" })
    })

    expect(invalidar).toHaveBeenCalledWith({ queryKey: alertasKeys.raiz })
  })
})
