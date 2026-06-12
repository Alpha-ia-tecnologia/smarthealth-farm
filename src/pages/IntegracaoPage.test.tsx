import { http, HttpResponse } from "msw"
import IntegracaoPage from "@/pages/IntegracaoPage"
import { renderizar, screen } from "@/test/utils"
import { server } from "@/test/server"
import { erro } from "@/test/handlers"
import { salvarToken } from "@/lib/auth-storage"

function renderIntegracao() {
  salvarToken("jwt", true)
  return renderizar(<IntegracaoPage />)
}

describe("IntegracaoPage", () => {
  it("mostra os KPIs vindos de /integracoes/resumo", async () => {
    renderIntegracao()
    expect(await screen.findByText("Integrações operacionais")).toBeInTheDocument()
    // operacionais/totalIntegracoes = 1/2.
    expect(await screen.findByText("1/2")).toBeInTheDocument()
  })

  it("lista as conexões com status e modo do backend", async () => {
    renderIntegracao()
    expect(await screen.findByText("FarmaWeb API")).toBeInTheDocument()
    expect(screen.getByText("Offline (buffer)")).toBeInTheDocument()
  })

  it("mostra os provedores do AI Gateway", async () => {
    renderIntegracao()
    expect(await screen.findByText("DeepSeek")).toBeInTheDocument()
    expect(screen.getByText("Google Gemini")).toBeInTheDocument()
  })

  it("mostra erro quando os provedores de IA falham", async () => {
    // 403 (erro de cliente) não tem retry na política do QueryClient → falha imediata.
    server.use(
      http.get("*/integracoes/provedores-ia", () =>
        HttpResponse.json(erro("Acesso negado.", "ACESSO_NEGADO"), { status: 403 }),
      ),
    )
    renderIntegracao()
    expect(
      await screen.findByText("Não foi possível carregar os provedores de IA."),
    ).toBeInTheDocument()
  })
})
