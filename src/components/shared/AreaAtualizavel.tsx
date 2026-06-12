import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface AreaAtualizavelProps {
  /** Quando true, esmaece o conteúdo e mostra o spinner por cima (ex.: troca de página). */
  atualizando: boolean
  children: React.ReactNode
  className?: string
}

/**
 * Envolve um bloco que pode ser re-buscado mantendo o dado anterior na tela (keepPreviousData):
 * durante a atualização, o conteúdo fica esmaecido com um spinner sobreposto — feedback claro
 * sem colapsar o layout a cada paginação.
 */
export function AreaAtualizavel({ atualizando, children, className }: AreaAtualizavelProps) {
  return (
    <div className={cn("relative", className)}>
      <div className={cn("transition-opacity", atualizando && "pointer-events-none opacity-50")}>
        {children}
      </div>
      {atualizando && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <Spinner size={36} label="Atualizando dados" />
        </div>
      )}
    </div>
  )
}
