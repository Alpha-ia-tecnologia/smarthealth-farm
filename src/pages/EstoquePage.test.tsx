import { http, HttpResponse } from "msw"
import EstoquePage from "@/pages/EstoquePage"
import { renderizar, screen } from "@/test/utils"
import { server } from "@/test/server"
import { erro, lotesTeste, ok } from "@/test/handlers"

describe("EstoquePage", () => {
  it("mostra os KPIs e as posições vindas da API", async () => {
    renderizar(<EstoquePage />)
    expect(await screen.findByText("Itens abaixo do mínimo")).toBeInTheDocument()
    expect(await screen.findByText("Ceftriaxona 1g")).toBeInTheDocument()
    expect(screen.getByText("Dipirona 500mg/mL")).toBeInTheDocument()
  })

  it("abre o drill-down de lotes e movimentações ao clicar numa posição", async () => {
    const { usuario } = renderizar(<EstoquePage />)
    await usuario.click(await screen.findByText("Ceftriaxona 1g"))
    // "Movimentações recentes" é exclusivo do diálogo de drill-down.
    expect(await screen.findByText("Movimentações recentes")).toBeInTheDocument()
    expect(await screen.findByText("Entrada")).toBeInTheDocument()
  })

  it("pagina a aba de controle de validade", async () => {
    const muitos = Array.from({ length: 10 }, (_, i) => ({
      ...lotesTeste[0],
      id: `lote-${i}`,
      numeroLote: `LT-${i}`,
      medicamentoNome: `Med ${i}`,
      diasParaVencer: i + 1,
    }))
    server.use(http.get("*/lotes", () => HttpResponse.json(ok(muitos, muitos.length))))

    const { usuario } = renderizar(<EstoquePage />)
    await usuario.click(screen.getByRole("tab", { name: "Controle de validade" }))

    expect(await screen.findByText("Med 0")).toBeInTheDocument()
    await usuario.click(screen.getByRole("button", { name: "Página 2" }))
    expect(await screen.findByText("Med 9")).toBeInTheDocument()
    expect(screen.queryByText("Med 0")).not.toBeInTheDocument()
  })

  it("mostra erro quando as posições falham", async () => {
    server.use(
      http.get("*/estoque", () =>
        HttpResponse.json(erro("Acesso negado.", "ACESSO_NEGADO"), { status: 403 }),
      ),
    )
    renderizar(<EstoquePage />)
    expect(
      await screen.findByText("Não foi possível carregar as posições de estoque."),
    ).toBeInTheDocument()
  })
})
