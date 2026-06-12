import { http, HttpResponse } from "msw"
import RelatoriosPage from "@/pages/RelatoriosPage"
import { renderizar, screen } from "@/test/utils"
import { server } from "@/test/server"
import { erro } from "@/test/handlers"
import { salvarToken } from "@/lib/auth-storage"

function renderRelatorios() {
  salvarToken("jwt", true)
  return renderizar(<RelatoriosPage />)
}

describe("RelatoriosPage", () => {
  it("mostra o resumo executivo compondo /painel + /indicadores", async () => {
    renderRelatorios()
    expect(await screen.findByText("Metas atingidas")).toBeInTheDocument()
    // /indicadores/resumo: atingidas 5 de 5.
    expect(await screen.findByText("5/5")).toBeInTheDocument()
    // /painel totais: economia potencial (R$ 10.500).
    expect(await screen.findByText("R$ 10.500")).toBeInTheDocument()
  })

  it("preenche o filtro de unidade com as siglas reais (/unidades)", async () => {
    const { usuario } = renderRelatorios()
    // O combobox de unidade abre e lista as siglas atendidas (HTO/HRI).
    await usuario.click((await screen.findAllByRole("combobox"))[0])
    expect(await screen.findByRole("option", { name: "HTO" })).toBeInTheDocument()
  })

  it("marca o catálogo e o OPED como dados ilustrativos (mock)", async () => {
    renderRelatorios()
    expect((await screen.findAllByText("Dados ilustrativos")).length).toBeGreaterThan(0)
  })

  it("exporta (ação demo) com feedback de toast", async () => {
    const { usuario } = renderRelatorios()
    await usuario.click(await screen.findByRole("button", { name: /Planilha/ }))
    expect(await screen.findByText("Exportando planilha…")).toBeInTheDocument()
  })

  it("mostra erro quando o resumo (painel) falha", async () => {
    server.use(
      http.get("*/painel", () =>
        HttpResponse.json(erro("Acesso negado.", "ACESSO_NEGADO"), { status: 403 }),
      ),
    )
    renderRelatorios()
    expect(
      await screen.findByText("Não foi possível carregar o resumo executivo."),
    ).toBeInTheDocument()
  })
})
