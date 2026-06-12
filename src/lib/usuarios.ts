// Serviço da administração de usuários (RF-ADM-01). Exclusivo do perfil TI.
// Espelha UsuarioAdminController: GET/POST/PUT /admin/usuarios, PATCH .../status, PUT .../senha.
import type { PerfilUsuario, Usuario } from "@/types"
import { api, montarQuery } from "./api"

export interface UsuarioFiltros {
  perfil?: PerfilUsuario
  ativo?: boolean
  busca?: string
}

/** Dados para criar um usuário (senha ≥ 8; e-mail único; unidade opcional). */
export interface CriarUsuario {
  nome: string
  email: string
  perfil: PerfilUsuario
  senha: string
  unidadeId?: string | null
}

/** Dados para atualizar um usuário (nome, e-mail, perfil e unidade opcional). */
export interface AtualizarUsuario {
  nome: string
  email: string
  perfil: PerfilUsuario
  unidadeId?: string | null
}

export const usuariosApi = {
  /** GET /admin/usuarios (+ filtros). */
  listar: (filtros: UsuarioFiltros = {}) =>
    api.get<Usuario[]>(`/admin/usuarios${montarQuery({ ...filtros })}`),

  /** GET /admin/usuarios/{id}. */
  buscar: (id: string) => api.get<Usuario>(`/admin/usuarios/${id}`),

  /** POST /admin/usuarios — 409 se o e-mail já existir. */
  criar: (body: CriarUsuario) => api.post<Usuario>("/admin/usuarios", body),

  /** PUT /admin/usuarios/{id} — atualiza nome, e-mail, perfil e unidade. */
  atualizar: (id: string, body: AtualizarUsuario) =>
    api.put<Usuario>(`/admin/usuarios/${id}`, body),

  /** PATCH /admin/usuarios/{id}/status — 422 se o TI tentar se autodesativar. */
  alterarStatus: (id: string, ativo: boolean) =>
    api.patch<Usuario>(`/admin/usuarios/${id}/status`, { ativo }),

  /** PUT /admin/usuarios/{id}/senha — redefine a senha (≥ 8). */
  redefinirSenha: (id: string, novaSenha: string) =>
    api.put<string>(`/admin/usuarios/${id}/senha`, { novaSenha }),
}
