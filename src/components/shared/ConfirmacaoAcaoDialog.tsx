import { useId, useState, type ReactNode } from "react"
import { UserCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/auth"

interface Props {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  titulo: string
  descricao: string
  /** Resumo do item afetado, exibido numa caixa destacada (opcional). */
  resumo?: ReactNode
  /** Rótulo do botão de confirmação (ex.: "Confirmar aprovação"). */
  rotuloConfirmar: string
  rotuloProcessando?: string
  iconeConfirmar?: ReactNode
  /** Variante visual do botão de confirmação (use "destructive" para ações negativas, ex.: recusar). */
  varianteConfirmar?: "default" | "destructive"
  /** Dispara a ação de fato. Só habilitado com o aceite marcado. */
  onConfirmar: () => void
  /** Ação em andamento — desabilita os controles e troca o rótulo do botão. */
  processando: boolean
}

/**
 * Diálogo genérico de confirmação de ação sensível: explica o que vai acontecer, mostra **quem**
 * está realizando a ação (o usuário logado — que o backend registra na auditoria) e exige um aceite
 * explícito (checkbox) antes de habilitar o botão. Reaproveitado por alertas e recomendações.
 */
export function ConfirmacaoAcaoDialog({
  aberto,
  onOpenChange,
  titulo,
  descricao,
  resumo,
  rotuloConfirmar,
  rotuloProcessando = "Confirmando…",
  iconeConfirmar,
  varianteConfirmar = "default",
  onConfirmar,
  processando,
}: Props) {
  const { usuario } = useAuth()
  const [confirmado, setConfirmado] = useState(false)
  const idConfirmacao = useId()

  // Cada vez que o diálogo abre, o aceite recomeça desmarcado (evita confirmar por inércia).
  // Ajuste de estado durante o render (padrão do React), sem efeito.
  const [abertoAnterior, setAbertoAnterior] = useState(aberto)
  if (aberto !== abertoAnterior) {
    setAbertoAnterior(aberto)
    if (aberto) setConfirmado(false)
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </DialogHeader>

        {resumo && (
          <div className="space-y-1.5 rounded-lg border bg-muted/40 p-3 text-sm">{resumo}</div>
        )}

        {/* Quem está realizando a ação (fica registrado na auditoria) */}
        <div className="flex items-center gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <UserCircle className="size-5 shrink-0 text-primary" />
          <div className="min-w-0 text-sm">
            <p className="text-xs text-muted-foreground">Ação registrada em nome de</p>
            <p className="font-medium leading-tight">
              {usuario?.nome ?? "Usuário"}
              {usuario?.perfil && (
                <span className="font-normal text-muted-foreground"> · {usuario.perfil}</span>
              )}
            </p>
          </div>
        </div>

        {/* Aceite explícito */}
        <div className="flex items-start gap-2.5">
          <Checkbox
            id={idConfirmacao}
            checked={confirmado}
            onCheckedChange={(v) => setConfirmado(v === true)}
            disabled={processando}
            className="mt-0.5"
          />
          <Label htmlFor={idConfirmacao} className="text-sm font-normal leading-snug">
            Eu confirmo esta ação e que ela será registrada em meu nome.
          </Label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processando}>
            Cancelar
          </Button>
          <Button variant={varianteConfirmar} onClick={onConfirmar} disabled={!confirmado || processando}>
            {iconeConfirmar}
            {processando ? rotuloProcessando : rotuloConfirmar}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
