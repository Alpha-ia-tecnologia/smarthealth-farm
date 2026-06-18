import { http, HttpResponse } from "msw"
import IndicadoresPage from "@/pages/IndicadoresPage"
import { renderizar, screen } from "@/test/utils"
import { server } from "@/test/server"
import { erro } from "@/test/handlers"
import { salvarToken } from "@/lib/auth-storage"

function renderIndicadores() {
  salvarToken("jwt", true)
  return renderizar(<IndicadoresPage />)
}

describe("IndicadoresPage", () => {
  it("mostra os KPIs do resumo (/indicadores/resumo)", async () => {
    renderIndicadores()
    expect(await screen.findByText("Indicadores monitorados")).toBeInTheDocument()
    expect(screen.getByText("Metas atingidas")).toBeInTheDocument()
    expect(screen.getByText("Em progresso")).toBeInTheDocument()
  })

  it("mostra os cards de indicador com a meta atingida (status do backend)", async () => {
    renderIndicadores()
    // Todos os indicadores de teste atingiram a meta → vários badges "Meta atingida".
    expect((await screen.findAllByText("Meta atingida")).length).toBeGreaterThan(0)
  })

  it("mostra a comparação objetiva Base/Atual/Meta no card (sem o 'progresso até a meta')", async () => {
    renderIndicadores()
    // Faixa objetiva substitui a barra de progresso que podia passar de 100%.
    expect((await screen.findAllByText("Linha de base")).length).toBeGreaterThan(0)
    expect(screen.queryByText("progresso até a meta")).not.toBeInTheDocument()
  })

  it("mostra o comparativo piloto × atual com a variação real", async () => {
    renderIndicadores()
    expect(
      await screen.findByText("Operação em paralelo — piloto × sistema atual"),
    ).toBeInTheDocument()
    expect(screen.getByText("Sistema atual")).toBeInTheDocument()
    // Variação real do ind-ruptura (variacaoPct = -39).
    expect(screen.getByText("-39%")).toBeInTheDocument()
  })

  it("marca o painel de coleta como dados ilustrativos (mock)", async () => {
    renderIndicadores()
    expect(await screen.findByText("Dados ilustrativos")).toBeInTheDocument()
  })

  it("abre o insight de IA de um indicador ao clicar em Análise IA", async () => {
    const { usuario } = renderIndicadores()
    await usuario.click(
      await screen.findByRole("button", { name: "Análise IA — Taxa de desabastecimento de essenciais" }),
    )
    // Modal de insight do indicador: bloco de IA + resposta (o handler ecoa a última mensagem).
    expect(await screen.findByText("Análise por IA")).toBeInTheDocument()
    expect(await screen.findByText(/Resposta para:/)).toBeInTheDocument()
  })

  it("mostra erro quando a lista de indicadores falha", async () => {
    server.use(
      http.get("*/indicadores", () =>
        HttpResponse.json(erro("Acesso negado.", "ACESSO_NEGADO"), { status: 403 }),
      ),
    )
    renderIndicadores()
    expect(await screen.findByText("Não foi possível carregar os indicadores.")).toBeInTheDocument()
  })

  it("mostra erro quando o resumo falha", async () => {
    server.use(
      http.get("*/indicadores/resumo", () =>
        HttpResponse.json(erro("Acesso negado.", "ACESSO_NEGADO"), { status: 403 }),
      ),
    )
    renderIndicadores()
    expect(
      await screen.findByText("Não foi possível carregar o resumo dos indicadores."),
    ).toBeInTheDocument()
  })
})
