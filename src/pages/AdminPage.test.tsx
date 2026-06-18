import { http, HttpResponse } from "msw"
import AdminPage from "@/pages/AdminPage"
import { renderizar, screen } from "@/test/utils"
import { server } from "@/test/server"
import { erro } from "@/test/handlers"
import { salvarToken } from "@/lib/auth-storage"

/** O usuário logado de teste é TI (mesmo id do primeiro usuário da lista — "Ana Sousa"). */
function renderAdmin() {
  salvarToken("jwt", true)
  return renderizar(<AdminPage />)
}

describe("AdminPage", () => {
  it("lista os usuários reais e os KPIs do catálogo", async () => {
    renderAdmin()
    expect(await screen.findByText("João Operador")).toBeInTheDocument()
    expect(screen.getByText("Maria Gestora")).toBeInTheDocument()
    // 2 de 3 ativos (Ana + João ativos; Maria inativa).
    expect(await screen.findByText("2/3")).toBeInTheDocument()
  })

  it("abre o modal de novo usuário e cria com sucesso", async () => {
    const { usuario } = renderAdmin()
    await usuario.click(await screen.findByRole("button", { name: /Novo usuário/ }))

    await usuario.type(await screen.findByLabelText("Nome"), "Pedro Novo")
    await usuario.type(screen.getByLabelText("E-mail"), "pedro@cahosp.local")
    await usuario.type(screen.getByLabelText("Senha"), "senha1234")
    await usuario.click(screen.getByRole("button", { name: "Criar usuário" }))

    expect(await screen.findByText("Usuário criado.")).toBeInTheDocument()
  })

  it("valida o formulário (nome obrigatório)", async () => {
    const { usuario } = renderAdmin()
    await usuario.click(await screen.findByRole("button", { name: /Novo usuário/ }))
    await usuario.click(screen.getByRole("button", { name: "Criar usuário" }))
    expect(await screen.findByText("Informe o nome.")).toBeInTheDocument()
  })

  it("desabilita a desativação da própria conta (espelha o 422 do backend)", async () => {
    renderAdmin()
    const botao = await screen.findByRole("button", { name: "Desativar Ana Sousa" })
    expect(botao).toBeDisabled()
  })

  it("mostra erro (toast) quando a alteração de status falha", async () => {
    server.use(
      http.patch("*/admin/usuarios/:id/status", () =>
        HttpResponse.json(erro("Falha ao alterar status.", "REGRA_NEGOCIO"), { status: 422 }),
      ),
    )
    const { usuario } = renderAdmin()
    await usuario.click(await screen.findByRole("button", { name: "Desativar João Operador" }))
    expect(await screen.findByText("Falha ao alterar status.")).toBeInTheDocument()
  })

  it("aba Cadastros lista as unidades reais e cria uma nova", async () => {
    const { usuario } = renderAdmin()
    await usuario.click(await screen.findByRole("tab", { name: /Cadastros/ }))

    expect(await screen.findByText("CAHOSP — Central")).toBeInTheDocument()

    await usuario.click(await screen.findByRole("button", { name: /Nova unidade/ }))
    // Textos curtos: a validação só exige campos não vazios (digitação no jsdom é lenta).
    await usuario.type(await screen.findByLabelText("Nome"), "Hosp")
    await usuario.type(screen.getByLabelText("Sigla"), "HNV")
    await usuario.type(screen.getByLabelText("Município"), "Cax")
    await usuario.type(screen.getByLabelText("Perfil demográfico"), "Ger")
    await usuario.click(screen.getByRole("button", { name: "Criar unidade" }))

    expect(await screen.findByText("Unidade criada.")).toBeInTheDocument()
  }, 30000)

  it("aba Cadastros abre o modal de itens da categoria ao clicar nela", async () => {
    const { usuario } = renderAdmin()
    await usuario.click(await screen.findByRole("tab", { name: /Cadastros/ }))
    await usuario.click(await screen.findByRole("button", { name: /Antibióticos/ }))
    // O item da categoria (Ceftriaxona) aparece no modal.
    expect(await screen.findByText("Ceftriaxona 1g")).toBeInTheDocument()
  })
})
