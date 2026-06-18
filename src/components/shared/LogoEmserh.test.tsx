import { LogoEmserh } from "./LogoEmserh"
import { renderizar, screen } from "@/test/utils"

describe("LogoEmserh", () => {
  it("variante completa usa o arquivo oficial da logo (com alt acessível)", () => {
    renderizar(<LogoEmserh />)
    const img = screen.getByRole("img", { name: /EMSERH/i })
    expect(img).toHaveAttribute("src", "/logo-emserh.png")
  })

  it("variante compacta mostra o wordmark (sem o arquivo de imagem)", () => {
    renderizar(<LogoEmserh variant="compact" />)
    expect(screen.getByRole("img", { name: /EMSERH/i })).toBeInTheDocument()
    expect(screen.queryByRole("img", { name: /EMSERH/i })).not.toHaveAttribute("src")
  })
})
