import { http, HttpResponse } from "msw"
import { IndicadorInsightDialog } from "./IndicadorInsightDialog"
import { renderizar, screen } from "@/test/utils"
import { server } from "@/test/server"
import { indicadoresTeste, ok, erro } from "@/test/handlers"

// ind-ruptura: atual 11,2% · base 18,4% · meta 11,96% · variação −39% · meta atingida.
const indicador = indicadoresTeste[0]

describe("IndicadorInsightDialog", () => {
  it("mostra os números reais do indicador (atual, base e variação)", async () => {
    renderizar(<IndicadorInsightDialog indicador={indicador} aberto onOpenChange={() => {}} />)

    // Título com o nome completo do indicador e o status da meta.
    expect(await screen.findByText("Taxa de desabastecimento de essenciais")).toBeInTheDocument()
    expect(screen.getByText("Meta atingida")).toBeInTheDocument()

    // Números reais: atual, linha de base e variação vs. base.
    expect(screen.getByText("11,2%")).toBeInTheDocument()
    expect(screen.getByText("18,4%")).toBeInTheDocument()
    expect(screen.getByText("-39%")).toBeInTheDocument()
    expect(screen.getByText("Linha de base")).toBeInTheDocument()
  })

  it("mostra a barra de progresso com o marcador da meta", async () => {
    renderizar(<IndicadorInsightDialog indicador={indicador} aberto onOpenChange={() => {}} />)

    // Barra acessível com o progresso e a posição da meta (100% na escala).
    const barra = await screen.findByRole("img", { name: /Progresso até a meta: 112%/ })
    expect(barra).toBeInTheDocument()
    expect(barra).toHaveAccessibleName(/A meta corresponde a 100% \(atingida\)/)
    // "Meta" aparece duas vezes: no tile de número real e no marcador da régua da barra.
    expect(screen.getAllByText("Meta").length).toBeGreaterThanOrEqual(2)
  })

  it("mostra o lastro em números absolutos por trás da taxa (%)", async () => {
    renderizar(<IndicadorInsightDialog indicador={indicador} aberto onOpenChange={() => {}} />)
    // ind-ruptura: 9 de 80 itens essenciais por trás dos 11,2%.
    expect(await screen.findByText("Em números reais")).toBeInTheDocument()
    expect(screen.getByText("9")).toBeInTheDocument()
    expect(screen.getByText("80")).toBeInTheDocument()
    expect(screen.getByText("itens essenciais")).toBeInTheDocument()
  })

  it("omite o bloco de números absolutos quando o indicador não tem lastro (ex.: MAPE)", async () => {
    const mape = indicadoresTeste.find((i) => i.codigo === "ind-mape")!
    renderizar(<IndicadorInsightDialog indicador={mape} aberto onOpenChange={() => {}} />)
    expect(await screen.findByText("Assertividade da previsão (MAPE)")).toBeInTheDocument()
    expect(screen.queryByText("Em números reais")).not.toBeInTheDocument()
  })

  it("gera a análise por IA ao abrir e sinaliza o modo demo", async () => {
    renderizar(<IndicadorInsightDialog indicador={indicador} aberto onOpenChange={() => {}} />)

    // O handler de teste ecoa a última mensagem enviada ao gateway.
    expect(await screen.findByText(/Resposta para:/)).toBeInTheDocument()
    // chatRespostaTeste vem com mode "demo" → badge de modo demo.
    expect(screen.getByText("Modo demo")).toBeInTheDocument()
    // Aviso de anonimização (LGPD).
    expect(screen.getByText("Dados anonimizados antes do envio à IA.")).toBeInTheDocument()
  })

  it("mostra erro e permite tentar novamente quando a IA falha", async () => {
    server.use(
      http.post("*/ia/chat", () =>
        HttpResponse.json(erro("Falha na IA.", "ERRO_INTERNO"), { status: 500 }),
      ),
    )
    const { usuario } = renderizar(
      <IndicadorInsightDialog indicador={indicador} aberto onOpenChange={() => {}} />,
    )

    expect(await screen.findByText("Não foi possível gerar a análise agora.")).toBeInTheDocument()

    // Recupera no próximo envio.
    server.use(
      http.post("*/ia/chat", () =>
        HttpResponse.json(
          ok({ content: "Análise recuperada.", model: "deepseek", mode: "online", provider: "deepseek" }),
        ),
      ),
    )
    await usuario.click(screen.getByRole("button", { name: "Tentar novamente" }))
    expect(await screen.findByText("Análise recuperada.")).toBeInTheDocument()
  })

  it("não renderiza conteúdo quando não há indicador selecionado", () => {
    renderizar(<IndicadorInsightDialog indicador={null} aberto={false} onOpenChange={() => {}} />)
    expect(screen.queryByText("Análise por IA")).not.toBeInTheDocument()
  })
})
