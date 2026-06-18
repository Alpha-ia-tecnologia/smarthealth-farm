import { cn } from "@/lib/utils"

// Cores institucionais da EMSERH (usadas no wordmark compacto).
const VERDE = "#8DC63F"
const AZUL = "#1B9DD9"

interface Props {
  /** "full" = logo oficial completa (login); "compact" = wordmark enxuto (header/sidebar). */
  variant?: "full" | "compact"
  className?: string
}

/**
 * Logo institucional da EMSERH. A variante completa usa o arquivo oficial
 * (`public/logo-emserh.png`, PNG transparente). A compacta é o wordmark "EMSERH+" nas cores da
 * marca, para caber em barras estreitas.
 */
export function LogoEmserh({ variant = "full", className }: Props) {
  if (variant !== "compact") {
    return (
      <img
        src="/logo-emserh.png"
        alt="EMSERH — Empresa Maranhense de Serviços Hospitalares"
        className={cn("h-auto w-full max-w-[16rem] select-none", className)}
      />
    )
  }

  return (
    <div
      className={cn("select-none leading-none", className)}
      role="img"
      aria-label="EMSERH — Empresa Maranhense de Serviços Hospitalares"
    >
      <span className="inline-flex items-center font-display text-2xl font-extrabold tracking-tight">
        <span style={{ color: VERDE }}>EMSER</span>
        <span style={{ color: AZUL }}>H</span>
        <span style={{ color: AZUL }} className="ml-[0.06em]">
          +
        </span>
      </span>
    </div>
  )
}
