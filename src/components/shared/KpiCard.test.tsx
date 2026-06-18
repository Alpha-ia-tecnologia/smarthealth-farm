import { Coins } from "lucide-react"
import { KpiCard } from "./KpiCard"
import { renderizar, screen } from "@/test/utils"

describe("KpiCard", () => {
  it("reduz o tamanho de valores longos para caber no card sem quebrar", () => {
    renderizar(<KpiCard label="Economia potencial" value="R$ 11.367.572" icon={Coins} />)
    const valor = screen.getByText("R$ 11.367.572")
    // 13 caracteres → cai para text-lg (e não text-2xl/3xl), cabendo numa linha.
    expect(valor.className).toContain("text-lg")
    expect(valor.className).not.toContain("text-2xl")
    expect(valor.className).not.toContain("text-3xl")
  })

  it("valor monetário de ~10 caracteres (R$ 812.000) usa text-xl (não quebra)", () => {
    renderizar(<KpiCard label="Compras emergenciais" value="R$ 812.000" icon={Coins} />)
    const valor = screen.getByText("R$ 812.000")
    expect(valor.className).toContain("text-xl")
    expect(valor.className).not.toContain("text-2xl")
  })

  it("mantém valores curtos no tamanho padrão (text-3xl)", () => {
    renderizar(<KpiCard label="Itens críticos" value="42" icon={Coins} />)
    expect(screen.getByText("42").className).toContain("text-3xl")
  })

  it("sem onClick não é interativo (não vira botão)", () => {
    renderizar(<KpiCard label="Itens críticos" value="42" icon={Coins} />)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("com onClick vira um botão acessível e dispara ao clicar", async () => {
    const aoClicar = vi.fn()
    const { usuario } = renderizar(
      <KpiCard label="Taxa de desabastecimento" value="11,2%" icon={Coins} onClick={aoClicar} />,
    )
    const card = screen.getByRole("button", { name: "Ver números e análise de Taxa de desabastecimento" })
    await usuario.click(card)
    expect(aoClicar).toHaveBeenCalledTimes(1)
  })

  it("com onClick exibe a chamada para abrir os detalhes", () => {
    renderizar(<KpiCard label="Taxa de desabastecimento" value="11,2%" icon={Coins} onClick={() => {}} />)
    expect(screen.getByText("Números reais e análise IA")).toBeInTheDocument()
  })
})
