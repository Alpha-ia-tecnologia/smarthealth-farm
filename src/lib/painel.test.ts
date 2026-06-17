import { http, HttpResponse } from "msw"
import { server } from "@/test/server"
import { painelApi } from "@/lib/painel"
import { ok, painelGerencialTeste, painelOperacionalTeste } from "@/test/handlers"

describe("painelApi", () => {
  it("traz o dashboard gerencial consolidado", async () => {
    const dashboard = await painelApi.dashboard()
    expect(dashboard.totais.alertasAbertos).toBe(painelGerencialTeste.totais.alertasAbertos)
    expect(dashboard.coberturaPorUnidade).toHaveLength(2)
    expect(dashboard.serieAgregada.insumoNome).toBe("Ceftriaxona 1g")
    expect(dashboard.alertasRecentes.length).toBeGreaterThan(0)
    expect(dashboard.recomendacoesPendentes.length).toBeGreaterThan(0)
  })

  it("envia unidadeId no dashboard quando filtrado por unidade", async () => {
    let url: URL | undefined
    server.use(
      http.get("*/painel", ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json(ok(painelGerencialTeste))
      }),
    )
    await painelApi.dashboard({ unidadeId: "uni-hto" })
    expect(url?.searchParams.get("unidadeId")).toBe("uni-hto")
  })

  it("traz o painel operacional (unidades + filas)", async () => {
    const operacional = await painelApi.operacional()
    expect(operacional.unidades).toHaveLength(painelOperacionalTeste.unidades.length)
    expect(operacional.unidades[0].statusUnidade).toBe("critico")
    expect(operacional.alertasAtivos.length).toBeGreaterThan(0)
    expect(operacional.recomendacoesAbertas.length).toBeGreaterThan(0)
  })

  it("envia unidadeId e insumoId no operacional quando filtrado", async () => {
    let url: URL | undefined
    server.use(
      http.get("*/painel/operacional", ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json(ok(painelOperacionalTeste))
      }),
    )
    await painelApi.operacional({ unidadeId: "uni-hto", insumoId: "ins-001" })
    expect(url?.searchParams.get("unidadeId")).toBe("uni-hto")
    expect(url?.searchParams.get("insumoId")).toBe("ins-001")
  })
})
