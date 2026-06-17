import { Route, Routes } from "react-router-dom"
import { http, HttpResponse } from "msw"
import { RequireRole } from "@/components/auth/RequireRole"
import { salvarToken } from "@/lib/auth-storage"
import { server } from "@/test/server"
import { ok, usuarioTeste } from "@/test/handlers"
import { renderizar, screen } from "@/test/utils"
import type { PerfilUsuario } from "@/types"

function renderComPerfil(perfil: PerfilUsuario, perfis: PerfilUsuario[]) {
  salvarToken("jwt", true)
  server.use(http.get("*/auth/me", () => HttpResponse.json(ok({ ...usuarioTeste, perfil }))))
  return renderizar(
    <Routes>
      <Route element={<RequireRole perfis={perfis} />}>
        <Route path="/" element={<div>Área restrita</div>} />
      </Route>
    </Routes>,
    { rota: "/" },
  )
}

describe("RequireRole", () => {
  it("libera o conteúdo quando o perfil está autorizado", async () => {
    renderComPerfil("TI", ["TI"])
    expect(await screen.findByText("Área restrita")).toBeInTheDocument()
  })

  it("mostra 403 quando o perfil não está autorizado", async () => {
    renderComPerfil("Operador", ["TI"])
    expect(await screen.findByText("403")).toBeInTheDocument()
    expect(screen.queryByText("Área restrita")).not.toBeInTheDocument()
  })

  it("Gestor acessa área liberada para Gestor/TI", async () => {
    renderComPerfil("Gestor", ["Gestor", "TI"])
    expect(await screen.findByText("Área restrita")).toBeInTheDocument()
  })

  it("Admin (superusuário) acessa qualquer rota, mesmo fora da lista de perfis", async () => {
    renderComPerfil("Admin", ["TI"])
    expect(await screen.findByText("Área restrita")).toBeInTheDocument()
  })
})
