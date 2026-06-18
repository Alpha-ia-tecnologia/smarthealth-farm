import { http, HttpResponse } from "msw"
import SegurancaPage from "@/pages/SegurancaPage"
import { server } from "@/test/server"
import { erro, ok, resumoAuditoriaTeste } from "@/test/handlers"
import { renderizar, screen } from "@/test/utils"

describe("SegurancaPage", () => {
  it("mostra os KPIs reais do resumo de auditoria", async () => {
    renderizar(<SegurancaPage />)
    // Eventos auditados = total real (21), não mais o valor fabricado do mock.
    expect(await screen.findByText(resumoAuditoriaTeste.total.toLocaleString("pt-BR"))).toBeInTheDocument()
    expect(screen.getByText("Eventos auditados")).toBeInTheDocument()
    expect(screen.getByText("Decisões assistidas por IA")).toBeInTheDocument()
  })

  it("lista a trilha de auditoria com a categoria real", async () => {
    renderizar(<SegurancaPage />)
    expect(await screen.findByText("Ana Sousa")).toBeInTheDocument()
    expect(screen.getByText("Recalibração de previsão")).toBeInTheDocument()
    expect(screen.getByText("Criou usuário")).toBeInTheDocument()
  })

  it("mostra estado vazio quando a trilha não tem eventos", async () => {
    server.use(http.get("*/seguranca/auditoria", () => HttpResponse.json(ok([], 0))))
    renderizar(<SegurancaPage />)
    expect(
      await screen.findByText(/Nenhum evento de auditoria para os filtros/i),
    ).toBeInTheDocument()
  })

  it("mostra erro quando o resumo falha, com ação de tentar de novo", async () => {
    server.use(
      http.get("*/seguranca/auditoria/resumo", () =>
        HttpResponse.json(erro("Acesso negado.", "ACESSO_NEGADO"), { status: 403 }),
      ),
    )
    renderizar(<SegurancaPage />)
    expect(
      await screen.findByText(/Não foi possível carregar os indicadores de auditoria/i),
    ).toBeInTheDocument()
  })
})
