import { useState } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { useAuth } from "@/context/auth"
import { criarQueryClient } from "@/lib/query-client"

/**
 * Cria o QueryClient já ligado à sessão: qualquer query/mutation que falhe com 401
 * (token expirado) encerra a sessão local e leva ao re-login (via ProtectedRoute).
 * Por isso precisa viver dentro do AuthProvider.
 */
export function ProvedorDados({ children }: { children: React.ReactNode }) {
  const { expirarSessao } = useAuth()
  const [queryClient] = useState(() => criarQueryClient({ aoSessaoExpirar: expirarSessao }))
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
