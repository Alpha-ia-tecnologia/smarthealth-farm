import type { ReactNode } from "react"
import { RefreshCw } from "lucide-react"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AnaliseIaPainel } from "@/components/shared/AnaliseIaPainel"
import { useAnaliseIaAuto } from "@/hooks/use-analise-ia"
import type { MensagemChat } from "@/lib/ia"
import { cn } from "@/lib/utils"

interface Props {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  titulo: string
  descricao?: string
  /** Mensagens enviadas à IA para analisar o gráfico (os números vão no corpo). */
  mensagens: MensagemChat[]
  /** Identifica o gráfico; ao abrir com uma nova chave, dispara a análise. `null` desabilita. */
  chave: string | null
  /** Detalhamento exibido no modal: gráfico ampliado + tabela de números (opcional). */
  children?: ReactNode
}

/**
 * Modal de um gráfico (como o dos KPIs): detalhamento das informações (gráfico ampliado + números)
 * e uma análise gerada por IA. Genérico — o conteúdo e o prompt são fornecidos pelo chamador.
 */
export function GraficoInsightDialog({
  aberto,
  onOpenChange,
  titulo,
  descricao,
  mensagens,
  chave,
  children,
}: Props) {
  const { analise, carregando, erro, gerar } = useAnaliseIaAuto(mensagens, aberto, chave)

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="pr-6">{titulo}</DialogTitle>
          {descricao && <DialogDescription>{descricao}</DialogDescription>}
        </DialogHeader>

        {children && <div className="space-y-4">{children}</div>}

        <AnaliseIaPainel carregando={carregando} erro={erro} analise={analise} onTentarNovamente={gerar} />

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Fechar</Button>
          </DialogClose>
          <Button variant="outline" onClick={gerar} disabled={carregando}>
            <RefreshCw className={cn("size-4", carregando && "animate-spin")} />
            Gerar novamente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
