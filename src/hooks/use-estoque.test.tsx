import type { ReactNode } from "react"
import { http, HttpResponse } from "msw"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { usePosicoes } from "@/hooks/use-estoque"
import { server } from "@/test/server"
import { erro, posicoesTeste } from "@/test/handlers"

function criarWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe("usePosicoes", () => {
  it("carrega e devolve as posições", async () => {
    const { result } = renderHook(() => usePosicoes(), { wrapper: criarWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(posicoesTeste.length)
  })

  it("expõe estado de erro quando a API falha", async () => {
    server.use(
      http.get("*/estoque", () =>
        HttpResponse.json(erro("Falha.", "ERRO_INTERNO"), { status: 500 }),
      ),
    )
    const { result } = renderHook(() => usePosicoes(), { wrapper: criarWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
