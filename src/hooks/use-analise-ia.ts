import { useCallback, useEffect, useRef, useState } from "react"
import { useChatIa } from "@/hooks/use-ia"
import type { MensagemChat, ModoResposta } from "@/lib/ia"

export interface EstadoAnaliseIa {
  /** Conteúdo da última análise (ou null antes da primeira resposta). */
  analise: { content: string; mode: ModoResposta } | null
  carregando: boolean
  erro: boolean
  /** Dispara (ou repete) a geração da análise. */
  gerar: () => void
}

/**
 * Gera uma análise por IA (`POST /ia/chat`) para um conteúdo qualquer — KPI, gráfico, etc.
 * Dispara automaticamente quando `aberto` fica `true` para uma nova `chave` e expõe `gerar` para
 * repetir sob demanda. O backend anonimiza antes do envio e cai para "modo demo" sem provedor
 * configurado (RF-INT-06 · RF-SEG-04).
 *
 * O gatilho da geração automática é a mudança de `chave` (ex.: o código do indicador ou o id do
 * gráfico): `mensagens` pode ser recalculado a cada render sem redisparar — o efeito só age quando
 * a `chave` muda.
 */
export function useAnaliseIaAuto(
  mensagens: MensagemChat[],
  aberto: boolean,
  chave: string | null,
): EstadoAnaliseIa {
  const chat = useChatIa()
  const enviar = chat.mutateAsync
  const [analise, setAnalise] = useState<{ content: string; mode: ModoResposta } | null>(null)
  const chaveSolicitada = useRef<string | null>(null)

  const gerar = useCallback(async () => {
    setAnalise(null)
    try {
      const resposta = await enviar(mensagens)
      setAnalise({ content: resposta.content, mode: resposta.mode })
    } catch {
      // O estado de erro é refletido por chat.isError (com ação de tentar de novo).
    }
  }, [enviar, mensagens])

  useEffect(() => {
    // `gerar` muda a cada render (depende de `mensagens`), então o efeito reexecuta sempre; o guard
    // por `chave` garante uma única geração por gráfico/indicador (e regeneração só ao trocar).
    if (!aberto || chave == null) {
      chaveSolicitada.current = null
      return
    }
    if (chaveSolicitada.current === chave) return
    chaveSolicitada.current = chave
    void gerar()
  }, [aberto, chave, gerar])

  return {
    analise,
    carregando: chat.isPending,
    erro: chat.isError && !chat.isPending,
    gerar: () => void gerar(),
  }
}
