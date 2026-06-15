// Cliente HTTP da API CAHOSP.
//
// Todas as respostas do backend usam o envelope:
//   sucesso → { success: true, data: <payload>, total? }
//   erro    → { success: false, error: "mensagem pt-BR", codigo: "CODIGO_ESTAVEL" }
//
// Este módulo desembrulha o envelope (devolvendo apenas `data`) e converte qualquer
// falha (HTTP, rede ou envelope de erro) em uma ApiError consistente.

import { lerToken } from "./auth-storage"

declare global {
  interface Window {
    /** Config injetada em runtime pelo container (public/config.js, regenerado no start). */
    __APP_CONFIG__?: { VITE_API_URL?: string }
  }
}

/**
 * URL base da API, resolvida na seguinte ordem:
 *   1. `window.__APP_CONFIG__` — injetada em runtime pelo container (config.js gerado a partir
 *      da env VITE_API_URL no start). Permite trocar a API por ambiente sem reconstruir o bundle.
 *   2. `import.meta.env.VITE_API_URL` — env de build do Vite (usada em desenvolvimento).
 *   3. Backend local — fallback.
 */
function resolverApiUrl(): string {
  const runtime = typeof window !== "undefined" ? window.__APP_CONFIG__?.VITE_API_URL : undefined
  const url = runtime || import.meta.env.VITE_API_URL || "http://localhost:3002/api"
  return url.replace(/\/$/, "")
}

const API_URL = resolverApiUrl()

interface ApiEnvelope<T> {
  success: boolean
  data: T
  total?: number
  error?: string
  codigo?: string
}

/** Erro normalizado da API. `codigo` é o código estável do backend (ex.: CREDENCIAIS_INVALIDAS). */
export class ApiError extends Error {
  readonly status: number
  readonly codigo: string

  constructor(message: string, status: number, codigo: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.codigo = codigo
  }

  /** Credenciais de login inválidas (401 com código do backend). */
  get credenciaisInvalidas(): boolean {
    return this.codigo === "CREDENCIAIS_INVALIDAS"
  }

  /** Token ausente, expirado ou inválido. */
  get naoAutenticado(): boolean {
    return this.status === 401
  }
}

interface RequestOptions {
  method?: string
  body?: unknown
  /** Inclui o header Authorization com o token salvo. Default: true. */
  auth?: boolean
  signal?: AbortSignal
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiEnvelope<T>> {
  const { method = "GET", body, auth = true, signal } = options

  const headers: Record<string, string> = {}
  if (body !== undefined) headers["Content-Type"] = "application/json"
  if (auth) {
    const token = lerToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (erro) {
    if (erro instanceof DOMException && erro.name === "AbortError") throw erro
    // Falha de rede / CORS / servidor fora do ar.
    throw new ApiError(
      "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
      0,
      "REDE",
    )
  }

  // Respostas sem corpo (ex.: 204) não têm JSON para ler.
  let envelope: ApiEnvelope<T> | null = null
  const conteudo = response.headers.get("content-type") ?? ""
  if (conteudo.includes("application/json")) {
    envelope = (await response.json().catch(() => null)) as ApiEnvelope<T> | null
  }

  if (!response.ok || !envelope?.success) {
    throw new ApiError(
      envelope?.error ?? "Erro inesperado ao processar a requisição.",
      response.status,
      envelope?.codigo ?? "ERRO_INTERNO",
    )
  }

  return envelope
}

/** Página de uma lista: os itens + o total de elementos do conjunto (para calcular as páginas). */
export interface Pagina<T> {
  itens: T[]
  total: number
}

/** Parâmetros de paginação/ordenação enviados ao servidor (página base 0). */
export interface ParamsPaginacao {
  pagina?: number
  tamanho?: number
  /** Campo de ordenação no formato do backend (ex.: "quantidade", "medicamento.nome"). */
  ordenarPor?: string
  ordem?: "asc" | "desc"
}

/** Converte os parâmetros de paginação para as chaves que o Spring espera (page/size/sort). */
export function paramsPaginacao(p: ParamsPaginacao): Record<string, string | number | undefined> {
  return {
    page: p.pagina,
    size: p.tamanho,
    sort: p.ordenarPor ? `${p.ordenarPor},${p.ordem ?? "asc"}` : undefined,
  }
}

export const api = {
  get: async <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    (await request<T>(path, { ...options, method: "GET" })).data,
  post: async <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    (await request<T>(path, { ...options, method: "POST", body })).data,
  put: async <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    (await request<T>(path, { ...options, method: "PUT", body })).data,
  patch: async <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    (await request<T>(path, { ...options, method: "PATCH", body })).data,
  /** GET de lista paginada: devolve `{ itens, total }` lendo `data` e `total` do envelope. */
  getPagina: async <T>(
    path: string,
    options?: Omit<RequestOptions, "method" | "body">,
  ): Promise<Pagina<T>> => {
    const envelope = await request<T[]>(path, { ...options, method: "GET" })
    return { itens: envelope.data, total: envelope.total ?? envelope.data.length }
  },
}

/**
 * Monta a query string a partir de um objeto de filtros, ignorando valores vazios
 * (`undefined`, `null`, `""`). Devolve "" quando não há filtro, ou "?a=1&b=2".
 * Os enums de domínio já vêm como rótulo pt-BR, que é o que o backend aceita.
 */
export function montarQuery(
  params: Record<string, string | number | boolean | null | undefined>,
): string {
  const sp = new URLSearchParams()
  for (const [chave, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== null && valor !== "") sp.append(chave, String(valor))
  }
  const query = sp.toString()
  return query ? `?${query}` : ""
}
