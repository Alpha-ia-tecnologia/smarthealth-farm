import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { useFontes, useQualidadeCategorias, useResumoIngestao } from "@/hooks/use-ingestao"
import { useIntegracoes, useProvedoresIa, useResumoIntegracoes } from "@/hooks/use-integracoes"

function criarAmbiente() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { wrapper }
}

describe("hooks de ingestão", () => {
  it("useFontes carrega as fontes de dados", async () => {
    const { wrapper } = criarAmbiente()
    const { result } = renderHook(() => useFontes(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.length).toBeGreaterThan(0)
  })

  it("useQualidadeCategorias carrega a qualidade por categoria", async () => {
    const { wrapper } = criarAmbiente()
    const { result } = renderHook(() => useQualidadeCategorias(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.[0].categoria).toBe("Antibióticos")
  })

  it("useResumoIngestao carrega os KPIs", async () => {
    const { wrapper } = criarAmbiente()
    const { result } = renderHook(() => useResumoIngestao(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.anonimizacaoAtiva).toBe(true)
  })
})

describe("hooks de integração", () => {
  it("useIntegracoes carrega as conexões", async () => {
    const { wrapper } = criarAmbiente()
    const { result } = renderHook(() => useIntegracoes(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.length).toBeGreaterThan(0)
  })

  it("useResumoIntegracoes carrega os KPIs", async () => {
    const { wrapper } = criarAmbiente()
    const { result } = renderHook(() => useResumoIntegracoes(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.totalIntegracoes).toBeGreaterThan(0)
  })

  it("useProvedoresIa carrega os provedores do AI Gateway", async () => {
    const { wrapper } = criarAmbiente()
    const { result } = renderHook(() => useProvedoresIa(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.[0].papel).toBe("Primário")
  })
})
