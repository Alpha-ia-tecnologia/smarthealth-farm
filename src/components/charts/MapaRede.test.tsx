import { MapaRede, type PontoMapa } from "./MapaRede"
import { renderizar, screen } from "@/test/utils"

const pontos: PontoMapa[] = [
  {
    unidadeId: "uni-hto",
    sigla: "HTO",
    nome: "Hospital de Traumatologia e Ortopedia",
    municipio: "São Luís",
    status: "critico",
    detalhes: [
      { rotulo: "Cobertura", valor: "58%" },
      { rotulo: "Itens críticos", valor: "5" },
    ],
  },
  {
    unidadeId: "uni-hri",
    sigla: "HRI",
    nome: "Hospital Regional de Imperatriz",
    municipio: "Imperatriz",
    status: "ok",
    detalhes: [
      { rotulo: "Cobertura", valor: "86%" },
      { rotulo: "Itens críticos", valor: "0" },
    ],
  },
]

describe("MapaRede", () => {
  it("renderiza um marcador por ponto e a legenda de condição", () => {
    renderizar(<MapaRede pontos={pontos} />)
    expect(screen.getByRole("img", { name: /Mapa da rede/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /HTO/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /HRI/ })).toBeInTheDocument()
    expect(screen.getByText("Adequado")).toBeInTheDocument()
    expect(screen.getByText("Atenção")).toBeInTheDocument()
    expect(screen.getByText("Crítico")).toBeInTheDocument()
  })

  it("mostra os detalhes do ponto ao passar o cursor", async () => {
    const { usuario } = renderizar(<MapaRede pontos={pontos} />)
    await usuario.hover(screen.getByRole("button", { name: /HTO/ }))
    expect(await screen.findByText("Cobertura")).toBeInTheDocument()
    expect(screen.getByText("58%")).toBeInTheDocument()
  })

  it("não congela os detalhes: ponto só selecionado (sem hover) não mostra o card", () => {
    renderizar(<MapaRede pontos={pontos} unidadeSelecionadaId="uni-hri" />)
    // Sem o cursor sobre o marcador, os detalhes não aparecem (corrige o "congelado" ao clicar).
    expect(screen.queryByText("Cobertura")).not.toBeInTheDocument()
  })

  it("ao clicar num marcador, dispara o filtro com o id da unidade", async () => {
    const onSelecionar = vi.fn()
    const { usuario } = renderizar(<MapaRede pontos={pontos} onSelecionar={onSelecionar} />)
    await usuario.click(screen.getByRole("button", { name: /HTO/ }))
    expect(onSelecionar).toHaveBeenCalledWith("uni-hto")
  })

  it("modo transferência: rotula origem/destino e desenha a seta animada", () => {
    const { container } = renderizar(
      <MapaRede pontos={pontos} origemId="uni-hto" destinoId="uni-hri" onSelecionar={() => {}} />,
    )
    expect(screen.getByText("Origem")).toBeInTheDocument()
    expect(screen.getByText("Destino")).toBeInTheDocument()
    expect(container.querySelector("line.seta-fluxo")).toBeInTheDocument()
  })

  it("modo transferência: clique informa a unidade (não alterna para undefined)", async () => {
    const onSelecionar = vi.fn()
    const { usuario } = renderizar(
      <MapaRede pontos={pontos} origemId="" destinoId="" onSelecionar={onSelecionar} />,
    )
    await usuario.click(screen.getByRole("button", { name: /HRI/ }))
    expect(onSelecionar).toHaveBeenCalledWith("uni-hri")
  })
})
