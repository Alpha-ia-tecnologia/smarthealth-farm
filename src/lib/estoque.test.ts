import { http, HttpResponse } from "msw"
import { server } from "@/test/server"
import { lotesTeste, ok, posicoesTeste, resumoEstoqueTeste } from "@/test/handlers"
import { estoqueApi } from "@/lib/estoque"

describe("estoqueApi", () => {
  it("lista as posições paginadas com status e total", async () => {
    const pagina = await estoqueApi.listarPosicoes()
    expect(pagina.itens).toHaveLength(posicoesTeste.length)
    expect(pagina.itens[0].status).toBe("critico")
    expect(pagina.total).toBe(posicoesTeste.length)
  })

  it("o resumo envia unidadeId/insumoId como query params", async () => {
    let url: URL | undefined
    server.use(
      http.get("*/estoque/resumo", ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json(ok(resumoEstoqueTeste))
      }),
    )
    await estoqueApi.resumo({ unidadeId: "uni-hto", insumoId: "ins-001" })
    expect(url?.searchParams.get("unidadeId")).toBe("uni-hto")
    expect(url?.searchParams.get("insumoId")).toBe("ins-001")
  })

  it("envia page/size/sort ao paginar e ordenar", async () => {
    let url: URL | undefined
    server.use(
      http.get("*/estoque", ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json(ok([], 0))
      }),
    )
    await estoqueApi.listarPosicoes({}, { pagina: 2, tamanho: 20, ordenarPor: "quantidade", ordem: "desc" })
    expect(url?.searchParams.get("page")).toBe("2")
    expect(url?.searchParams.get("size")).toBe("20")
    expect(url?.searchParams.get("sort")).toBe("quantidade,desc")
  })

  it("envia os filtros de posição na query", async () => {
    let url: URL | undefined
    server.use(
      http.get("*/estoque", ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json(ok([]))
      }),
    )
    await estoqueApi.listarPosicoes({ status: "critico", unidadeId: "uni-hto" })
    expect(url?.searchParams.get("status")).toBe("critico")
    expect(url?.searchParams.get("unidadeId")).toBe("uni-hto")
  })

  it("traz o resumo de KPIs", async () => {
    const resumo = await estoqueApi.resumo()
    expect(resumo).toEqual(resumoEstoqueTeste)
  })

  it("traz a Curva ABC com itens ordenados e resumo por classe", async () => {
    const curva = await estoqueApi.curvaAbc()
    expect(curva.itens[0].classe).toBe("A")
    expect(curva.itens).toHaveLength(3)
    expect(curva.resumo).toHaveLength(3)
    expect(curva.resumo[0].classe).toBe("A")
  })

  it("detalha uma posição com lotes e movimentações", async () => {
    const detalhe = await estoqueApi.detalhar("ins-001", "uni-hto")
    expect(detalhe.lotes).toHaveLength(1)
    expect(detalhe.movimentacoes[0].tipo).toBe("Entrada")
  })

  it("lista lotes com filtros de validade", async () => {
    let url: URL | undefined
    server.use(
      http.get("*/lotes", ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json(ok(lotesTeste))
      }),
    )
    await estoqueApi.listarLotes({ comSaldo: true, validadeAteDias: 90 })
    expect(url?.searchParams.get("comSaldo")).toBe("true")
    expect(url?.searchParams.get("validadeAteDias")).toBe("90")
  })
})
