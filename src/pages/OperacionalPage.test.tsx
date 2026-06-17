import { http, HttpResponse } from "msw"
import OperacionalPage from "@/pages/OperacionalPage"
import { renderizar, screen, waitFor } from "@/test/utils"
import { server } from "@/test/server"
import { erro, paginar, recomendacoesTeste } from "@/test/handlers"
import { salvarToken } from "@/lib/auth-storage"

function renderOperacional() {
  salvarToken("jwt", true)
  return renderizar(<OperacionalPage />)
}

describe("OperacionalPage", () => {
  it("mostra os KPIs vindos de /painel/operacional", async () => {
    renderOperacional()
    expect(await screen.findByText("Alertas ativos")).toBeInTheDocument()
    // Valor do KPI "Alertas ativos" (totais.alertasAtivos = 15).
    expect(await screen.findByText("15")).toBeInTheDocument()
  })

  it("mostra a situação por unidade com o status pronto do backend", async () => {
    renderOperacional()
    // Municípios são exclusivos da seção "Situação por unidade".
    expect(await screen.findByText("Imperatriz")).toBeInTheDocument()
    expect(screen.getByText("São Luís")).toBeInTheDocument()
    // Cobertura da unidade (58%).
    expect(screen.getByText("58%")).toBeInTheDocument()
  })

  it("mostra a fila de alertas ativos e as recomendações em aberto", async () => {
    renderOperacional()
    // Alerta de teste (tipo + unidade denormalizada).
    expect(await screen.findByText("Desabastecimento")).toBeInTheDocument()
    // Recomendação em aberto (insumo denormalizado).
    expect(await screen.findByText("Ceftriaxona 1g")).toBeInTheDocument()
  })

  it("pinta a recomendação Recusada com a cor de status crítico (vermelho), não verde", async () => {
    server.use(
      http.get("*/recomendacoes", ({ request }) =>
        HttpResponse.json(
          paginar(request, [{ ...recomendacoesTeste[0], id: "rec-recusada", status: "Recusada" }]),
        ),
      ),
    )
    renderOperacional()
    const badge = await screen.findByText("Recusada")
    // recomendacaoStatus.Recusada = "critico" → estilo de perigo (text-danger), não "ok".
    expect(badge.className).toContain("text-danger")
  })

  it("filtra a seção de recomendações por status, enviando o rótulo ao /recomendacoes", async () => {
    let statusEnviado: string | null = null
    server.use(
      http.get("*/recomendacoes", ({ request }) => {
        statusEnviado = new URL(request.url).searchParams.get("status")
        return HttpResponse.json(paginar(request, recomendacoesTeste))
      }),
    )
    const { usuario } = renderOperacional()
    await usuario.click(await screen.findByRole("combobox", { name: "Todos os status" }))
    await usuario.click(await screen.findByRole("option", { name: "Recusada" }))
    await waitFor(() => expect(statusEnviado).toBe("Recusada"))
  })

  it("mostra erro quando o painel falha", async () => {
    // 403 (erro de cliente) não tem retry na política do QueryClient → falha imediata.
    server.use(
      http.get("*/painel/operacional", () =>
        HttpResponse.json(erro("Acesso negado.", "ACESSO_NEGADO"), { status: 403 }),
      ),
    )
    renderOperacional()
    expect(
      await screen.findByText("Não foi possível carregar o painel operacional."),
    ).toBeInTheDocument()
  })
})
