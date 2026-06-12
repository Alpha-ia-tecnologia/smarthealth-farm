import { Outlet } from "react-router-dom"
import { usePerfil } from "@/context/auth"
import type { PerfilUsuario } from "@/types"
import AcessoNegado from "./AcessoNegado"

/**
 * Guarda de rota por perfil (RBAC na UI). Usada dentro de uma rota já protegida por
 * {@link ProtectedRoute} — aqui a sessão já existe, então só decidimos pelo perfil.
 *
 * Libera o conteúdo (`<Outlet />`) se o perfil do usuário está em `perfis`; caso contrário
 * mostra o estado de 403. A barreira real continua no backend; isto apenas espelha o acesso.
 */
export function RequireRole({ perfis }: { perfis: PerfilUsuario[] }) {
  const perfil = usePerfil()
  if (perfil && perfis.includes(perfil)) return <Outlet />
  return <AcessoNegado />
}
