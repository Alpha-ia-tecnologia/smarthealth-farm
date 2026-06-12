import { http, HttpResponse } from "msw"
import { Route, Routes } from "react-router-dom"
import LoginPage from "@/pages/LoginPage"
import { lerToken } from "@/lib/auth-storage"
import { renderizar, screen } from "@/test/utils"
import { server } from "@/test/server"
import { erro } from "@/test/handlers"

function renderLogin() {
  return renderizar(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<div>Painel inicial</div>} />
    </Routes>,
    { rota: "/login" },
  )
}

describe("LoginPage", () => {
  it("mostra o título da tela", () => {
    renderLogin()
    expect(screen.getByRole("heading", { name: "Acesse a plataforma" })).toBeInTheDocument()
  })

  it("valida campos vazios sem chamar a API", async () => {
    const { usuario } = renderLogin()
    await usuario.click(screen.getByRole("button", { name: "Entrar" }))
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Informe seu e-mail e sua senha para entrar.",
    )
  })

  it("exibe mensagem amigável em credenciais inválidas", async () => {
    server.use(
      http.post("*/auth/login", () =>
        HttpResponse.json(erro("E-mail ou senha invalidos.", "CREDENCIAIS_INVALIDAS"), {
          status: 401,
        }),
      ),
    )
    const { usuario } = renderLogin()
    await usuario.type(screen.getByLabelText("E-mail"), "ana@cahosp.local")
    await usuario.type(screen.getByLabelText("Senha"), "errada")
    await usuario.click(screen.getByRole("button", { name: "Entrar" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail ou senha incorretos.")
  })

  it("alterna a visibilidade da senha", async () => {
    const { usuario } = renderLogin()
    const senha = screen.getByLabelText("Senha")
    expect(senha).toHaveAttribute("type", "password")
    await usuario.click(screen.getByRole("button", { name: "Mostrar senha" }))
    expect(senha).toHaveAttribute("type", "text")
  })

  it("autentica e redireciona ao painel no sucesso", async () => {
    const { usuario } = renderLogin()
    await usuario.type(screen.getByLabelText("E-mail"), "ana@cahosp.local")
    await usuario.type(screen.getByLabelText("Senha"), "senha123")
    await usuario.click(screen.getByRole("button", { name: "Entrar" }))
    expect(await screen.findByText("Painel inicial")).toBeInTheDocument()
    expect(lerToken()).toBe("jwt-de-teste")
  })
})
