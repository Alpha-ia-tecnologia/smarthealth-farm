import { render, screen } from "@testing-library/react"
import { Spinner } from "@/components/ui/spinner"

describe("Spinner", () => {
  it("expõe um status acessível de carregamento", () => {
    render(<Spinner label="Carregando dados" />)
    expect(screen.getByRole("status", { name: "Carregando dados" })).toBeInTheDocument()
  })

  it("usa o rótulo padrão quando não informado", () => {
    render(<Spinner />)
    expect(screen.getByRole("status", { name: "Carregando" })).toBeInTheDocument()
  })
})
