import type { ReactNode } from "react"
import { http, HttpResponse } from "msw"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { useUnidades } from "@/hooks/use-unidades"
import { server } from "@/test/server"
import { erro, unidadesTeste } from "@/test/handlers"

function criarWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe("useUnidades", () => {
  it("carrega e devolve as unidades", async () => {
    const { result } = renderHook(() => useUnidades(), { wrapper: criarWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(unidadesTeste.length)
  })

  it("expõe estado de erro quando a API falha", async () => {
    server.use(
      http.get("*/unidades", () =>
        HttpResponse.json(erro("Falha interna.", "ERRO_INTERNO"), { status: 500 }),
      ),
    )
    const { result } = renderHook(() => useUnidades(), { wrapper: criarWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
