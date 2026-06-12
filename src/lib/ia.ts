// Serviço do AI Gateway (RF-INT-06 / RF-SEG-04). O backend anonimiza antes de enviar à IA e cai
// para "modo demo" sem provedor configurado.
import { api } from "./api"

/** Papel de uma mensagem na conversa (convenção dos provedores compatíveis com OpenAI). */
export type PapelMensagem = "system" | "user" | "assistant"

/** Mensagem de uma conversa com o AI Gateway. */
export interface MensagemChat {
  papel: PapelMensagem
  conteudo: string
}

/** Origem da resposta: "online" (provedor externo respondeu) ou "demo" (sem chave/fallback). */
export type ModoResposta = "online" | "demo"

/** Resposta do AI Gateway (RF-INT-06). */
export interface ChatResposta {
  content: string
  model: string
  mode: ModoResposta
  provider: string
}

export const iaApi = {
  /** POST /ia/chat — envia a conversa e recebe a resposta da IA (anonimização é do backend). */
  chat: (mensagens: MensagemChat[]) => api.post<ChatResposta>("/ia/chat", { mensagens }),
}
