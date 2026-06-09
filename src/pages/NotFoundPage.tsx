import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Activity } from "lucide-react"

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Activity className="size-7" />
      </div>
      <div>
        <p className="font-display text-5xl font-bold">404</p>
        <p className="mt-1 text-muted-foreground">Página não encontrada na plataforma Smart Health.</p>
      </div>
      <Button asChild>
        <Link to="/">Voltar ao dashboard</Link>
      </Button>
    </div>
  )
}
