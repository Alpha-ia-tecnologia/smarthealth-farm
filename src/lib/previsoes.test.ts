import { http, HttpResponse } from "msw"
import { server } from "@/test/server"
import {
  detalhePrevisaoTeste,
  erro,
  ok,
  previsoesTeste,
  resumoPrevisaoTeste,
} from "@/test/handlers"
import { previsoesApi } from "@/lib/previsoes"

describe("previsoesApi", () => {
  it("lista previsões paginadas (itens + total) do envelope", async () => {
    const pagina = await previsoesApi.listar()
    expect(pagina.itens).toHaveLength(previsoesTeste.length)
    expect(pagina.total).toBe(previsoesTeste.length)
    expect(pagina.itens[0].medicamentoNome).toBe("Ceftriaxona 1g")
    expect(pagina.itens[0].criticidade).toBe("Alta")
  })

  it("envia filtros e paginação na query (rótulos pt-BR)", async () => {
    let url: URL | undefined
    server.use(
      http.get("*/previsoes", ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json(ok([], 0))
      }),
    )
    await previsoesApi.listar(
      { unidadeId: "uni-hto", drift: "Degradado", busca: "cef" },
      { pagina: 2, tamanho: 10, ordenarPor: "medicamento.nome", ordem: "desc" },
    )
    expect(url?.searchParams.get("unidadeId")).toBe("uni-hto")
    expect(url?.searchParams.get("drift")).toBe("Degradado")
    expect(url?.searchParams.get("busca")).toBe("cef")
    expect(url?.searchParams.get("page")).toBe("2")
    expect(url?.searchParams.get("sort")).toBe("medicamento.nome,desc")
  })

  it("traz o resumo de KPIs", async () => {
    const resumo = await previsoesApi.resumo()
    expect(resumo).toEqual(resumoPrevisaoTeste)
  })

  it("detalha a série temporal de um item", async () => {
    const detalhe = await previsoesApi.detalhar("med-001", "uni-hto")
    expect(detalhe).toEqual(detalhePrevisaoTeste)
    expect(detalhe.serie.at(-1)?.realizado).toBeNull()
  })

  it("monta a URL do detalhe com medicamento e unidade", async () => {
    let path: string | undefined
    server.use(
      http.get("*/previsoes/:med/:uni", ({ request }) => {
        path = new URL(request.url).pathname
        return HttpResponse.json(ok(detalhePrevisaoTeste))
      }),
    )
    await previsoesApi.detalhar("med-001", "uni-hto")
    expect(path).toContain("/previsoes/med-001/uni-hto")
  })

  it("recalibra devolvendo o resultado do motor", async () => {
    const resultado = await previsoesApi.recalibrar()
    expect(resultado.recalibradas).toBe(previsoesTeste.length)
    expect(resultado.calibradoEm).toBe("2026-06-11")
  })

  it("propaga 403 ao recalibrar sem permissão (perfil sem acesso)", async () => {
    server.use(
      http.post("*/previsoes/recalibrar", () =>
        HttpResponse.json(erro("Acesso negado.", "ACESSO_NEGADO"), { status: 403 }),
      ),
    )
    await expect(previsoesApi.recalibrar()).rejects.toMatchObject({
      codigo: "ACESSO_NEGADO",
      status: 403,
    })
  })
})
