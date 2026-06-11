import { cn } from "@/lib/utils"

interface SpinnerProps {
  /** Diâmetro em px (default 28). */
  size?: number
  /** Cor herda de `text-*`; default é a cor da marca (primary). */
  className?: string
  /** Rótulo acessível. */
  label?: string
}

/**
 * Indicador de carregamento: dois anéis concêntricos girando em sentidos opostos
 * (externo horário, interno anti-horário), na cor da marca. Respeita `prefers-reduced-motion`.
 */
export function Spinner({ size = 28, className, label = "Carregando" }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className={cn("inline-flex text-primary", className)}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
        {/* Anel externo — trilho + arco (horário) */}
        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeOpacity="0.15" strokeWidth="3" />
        <circle
          cx="24"
          cy="24"
          r="20"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray="72 28"
          className="spinner-arco motion-safe:animate-[girar_0.95s_linear_infinite]"
        />
        {/* Anel interno — trilho + arco (anti-horário) */}
        <circle cx="24" cy="24" r="14" stroke="currentColor" strokeOpacity="0.15" strokeWidth="3" />
        <circle
          cx="24"
          cy="24"
          r="14"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray="62 38"
          className="spinner-arco motion-safe:animate-[girar-reverso_0.8s_linear_infinite]"
        />
      </svg>
    </span>
  )
}
