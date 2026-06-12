import { Route, Routes } from "react-router-dom"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { salvarToken } from "@/lib/auth-storage"
import { renderizar, screen } from "@/test/utils"

function renderApp(rota: string) {
  return renderizar(
    <Routes>
      <Route path="/login" element={<div>Tela de login</div>} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<div>Conteúdo protegido</div>} />
      </Route>
    </Routes>,
    { rota },
  )
}

describe("ProtectedRoute", () => {
  it("redireciona usuário anônimo para /login", async () => {
    renderApp("/")
    expect(await screen.findByText("Tela de login")).toBeInTheDocument()
  })

  it("libera o conteúdo para usuário autenticado", async () => {
    salvarToken("jwt", true)
    renderApp("/")
    expect(await screen.findByText("Conteúdo protegido")).toBeInTheDocument()
  })
})
