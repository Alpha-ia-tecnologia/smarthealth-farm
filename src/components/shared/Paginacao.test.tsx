import { vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Paginacao } from "@/components/shared/Paginacao"

describe("Paginacao", () => {
  it("não renderiza nada com uma única página", () => {
    const { container } = render(
      <Paginacao paginaAtual={0} totalPaginas={1} onMudarPagina={() => {}} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("seleciona uma página ao clicar no número (base 0)", async () => {
    const onMudar = vi.fn()
    // página atual 3 (base 0 = 2): a janela mostra todas (1 2 3 4 5).
    render(<Paginacao paginaAtual={2} totalPaginas={5} onMudarPagina={onMudar} />)
    await userEvent.click(screen.getByRole("button", { name: "Página 5" }))
    expect(onMudar).toHaveBeenCalledWith(4)
  })

  it("desabilita anterior na primeira página e próxima na última", () => {
    const { rerender } = render(
      <Paginacao paginaAtual={0} totalPaginas={5} onMudarPagina={() => {}} />,
    )
    expect(screen.getByRole("button", { name: "Página anterior" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Próxima página" })).toBeEnabled()

    rerender(<Paginacao paginaAtual={4} totalPaginas={5} onMudarPagina={() => {}} />)
    expect(screen.getByRole("button", { name: "Próxima página" })).toBeDisabled()
  })
})
