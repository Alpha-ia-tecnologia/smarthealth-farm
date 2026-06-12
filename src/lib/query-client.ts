import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query"
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

interface OpcoesQueryClient {
  /**
   * Chamado quando qualquer query/mutation falha com 401 (token expirado ou revogado).
   * O app liga aqui o encerramento da sessão (limpar token → tela de login). O login em si
   * não passa pelo QueryClient (AuthContext chama a API direto), então 401 de credencial
   * inválida nunca cai neste handler.
   */
  aoSessaoExpirar?: () => void
}

/** Cria um QueryClient com os defaults do projeto. Uma instância por app (e por teste). */
export function criarQueryClient(opcoes: OpcoesQueryClient = {}): QueryClient {
  const aoErro = (erro: unknown) => {
    if (erro instanceof ApiError && erro.naoAutenticado) opcoes.aoSessaoExpirar?.()
  }

  return new QueryClient({
    queryCache: new QueryCache({ onError: aoErro }),
    mutationCache: new MutationCache({ onError: aoErro }),
    defaultOptions: {
      queries: {
        retry: deveTentarNovamente,
        // stale-while-revalidate: ao reentrar numa tela, mostra o cache na hora e revalida
        // em background (uma nova requisição). Com staleTime > 0, revisitar dentro da janela
        // serviria só o cache, sem requisição — não é o que queremos para dados operacionais.
        staleTime: 0,
        // Evita refetch a cada foco de janela; a revalidação acontece ao montar a tela.
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}
