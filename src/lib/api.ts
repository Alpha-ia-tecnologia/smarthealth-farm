// Cliente HTTP da API CAHOSP.
//
// Todas as respostas do backend usam o envelope:
//   sucesso → { success: true, data: <payload>, total? }
//   erro    → { success: false, error: "mensagem pt-BR", codigo: "CODIGO_ESTAVEL" }
//
// Este módulo desembrulha o envelope (devolvendo apenas `data`) e converte qualquer
// falha (HTTP, rede ou envelope de erro) em uma ApiError consistente.

import { lerToken } from "./auth-storage"

const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3002/api").replace(/\/$/, "")

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

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
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

  return envelope.data
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "POST", body }),
}
