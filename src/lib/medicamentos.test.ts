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

  it("busca um medicamento por id", async () => {
    server.use(
      http.get("*/medicamentos/med-001", () => HttpResponse.json(ok(medicamentosTeste[0]))),
    )
    const medicamento = await medicamentosApi.buscar("med-001")
    expect(medicamento.nome).toBe("Ceftriaxona 1g")
  })
})
