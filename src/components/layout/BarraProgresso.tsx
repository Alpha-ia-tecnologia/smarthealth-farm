import { useIsFetching } from "@tanstack/react-query"

/**
 * Barra de progresso global no topo: aparece enquanto há qualquer requisição à API em andamento
 * (navegação para uma tela que carrega dados, paginação, refetch). Indeterminada e acessível.
 */
export function BarraProgresso() {
  const carregando = useIsFetching() > 0
  if (!carregando) return null

  return (
    <div
      role="progressbar"
      aria-label="Carregando dados"
      aria-busy="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden"
    >
      {/* Movimento reduzido: barra estática. */}
      <div className="hidden h-full w-full bg-primary/70 motion-reduce:block" />
      {/* Padrão: segmento deslizante (indeterminado). */}
      <div className="hidden h-full w-1/3 bg-primary motion-safe:block motion-safe:animate-[barra-indeterminada_1.1s_ease-in-out_infinite]" />
    </div>
  )
}
