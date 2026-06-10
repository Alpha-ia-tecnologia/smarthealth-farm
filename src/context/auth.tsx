import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { Usuario } from "@/types"
import { ApiError } from "@/lib/api"
import { authApi } from "@/lib/auth"
import { lerToken, limparToken, salvarToken } from "@/lib/auth-storage"

type AuthStatus = "carregando" | "autenticado" | "anonimo"

interface AuthContextValue {
  status: AuthStatus
  usuario: Usuario | null
  /** Autentica e persiste a sessão. Lança ApiError em falha (o chamador trata a mensagem). */
  login: (email: string, password: string, lembrar: boolean) => Promise<Usuario>
  /** Encerra a sessão local e avisa o backend (best-effort). */
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [status, setStatus] = useState<AuthStatus>("carregando")

  // Restaura a sessão no boot: se há token salvo, valida-o em /auth/me.
  useEffect(() => {
    const token = lerToken()
    if (!token) {
      setStatus("anonimo")
      return
    }

    const controller = new AbortController()
    authApi
      .me(controller.signal)
      .then((u) => {
        setUsuario(u)
        setStatus("autenticado")
      })
      .catch((erro) => {
        if (erro instanceof DOMException && erro.name === "AbortError") return
        // Token expirado/inválido — limpa e segue como anônimo.
        limparToken()
        setUsuario(null)
        setStatus("anonimo")
      })

    return () => controller.abort()
  }, [])

  const login = useCallback(async (email: string, password: string, lembrar: boolean) => {
    const { usuario: u, token } = await authApi.login(email, password)
    salvarToken(token, lembrar)
    setUsuario(u)
    setStatus("autenticado")
    return u
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Logout é stateless; mesmo se a chamada falhar, encerramos a sessão local.
    }
    limparToken()
    setUsuario(null)
    setStatus("anonimo")
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ status, usuario, login, logout }),
    [status, usuario, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>.")
  return ctx
}

// eslint-disable-next-line react-refresh/only-export-components
export { ApiError }
