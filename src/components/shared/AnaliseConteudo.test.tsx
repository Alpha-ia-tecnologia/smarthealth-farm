import { AnaliseConteudo } from "./AnaliseConteudo"
import { renderizar, screen } from "@/test/utils"

describe("AnaliseConteudo", () => {
  it("remove os marcadores markdown (**, *) e formata as seções com bullets", () => {
    const texto =
      "Resumo: A rede está estável.\n\n" +
      "Pontos fortes:\n- **Cobertura** alta\n- Economia relevante\n\n" +
      "Pontos de atenção:\n- *Risco* em HMA"
    const { container } = renderizar(<AnaliseConteudo texto={texto} />)

    // Nenhum asterisco sobra no conteúdo renderizado.
    expect(container.textContent).not.toContain("*")
    // Seções viram cabeçalhos; o conteúdo, parágrafos/bullets.
    expect(screen.getByText("Resumo")).toBeInTheDocument()
    expect(screen.getByText("A rede está estável.")).toBeInTheDocument()
    expect(screen.getByText("Pontos fortes")).toBeInTheDocument()
    expect(screen.getByText("Cobertura alta")).toBeInTheDocument()
    expect(screen.getByText("Pontos de atenção")).toBeInTheDocument()
    expect(screen.getByText("Risco em HMA")).toBeInTheDocument()
  })

  it("texto simples sem markdown vira parágrafo (sem quebrar)", () => {
    renderizar(<AnaliseConteudo texto="A previsão está dentro da meta de MAPE." />)
    expect(screen.getByText("A previsão está dentro da meta de MAPE.")).toBeInTheDocument()
  })
})
