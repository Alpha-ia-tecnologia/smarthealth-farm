import RecomendacoesPage from "@/pages/RecomendacoesPage"
import AlertasPage from "@/pages/AlertasPage"
import PrevisaoPage from "@/pages/PrevisaoPage"
import OperacionalPage from "@/pages/OperacionalPage"
import IngestaoPage from "@/pages/IngestaoPage"
import IntegracaoPage from "@/pages/IntegracaoPage"
import SegurancaPage from "@/pages/SegurancaPage"
import RelatoriosPage from "@/pages/RelatoriosPage"
import { renderizar, screen } from "@/test/utils"

/**
 * Cobre a "Análise por IA" de nível de tela em cada página: o botão no cabeçalho abre o modal,
 * que dispara a chamada ao AI Gateway (o handler de teste ecoa a última mensagem enviada).
 */
const PAGINAS: Array<[string, React.ComponentType]> = [
  ["Recomendações", RecomendacoesPage],
  ["Alertas", AlertasPage],
  ["Previsão", PrevisaoPage],
  ["Operacional", OperacionalPage],
  ["Ingestão", IngestaoPage],
  ["Integração", IntegracaoPage],
  ["Segurança", SegurancaPage],
  ["Relatórios", RelatoriosPage],
]

describe("Análise por IA nas telas", () => {
  it.each(PAGINAS)("abre o modal de análise por IA em %s", async (rotulo, Page) => {
    const { usuario } = renderizar(<Page />)
    await usuario.click(await screen.findByRole("button", { name: `Análise IA — ${rotulo}` }))
    expect(await screen.findByText("Análise por IA")).toBeInTheDocument()
    expect(await screen.findByText(/Resposta para:/)).toBeInTheDocument()
  })
})
