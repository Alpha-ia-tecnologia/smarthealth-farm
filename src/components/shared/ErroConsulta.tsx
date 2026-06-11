import { AlertCircle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErroConsultaProps {
  mensagem?: string
  /** Refaz a consulta que falhou (ex.: `() => query.refetch()`). */
  onTentarNovamente?: () => void
}

/** Erro padrão de uma consulta à API, com ação de tentar de novo. */
export function ErroConsulta({ mensagem, onTentarNovamente }: ErroConsultaProps) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      <AlertCircle className="size-4 shrink-0" />
      <span className="min-w-0 flex-1">
        {mensagem ?? "Não foi possível carregar os dados. Tente novamente."}
      </span>
      {onTentarNovamente && (
        <Button size="sm" variant="outline" onClick={onTentarNovamente}>
          <RotateCcw className="size-3.5" />
          Tentar novamente
        </Button>
      )}
    </div>
  )
}
