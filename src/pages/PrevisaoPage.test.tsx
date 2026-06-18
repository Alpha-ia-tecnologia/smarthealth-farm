import { http, HttpResponse } from "msw"
import PrevisaoPage from "@/pages/PrevisaoPage"
import { renderizar, screen, waitFor } from "@/test/utils"
import { server } from "@/test/server"
import { detalhePrevisaoTeste, erro, ok, paginar, previsoesTeste, usuarioTeste } from "@/test/handlers"
import { salvarToken } from "@/lib/auth-storage"

/** Autentica o usuário de teste (Gestor por padrão) antes de renderizar. */
function renderComoGestor() {
  salvarToken("jwt", true)
  return renderizar(<PrevisaoPage />)
}

function renderComoOperador() {
  server.use(
    http.get("*/auth/me", () => HttpResponse.json(ok({ ...usuarioTeste, perfil: "Operador" }))),
  )
  salvarToken("jwt", true)
  return renderizar(<PrevisaoPage />)
}

describe("PrevisaoPage", () => {
  it("mostra os KPIs e as previsões vindas da API", async () => {
    renderComoGestor()
    expect(await screen.findByText("Erro médio (MAPE)")).toBeInTheDocument()
    // KPI "Itens críticos na meta" usa o resumo (1/1).
    expect(await screen.findByText("1/1")).toBeInTheDocument()
    // Linhas da tabela.
    expect(await screen.findByText("Ceftriaxona 1g")).toBeInTheDocument()
    expect(screen.getByText("Dipirona 500mg/mL")).toBeInTheDocument()
  })

  it("seleciona a primeira previsão e abre a série temporal", async () => {
    renderComoGestor()
    // O título da seção de detalhe reflete o item selecionado (primeira linha).
    expect(await screen.findByText("Previsão — Ceftriaxona 1g")).toBeInTheDocument()
  })

  it("Gestor vê o botão de recalibrar e recebe o resultado do motor", async () => {
    const { usuario } = renderComoGestor()
    const botao = await screen.findByRole("button", { name: /Recalibrar previsões/ })
    await usuario.click(botao)
    expect(
      await screen.findByText("2 previsoes recalibradas; drift estabilizado."),
    ).toBeInTheDocument()
  })

  it("Operador não vê o botão de recalibrar (RBAC espelhado)", async () => {
    renderComoOperador()
    await screen.findByText("Ceftriaxona 1g")
    expect(screen.queryByRole("button", { name: /Recalibrar previsões/ })).not.toBeInTheDocument()
  })

  it("mostra o estado vazio quando não há previsões", async () => {
    server.use(http.get("*/previsoes", () => HttpResponse.json(ok([], 0))))
    renderComoGestor()
    expect(
      await screen.findByText("Nenhuma previsão disponível no momento."),
    ).toBeInTheDocument()
  })

  it("filtro de status sem resultado mantém o filtro acessível (não colapsa a tela)", async () => {
    const { usuario } = renderComoGestor()
    // Carrega normalmente com previsões.
    expect(await screen.findByText("Ceftriaxona 1g")).toBeInTheDocument()

    // O backend passa a devolver vazio (filtro de drift sem correspondência).
    server.use(http.get("*/previsoes", () => HttpResponse.json(ok([], 0))))
    await usuario.click(screen.getByRole("combobox", { name: "Todos os status" }))
    await usuario.click(await screen.findByRole("option", { name: "Degradado" }))

    // A tabela mostra o vazio nativo…
    expect(await screen.findByText("Nenhum registro encontrado.")).toBeInTheDocument()
    // …e o filtro de status CONTINUA na tela, para o usuário poder desfazer (antes sumia).
    expect(screen.getByRole("combobox", { name: "Todos os status" })).toBeInTheDocument()
  })

  it("mostra erro quando a lista falha", async () => {
    // 403: erro de cliente não tem retry na política do QueryClient → falha imediata.
    server.use(
      http.get("*/previsoes", () =>
        HttpResponse.json(erro("Acesso negado.", "ACESSO_NEGADO"), { status: 403 }),
      ),
    )
    renderComoGestor()
    expect(await screen.findByText("Não foi possível carregar as previsões.")).toBeInTheDocument()
  })

  it("não exibe mais o painel ilustrativo de 'Composição da previsão'", async () => {
    renderComoGestor()
    // A tela carregou (gráfico de topo presente)…
    expect(await screen.findByText("Previsão — Ceftriaxona 1g")).toBeInTheDocument()
    // …mas o painel de composição (dados ilustrativos) ficou oculto.
    expect(screen.queryByText("Composição da previsão")).not.toBeInTheDocument()
    expect(screen.queryByText("Dados ilustrativos")).not.toBeInTheDocument()
  })

  it("filtra por unidade enviando unidadeId ao servidor", async () => {
    let unidadeIdEnviado: string | null = null
    server.use(
      http.get("*/previsoes", ({ request }) => {
        unidadeIdEnviado = new URL(request.url).searchParams.get("unidadeId")
        return HttpResponse.json(paginar(request, previsoesTeste))
      }),
    )
    const { usuario } = renderComoGestor()
    await usuario.click(await screen.findByRole("combobox", { name: "Unidade" }))
    await usuario.click(await screen.findByRole("option", { name: "HTO · São Luís" }))
    await waitFor(() => expect(unidadeIdEnviado).toBe("uni-hto"))
  })

  it("ao clicar numa linha, seleciona o item (detalhe e gráfico passam a refletir a linha)", async () => {
    const scrollSpy = vi.fn()
    Element.prototype.scrollIntoView = scrollSpy
    HTMLElement.prototype.scrollIntoView = scrollSpy

    let detalhePedido: string | null = null
    server.use(
      http.get("*/previsoes/:insumoId/:unidadeId", ({ params }) => {
        detalhePedido = `${params.insumoId}/${params.unidadeId}`
        return HttpResponse.json(ok(detalhePrevisaoTeste))
      }),
    )

    const { usuario } = renderComoGestor()
    expect(await screen.findByText("Previsão — Ceftriaxona 1g")).toBeInTheDocument()
    await usuario.click(screen.getByRole("row", { name: /Dipirona 500mg\/mL/ }))
    // O handler do clique disparou o scroll…
    expect(scrollSpy).toHaveBeenCalled()
    // …e o detalhe passa a ser pedido para a linha clicada (ins-002/uni-hri).
    await waitFor(() => expect(detalhePedido).toBe("ins-002/uni-hri"))
  })

  it("pagina no servidor: a lista envia page/size na requisição", async () => {
    let url: URL | undefined
    server.use(
      http.get("*/previsoes", ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json(ok([], 0))
      }),
    )
    renderComoGestor()
    await waitFor(() => expect(url?.searchParams.get("size")).not.toBeNull())
    expect(url?.searchParams.get("page")).toBe("0")
  })
})
