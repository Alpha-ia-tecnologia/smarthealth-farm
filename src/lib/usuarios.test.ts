import { http, HttpResponse } from "msw"
import { usuariosApi } from "@/lib/usuarios"
import { ApiError } from "@/lib/api"
import { server } from "@/test/server"
import { erro, ok, usuariosAdminTeste } from "@/test/handlers"

describe("usuariosApi", () => {
  it("lista usuários", async () => {
    const lista = await usuariosApi.listar()
    expect(lista).toHaveLength(usuariosAdminTeste.length)
    expect(lista[0].perfil).toBe("TI")
  })

  it("envia os filtros (perfil, ativo, busca) na query string", async () => {
    let url = ""
    server.use(
      http.get("*/admin/usuarios", ({ request }) => {
        url = request.url
        return HttpResponse.json(ok(usuariosAdminTeste, usuariosAdminTeste.length))
      }),
    )
    await usuariosApi.listar({ perfil: "TI", ativo: true, busca: "ana" })
    const params = new URL(url).searchParams
    expect(params.get("perfil")).toBe("TI")
    expect(params.get("ativo")).toBe("true")
    expect(params.get("busca")).toBe("ana")
  })

  it("cria um usuário com unidade opcional", async () => {
    const criado = await usuariosApi.criar({
      nome: "Novo",
      email: "novo@cahosp.local",
      perfil: "Operador",
      senha: "senha1234",
      unidadeId: "uni-hto",
    })
    expect(criado.nome).toBe("Novo")
    expect(criado.unidadeId).toBe("uni-hto")
  })

  it("lança ApiError com código CONFLITO em e-mail duplicado (409)", async () => {
    server.use(
      http.post("*/admin/usuarios", () =>
        HttpResponse.json(erro("E-mail já existe.", "CONFLITO"), { status: 409 }),
      ),
    )
    await expect(
      usuariosApi.criar({ nome: "X", email: "dup@cahosp.local", perfil: "TI", senha: "senha1234" }),
    ).rejects.toMatchObject({ codigo: "CONFLITO" })
  })

  it("lança ApiError com código REGRA_NEGOCIO em autodesativação (422)", async () => {
    server.use(
      http.patch("*/admin/usuarios/:id/status", () =>
        HttpResponse.json(erro("Você não pode desativar a própria conta.", "REGRA_NEGOCIO"), {
          status: 422,
        }),
      ),
    )
    await expect(usuariosApi.alterarStatus("abc", false)).rejects.toBeInstanceOf(ApiError)
  })

  it("redefine a senha", async () => {
    const msg = await usuariosApi.redefinirSenha("abc", "novaSenha9")
    expect(msg).toContain("redefinida")
  })
})
