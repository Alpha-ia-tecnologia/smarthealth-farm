import { painelApi } from "@/lib/painel"
import { painelGerencialTeste, painelOperacionalTeste } from "@/test/handlers"

describe("painelApi", () => {
  it("traz o dashboard gerencial consolidado", async () => {
    const dashboard = await painelApi.dashboard()
    expect(dashboard.totais.alertasAbertos).toBe(painelGerencialTeste.totais.alertasAbertos)
    expect(dashboard.coberturaPorUnidade).toHaveLength(2)
    expect(dashboard.serieAgregada.medicamentoNome).toBe("Ceftriaxona 1g")
    expect(dashboard.alertasRecentes.length).toBeGreaterThan(0)
    expect(dashboard.recomendacoesPendentes.length).toBeGreaterThan(0)
  })

  it("traz o painel operacional (unidades + filas)", async () => {
    const operacional = await painelApi.operacional()
    expect(operacional.unidades).toHaveLength(painelOperacionalTeste.unidades.length)
    expect(operacional.unidades[0].statusUnidade).toBe("critico")
    expect(operacional.alertasAtivos.length).toBeGreaterThan(0)
    expect(operacional.recomendacoesAbertas.length).toBeGreaterThan(0)
  })
})
