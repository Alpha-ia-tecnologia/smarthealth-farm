// Chamadas de autenticação (RF-SEG). Mapeiam direto nos endpoints do AuthController.
import type { Usuario } from "@/types"
import { api } from "./api"

export interface LoginResponse {
  usuario: Usuario
  token: string
}

export const authApi = {
  /** POST /auth/login — público. Devolve o usuário e o JWT. */
  login: (email: string, password: string) =>
    api.post<LoginResponse>("/auth/login", { email, password }, { auth: false }),

  /** GET /auth/me — valida o JWT e devolve o usuário autenticado. */
  me: (signal?: AbortSignal) => api.get<Usuario>("/auth/me", { signal }),

  /** POST /auth/logout — logout stateless; o cliente apenas descarta o token. */
  logout: () => api.post<string>("/auth/logout", undefined, { auth: false }),
}
