import { http, HttpResponse } from "msw"
import type { Medicamento, Unidade, Usuario } from "@/types"

/** Usuário padrão devolvido pelos handlers de sucesso. */
export const usuarioTeste: Usuario = {
  id: "11111111-1111-1111-1111-111111111111",
  nome: "Ana Sousa",
  email: "ana@cahosp.local",
  perfil: "Gestor",
  ativo: true,
  ultimoAcesso: "2026-06-10T12:00:00Z",
}

/** Unidades de teste: uma central (hub) e duas atendidas. */
export const unidadesTeste: Unidade[] = [
  {
    id: "uni-cahosp",
    nome: "CAHOSP — Central",
    sigla: "CAHOSP",
    municipio: "São Luís",
    porte: "Grande",
    leitos: 0,
    conectividade: "Estável",
    perfilDemografico: "Hub logístico",
    hub: true,
    ativo: true,
  },
  {
    id: "uni-hto",
    nome: "Hospital de Traumatologia e Ortopedia",
    sigla: "HTO",
    municipio: "São Luís",
    porte: "Grande",
    leitos: 320,
    conectividade: "Estável",
    perfilDemografico: "Trauma",
    hub: false,
    ativo: true,
  },
  {
    id: "uni-hri",
    nome: "Hospital Regional de Imperatriz",
    sigla: "HRI",
    municipio: "Imperatriz",
    porte: "Grande",
    leitos: 280,
    conectividade: "Intermitente",
    perfilDemografico: "Referência regional",
    hub: false,
    ativo: true,
  },
]

/** Medicamentos de teste. */
export const medicamentosTeste: Medicamento[] = [
  {
    id: "med-001",
    codigo: "MED-001",
    nome: "Ceftriaxona 1g",
    apresentacao: "Frasco-ampola",
    familia: "Antibióticos",
    unidadeMedida: "fa",
    criticidade: "Alta",
    essencial: true,
    ativo: true,
  },
  {
    id: "med-002",
    codigo: "MED-002",
    nome: "Dipirona 500mg/mL",
    apresentacao: "Ampola 2mL",
    familia: "Analgésicos",
    unidadeMedida: "amp",
    criticidade: "Média",
    essencial: true,
    ativo: true,
  },
]

/** Monta o envelope de sucesso da API (`{ success, data, total? }`). */
export function ok<T>(data: T, total?: number) {
  return total === undefined
    ? { success: true, data }
    : { success: true, data, total }
}

/** Monta o envelope de erro da API (`{ success: false, error, codigo }`). */
export function erro(mensagem: string, codigo: string) {
  return { success: false, error: mensagem, codigo }
}

/**
 * Handlers padrão (caminho feliz). Casos de erro são definidos por teste via `server.use(...)`.
 * Os caminhos usam curinga inicial para casar com qualquer base URL configurada.
 */
export const handlers = [
  http.post("*/auth/login", () =>
    HttpResponse.json(ok({ usuario: usuarioTeste, token: "jwt-de-teste" })),
  ),
  http.get("*/auth/me", () => HttpResponse.json(ok(usuarioTeste))),
  http.post("*/auth/logout", () =>
    HttpResponse.json(ok("Logout efetuado. Descarte o token no cliente.")),
  ),
  http.get("*/unidades", () => HttpResponse.json(ok(unidadesTeste, unidadesTeste.length))),
  http.get("*/medicamentos", () =>
    HttpResponse.json(ok(medicamentosTeste, medicamentosTeste.length)),
  ),
]
