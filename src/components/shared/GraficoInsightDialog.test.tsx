import { http, HttpResponse } from "msw"
import { GraficoInsightDialog } from "./GraficoInsightDialog"
import { renderizar, screen } from "@/test/utils"
import { server } from "@/test/server"
import { ok, erro } from "@/test/handlers"
import type { MensagemChat } from "@/lib/ia"

const mensagens: MensagemChat[] = [
  { papel: "system", conteudo: "Você é um analista." },
  { papel: "user", conteudo: "Analise a cobertura." },
]

describe("GraficoInsightDialog", () => {
  it("mostra o detalhamento (children) e gera a análise por IA ao abrir", async () => {
    renderizar(
      <GraficoInsightDialog
        aberto
        onOpenChange={() => {}}
        titulo="Cobertura por unidade"
        descricao="Detalhe da cobertura"
        chave="cobertura"
        mensagens={mensagens}
      >
        <div>HTO — 58%</div>
      </GraficoInsightDialog>,
    )

    expect(screen.getByText("Cobertura por unidade")).toBeInTheDocument()
    expect(screen.getByText("HTO — 58%")).toBeInTheDocument()
    // O handler de teste ecoa a última mensagem enviada ao gateway.
    expect(await screen.findByText(/Resposta para:/)).toBeInTheDocument()
    expect(screen.getByText("Modo demo")).toBeInTheDocument()
    expect(screen.getByText("Dados anonimizados antes do envio à IA.")).toBeInTheDocument()
  })

  it("mostra erro e permite tentar novamente quando a IA falha", async () => {
    server.use(
      http.post("*/ia/chat", () =>
        HttpResponse.json(erro("Falha na IA.", "ERRO_INTERNO"), { status: 500 }),
      ),
    )
    const { usuario } = renderizar(
      <GraficoInsightDialog aberto onOpenChange={() => {}} titulo="Gráfico" chave="g" mensagens={mensagens}>
        <div>conteúdo do gráfico</div>
      </GraficoInsightDialog>,
    )

    expect(await screen.findByText("Não foi possível gerar a análise agora.")).toBeInTheDocument()

    server.use(
      http.post("*/ia/chat", () =>
        HttpResponse.json(ok({ content: "Análise recuperada.", model: "x", mode: "online", provider: "x" })),
      ),
    )
    await usuario.click(screen.getByRole("button", { name: "Tentar novamente" }))
    expect(await screen.findByText("Análise recuperada.")).toBeInTheDocument()
  })

  it("não dispara a análise quando a chave é nula", () => {
    renderizar(
      <GraficoInsightDialog aberto onOpenChange={() => {}} titulo="Gráfico" chave={null} mensagens={[]}>
        <div>sem dados</div>
      </GraficoInsightDialog>,
    )
    // Sem chave não há geração: permanece no estado "Preparando análise…".
    expect(screen.getByText("Preparando análise…")).toBeInTheDocument()
  })
})
