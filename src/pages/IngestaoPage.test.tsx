import { http, HttpResponse } from "msw"
import IngestaoPage from "@/pages/IngestaoPage"
import { renderizar, screen } from "@/test/utils"
import { server } from "@/test/server"
import { erro } from "@/test/handlers"
import { salvarToken } from "@/lib/auth-storage"

function renderIngestao() {
  salvarToken("jwt", true)
  return renderizar(<IngestaoPage />)
}

describe("IngestaoPage", () => {
  it("mostra os KPIs vindos de /ingestao/resumo", async () => {
    renderIngestao()
    expect(await screen.findByText("Fontes sincronizadas")).toBeInTheDocument()
    // fontesSincronizadas/totalFontes = 1/3.
    expect(await screen.findByText("1/3")).toBeInTheDocument()
  })

  it("lista as fontes de dados com o status do backend", async () => {
    renderIngestao()
    expect(await screen.findByText("SIH — Sistema de Internação")).toBeInTheDocument()
    expect(screen.getByText("Vigilância Epidemiológica")).toBeInTheDocument()
  })

  it("mostra a qualidade por família terapêutica", async () => {
    renderIngestao()
    expect(await screen.findByText("Antibióticos")).toBeInTheDocument()
    expect(screen.getByText("Analgésicos")).toBeInTheDocument()
  })

  it("marca os painéis sem endpoint como dados ilustrativos (mock)", async () => {
    renderIngestao()
    expect((await screen.findAllByText("Dados ilustrativos")).length).toBeGreaterThan(0)
  })

  it("mostra erro quando as fontes falham", async () => {
    // 403 (erro de cliente) não tem retry na política do QueryClient → falha imediata.
    server.use(
      http.get("*/ingestao/fontes", () =>
        HttpResponse.json(erro("Acesso negado.", "ACESSO_NEGADO"), { status: 403 }),
      ),
    )
    renderIngestao()
    expect(
      await screen.findByText("Não foi possível carregar as fontes de dados."),
    ).toBeInTheDocument()
  })
})
