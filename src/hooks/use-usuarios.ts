import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  usuariosApi,
  type AtualizarUsuario,
  type CriarUsuario,
  type UsuarioFiltros,
} from "@/lib/usuarios"

/** Chaves de cache do domínio de usuários (admin). */
export const usuariosKeys = {
  raiz: ["usuarios-admin"] as const,
  lista: (filtros: UsuarioFiltros) => ["usuarios-admin", "lista", filtros] as const,
}

/** Lista usuários com filtros (perfil, ativo, busca). Mantém a lista anterior ao filtrar. */
export function useUsuarios(filtros: UsuarioFiltros = {}) {
  return useQuery({
    queryKey: usuariosKeys.lista(filtros),
    queryFn: () => usuariosApi.listar(filtros),
    placeholderData: keepPreviousData,
  })
}

/** Cria um usuário (TI) e invalida a lista. */
export function useCriarUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CriarUsuario) => usuariosApi.criar(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usuariosKeys.raiz }),
  })
}

/** Atualiza um usuário (TI) e invalida a lista. */
export function useAtualizarUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: AtualizarUsuario }) =>
      usuariosApi.atualizar(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usuariosKeys.raiz }),
  })
}

/** Ativa/desativa um usuário (TI) e invalida a lista. */
export function useAlterarStatusUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      usuariosApi.alterarStatus(id, ativo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usuariosKeys.raiz }),
  })
}

/** Redefine a senha de um usuário (TI). Não altera a lista (sem invalidação). */
export function useRedefinirSenha() {
  return useMutation({
    mutationFn: ({ id, novaSenha }: { id: string; novaSenha: string }) =>
      usuariosApi.redefinirSenha(id, novaSenha),
  })
}
