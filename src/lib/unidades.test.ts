import { http, HttpResponse } from "msw"
import { server } from "@/test/server"
import { ok, unidadesTeste } from "@/test/handlers"
import { unidadesApi } from "@/lib/unidades"

describe("unidadesApi", () => {
  it("lista as unidades", async () => {
    const unidades = await unidadesApi.listar()
    expect(unidades).toHaveLength(unidadesTeste.length)
    expect(unidades[0].sigla).toBe("CAHOSP")
  })

  it("envia os filtros como query params (rótulo pt-BR)", async () => {
    let url: URL | undefined
    server.use(
      http.get("*/unidades", ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json(ok([]))
      }),
    )
    await unidadesApi.listar({ porte: "Grande", ativo: true, busca: "hospital" })
    expect(url?.searchParams.get("porte")).toBe("Grande")
    expect(url?.searchParams.get("ativo")).toBe("true")
    expect(url?.searchParams.get("busca")).toBe("hospital")
  })

  it("não inclui filtros vazios na query", async () => {
    let url: URL | undefined
    server.use(
      http.get("*/unidades", ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json(ok([]))
      }),
    )
    await unidadesApi.listar({ busca: "" })
    expect(url?.search).toBe("")
  })

  it("busca uma unidade por id", async () => {
    server.use(
      http.get("*/unidades/uni-hto", () => HttpResponse.json(ok(unidadesTeste[1]))),
    )
    const unidade = await unidadesApi.buscar("uni-hto")
    expect(unidade.sigla).toBe("HTO")
  })
})
