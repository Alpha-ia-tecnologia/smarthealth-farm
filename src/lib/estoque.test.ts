import { http, HttpResponse } from "msw"
import { server } from "@/test/server"
import { lotesTeste, ok, posicoesTeste, resumoEstoqueTeste } from "@/test/handlers"
import { estoqueApi } from "@/lib/estoque"

describe("estoqueApi", () => {
  it("lista as posições com status", async () => {
    const posicoes = await estoqueApi.listarPosicoes()
    expect(posicoes).toHaveLength(posicoesTeste.length)
    expect(posicoes[0].status).toBe("critico")
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

  it("detalha uma posição com lotes e movimentações", async () => {
    const detalhe = await estoqueApi.detalhar("med-001", "uni-hto")
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
