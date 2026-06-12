import { http, HttpResponse } from "msw"
import { AssistenteIa } from "@/components/shared/AssistenteIa"
import { renderizar, screen, waitFor } from "@/test/utils"
import { server } from "@/test/server"
import { erro } from "@/test/handlers"
import { salvarToken } from "@/lib/auth-storage"

function renderAssistente() {
  salvarToken("jwt", true)
  return renderizar(<AssistenteIa />)
}

describe("AssistenteIa", () => {
  it("abre o painel e mostra o estado inicial com sugestões", async () => {
    const { usuario } = renderAssistente()
    await usuario.click(screen.getByLabelText("Abrir assistente de IA"))
    expect(await screen.findByText("Como posso ajudar?")).toBeInTheDocument()
    expect(screen.getByLabelText("Mensagem para o assistente")).toBeInTheDocument()
  })

  it("envia a pergunta e mostra a resposta da IA + selo de modo demo", async () => {
    const { usuario } = renderAssistente()
    await usuario.click(screen.getByLabelText("Abrir assistente de IA"))

    const campo = await screen.findByLabelText("Mensagem para o assistente")
    await usuario.type(campo, "qual o risco?")
    await usuario.click(screen.getByLabelText("Enviar"))

    // A pergunta do usuário e a resposta do gateway (handler ecoa o conteúdo) aparecem.
    expect(await screen.findByText("qual o risco?")).toBeInTheDocument()
    expect(await screen.findByText("Resposta para: qual o risco?")).toBeInTheDocument()
    // Resposta veio em modo demo → selo na UI.
    expect(await screen.findByText("Modo demo")).toBeInTheDocument()
  })

  it("avisa quando o gateway falha e devolve a pergunta ao campo", async () => {
    server.use(
      http.post("*/ia/chat", () =>
        HttpResponse.json(erro("Indisponível.", "ERRO_INTERNO"), { status: 500 }),
      ),
    )
    const { usuario } = renderAssistente()
    await usuario.click(screen.getByLabelText("Abrir assistente de IA"))

    const campo = await screen.findByLabelText("Mensagem para o assistente")
    await usuario.type(campo, "pergunta que falha")
    await usuario.click(screen.getByLabelText("Enviar"))

    expect(
      await screen.findByText("Não foi possível falar com o assistente. Tente novamente."),
    ).toBeInTheDocument()
    // A pergunta volta ao campo para nova tentativa.
    await waitFor(() =>
      expect(screen.getByLabelText("Mensagem para o assistente")).toHaveValue("pergunta que falha"),
    )
  })
})
