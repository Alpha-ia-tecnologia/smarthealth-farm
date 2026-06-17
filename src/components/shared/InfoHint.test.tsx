import { renderizar, screen, userEvent } from "@/test/utils"
import { InfoHint } from "@/components/shared/InfoHint"

describe("InfoHint", () => {
  it("renderiza um botão de ajuda acessível com rótulo personalizado", () => {
    renderizar(<InfoHint texto="Explicação do indicador" rotulo="O que significa?" />)
    expect(screen.getByRole("button", { name: "O que significa?" })).toBeInTheDocument()
  })

  it("usa um rótulo acessível padrão quando nenhum é informado", () => {
    renderizar(<InfoHint texto="Explicação do indicador" />)
    expect(screen.getByRole("button", { name: "O que é isto?" })).toBeInTheDocument()
  })

  it("revela a explicação ao focar o gatilho", async () => {
    const usuario = userEvent.setup()
    renderizar(<InfoHint texto="Reduz compras emergenciais e o custo de frete." />)

    // O texto não fica visível até o usuário interagir.
    expect(screen.queryByText("Reduz compras emergenciais e o custo de frete.")).not.toBeInTheDocument()

    await usuario.tab()

    // Ao abrir, o radix renderiza o texto duas vezes (balão visível + cópia para leitores de tela).
    expect(
      (await screen.findAllByText("Reduz compras emergenciais e o custo de frete.")).length,
    ).toBeGreaterThan(0)
  })
})
