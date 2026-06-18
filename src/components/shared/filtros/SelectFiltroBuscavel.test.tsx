import { useState } from "react"
import { SelectFiltroBuscavel } from "./SelectFiltroBuscavel"
import { renderizar, screen } from "@/test/utils"

/** Casca controlada para observar o valor emitido pelo combobox. */
function Casca({ inicial }: { inicial?: string }) {
  const [valor, setValor] = useState<string | undefined>(inicial)
  return (
    <>
      <SelectFiltroBuscavel
        label="Insumo"
        valor={valor}
        onChange={setValor}
        opcoes={[
          { valor: "1", rotulo: "Dipirona (INS-001)" },
          { valor: "2", rotulo: "Amoxicilina (INS-002)" },
          { valor: "3", rotulo: "Ácido Acetilsalicílico (INS-003)" },
        ]}
        todosRotulo="Todos os insumos"
        buscarPlaceholder="Pesquisar insumo…"
      />
      <span data-testid="valor">{valor ?? "—"}</span>
    </>
  )
}

describe("SelectFiltroBuscavel", () => {
  it("abre, pesquisa e seleciona a opção filtrada", async () => {
    const { usuario } = renderizar(<Casca />)
    await usuario.click(screen.getByRole("combobox", { name: "Insumo" }))
    await usuario.type(screen.getByPlaceholderText("Pesquisar insumo…"), "amox")
    await usuario.click(screen.getByRole("option", { name: /Amoxicilina/ }))
    expect(screen.getByTestId("valor")).toHaveTextContent("2")
  })

  it("a busca ignora maiúsculas/minúsculas e acentos", async () => {
    const { usuario } = renderizar(<Casca />)
    await usuario.click(screen.getByRole("combobox", { name: "Insumo" }))
    // "ACIDO" (caixa alta, sem acento) deve casar "Ácido Acetilsalicílico".
    await usuario.type(screen.getByPlaceholderText("Pesquisar insumo…"), "ACIDO")
    await usuario.click(screen.getByRole("option", { name: /Ácido Acetilsalicílico/ }))
    expect(screen.getByTestId("valor")).toHaveTextContent("3")
  })

  it("mostra o estado vazio quando nada casa", async () => {
    const { usuario } = renderizar(<Casca />)
    await usuario.click(screen.getByRole("combobox", { name: "Insumo" }))
    await usuario.type(screen.getByPlaceholderText("Pesquisar insumo…"), "xyz")
    expect(screen.getByText("Nada encontrado.")).toBeInTheDocument()
  })

  it("ao escolher 'todos' limpa o filtro emitindo undefined", async () => {
    const { usuario } = renderizar(<Casca inicial="1" />)
    expect(screen.getByTestId("valor")).toHaveTextContent("1")
    await usuario.click(screen.getByRole("combobox", { name: "Insumo" }))
    await usuario.click(screen.getByRole("option", { name: "Todos os insumos" }))
    expect(screen.getByTestId("valor")).toHaveTextContent("—")
  })
})
