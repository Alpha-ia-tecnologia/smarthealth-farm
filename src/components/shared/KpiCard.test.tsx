import { Coins } from "lucide-react"
import { KpiCard } from "./KpiCard"
import { renderizar, screen } from "@/test/utils"

describe("KpiCard", () => {
  it("reduz o tamanho de valores longos para não cobrir o ícone", () => {
    renderizar(<KpiCard label="Economia potencial" value="R$ 11.367.572" icon={Coins} />)
    const valor = screen.getByText("R$ 11.367.572")
    // 13 caracteres → cai para text-2xl (e não text-3xl), preservando o espaço do ícone.
    expect(valor.className).toContain("text-2xl")
    expect(valor.className).not.toContain("text-3xl")
  })

  it("mantém valores curtos no tamanho padrão (text-3xl)", () => {
    renderizar(<KpiCard label="Itens críticos" value="42" icon={Coins} />)
    expect(screen.getByText("42").className).toContain("text-3xl")
  })
})
