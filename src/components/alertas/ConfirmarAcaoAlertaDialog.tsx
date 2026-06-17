import { CheckCheck, Wrench } from "lucide-react"
import { ConfirmacaoAcaoDialog } from "@/components/shared/ConfirmacaoAcaoDialog"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { severidadeStatus } from "@/lib/status"
import type { Alerta, StatusAlerta } from "@/lib/alertas"

interface Props {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  /** Alerta-alvo da ação (null quando o diálogo está fechado/sem seleção). */
  alerta: Alerta | null
  /** Status para onde o alerta será movido. */
  novoStatus: StatusAlerta
  /** Dispara a mutação de fato. Só chamado com a confirmação marcada. */
  onConfirmar: () => void
  /** Mutação em andamento — desabilita os controles e troca o rótulo do botão. */
  processando: boolean
}

/**
 * Confirmação de tratamento de alerta (RF-ALE-05): em cima do diálogo genérico, descreve a transição
 * de status e o alerta afetado. A ação é registrada na trilha de auditoria pelo backend.
 */
export function ConfirmarAcaoAlertaDialog({
  aberto,
  onOpenChange,
  alerta,
  novoStatus,
  onConfirmar,
  processando,
}: Props) {
  if (!alerta) return null

  const ehResolucao = novoStatus === "Resolvido"

  return (
    <ConfirmacaoAcaoDialog
      aberto={aberto}
      onOpenChange={onOpenChange}
      titulo={ehResolucao ? "Confirmar resolução do alerta" : "Confirmar tratamento do alerta"}
      descricao={
        ehResolucao
          ? "Você vai marcar este alerta como resolvido. Um alerta resolvido não volta a mudar de status — se a condição persistir, o sistema gera um novo alerta."
          : "Você vai marcar este alerta como em tratamento, indicando que a equipe assumiu a ocorrência e está atuando sobre ela."
      }
      resumo={
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{alerta.tipo}</span>
            <StatusBadge status={severidadeStatus[alerta.severidade]} label={alerta.severidade} />
          </div>
          <p className="text-muted-foreground">
            {alerta.insumoNome} · {alerta.unidadeSigla}
          </p>
          <p className="text-xs text-muted-foreground">{alerta.mensagem}</p>
        </>
      }
      iconeConfirmar={ehResolucao ? <CheckCheck className="size-4" /> : <Wrench className="size-4" />}
      rotuloConfirmar={ehResolucao ? "Confirmar resolução" : "Confirmar tratamento"}
      onConfirmar={onConfirmar}
      processando={processando}
    />
  )
}
