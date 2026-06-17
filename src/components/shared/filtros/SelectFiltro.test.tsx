import { useState } from "react"
import { SelectFiltro } from "./SelectFiltro"
import { renderizar, screen } from "@/test/utils"

/** Casca controlada para observar o valor emitido pelo SelectFiltro. */
function Casca({ inicial }: { inicial?: string }) {
  const [valor, setValor] = useState<string | undefined>(inicial)
  return (
    <>
      <SelectFiltro
        label="Status"
        valor={valor}
        onChange={setValor}
        opcoes={[
          { valor: "Pendente", rotulo: "Pendente" },
          { valor: "Recusada", rotulo: "Recusada" },
        ]}
        todosRotulo="Todos os status"
      />
      <span data-testid="valor">{valor ?? "—"}</span>
    </>
  )
}

describe("SelectFiltro", () => {
  it("seleciona uma opção e emite o valor escolhido", async () => {
    const { usuario } = renderizar(<Casca />)
    await usuario.click(screen.getByRole("combobox", { name: "Status" }))
    await usuario.click(screen.getByRole("option", { name: "Recusada" }))
    expect(screen.getByTestId("valor")).toHaveTextContent("Recusada")
  })

  it("ao escolher 'todos' limpa o filtro emitindo undefined", async () => {
    const { usuario } = renderizar(<Casca inicial="Pendente" />)
    expect(screen.getByTestId("valor")).toHaveTextContent("Pendente")
    await usuario.click(screen.getByRole("combobox", { name: "Status" }))
    await usuario.click(screen.getByRole("option", { name: "Todos os status" }))
    expect(screen.getByTestId("valor")).toHaveTextContent("—")
  })
})
