import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { useInsumos } from "@/hooks/use-insumos"

function criarWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe("useInsumos", () => {
  it("carrega e devolve os insumos", async () => {
    const { result } = renderHook(() => useInsumos(), { wrapper: criarWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.[0].codigo).toBe("INS-001")
  })
})
