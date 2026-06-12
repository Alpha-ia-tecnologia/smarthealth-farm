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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUnidades } from "@/hooks/use-unidades"
import { useAtualizarUsuario, useCriarUsuario } from "@/hooks/use-usuarios"
import { ApiError } from "@/lib/api"
import type { PerfilUsuario, Usuario } from "@/types"

const PERFIS: PerfilUsuario[] = ["Operador", "Gestor", "TI"]
const SEM_UNIDADE = "__sem_unidade__"
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Presente = edição; ausente = criação. */
  usuario?: Usuario | null
}

/**
 * Modal de criação/edição de usuário (RF-ADM-01, perfil TI). O formulário vive num componente
 * interno que monta junto com o `DialogContent` (Radix desmonta ao fechar), então o estado nasce
 * dos dados atuais sem `useEffect`. A unidade de lotação é opcional; mapeia 409 para o campo e-mail.
 */
export function UsuarioFormDialog({ open, onOpenChange, usuario }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <FormularioUsuario usuario={usuario ?? null} onConcluir={() => onOpenChange(false)} onCancelar={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function FormularioUsuario({
  usuario,
  onConcluir,
  onCancelar,
}: {
  usuario: Usuario | null
  onConcluir: () => void
  onCancelar: () => void
}) {
  const ehEdicao = Boolean(usuario)
  const unidadesQuery = useUnidades({ ativo: true })
  const criar = useCriarUsuario()
  const atualizar = useAtualizarUsuario()

  const [nome, setNome] = useState(usuario?.nome ?? "")
  const [email, setEmail] = useState(usuario?.email ?? "")
  const [perfil, setPerfil] = useState<PerfilUsuario>(usuario?.perfil ?? "Operador")
  const [senha, setSenha] = useState("")
  const [unidadeId, setUnidadeId] = useState<string>(usuario?.unidadeId ?? SEM_UNIDADE)
  const [erros, setErros] = useState<{ nome?: string; email?: string; senha?: string }>({})

  const salvando = criar.isPending || atualizar.isPending

  function validar(): boolean {
    const novos: typeof erros = {}
    if (!nome.trim()) novos.nome = "Informe o nome."
    if (!EMAIL_RE.test(email)) novos.email = "E-mail inválido."
    if (!ehEdicao && senha.length < 8) novos.senha = "A senha deve ter ao menos 8 caracteres."
    setErros(novos)
    return Object.keys(novos).length === 0
  }

  function aoErro(erro: unknown) {
    if (erro instanceof ApiError) {
      if (erro.codigo === "CONFLITO") {
        setErros((e) => ({ ...e, email: "Já existe um usuário com este e-mail." }))
        return
      }
      toast.error(erro.message)
      return
    }
    toast.error("Erro inesperado. Tente novamente.")
  }

  function aoSubmeter(evento: React.FormEvent) {
    evento.preventDefault()
    if (!validar()) return
    const unidade = unidadeId === SEM_UNIDADE ? null : unidadeId

    if (ehEdicao && usuario) {
      atualizar.mutate(
        { id: usuario.id, body: { nome: nome.trim(), email: email.trim(), perfil, unidadeId: unidade } },
        {
          onSuccess: () => {
            toast.success("Usuário atualizado.")
            onConcluir()
          },
          onError: aoErro,
        },
      )
    } else {
      criar.mutate(
        { nome: nome.trim(), email: email.trim(), perfil, senha, unidadeId: unidade },
        {
          onSuccess: () => {
            toast.success("Usuário criado.")
            onConcluir()
          },
          onError: aoErro,
        },
      )
    }
  }

  const atendidas = (unidadesQuery.data ?? []).filter((u) => u.ativo)

  return (
    <>
      <DialogHeader>
        <DialogTitle>{ehEdicao ? "Editar usuário" : "Novo usuário"}</DialogTitle>
        <DialogDescription>
          {ehEdicao
            ? "Atualize os dados de acesso. A senha é redefinida em uma ação à parte."
            : "Cadastre um novo acesso ao sistema. A unidade de lotação é opcional."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={aoSubmeter} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="usuario-nome">Nome</Label>
          <Input id="usuario-nome" value={nome} onChange={(e) => setNome(e.target.value)} aria-invalid={Boolean(erros.nome)} aria-describedby={erros.nome ? "usuario-nome-erro" : undefined} />
          {erros.nome && <p id="usuario-nome-erro" className="text-xs text-destructive">{erros.nome}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="usuario-email">E-mail</Label>
          <Input id="usuario-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={Boolean(erros.email)} aria-describedby={erros.email ? "usuario-email-erro" : undefined} />
          {erros.email && <p id="usuario-email-erro" className="text-xs text-destructive">{erros.email}</p>}
        </div>

        {!ehEdicao && (
          <div className="space-y-1.5">
            <Label htmlFor="usuario-senha">Senha</Label>
            <Input id="usuario-senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} aria-invalid={Boolean(erros.senha)} aria-describedby={erros.senha ? "usuario-senha-erro" : undefined} autoComplete="new-password" />
            {erros.senha && <p id="usuario-senha-erro" className="text-xs text-destructive">{erros.senha}</p>}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="usuario-perfil">Perfil</Label>
            <Select value={perfil} onValueChange={(v) => setPerfil(v as PerfilUsuario)}>
              <SelectTrigger id="usuario-perfil" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PERFIS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="usuario-unidade">Unidade (opcional)</Label>
            <Select value={unidadeId} onValueChange={setUnidadeId}>
              <SelectTrigger id="usuario-unidade" className="w-full"><SelectValue placeholder="Sem unidade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_UNIDADE}>Sem unidade</SelectItem>
                {atendidas.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.sigla} · {u.municipio}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancelar}>Cancelar</Button>
          <Button type="submit" disabled={salvando}>
            {salvando ? "Salvando…" : ehEdicao ? "Salvar" : "Criar usuário"}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}
