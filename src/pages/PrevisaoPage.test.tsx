import { http, HttpResponse } from "msw"
import PrevisaoPage from "@/pages/PrevisaoPage"
import { renderizar, screen, waitFor } from "@/test/utils"
import { server } from "@/test/server"
import { erro, ok, usuarioTeste } from "@/test/handlers"
import { salvarToken } from "@/lib/auth-storage"

/** Autentica o usuário de teste (Gestor por padrão) antes de renderizar. */
function renderComoGestor() {
  salvarToken("jwt", true)
  return renderizar(<PrevisaoPage />)
}

function renderComoOperador() {
  server.use(
    http.get("*/auth/me", () => HttpResponse.json(ok({ ...usuarioTeste, perfil: "Operador" }))),
  )
  salvarToken("jwt", true)
  return renderizar(<PrevisaoPage />)
}

describe("PrevisaoPage", () => {
  it("mostra os KPIs e as previsões vindas da API", async () => {
    renderComoGestor()
    expect(await screen.findByText("Erro médio (MAPE)")).toBeInTheDocument()
    // KPI "Itens críticos na meta" usa o resumo (1/1).
    expect(await screen.findByText("1/1")).toBeInTheDocument()
    // Linhas da tabela.
    expect(await screen.findByText("Ceftriaxona 1g")).toBeInTheDocument()
    expect(screen.getByText("Dipirona 500mg/mL")).toBeInTheDocument()
  })

  it("seleciona a primeira previsão e abre a série temporal", async () => {
    renderComoGestor()
    // O título da seção de detalhe reflete o item selecionado (primeira linha).
    expect(await screen.findByText("Previsão — Ceftriaxona 1g")).toBeInTheDocument()
  })

  it("Gestor vê o botão de recalibrar e recebe o resultado do motor", async () => {
    const { usuario } = renderComoGestor()
    const botao = await screen.findByRole("button", { name: /Recalibrar previsões/ })
    await usuario.click(botao)
    expect(
      await screen.findByText("2 previsoes recalibradas; drift estabilizado."),
    ).toBeInTheDocument()
  })

  it("Operador não vê o botão de recalibrar (RBAC espelhado)", async () => {
    renderComoOperador()
    await screen.findByText("Ceftriaxona 1g")
    expect(screen.queryByRole("button", { name: /Recalibrar previsões/ })).not.toBeInTheDocument()
  })

  it("mostra o estado vazio quando não há previsões", async () => {
    server.use(http.get("*/previsoes", () => HttpResponse.json(ok([], 0))))
    renderComoGestor()
    expect(
      await screen.findByText("Nenhuma previsão disponível no momento."),
    ).toBeInTheDocument()
  })

  it("mostra erro quando a lista falha", async () => {
    // 403: erro de cliente não tem retry na política do QueryClient → falha imediata.
    server.use(
      http.get("*/previsoes", () =>
        HttpResponse.json(erro("Acesso negado.", "ACESSO_NEGADO"), { status: 403 }),
      ),
    )
    renderComoGestor()
    expect(await screen.findByText("Não foi possível carregar as previsões.")).toBeInTheDocument()
  })

  it("marca o painel de composição como dados ilustrativos (mock)", async () => {
    renderComoGestor()
    expect(await screen.findByText("Dados ilustrativos")).toBeInTheDocument()
  })

  it("pagina no servidor: a lista envia page/size na requisição", async () => {
    let url: URL | undefined
    server.use(
      http.get("*/previsoes", ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json(ok([], 0))
      }),
    )
    renderComoGestor()
    await waitFor(() => expect(url?.searchParams.get("size")).not.toBeNull())
    expect(url?.searchParams.get("page")).toBe("0")
  })
})
