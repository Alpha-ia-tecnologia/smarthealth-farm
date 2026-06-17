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
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAtualizarUnidade, useCriarUnidade } from "@/hooks/use-unidades"
import { ApiError } from "@/lib/api"
import type { Unidade } from "@/types"

const PORTES: Unidade["porte"][] = ["Pequeno", "Médio", "Grande"]
const CONECTIVIDADES: Unidade["conectividade"][] = ["Estável", "Intermitente", "Precária"]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Presente = edição; ausente = criação. */
  unidade?: Unidade | null
}

const VAZIO = {
  nome: "",
  sigla: "",
  municipio: "",
  porte: "Médio" as Unidade["porte"],
  leitos: 0,
  conectividade: "Estável" as Unidade["conectividade"],
  perfilDemografico: "",
  hub: false,
}

/** Modal de criação/edição de unidade (RF-DAD-06, perfil TI). Sigla única (409 → campo sigla). */
export function UnidadeFormDialog({ open, onOpenChange, unidade }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <Formulario unidade={unidade ?? null} onConcluir={() => onOpenChange(false)} onCancelar={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function Formulario({
  unidade,
  onConcluir,
  onCancelar,
}: {
  unidade: Unidade | null
  onConcluir: () => void
  onCancelar: () => void
}) {
  const ehEdicao = Boolean(unidade)
  const criar = useCriarUnidade()
  const atualizar = useAtualizarUnidade()

  const [form, setForm] = useState(() =>
    unidade
      ? {
          nome: unidade.nome,
          sigla: unidade.sigla,
          municipio: unidade.municipio,
          porte: unidade.porte,
          leitos: unidade.leitos,
          conectividade: unidade.conectividade,
          perfilDemografico: unidade.perfilDemografico,
          hub: unidade.hub,
        }
      : VAZIO,
  )
  const [erros, setErros] = useState<Record<string, string>>({})

  const salvando = criar.isPending || atualizar.isPending

  function validar(): boolean {
    const novos: Record<string, string> = {}
    if (!form.nome.trim()) novos.nome = "Informe o nome."
    if (!form.sigla.trim()) novos.sigla = "Informe a sigla."
    if (!form.municipio.trim()) novos.municipio = "Informe o município."
    if (!form.perfilDemografico.trim()) novos.perfilDemografico = "Informe o perfil demográfico."
    if (form.leitos < 0) novos.leitos = "Leitos não pode ser negativo."
    setErros(novos)
    return Object.keys(novos).length === 0
  }

  function aoErro(erro: unknown) {
    if (erro instanceof ApiError) {
      if (erro.codigo === "CONFLITO") {
        setErros((e) => ({ ...e, sigla: "Já existe uma unidade com esta sigla." }))
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
    const body = { ...form, nome: form.nome.trim(), sigla: form.sigla.trim(), municipio: form.municipio.trim(), perfilDemografico: form.perfilDemografico.trim() }
    const aposSucesso = () => {
      toast.success(ehEdicao ? "Unidade atualizada." : "Unidade criada.")
      onConcluir()
    }
    if (ehEdicao && unidade) {
      atualizar.mutate({ id: unidade.id, body }, { onSuccess: aposSucesso, onError: aoErro })
    } else {
      criar.mutate(body, { onSuccess: aposSucesso, onError: aoErro })
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{ehEdicao ? "Editar unidade" : "Nova unidade"}</DialogTitle>
        <DialogDescription>Unidade hospitalar da rede EMSERH.</DialogDescription>
      </DialogHeader>

      <form onSubmit={aoSubmeter} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="uni-nome" label="Nome" erro={erros.nome}>
            <Input id="uni-nome" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} aria-invalid={Boolean(erros.nome)} aria-describedby={erros.nome ? "uni-nome-erro" : undefined} />
          </Campo>
          <Campo id="uni-sigla" label="Sigla" erro={erros.sigla}>
            <Input id="uni-sigla" value={form.sigla} onChange={(e) => setForm((f) => ({ ...f, sigla: e.target.value }))} aria-invalid={Boolean(erros.sigla)} aria-describedby={erros.sigla ? "uni-sigla-erro" : undefined} />
          </Campo>
          <Campo id="uni-municipio" label="Município" erro={erros.municipio}>
            <Input id="uni-municipio" value={form.municipio} onChange={(e) => setForm((f) => ({ ...f, municipio: e.target.value }))} aria-invalid={Boolean(erros.municipio)} aria-describedby={erros.municipio ? "uni-municipio-erro" : undefined} />
          </Campo>
          <Campo id="uni-leitos" label="Leitos" erro={erros.leitos}>
            <Input id="uni-leitos" type="number" min={0} value={form.leitos} onChange={(e) => setForm((f) => ({ ...f, leitos: Number(e.target.value) }))} aria-invalid={Boolean(erros.leitos)} aria-describedby={erros.leitos ? "uni-leitos-erro" : undefined} />
          </Campo>
          <Campo id="uni-porte" label="Porte">
            <Select value={form.porte} onValueChange={(v) => setForm((f) => ({ ...f, porte: v as Unidade["porte"] }))}>
              <SelectTrigger id="uni-porte" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PORTES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </Campo>
          <Campo id="uni-conect" label="Conectividade">
            <Select value={form.conectividade} onValueChange={(v) => setForm((f) => ({ ...f, conectividade: v as Unidade["conectividade"] }))}>
              <SelectTrigger id="uni-conect" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONECTIVIDADES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Campo>
        </div>

        <Campo id="uni-perfil" label="Perfil demográfico" erro={erros.perfilDemografico}>
          <Input id="uni-perfil" value={form.perfilDemografico} onChange={(e) => setForm((f) => ({ ...f, perfilDemografico: e.target.value }))} aria-invalid={Boolean(erros.perfilDemografico)} aria-describedby={erros.perfilDemografico ? "uni-perfil-erro" : undefined} />
        </Campo>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label htmlFor="uni-hub" className="text-sm">Hub logístico (CAHOSP central)</Label>
            <p className="text-xs text-muted-foreground">Centraliza a distribuição; não consome direto.</p>
          </div>
          <Switch id="uni-hub" checked={form.hub} onCheckedChange={(v) => setForm((f) => ({ ...f, hub: v }))} />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancelar}>Cancelar</Button>
          <Button type="submit" disabled={salvando}>
            {salvando ? "Salvando…" : ehEdicao ? "Salvar" : "Criar unidade"}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

function Campo({ id, label, erro, children }: { id: string; label: string; erro?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {erro && <p id={`${id}-erro`} className="text-xs text-destructive">{erro}</p>}
    </div>
  )
}
