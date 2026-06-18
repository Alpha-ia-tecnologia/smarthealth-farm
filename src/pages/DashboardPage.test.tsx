import { http, HttpResponse } from "msw"
import DashboardPage from "@/pages/DashboardPage"
import { renderizar, screen, waitFor } from "@/test/utils"
import { server } from "@/test/server"
import { erro, ok, painelGerencialTeste } from "@/test/handlers"
import { salvarToken } from "@/lib/auth-storage"

function renderDashboard() {
  salvarToken("jwt", true)
  return renderizar(<DashboardPage />)
}

describe("DashboardPage", () => {
  it("mostra os KPIs vindos de /indicadores", async () => {
    renderDashboard()
    expect(await screen.findByText("Taxa de desabastecimento")).toBeInTheDocument()
    // Valor atual do indicador ind-ruptura (11,2%).
    expect(await screen.findByText("11,2%")).toBeInTheDocument()
  })

  it("mostra a série agregada com o insumo mais crítico da rede", async () => {
    renderDashboard()
    expect(
      await screen.findByText("Demanda × Previsão — Ceftriaxona 1g (rede)"),
    ).toBeInTheDocument()
  })

  it("mostra os desabastecimentos evitados reais (indicador, não hardcoded)", async () => {
    renderDashboard()
    expect(await screen.findByText("147")).toBeInTheDocument()
  })

  it("assertividade é o complemento do MAPE e preserva a casa decimal (100 − 11,8 = 88,2)", async () => {
    renderDashboard()
    // Medidor de assertividade: não arredonda para inteiro (88), mantém 88,2.
    expect(await screen.findByText("88,2")).toBeInTheDocument()
    // Erro médio (MAPE) do mesmo indicador — os dois somam 100 (aparece no KPI e no medidor).
    expect(screen.getAllByText("11,8%").length).toBeGreaterThan(0)
  })

  it("mostra a cobertura por unidade e os alertas recentes do /painel", async () => {
    renderDashboard()
    // CoverageChart usa as siglas das unidades.
    expect(await screen.findAllByText("HTO")).not.toHaveLength(0)
    // Lista de alertas recentes (tipo do alerta de teste).
    expect(await screen.findByText("Desabastecimento")).toBeInTheDocument()
  })

  it("a contagem de alertas usa 'ativos' (abertos + em tratamento), coerente com a tela de alertas", async () => {
    renderDashboard()
    expect(await screen.findByText("15 alertas ativos na rede")).toBeInTheDocument()
  })

  it("abre o modal com números reais e análise de IA ao clicar num KPI de indicador", async () => {
    const { usuario } = renderDashboard()
    const kpi = await screen.findByRole("button", {
      name: "Ver números e análise de Taxa de desabastecimento",
    })
    await usuario.click(kpi)

    // Modal: nome completo do indicador, números reais e a análise gerada pela IA.
    expect(await screen.findByText("Taxa de desabastecimento de essenciais")).toBeInTheDocument()
    expect(screen.getByText("Linha de base")).toBeInTheDocument()
    expect(await screen.findByText(/Resposta para:/)).toBeInTheDocument()
  })

  it("abre o modal de análise de um gráfico (cobertura) com detalhe e insight de IA", async () => {
    const { usuario } = renderDashboard()
    const botao = await screen.findByRole("button", { name: "Análise IA — Cobertura por unidade" })
    await usuario.click(botao)

    // Modal: detalhe (tabela com a situação por unidade) + bloco de análise por IA.
    expect(await screen.findByText("Situação")).toBeInTheDocument()
    expect(screen.getByText("Análise por IA")).toBeInTheDocument()
    expect(await screen.findByText(/Resposta para:/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Gerar novamente" })).toBeInTheDocument()
  })

  it("ao filtrar por unidade, mantém os KPIs do projeto (não troca por operacionais)", async () => {
    const { usuario } = renderDashboard()
    // Sem filtro: KPIs do projeto (rede).
    expect(await screen.findByText("Taxa de desabastecimento")).toBeInTheDocument()

    await usuario.click(screen.getByRole("combobox", { name: "Unidade" }))
    await usuario.click(await screen.findByRole("option", { name: "HTO · São Luís" }))

    // Com unidade: os KPIs do projeto permanecem; o filtro afeta só os blocos abaixo.
    expect(await screen.findByText("Taxa de desabastecimento")).toBeInTheDocument()
    expect(screen.queryByText("Itens críticos")).not.toBeInTheDocument()
  })

  it("envia o insumoId ao /painel ao filtrar por insumo", async () => {
    let ultimaUrl: URL | undefined
    server.use(
      http.get("*/painel", ({ request }) => {
        ultimaUrl = new URL(request.url)
        return HttpResponse.json(ok(painelGerencialTeste))
      }),
    )
    const { usuario } = renderDashboard()

    await usuario.click(await screen.findByRole("combobox", { name: "Insumo" }))
    await usuario.click(await screen.findByRole("option", { name: "Dipirona 500mg/mL (INS-002)" }))

    await waitFor(() => expect(ultimaUrl?.searchParams.get("insumoId")).toBe("ins-002"))
  })

  it("mostra o resumo da Curva ABC da rede", async () => {
    renderDashboard()
    expect(await screen.findByText("Curva ABC da rede — valor de consumo")).toBeInTheDocument()
    expect(await screen.findByText("Classe A")).toBeInTheDocument()
  })

  it("gera a análise gerencial da página por IA pelo botão do topo", async () => {
    const { usuario } = renderDashboard()
    await usuario.click(await screen.findByRole("button", { name: "Análise IA — Dashboard" }))
    expect(await screen.findByText("Análise gerencial por IA")).toBeInTheDocument()
    expect(screen.getByText("Análise por IA")).toBeInTheDocument()
    expect(await screen.findByText(/Resposta para:/)).toBeInTheDocument()
  })

  it("mostra erro quando o /painel falha", async () => {
    // 403 (erro de cliente) não tem retry na política do QueryClient → falha imediata.
    server.use(
      http.get("*/painel", () =>
        HttpResponse.json(erro("Acesso negado.", "ACESSO_NEGADO"), { status: 403 }),
      ),
    )
    renderDashboard()
    expect(await screen.findByText("Não foi possível carregar a série.")).toBeInTheDocument()
  })

  it("mostra erro quando os /indicadores falham", async () => {
    server.use(
      http.get("*/indicadores", () =>
        HttpResponse.json(erro("Acesso negado.", "ACESSO_NEGADO"), { status: 403 }),
      ),
    )
    renderDashboard()
    expect(
      await screen.findByText("Não foi possível carregar os indicadores do projeto."),
    ).toBeInTheDocument()
  })
})
