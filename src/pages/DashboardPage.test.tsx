import { http, HttpResponse } from "msw"
import DashboardPage from "@/pages/DashboardPage"
import { renderizar, screen } from "@/test/utils"
import { server } from "@/test/server"
import { erro } from "@/test/handlers"
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

  it("mostra a série agregada com o medicamento mais crítico da rede", async () => {
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

  it("ao filtrar por unidade, troca os KPIs do edital pelos operacionais da unidade", async () => {
    const { usuario } = renderDashboard()
    // Sem filtro: KPI do edital (rede).
    expect(await screen.findByText("Taxa de desabastecimento")).toBeInTheDocument()

    await usuario.click(screen.getByRole("combobox", { name: "Unidade" }))
    await usuario.click(await screen.findByRole("option", { name: "HTO · São Luís" }))

    // Com unidade: KPIs operacionais da unidade (do /painel filtrado).
    expect(await screen.findByText("Itens críticos")).toBeInTheDocument()
    expect(screen.queryByText("Taxa de desabastecimento")).not.toBeInTheDocument()
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
