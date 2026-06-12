import { http, HttpResponse } from "msw"
import { server } from "@/test/server"
import { alertasTeste, erro, limiaresTeste, ok, resumoAlertasTeste } from "@/test/handlers"
import { alertasApi } from "@/lib/alertas"

describe("alertasApi", () => {
  it("lista alertas paginados com total", async () => {
    const pagina = await alertasApi.listar()
    expect(pagina.itens).toHaveLength(alertasTeste.length)
    expect(pagina.total).toBe(alertasTeste.length)
    expect(pagina.itens[0].tipo).toBe("Desabastecimento")
  })

  it("envia filtros e paginação na query (rótulos pt-BR)", async () => {
    let url: URL | undefined
    server.use(
      http.get("*/alertas", ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json(ok([], 0))
      }),
    )
    await alertasApi.listar(
      { tipo: "Vencimento", status: "Aberto" },
      { pagina: 1, tamanho: 10, ordenarPor: "criadoEm", ordem: "desc" },
    )
    expect(url?.searchParams.get("tipo")).toBe("Vencimento")
    expect(url?.searchParams.get("status")).toBe("Aberto")
    expect(url?.searchParams.get("page")).toBe("1")
    expect(url?.searchParams.get("sort")).toBe("criadoEm,desc")
  })

  it("traz o resumo de KPIs", async () => {
    const resumo = await alertasApi.resumo()
    expect(resumo).toEqual(resumoAlertasTeste)
  })

  it("trata um alerta via PATCH com o rótulo do status", async () => {
    const atualizado = await alertasApi.atualizarStatus("ale-1", "Em tratamento")
    expect(atualizado.status).toBe("Em tratamento")
  })

  it("propaga regra de negócio do tratamento (422)", async () => {
    server.use(
      http.patch("*/alertas/ale-1/status", () =>
        HttpResponse.json(erro("Alerta resolvido nao pode mudar de status.", "REGRA_NEGOCIO"), {
          status: 422,
        }),
      ),
    )
    await expect(alertasApi.atualizarStatus("ale-1", "Aberto")).rejects.toMatchObject({
      codigo: "REGRA_NEGOCIO",
      status: 422,
    })
  })

  it("busca e salva os limiares", async () => {
    const limiares = await alertasApi.limiares()
    expect(limiares.antecedenciaVencimentoDias).toBe(60)

    const salvo = await alertasApi.salvarLimiares({ ...limiaresTeste, percentualEstoqueMinimo: 120 })
    expect(salvo.percentualEstoqueMinimo).toBe(120)
  })

  it("gerar devolve o resultado do motor", async () => {
    const resultado = await alertasApi.gerar()
    expect(resultado.totalAtivo).toBe(20)
  })
})
