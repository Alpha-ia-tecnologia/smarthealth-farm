import { TransferenciaFormDialog } from "@/components/recomendacoes/TransferenciaFormDialog"
import { renderizar, screen } from "@/test/utils"
import { recomendacoesTeste } from "@/test/handlers"

describe("TransferenciaFormDialog", () => {
  it("calcula a economia ao vivo conforme a quantidade (qtd × 12)", async () => {
    const { usuario } = renderizar(<TransferenciaFormDialog open onOpenChange={() => {}} />)

    const economia = await screen.findByTestId("economia-estimada")
    expect(economia.textContent).toContain("0") // vazio → R$ 0

    const qtd = screen.getByLabelText("Quantidade (unidades)")
    await usuario.clear(qtd)
    await usuario.type(qtd, "50")

    expect(economia.textContent).toContain("600") // 50 × 12
  })

  it("em edição, abre pré-preenchido com os valores da recomendação", async () => {
    const rec = recomendacoesTeste[0] // Redistribuição · Ceftriaxona · quantidade 120
    renderizar(<TransferenciaFormDialog open onOpenChange={() => {}} recomendacao={rec} />)

    expect(await screen.findByText("Editar transferência")).toBeInTheDocument()
    expect(screen.getByLabelText("Quantidade (unidades)")).toHaveValue(120)
  })

  it("edição salva a nova quantidade e confirma com toast", async () => {
    const rec = recomendacoesTeste[0]
    const { usuario } = renderizar(<TransferenciaFormDialog open onOpenChange={() => {}} recomendacao={rec} />)

    const qtd = await screen.findByLabelText("Quantidade (unidades)")
    await usuario.clear(qtd)
    await usuario.type(qtd, "200")
    await usuario.click(screen.getByRole("button", { name: "Salvar alterações" }))

    expect(await screen.findByText("Transferência atualizada.")).toBeInTheDocument()
  })

  it("na criação, valida campos obrigatórios antes de enviar", async () => {
    const { usuario } = renderizar(<TransferenciaFormDialog open onOpenChange={() => {}} />)

    await usuario.click(await screen.findByRole("button", { name: "Criar transferência" }))

    expect(await screen.findByText("Selecione o insumo.")).toBeInTheDocument()
    expect(screen.getByText("Informe uma quantidade maior que zero.")).toBeInTheDocument()
  })
})
