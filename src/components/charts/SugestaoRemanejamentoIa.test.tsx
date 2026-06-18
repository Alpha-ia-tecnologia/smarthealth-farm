import { SugestaoRemanejamentoIa, type UnidadeInsumo } from "./SugestaoRemanejamentoIa"
import { renderizar, screen } from "@/test/utils"

const comCritica: UnidadeInsumo[] = [
  { sigla: "HCH", municipio: "Chapadinha", status: "critico", quantidade: 122, nivelCritico: 260, consumoMedioDiario: 30 },
  { sigla: "HTO", municipio: "São Luís", status: "ok", quantidade: 1976, nivelCritico: 990, consumoMedioDiario: 40 },
]
const semCritica: UnidadeInsumo[] = [
  { sigla: "HTO", municipio: "São Luís", status: "ok", quantidade: 1976, nivelCritico: 990, consumoMedioDiario: 40 },
]

describe("SugestaoRemanejamentoIa", () => {
  it("não renderiza nada quando não há unidade em nível crítico", () => {
    renderizar(<SugestaoRemanejamentoIa insumoNome="Dipirona" unidades={semCritica} />)
    expect(screen.queryByText("Dipirona")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Sugerir remanejamento/i })).not.toBeInTheDocument()
  })

  it("mostra o alerta e gera a sugestão por IA ao clicar", async () => {
    const { usuario } = renderizar(<SugestaoRemanejamentoIa insumoNome="Dipirona" unidades={comCritica} />)
    // Alerta com o insumo em nível crítico + botão de geração.
    expect(screen.getByText("Dipirona")).toBeInTheDocument()
    const botao = screen.getByRole("button", { name: /Sugerir remanejamento/i })

    await usuario.click(botao)

    // O AI Gateway (modo demo nos testes) ecoa o corpo enviado → a sugestão aparece.
    expect(await screen.findByText(/Resposta para/)).toBeInTheDocument()
  })
})
