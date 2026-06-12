import type { ReactNode } from "react"
import { http, HttpResponse } from "msw"
import { act, renderHook, waitFor } from "@testing-library/react"
import { AuthProvider, useAuth } from "@/context/auth"
import { lerToken, salvarToken } from "@/lib/auth-storage"
import { server } from "@/test/server"
import { erro, usuarioTeste } from "@/test/handlers"

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

describe("AuthProvider", () => {
  it("inicia anônimo quando não há token salvo", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.status).toBe("anonimo"))
    expect(result.current.usuario).toBeNull()
  })

  it("restaura a sessão validando o token em /auth/me", async () => {
    salvarToken("jwt", true)
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.status).toBe("autenticado"))
    expect(result.current.usuario).toEqual(usuarioTeste)
  })

  it("descarta token inválido e fica anônimo", async () => {
    salvarToken("jwt-velho", true)
    server.use(
      http.get("*/auth/me", () =>
        HttpResponse.json(erro("Nao autenticado.", "NAO_AUTENTICADO"), { status: 401 }),
      ),
    )
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.status).toBe("anonimo"))
    expect(lerToken()).toBeNull()
  })

  it("login autentica e persiste o token", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.status).toBe("anonimo"))

    await act(async () => {
      await result.current.login("ana@cahosp.local", "senha", true)
    })

    expect(result.current.status).toBe("autenticado")
    expect(result.current.usuario).toEqual(usuarioTeste)
    expect(lerToken()).toBe("jwt-de-teste")
  })

  it("logout limpa a sessão local", async () => {
    salvarToken("jwt", true)
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.status).toBe("autenticado"))

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.status).toBe("anonimo")
    expect(result.current.usuario).toBeNull()
    expect(lerToken()).toBeNull()
  })
})
