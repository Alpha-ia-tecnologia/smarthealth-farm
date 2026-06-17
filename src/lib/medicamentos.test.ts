import { http, HttpResponse } from "msw"
import { server } from "@/test/server"
import { medicamentosTeste, ok } from "@/test/handlers"
import { medicamentosApi } from "@/lib/medicamentos"

describe("medicamentosApi", () => {
  it("lista os medicamentos", async () => {
    const medicamentos = await medicamentosApi.listar()
    expect(medicamentos).toHaveLength(medicamentosTeste.length)
    expect(medicamentos[0].codigo).toBe("MED-001")
  })

  it("envia os filtros como query params (rótulo pt-BR)", async () => {
    let url: URL | undefined
    server.use(
      http.get("*/medicamentos", ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json(ok([]))
      }),
    )
    await medicamentosApi.listar({ familia: "Antibióticos", essencial: true })
    expect(url?.searchParams.get("familia")).toBe("Antibióticos")
    expect(url?.searchParams.get("essencial")).toBe("true")
  })

  it("envia unidadeId para listar só os medicamentos da unidade (filtro dependente)", async () => {
    let url: URL | undefined
    server.use(
      http.get("*/medicamentos", ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json(ok([]))
      }),
    )
    await medicamentosApi.listar({ unidadeId: "uni-hto", ativo: true })
    expect(url?.searchParams.get("unidadeId")).toBe("uni-hto")
    expect(url?.searchParams.get("ativo")).toBe("true")
  })

  it("busca um medicamento por id", async () => {
    server.use(
      http.get("*/medicamentos/med-001", () => HttpResponse.json(ok(medicamentosTeste[0]))),
    )
    const medicamento = await medicamentosApi.buscar("med-001")
    expect(medicamento.nome).toBe("Ceftriaxona 1g")
  })

  it("cria um medicamento (POST)", async () => {
    const criado = await medicamentosApi.criar({
      codigo: "MED-031",
      nome: "Amoxicilina 500mg",
      apresentacao: "Cápsula",
      familia: "Antibióticos",
      unidadeMedida: "cp",
      criticidade: "Média",
      essencial: true,
    })
    expect(criado.codigo).toBe("MED-031")
    expect(criado.ativo).toBe(true)
  })

  it("ativa/desativa um medicamento (PATCH status)", async () => {
    const atualizado = await medicamentosApi.alterarStatus("med-001", false)
    expect(atualizado.ativo).toBe(false)
  })

  it("propaga CONFLITO (409) ao criar com código duplicado", async () => {
    server.use(
      http.post("*/medicamentos", () =>
        HttpResponse.json({ success: false, error: "Código já existe.", codigo: "CONFLITO" }, { status: 409 }),
      ),
    )
    await expect(
      medicamentosApi.criar({
        codigo: "MED-001",
        nome: "X",
        apresentacao: "Y",
        familia: "Antibióticos",
        unidadeMedida: "cp",
        criticidade: "Alta",
        essencial: false,
      }),
    ).rejects.toMatchObject({ codigo: "CONFLITO" })
  })
})
