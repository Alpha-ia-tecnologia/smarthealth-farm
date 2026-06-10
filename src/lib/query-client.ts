import { QueryClient } from "@tanstack/react-query"
import { ApiError } from "./api"

/**
 * Política de retry: erro do cliente (4xx — validação, não autenticado, sem permissão,
 * não encontrado) não se resolve repetindo, então não tentamos de novo. Falhas transitórias
 * (rede, 5xx) tentam mais 2 vezes.
 */
function deveTentarNovamente(falhas: number, erro: unknown): boolean {
  if (erro instanceof ApiError && erro.status >= 400 && erro.status < 500) return false
  return falhas < 2
}

/** Cria um QueryClient com os defaults do projeto. Uma instância por app (e por teste). */
export function criarQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: deveTentarNovamente,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}
