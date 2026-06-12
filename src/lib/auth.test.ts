import { http, HttpResponse } from "msw"
import { server } from "@/test/server"
import { erro, usuarioTeste } from "@/test/handlers"
import { authApi } from "@/lib/auth"

describe("authApi", () => {
  it("login devolve usuário e token", async () => {
    const resposta = await authApi.login("ana@cahosp.local", "senha123")
    expect(resposta.token).toBe("jwt-de-teste")
    expect(resposta.usuario).toEqual(usuarioTeste)
  })

  it("login propaga ApiError em credencial inválida", async () => {
    server.use(
      http.post("*/auth/login", () =>
        HttpResponse.json(erro("E-mail ou senha invalidos.", "CREDENCIAIS_INVALIDAS"), {
          status: 401,
        }),
      ),
    )
    await expect(authApi.login("a@b.com", "x")).rejects.toMatchObject({
      codigo: "CREDENCIAIS_INVALIDAS",
      status: 401,
    })
  })

  it("me devolve o usuário do token", async () => {
    const usuario = await authApi.me()
    expect(usuario).toEqual(usuarioTeste)
  })
})
