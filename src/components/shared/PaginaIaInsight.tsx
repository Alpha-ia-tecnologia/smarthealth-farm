import { useState, type ReactNode } from "react"
import { BotaoAnaliseIa } from "@/components/shared/BotaoAnaliseIa"
import { GraficoInsightDialog } from "@/components/shared/GraficoInsightDialog"
import type { MensagemChat } from "@/lib/ia"

interface Props {
  /** Rótulo da tela/seção (compõe o aria-label do botão e identifica a análise). */
  rotulo: string
  titulo: string
  descricao?: string
  /** Mensagens enviadas à IA (os números/contexto vão no corpo). */
  mensagens: MensagemChat[]
  /** Detalhamento opcional exibido acima da análise (cards/tabela). */
  children?: ReactNode
}

/**
 * Botão "Análise IA" + modal de insight para uma tela inteira (resumo + análise por IA). Encapsula
 * o estado de abertura para que cada página o use com uma linha no cabeçalho. RF-INT-06.
 */
export function PaginaIaInsight({ rotulo, titulo, descricao, mensagens, children }: Props) {
  const [aberto, setAberto] = useState(false)
  return (
    <>
      <BotaoAnaliseIa rotulo={rotulo} onClick={() => setAberto(true)} />
      <GraficoInsightDialog
        aberto={aberto}
        onOpenChange={setAberto}
        titulo={titulo}
        descricao={descricao}
        chave={aberto ? rotulo : null}
        mensagens={mensagens}
      >
        {children}
      </GraficoInsightDialog>
    </>
  )
}
