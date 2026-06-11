import { http, HttpResponse } from "msw"
import { server } from "@/test/server"
import { erro, ok, recomendacoesTeste, resumoRecomendacoesTeste } from "@/test/handlers"
import { recomendacoesApi } from "@/lib/recomendacoes"

describe("recomendacoesApi", () => {
  it("lista recomendações paginadas (itens + total)", async () => {
    const pagina = await recomendacoesApi.listar()
    expect(pagina.itens).toHaveLength(recomendacoesTeste.length)
    expect(pagina.total).toBe(recomendacoesTeste.length)
    expect(pagina.itens[0].tipo).toBe("Redistribuição")
  })

  it("envia filtros e paginação na query (rótulos pt-BR)", async () => {
    let url: URL | undefined
    server.use(
      http.get("*/recomendacoes", ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json(ok([], 0))
      }),
    )
    await recomendacoesApi.listar({ tipo: "Reposição", status: "Pendente" }, { pagina: 1, tamanho: 10 })
    expect(url?.searchParams.get("tipo")).toBe("Reposição")
    expect(url?.searchParams.get("status")).toBe("Pendente")
    expect(url?.searchParams.get("page")).toBe("1")
    expect(url?.searchParams.get("size")).toBe("10")
  })

  it("traz o resumo de KPIs", async () => {
    const resumo = await recomendacoesApi.resumo()
    expect(resumo).toEqual(resumoRecomendacoesTeste)
  })

  it("aprova uma recomendação (Pendente → Aprovada)", async () => {
    const aprovada = await recomendacoesApi.aprovar("rec-1")
    expect(aprovada.status).toBe("Aprovada")
  })

  it("executa uma recomendação (Aprovada → Executada)", async () => {
    const executada = await recomendacoesApi.executar("rec-2")
    expect(executada.status).toBe("Executada")
  })

  it("propaga regra de negócio ao executar uma pendente (422)", async () => {
    server.use(
      http.post("*/recomendacoes/rec-1/executar", () =>
        HttpResponse.json(
          erro("Apenas recomendacoes aprovadas podem ser executadas.", "REGRA_NEGOCIO"),
          { status: 422 },
        ),
      ),
    )
    await expect(recomendacoesApi.executar("rec-1")).rejects.toMatchObject({
      codigo: "REGRA_NEGOCIO",
      status: 422,
    })
  })

  it("gerar devolve o resultado do motor", async () => {
    const resultado = await recomendacoesApi.gerar()
    expect(resultado.totalAtivo).toBe(12)
  })

  it("propaga 403 ao gerar sem permissão", async () => {
    server.use(
      http.post("*/recomendacoes/gerar", () =>
        HttpResponse.json(erro("Acesso negado.", "ACESSO_NEGADO"), { status: 403 }),
      ),
    )
    await expect(recomendacoesApi.gerar()).rejects.toMatchObject({
      codigo: "ACESSO_NEGADO",
      status: 403,
    })
  })
})
