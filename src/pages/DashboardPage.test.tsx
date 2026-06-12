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
