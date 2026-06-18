import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

/** Botão "Análise IA" para o cabeçalho de um gráfico/seção — abre o modal de detalhe + insight. */
export function BotaoAnaliseIa({ rotulo, onClick }: { rotulo: string; onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      aria-label={`Análise IA — ${rotulo}`}
      className="text-primary hover:text-primary"
    >
      <Sparkles className="size-4" />
      Análise IA
    </Button>
  )
}
