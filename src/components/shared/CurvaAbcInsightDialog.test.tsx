import { CurvaAbcInsightDialog } from "./CurvaAbcInsightDialog"
import { renderizar, screen } from "@/test/utils"
import { curvaAbcTeste } from "@/test/handlers"

describe("CurvaAbcInsightDialog", () => {
  it("mostra o resumo por classe, a tabela ranqueada e a análise por IA", async () => {
    renderizar(<CurvaAbcInsightDialog curva={curvaAbcTeste} aberto onOpenChange={() => {}} />)

    expect(screen.getByText("Curva ABC — insumos por valor de consumo")).toBeInTheDocument()
    // Resumo por classe (cartões) + tabela ranqueada (item A no topo).
    expect(screen.getAllByText("Classe A").length).toBeGreaterThan(0)
    expect(screen.getByText("Ceftriaxona 1g")).toBeInTheDocument()
    // Análise por IA (o handler de teste ecoa a última mensagem) + modo demo + LGPD.
    expect(await screen.findByText(/Resposta para:/)).toBeInTheDocument()
    expect(screen.getByText("Modo demo")).toBeInTheDocument()
    expect(screen.getByText("Dados anonimizados antes do envio à IA.")).toBeInTheDocument()
  })

  it("não renderiza conteúdo quando não há curva", () => {
    renderizar(<CurvaAbcInsightDialog curva={undefined} aberto={false} onOpenChange={() => {}} />)
    expect(screen.queryByText("Análise por IA")).not.toBeInTheDocument()
  })
})
