import { useState } from "react"
import { http, HttpResponse } from "msw"
import { FiltroInsumo } from "./FiltroInsumo"
import { renderizar, screen, waitFor } from "@/test/utils"
import { server } from "@/test/server"
import { insumosTeste, ok } from "@/test/handlers"

/** Casca que troca a unidade e expõe o insumo atualmente selecionado. */
function Casca() {
  const [unidadeId, setUnidadeId] = useState<string | undefined>("uni-a")
  const [valor, setValor] = useState<string | undefined>(insumosTeste[0].id)
  return (
    <>
      <button onClick={() => setUnidadeId("uni-b")}>trocar unidade</button>
      <FiltroInsumo valor={valor} onChange={setValor} unidadeId={unidadeId} />
      <span data-testid="valor">{valor ?? "—"}</span>
    </>
  )
}

/** Casca com unidade fixa: testa que escolher/reabrir o insumo mantém a seleção. */
function CascaUnidadeFixa() {
  const [valor, setValor] = useState<string | undefined>(undefined)
  return (
    <>
      <FiltroInsumo valor={valor} onChange={setValor} unidadeId="uni-a" />
      <span data-testid="valor">{valor ?? "—"}</span>
    </>
  )
}

describe("FiltroInsumo (dependente da unidade)", () => {
  it("limpa a seleção quando o insumo não existe na nova unidade", async () => {
    // uni-a tem o catálogo todo; uni-b só o segundo insumo (sem o selecionado).
    server.use(
      http.get("*/insumos", ({ request }) => {
        const unidadeId = new URL(request.url).searchParams.get("unidadeId")
        const lista = unidadeId === "uni-b" ? [insumosTeste[1]] : insumosTeste
        return HttpResponse.json(ok(lista, lista.length))
      }),
    )

    const { usuario } = renderizar(<Casca />)
    expect(screen.getByTestId("valor")).toHaveTextContent(insumosTeste[0].id)

    await usuario.click(screen.getByText("trocar unidade"))

    await waitFor(() => expect(screen.getByTestId("valor")).toHaveTextContent("—"))
  })

  it("mantém o insumo selecionado ao reabrir o select (sem trocar a unidade)", async () => {
    // Unidade fixa: a lista não muda; escolher e reabrir não pode resetar a seleção.
    server.use(
      http.get("*/insumos", () =>
        HttpResponse.json(ok(insumosTeste, insumosTeste.length)),
      ),
    )
    const { usuario } = renderizar(<CascaUnidadeFixa />)

    await usuario.click(await screen.findByRole("combobox", { name: "Insumo" }))
    await usuario.click(await screen.findByRole("option", { name: /Ceftriaxona 1g/ }))
    expect(screen.getByTestId("valor")).toHaveTextContent(insumosTeste[0].id)

    // Reabrir o select (re-render) não pode limpar a seleção.
    await usuario.click(screen.getByRole("combobox", { name: "Insumo" }))
    expect(screen.getByTestId("valor")).toHaveTextContent(insumosTeste[0].id)
  })
})
