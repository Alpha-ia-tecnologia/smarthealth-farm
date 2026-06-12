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

  it("cria uma unidade (POST)", async () => {
    const criada = await unidadesApi.criar({
      nome: "Hospital Novo",
      sigla: "HNV",
      municipio: "Caxias",
      porte: "Médio",
      leitos: 80,
      conectividade: "Estável",
      perfilDemografico: "Geral",
      hub: false,
    })
    expect(criada.sigla).toBe("HNV")
    expect(criada.ativo).toBe(true)
  })

  it("ativa/desativa uma unidade (PATCH status)", async () => {
    const atualizada = await unidadesApi.alterarStatus("uni-hto", false)
    expect(atualizada.ativo).toBe(false)
  })

  it("propaga CONFLITO (409) ao criar com sigla duplicada", async () => {
    server.use(
      http.post("*/unidades", () =>
        HttpResponse.json({ success: false, error: "Sigla já existe.", codigo: "CONFLITO" }, { status: 409 }),
      ),
    )
    await expect(
      unidadesApi.criar({
        nome: "X",
        sigla: "HTO",
        municipio: "Y",
        porte: "Grande",
        leitos: 1,
        conectividade: "Estável",
        perfilDemografico: "Z",
        hub: false,
      }),
    ).rejects.toMatchObject({ codigo: "CONFLITO" })
  })
})
