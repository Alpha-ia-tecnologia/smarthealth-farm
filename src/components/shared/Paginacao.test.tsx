import { vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Paginacao } from "@/components/shared/Paginacao"

function renderPaginacao(props: Partial<React.ComponentProps<typeof Paginacao>> = {}) {
  const padrao = {
    paginaAtual: 0,
    totalPaginas: 5,
    onMudarPagina: () => {},
    tamanhoPagina: 10,
    onMudarTamanho: () => {},
    totalRegistros: 42,
  }
  return render(<Paginacao {...padrao} {...props} />)
}

describe("Paginacao", () => {
  it("não renderiza nada quando tudo cabe na menor página", () => {
    const { container } = renderPaginacao({ totalPaginas: 1, totalRegistros: 4 })
    expect(container).toBeEmptyDOMElement()
  })

  it("seleciona a página pelo select (todas as páginas listadas, base 0 no callback)", async () => {
    const onMudar = vi.fn()
    renderPaginacao({ onMudarPagina: onMudar })

    await userEvent.click(screen.getByRole("combobox", { name: "Página" }))
    // Todas as 5 páginas aparecem como opção.
    expect(screen.getByRole("option", { name: "5" })).toBeInTheDocument()
    await userEvent.click(screen.getByRole("option", { name: "3" }))
    expect(onMudar).toHaveBeenCalledWith(2)
  })

  it("seleciona o tamanho da página (5/10/20/30)", async () => {
    const onTamanho = vi.fn()
    renderPaginacao({ onMudarTamanho: onTamanho })

    await userEvent.click(screen.getByRole("combobox", { name: "Registros por página" }))
    for (const opcao of ["5", "20", "30"]) {
      expect(screen.getByRole("option", { name: opcao })).toBeInTheDocument()
    }
    await userEvent.click(screen.getByRole("option", { name: "20" }))
    expect(onTamanho).toHaveBeenCalledWith(20)
  })

  it("desabilita anterior na primeira página e próxima na última", () => {
    const { rerender } = renderPaginacao({ paginaAtual: 0 })
    expect(screen.getByRole("button", { name: "Página anterior" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Próxima página" })).toBeEnabled()

    rerender(
      <Paginacao
        paginaAtual={4}
        totalPaginas={5}
        onMudarPagina={() => {}}
        tamanhoPagina={10}
        onMudarTamanho={() => {}}
        totalRegistros={42}
      />,
    )
    expect(screen.getByRole("button", { name: "Próxima página" })).toBeDisabled()
  })
})
