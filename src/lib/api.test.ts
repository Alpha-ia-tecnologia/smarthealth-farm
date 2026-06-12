import { http, HttpResponse } from "msw"
import { server } from "@/test/server"
import { erro, ok } from "@/test/handlers"
import { salvarToken } from "@/lib/auth-storage"
import { api, ApiError } from "@/lib/api"

describe("api — cliente HTTP", () => {
  it("desembrulha o envelope e devolve apenas o data", async () => {
    server.use(http.get("*/coisas", () => HttpResponse.json(ok({ valor: 42 }))))
    const data = await api.get<{ valor: number }>("/coisas")
    expect(data).toEqual({ valor: 42 })
  })

  it("serializa o corpo como JSON no POST", async () => {
    let recebido: unknown
    server.use(
      http.post("*/eco", async ({ request }) => {
        recebido = await request.json()
        return HttpResponse.json(ok({ ecoado: true }))
      }),
    )
    await api.post("/eco", { nome: "teste" }, { auth: false })
    expect(recebido).toEqual({ nome: "teste" })
  })

  it("injeta o token Bearer quando há sessão", async () => {
    salvarToken("meu-jwt", true)
    let autorizacao: string | null = null
    server.use(
      http.get("*/protegido", ({ request }) => {
        autorizacao = request.headers.get("Authorization")
        return HttpResponse.json(ok(null))
      }),
    )
    await api.get("/protegido")
    expect(autorizacao).toBe("Bearer meu-jwt")
  })

  it("não envia Authorization quando auth: false", async () => {
    salvarToken("meu-jwt", true)
    let autorizacao: string | null = "presente"
    server.use(
      http.post("*/publico", ({ request }) => {
        autorizacao = request.headers.get("Authorization")
        return HttpResponse.json(ok(null))
      }),
    )
    await api.post("/publico", undefined, { auth: false })
    expect(autorizacao).toBeNull()
  })

  it("lança ApiError com status e código no envelope de erro", async () => {
    server.use(
      http.get("*/falha", () =>
        HttpResponse.json(erro("Não encontrado.", "NAO_ENCONTRADO"), { status: 404 }),
      ),
    )
    await expect(api.get("/falha")).rejects.toMatchObject({
      name: "ApiError",
      status: 404,
      codigo: "NAO_ENCONTRADO",
      message: "Não encontrado.",
    })
  })

  it("trata sucesso HTTP com envelope success:false como erro", async () => {
    server.use(http.get("*/inconsistente", () => HttpResponse.json(erro("Falhou.", "REGRA_NEGOCIO"))))
    await expect(api.get("/inconsistente")).rejects.toBeInstanceOf(ApiError)
  })

  it("converte falha de rede em ApiError com código REDE", async () => {
    server.use(http.get("*/rede", () => HttpResponse.error()))
    await expect(api.get("/rede")).rejects.toMatchObject({ codigo: "REDE", status: 0 })
  })
})
