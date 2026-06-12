import { Link } from "react-router-dom"
import { ShieldX } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Estado de 403 na UI: o usuário está autenticado, mas o perfil não tem acesso à rota.
 * Espelha o `ACESSO_NEGADO` do backend (a barreira real continua no servidor).
 */
export default function AcessoNegado() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <ShieldX className="size-7" />
      </div>
      <div>
        <p className="font-display text-5xl font-bold">403</p>
        <p className="mt-1 max-w-md text-muted-foreground">
          Seu perfil não tem permissão para acessar esta área. Em caso de dúvida, fale com a
          equipe de TI da CAHOSP.
        </p>
      </div>
      <Button asChild>
        <Link to="/">Voltar ao dashboard</Link>
      </Button>
    </div>
  )
}
