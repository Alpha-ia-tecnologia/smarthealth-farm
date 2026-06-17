import { ArrowRight, BadgeCheck, Ban, Boxes, CheckCheck } from "lucide-react"
import { ConfirmacaoAcaoDialog } from "@/components/shared/ConfirmacaoAcaoDialog"
import { fmtMoeda, fmtNum } from "@/lib/format"
import type { Recomendacao } from "@/lib/recomendacoes"

export type AcaoRecomendacao = "aprovar" | "executar" | "recusar"

/** Textos e estilo do diálogo por ação. */
const CONFIG: Record<
  AcaoRecomendacao,
  { titulo: string; descricao: string; rotulo: string; icone: React.ReactNode; variante: "default" | "destructive" }
> = {
  aprovar: {
    titulo: "Confirmar aprovação da recomendação",
    descricao:
      "Você vai aprovar esta recomendação. Depois de aprovada, ela poderá ser executada para efetivar a transferência/reposição.",
    rotulo: "Confirmar aprovação",
    icone: <BadgeCheck className="size-4" />,
    variante: "default",
  },
  executar: {
    titulo: "Confirmar execução da recomendação",
    descricao:
      "Você vai marcar esta recomendação como executada, registrando que a transferência/reposição foi efetivada.",
    rotulo: "Confirmar execução",
    icone: <CheckCheck className="size-4" />,
    variante: "default",
  },
  recusar: {
    titulo: "Confirmar recusa da recomendação",
    descricao:
      "Você vai recusar (descartar) esta recomendação. Ela não poderá mais ser aprovada — se a condição persistir, o sistema poderá gerá-la novamente.",
    rotulo: "Confirmar recusa",
    icone: <Ban className="size-4" />,
    variante: "destructive",
  },
}

interface Props {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  /** Recomendação-alvo da ação (null quando o diálogo está fechado/sem seleção). */
  recomendacao: Recomendacao | null
  acao: AcaoRecomendacao
  /** Dispara a mutação de fato. Só chamado com a confirmação marcada. */
  onConfirmar: () => void
  /** Mutação em andamento — desabilita os controles e troca o rótulo do botão. */
  processando: boolean
}

/**
 * Confirmação de aprovação/execução de recomendação (RF-REC-05): sobre o diálogo genérico, descreve
 * a ação e resume a transferência/reposição afetada. A ação é auditada pelo backend (quem aprovou/executou).
 */
export function ConfirmarAcaoRecomendacaoDialog({
  aberto,
  onOpenChange,
  recomendacao,
  acao,
  onConfirmar,
  processando,
}: Props) {
  if (!recomendacao) return null

  const r = recomendacao
  const cfg = CONFIG[acao]

  return (
    <ConfirmacaoAcaoDialog
      aberto={aberto}
      onOpenChange={onOpenChange}
      titulo={cfg.titulo}
      descricao={cfg.descricao}
      resumo={
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{r.tipo}</span>
            <span className="tabular text-xs text-success">economia {fmtMoeda(r.economiaEstimada)}</span>
          </div>
          <p className="text-muted-foreground">
            {r.medicamentoNome} <span className="text-xs">({r.medicamentoCodigo})</span>
          </p>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {r.unidadeOrigemSigla ? (
              <>
                <span className="font-medium">{r.unidadeOrigemSigla}</span>
                <ArrowRight className="size-3.5 text-primary" />
                <span className="font-medium">{r.unidadeDestinoSigla}</span>
              </>
            ) : (
              <>
                <Boxes className="size-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Reposição →</span>
                <span className="font-medium">{r.unidadeDestinoSigla}</span>
              </>
            )}
            <span className="text-muted-foreground">· {fmtNum(r.quantidade)} un</span>
          </div>
        </>
      }
      iconeConfirmar={cfg.icone}
      rotuloConfirmar={cfg.rotulo}
      varianteConfirmar={cfg.variante}
      onConfirmar={onConfirmar}
      processando={processando}
    />
  )
}
