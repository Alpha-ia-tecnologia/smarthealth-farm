import { http, HttpResponse } from "msw"
import { UnidadeSelect } from "@/components/shared/UnidadeSelect"
import { renderizar, screen, waitFor } from "@/test/utils"
import { server } from "@/test/server"
import { erro } from "@/test/handlers"

describe("UnidadeSelect", () => {
  it("lista as unidades atendidas (exclui o hub) ao abrir", async () => {
    const { usuario } = renderizar(<UnidadeSelect value="todas" onValueChange={() => {}} />)

    const trigger = screen.getByRole("combobox", { name: "Unidade" })
    await waitFor(() => expect(trigger).toBeEnabled())
    await usuario.click(trigger)

    expect(await screen.findByRole("option", { name: "HTO · São Luís" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "HRI · Imperatriz" })).toBeInTheDocument()
    // A CAHOSP é o hub central e não deve aparecer no filtro.
    expect(screen.queryByRole("option", { name: /CAHOSP/ })).not.toBeInTheDocument()
  })

  it("mostra estado de erro quando a API falha", async () => {
    server.use(
      http.get("*/unidades", () =>
        HttpResponse.json(erro("Acesso negado.", "ACESSO_NEGADO"), { status: 403 }),
      ),
    )
    renderizar(<UnidadeSelect value="todas" onValueChange={() => {}} />)
    expect(await screen.findByText("Erro ao carregar")).toBeInTheDocument()
  })
})
