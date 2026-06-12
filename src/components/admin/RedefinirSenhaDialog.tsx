import { useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRedefinirSenha } from "@/hooks/use-usuarios"
import { ApiError } from "@/lib/api"
import type { Usuario } from "@/types"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  usuario: Usuario | null
}

/** Modal de redefinição de senha (RF-ADM-01, perfil TI). Nova senha ≥ 8 caracteres. */
export function RedefinirSenhaDialog({ open, onOpenChange, usuario }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <Formulario usuario={usuario} onConcluir={() => onOpenChange(false)} onCancelar={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function Formulario({
  usuario,
  onConcluir,
  onCancelar,
}: {
  usuario: Usuario | null
  onConcluir: () => void
  onCancelar: () => void
}) {
  const redefinir = useRedefinirSenha()
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState<string>()

  function aoSubmeter(evento: React.FormEvent) {
    evento.preventDefault()
    if (senha.length < 8) {
      setErro("A senha deve ter ao menos 8 caracteres.")
      return
    }
    if (!usuario) return
    redefinir.mutate(
      { id: usuario.id, novaSenha: senha },
      {
        onSuccess: () => {
          toast.success("Senha redefinida.")
          onConcluir()
        },
        onError: (e) =>
          toast.error(e instanceof ApiError ? e.message : "Erro inesperado. Tente novamente."),
      },
    )
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Redefinir senha</DialogTitle>
        <DialogDescription>{usuario ? `Defina uma nova senha para ${usuario.nome}.` : ""}</DialogDescription>
      </DialogHeader>

      <form onSubmit={aoSubmeter} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="nova-senha">Nova senha</Label>
          <Input id="nova-senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} aria-invalid={Boolean(erro)} aria-describedby={erro ? "nova-senha-erro" : undefined} autoComplete="new-password" />
          {erro && <p id="nova-senha-erro" className="text-xs text-destructive">{erro}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancelar}>Cancelar</Button>
          <Button type="submit" disabled={redefinir.isPending}>
            {redefinir.isPending ? "Salvando…" : "Redefinir"}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}
