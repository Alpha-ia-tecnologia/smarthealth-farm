import { http, HttpResponse } from "msw"
import { server } from "@/test/server"
import { insumosTeste, ok } from "@/test/handlers"
import { insumosApi } from "@/lib/insumos"

describe("insumosApi", () => {
  it("lista os insumos", async () => {
    const insumos = await insumosApi.listar()
    expect(insumos).toHaveLength(insumosTeste.length)
    expect(insumos[0].codigo).toBe("INS-001")
  })

  it("envia os filtros como query params (rótulo pt-BR)", async () => {
    let url: URL | undefined
    server.use(
      http.get("*/insumos", ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json(ok([]))
      }),
    )
    await insumosApi.listar({ categoria: "Antibióticos", essencial: true })
    expect(url?.searchParams.get("categoria")).toBe("Antibióticos")
    expect(url?.searchParams.get("essencial")).toBe("true")
  })

  it("envia unidadeId para listar só os insumos da unidade (filtro dependente)", async () => {
    let url: URL | undefined
    server.use(
      http.get("*/insumos", ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json(ok([]))
      }),
    )
    await insumosApi.listar({ unidadeId: "uni-hto", ativo: true })
    expect(url?.searchParams.get("unidadeId")).toBe("uni-hto")
    expect(url?.searchParams.get("ativo")).toBe("true")
  })

  it("busca um insumo por id", async () => {
    server.use(
      http.get("*/insumos/ins-001", () => HttpResponse.json(ok(insumosTeste[0]))),
    )
    const insumo = await insumosApi.buscar("ins-001")
    expect(insumo.nome).toBe("Ceftriaxona 1g")
  })

  it("cria um insumo (POST)", async () => {
    const criado = await insumosApi.criar({
      codigo: "INS-031",
      nome: "Amoxicilina 500mg",
      apresentacao: "Cápsula",
      categoria: "Antibióticos",
      unidadeMedida: "cp",
      criticidade: "Média",
      essencial: true,
    })
    expect(criado.codigo).toBe("INS-031")
    expect(criado.ativo).toBe(true)
  })

  it("ativa/desativa um insumo (PATCH status)", async () => {
    const atualizado = await insumosApi.alterarStatus("ins-001", false)
    expect(atualizado.ativo).toBe(false)
  })

  it("propaga CONFLITO (409) ao criar com código duplicado", async () => {
    server.use(
      http.post("*/insumos", () =>
        HttpResponse.json({ success: false, error: "Código já existe.", codigo: "CONFLITO" }, { status: 409 }),
      ),
    )
    await expect(
      insumosApi.criar({
        codigo: "INS-001",
        nome: "X",
        apresentacao: "Y",
        categoria: "Antibióticos",
        unidadeMedida: "cp",
        criticidade: "Alta",
        essencial: false,
      }),
    ).rejects.toMatchObject({ codigo: "CONFLITO" })
  })
})
