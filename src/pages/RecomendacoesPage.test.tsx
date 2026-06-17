import { http, HttpResponse } from "msw"
import RecomendacoesPage from "@/pages/RecomendacoesPage"
import { renderizar, screen, waitFor, within } from "@/test/utils"
import { server } from "@/test/server"
import { erro, ok, usuarioTeste } from "@/test/handlers"
import { salvarToken } from "@/lib/auth-storage"

/** Autentica o usuário de teste (Gestor por padrão) antes de renderizar. */
function renderComoGestor() {
  salvarToken("jwt", true)
  return renderizar(<RecomendacoesPage />)
}

function renderComoOperador() {
  server.use(
    http.get("*/auth/me", () => HttpResponse.json(ok({ ...usuarioTeste, perfil: "Operador" }))),
  )
  salvarToken("jwt", true)
  return renderizar(<RecomendacoesPage />)
}

describe("RecomendacoesPage", () => {
  it("mostra os KPIs e os cards vindos da API", async () => {
    renderComoGestor()
    expect(await screen.findByText("Economia potencial")).toBeInTheDocument()
    expect(await screen.findByText("Ceftriaxona 1g")).toBeInTheDocument()
    expect(screen.getByText("Dipirona 500mg/mL")).toBeInTheDocument()
  })

  it("Gestor aprova uma recomendação: confirma no modal (com quem faz a ação) + toast", async () => {
    const { usuario } = renderComoGestor()
    await usuario.click(await screen.findByRole("button", { name: /Aprovar/ }))

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText(/Ana Sousa/)).toBeInTheDocument()

    const confirmar = within(dialog).getByRole("button", { name: /Confirmar aprovação/ })
    expect(confirmar).toBeDisabled()
    await usuario.click(within(dialog).getByRole("checkbox"))
    await usuario.click(confirmar)

    expect(await screen.findByText("Recomendação aprovada.")).toBeInTheDocument()
  })

  it("Gestor executa uma recomendação: confirma no modal + toast", async () => {
    const { usuario } = renderComoGestor()
    await usuario.click(await screen.findByRole("button", { name: /Executar/ }))

    const dialog = await screen.findByRole("dialog")
    const confirmar = within(dialog).getByRole("button", { name: /Confirmar execução/ })
    expect(confirmar).toBeDisabled()
    await usuario.click(within(dialog).getByRole("checkbox"))
    await usuario.click(confirmar)

    expect(await screen.findByText("Recomendação executada.")).toBeInTheDocument()
  })

  it("'Criar transferência' abre o modal de nova transferência", async () => {
    const { usuario } = renderComoGestor()
    await usuario.click(await screen.findByRole("button", { name: /Criar transferência/ }))
    expect(await screen.findByText("Nova transferência")).toBeInTheDocument()
  })

  it("clicar num card pendente abre o modal de edição pré-preenchido", async () => {
    const { usuario } = renderComoGestor()
    // Ceftriaxona (rec-1) é pendente → o card é clicável para edição.
    await usuario.click(await screen.findByText("Ceftriaxona 1g"))
    expect(await screen.findByText("Editar transferência")).toBeInTheDocument()
  })

  it("Gestor recusa uma pendente: confirma no modal + toast", async () => {
    const { usuario } = renderComoGestor()
    await usuario.click(await screen.findByRole("button", { name: /Recusar/ }))

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("Confirmar recusa da recomendação")).toBeInTheDocument()
    await usuario.click(within(dialog).getByRole("checkbox"))
    await usuario.click(within(dialog).getByRole("button", { name: /Confirmar recusa/ }))

    expect(await screen.findByText("Recomendação recusada.")).toBeInTheDocument()
  })

  it("Gestor vê o botão de gerar e recebe o resultado do motor", async () => {
    const { usuario } = renderComoGestor()
    await usuario.click(await screen.findByRole("button", { name: /Gerar recomendações/ }))
    expect(
      await screen.findByText("7 recomendacao(oes) gerada(s): 4 de reposição e 3 de redistribuição."),
    ).toBeInTheDocument()
  })

  it("Operador não vê ações de Gestor (gerar/aprovar/executar) — RBAC espelhado", async () => {
    renderComoOperador()
    await screen.findByText("Ceftriaxona 1g")
    expect(screen.queryByRole("button", { name: /Gerar recomendações/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Aprovar/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Executar/ })).not.toBeInTheDocument()
  })

  it("filtra por tipo enviando o rótulo ao servidor", async () => {
    let tipoEnviado: string | null = "inicial"
    server.use(
      http.get("*/recomendacoes", ({ request }) => {
        tipoEnviado = new URL(request.url).searchParams.get("tipo")
        return HttpResponse.json(ok([], 0))
      }),
    )
    const { usuario } = renderComoGestor()
    await usuario.click(await screen.findByRole("tab", { name: "Redistribuição" }))
    await waitFor(() => expect(tipoEnviado).toBe("Redistribuição"))
  })

  it("pagina no servidor: a lista envia page/size na requisição", async () => {
    let url: URL | undefined
    server.use(
      http.get("*/recomendacoes", ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json(ok([], 0))
      }),
    )
    renderComoGestor()
    await waitFor(() => expect(url?.searchParams.get("size")).not.toBeNull())
    expect(url?.searchParams.get("page")).toBe("0")
  })

  it("mostra erro quando a lista falha", async () => {
    server.use(
      http.get("*/recomendacoes", () =>
        HttpResponse.json(erro("Acesso negado.", "ACESSO_NEGADO"), { status: 403 }),
      ),
    )
    renderComoGestor()
    expect(await screen.findByText("Não foi possível carregar as recomendações.")).toBeInTheDocument()
  })

  it("marca o painel de desempenho como dados ilustrativos (mock)", async () => {
    renderComoGestor()
    expect(await screen.findByText("Dados ilustrativos")).toBeInTheDocument()
  })
})
