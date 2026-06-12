import { render, screen } from "@testing-library/react"
import { AreaAtualizavel } from "@/components/shared/AreaAtualizavel"

describe("AreaAtualizavel", () => {
  it("mostra só o conteúdo quando não está atualizando", () => {
    render(
      <AreaAtualizavel atualizando={false}>
        <p>Tabela</p>
      </AreaAtualizavel>,
    )
    expect(screen.getByText("Tabela")).toBeInTheDocument()
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("mantém o conteúdo visível e sobrepõe o spinner ao atualizar", () => {
    render(
      <AreaAtualizavel atualizando>
        <p>Tabela</p>
      </AreaAtualizavel>,
    )
    expect(screen.getByText("Tabela")).toBeInTheDocument()
    expect(screen.getByRole("status", { name: "Atualizando dados" })).toBeInTheDocument()
  })
})
