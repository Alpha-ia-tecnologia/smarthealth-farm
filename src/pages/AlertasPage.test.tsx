import { http, HttpResponse } from "msw"
import AlertasPage from "@/pages/AlertasPage"
import { renderizar, screen, waitFor } from "@/test/utils"
import { server } from "@/test/server"
import { erro, ok, usuarioTeste } from "@/test/handlers"
import { salvarToken } from "@/lib/auth-storage"

/** Autentica o usuário de teste (Gestor por padrão) antes de renderizar. */
function renderComoGestor() {
  salvarToken("jwt", true)
  return renderizar(<AlertasPage />)
}

function renderComoOperador() {
  server.use(
    http.get("*/auth/me", () =>
      HttpResponse.json(ok({ ...usuarioTeste, perfil: "Operador" })),
    ),
  )
  salvarToken("jwt", true)
  return renderizar(<AlertasPage />)
}

describe("AlertasPage", () => {
  it("mostra os KPIs e os alertas vindos da API", async () => {
    renderComoGestor()
    expect(await screen.findByText("Alertas abertos")).toBeInTheDocument()
    expect(await screen.findByText("Ceftriaxona 1g")).toBeInTheDocument()
    expect(screen.getByText("Dipirona 500mg/mL")).toBeInTheDocument()
  })

  it("trata um alerta aberto (mutation) e confirma com toast", async () => {
    const { usuario } = renderComoGestor()
    await usuario.click(await screen.findByRole("button", { name: /Tratar/ }))
    expect(await screen.findByText("Alerta em tratamento.")).toBeInTheDocument()
  })

  it("Gestor vê o botão de gerar alertas e recebe o resultado do motor", async () => {
    const { usuario } = renderComoGestor()
    const botao = await screen.findByRole("button", { name: /Gerar alertas/ })
    await usuario.click(botao)
    expect(
      await screen.findByText("8 alerta(s) gerado(s): 5 de desabastecimento e 3 de vencimento."),
    ).toBeInTheDocument()
  })

  it("Operador não vê o botão de gerar alertas (RBAC espelhado)", async () => {
    renderComoOperador()
    await screen.findByText("Ceftriaxona 1g")
    expect(screen.queryByRole("button", { name: /Gerar alertas/ })).not.toBeInTheDocument()
  })

  it("aba de limiares carrega a configuração real e o Gestor salva", async () => {
    const { usuario } = renderComoGestor()
    await usuario.click(await screen.findByRole("tab", { name: "Configuração de limiares" }))

    const campoPct = await screen.findByLabelText("Dispara abaixo de (% do estoque mínimo)")
    expect(campoPct).toHaveValue(100)

    await usuario.clear(campoPct)
    await usuario.type(campoPct, "120")
    await usuario.click(screen.getByRole("button", { name: "Salvar limiares" }))
    expect(
      await screen.findByText("Limiares salvos. Valem a partir da próxima geração de alertas."),
    ).toBeInTheDocument()
  })

  it("Operador vê os limiares somente leitura (sem salvar)", async () => {
    const { usuario } = renderComoOperador()
    await usuario.click(await screen.findByRole("tab", { name: "Configuração de limiares" }))

    const campoPct = await screen.findByLabelText("Dispara abaixo de (% do estoque mínimo)")
    expect(campoPct).toBeDisabled()
    expect(screen.queryByRole("button", { name: "Salvar limiares" })).not.toBeInTheDocument()
  })

  it("filtra por tipo enviando o rótulo ao servidor", async () => {
    let tipoEnviado: string | null = null
    server.use(
      http.get("*/alertas", ({ request }) => {
        tipoEnviado = new URL(request.url).searchParams.get("tipo")
        return HttpResponse.json(ok([], 0))
      }),
    )
    const { usuario } = renderComoGestor()
    await usuario.click(await screen.findByRole("button", { name: "Vencimento" }))
    await waitFor(() => expect(tipoEnviado).toBe("Vencimento"))
  })

  it("mostra erro quando a lista falha", async () => {
    // 403: erro de cliente não tem retry na política do QueryClient → falha imediata.
    server.use(
      http.get("*/alertas", () =>
        HttpResponse.json(erro("Acesso negado.", "ACESSO_NEGADO"), { status: 403 }),
      ),
    )
    renderComoGestor()
    expect(await screen.findByText("Não foi possível carregar os alertas.")).toBeInTheDocument()
  })
})
