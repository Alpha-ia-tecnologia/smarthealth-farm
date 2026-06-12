import { Navigate, Outlet, useLocation } from "react-router-dom"
import { Activity } from "lucide-react"
import { useAuth } from "@/context/auth"

/**
 * Porteiro das rotas autenticadas. Enquanto a sessão é restaurada (validação do JWT
 * em /auth/me) mostra um estado de carregamento; sem sessão, redireciona para /login
 * preservando a rota de origem para retornar após o login.
 */
export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === "carregando") return <TelaCarregando />

  if (status === "anonimo") {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

function TelaCarregando() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-background">
      <div className="flex size-11 animate-pulse items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <Activity className="size-5" strokeWidth={2.5} />
      </div>
      <p className="text-sm text-muted-foreground">Carregando sua sessão…</p>
    </div>
  )
}
