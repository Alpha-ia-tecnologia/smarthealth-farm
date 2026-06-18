import IntegracaoPage from "@/pages/IntegracaoPage"
import { renderizar, screen } from "@/test/utils"
import { salvarToken } from "@/lib/auth-storage"

function renderIntegracao() {
  salvarToken("jwt", true)
  return renderizar(<IntegracaoPage />)
}

describe("IntegracaoPage", () => {
  it("mostra os cards dos canais disponíveis", () => {
    renderIntegracao()
    expect(screen.getByRole("button", { name: /EMSERH/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /WhatsApp/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Telegram/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /E-mail/ })).toBeInTheDocument()
  })

  it("abre a configuração do WhatsApp com os provedores ao clicar no card", async () => {
    const { usuario } = renderIntegracao()
    await usuario.click(screen.getByRole("button", { name: /WhatsApp/ }))

    expect(screen.getByText("Configurar WhatsApp")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Evolution API" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Baileys" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "API Oficial" })).toBeInTheDocument()
    // Provedor padrão (Evolution) exibe seus campos.
    expect(screen.getByLabelText("URL da instância")).toBeInTheDocument()
  })

  it("troca os campos conforme o provedor de WhatsApp escolhido", async () => {
    const { usuario } = renderIntegracao()
    await usuario.click(screen.getByRole("button", { name: /WhatsApp/ }))
    await usuario.click(screen.getByRole("button", { name: "API Oficial" }))

    expect(screen.getByLabelText("Phone Number ID")).toBeInTheDocument()
    expect(screen.queryByLabelText("URL da instância")).not.toBeInTheDocument()
  })

  it("permite alternar para outro canal pelo menu", async () => {
    const { usuario } = renderIntegracao()
    await usuario.click(screen.getByRole("button", { name: /WhatsApp/ }))
    await usuario.click(screen.getByRole("button", { name: /Telegram/ }))

    expect(screen.getByText("Configurar Telegram")).toBeInTheDocument()
    expect(screen.getByLabelText("Chat ID")).toBeInTheDocument()
  })

  it("volta para a grade de canais ao cancelar", async () => {
    const { usuario } = renderIntegracao()
    await usuario.click(screen.getByRole("button", { name: /WhatsApp/ }))
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }))

    expect(screen.queryByText("Configurar WhatsApp")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Telegram/ })).toBeInTheDocument()
  })
})
