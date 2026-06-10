import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { useMedicamentos } from "@/hooks/use-medicamentos"

function criarWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe("useMedicamentos", () => {
  it("carrega e devolve os medicamentos", async () => {
    const { result } = renderHook(() => useMedicamentos(), { wrapper: criarWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.[0].codigo).toBe("MED-001")
  })
})
