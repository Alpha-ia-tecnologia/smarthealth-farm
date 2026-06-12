import { useMutation } from "@tanstack/react-query"
import { iaApi, type MensagemChat } from "@/lib/ia"

/**
 * Envia a conversa ao AI Gateway e devolve a resposta. É uma mutation (efeito de envio), não uma
 * query cacheável: cada turno do chat dispara uma chamada nova com o histórico acumulado.
 */
export function useChatIa() {
  return useMutation({
    mutationFn: (mensagens: MensagemChat[]) => iaApi.chat(mensagens),
  })
}
