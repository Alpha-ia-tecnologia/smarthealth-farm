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
import { useAtualizarMedicamento, useCriarMedicamento } from "@/hooks/use-medicamentos"
import { criticidades, familiasTerapeuticas } from "@/lib/medicamentos"
import { ApiError } from "@/lib/api"
import type { FamiliaTerapeutica, Medicamento } from "@/types"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Presente = edição; ausente = criação. */
  medicamento?: Medicamento | null
  /** Família pré-selecionada ao criar (a partir do modal de itens da família). */
  familiaInicial?: FamiliaTerapeutica
}

function inicial(medicamento: Medicamento | null, familiaInicial?: FamiliaTerapeutica): Omit<Medicamento, "id" | "ativo"> {
  if (medicamento) {
    return {
      codigo: medicamento.codigo,
      nome: medicamento.nome,
      apresentacao: medicamento.apresentacao,
      familia: medicamento.familia,
      unidadeMedida: medicamento.unidadeMedida,
      criticidade: medicamento.criticidade,
      essencial: medicamento.essencial,
    }
  }
  return {
    codigo: "",
    nome: "",
    apresentacao: "",
    familia: familiaInicial ?? "Antibióticos",
    unidadeMedida: "",
    criticidade: "Média",
    essencial: false,
  }
}

/** Modal de criação/edição de medicamento (RF-DAD-06, perfil TI). Código único (409 → campo código). */
export function MedicamentoFormDialog({ open, onOpenChange, medicamento, familiaInicial }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <Formulario
          medicamento={medicamento ?? null}
          familiaInicial={familiaInicial}
          onConcluir={() => onOpenChange(false)}
          onCancelar={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function Formulario({
  medicamento,
  familiaInicial,
  onConcluir,
  onCancelar,
}: {
  medicamento: Medicamento | null
  familiaInicial?: FamiliaTerapeutica
  onConcluir: () => void
  onCancelar: () => void
}) {
  const ehEdicao = Boolean(medicamento)
  const criar = useCriarMedicamento()
  const atualizar = useAtualizarMedicamento()

  const [form, setForm] = useState(() => inicial(medicamento, familiaInicial))
  const [erros, setErros] = useState<Record<string, string>>({})

  const salvando = criar.isPending || atualizar.isPending

  function validar(): boolean {
    const novos: Record<string, string> = {}
    if (!form.codigo.trim()) novos.codigo = "Informe o código."
    if (!form.nome.trim()) novos.nome = "Informe o nome."
    if (!form.apresentacao.trim()) novos.apresentacao = "Informe a apresentação."
    if (!form.unidadeMedida.trim()) novos.unidadeMedida = "Informe a unidade de medida."
    setErros(novos)
    return Object.keys(novos).length === 0
  }

  function aoErro(erro: unknown) {
    if (erro instanceof ApiError) {
      if (erro.codigo === "CONFLITO") {
        setErros((e) => ({ ...e, codigo: "Já existe um medicamento com este código." }))
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
    const body = {
      ...form,
      codigo: form.codigo.trim(),
      nome: form.nome.trim(),
      apresentacao: form.apresentacao.trim(),
      unidadeMedida: form.unidadeMedida.trim(),
    }
    const aposSucesso = () => {
      toast.success(ehEdicao ? "Medicamento atualizado." : "Medicamento criado.")
      onConcluir()
    }
    if (ehEdicao && medicamento) {
      atualizar.mutate({ id: medicamento.id, body }, { onSuccess: aposSucesso, onError: aoErro })
    } else {
      criar.mutate(body, { onSuccess: aposSucesso, onError: aoErro })
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{ehEdicao ? "Editar medicamento" : "Novo medicamento"}</DialogTitle>
        <DialogDescription>Item do catálogo farmacêutico (RF-DAD-06).</DialogDescription>
      </DialogHeader>

      <form onSubmit={aoSubmeter} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="med-codigo" label="Código" erro={erros.codigo}>
            <Input id="med-codigo" value={form.codigo} onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))} aria-invalid={Boolean(erros.codigo)} aria-describedby={erros.codigo ? "med-codigo-erro" : undefined} placeholder="MED-031" />
          </Campo>
          <Campo id="med-unidade" label="Unidade de medida" erro={erros.unidadeMedida}>
            <Input id="med-unidade" value={form.unidadeMedida} onChange={(e) => setForm((f) => ({ ...f, unidadeMedida: e.target.value }))} aria-invalid={Boolean(erros.unidadeMedida)} aria-describedby={erros.unidadeMedida ? "med-unidade-erro" : undefined} placeholder="amp, fa, cp…" />
          </Campo>
        </div>

        <Campo id="med-nome" label="Nome" erro={erros.nome}>
          <Input id="med-nome" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} aria-invalid={Boolean(erros.nome)} aria-describedby={erros.nome ? "med-nome-erro" : undefined} />
        </Campo>
        <Campo id="med-apresentacao" label="Apresentação" erro={erros.apresentacao}>
          <Input id="med-apresentacao" value={form.apresentacao} onChange={(e) => setForm((f) => ({ ...f, apresentacao: e.target.value }))} aria-invalid={Boolean(erros.apresentacao)} aria-describedby={erros.apresentacao ? "med-apresentacao-erro" : undefined} placeholder="Frasco-ampola, Comprimido…" />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="med-familia" label="Família terapêutica">
            <Select value={form.familia} onValueChange={(v) => setForm((f) => ({ ...f, familia: v as FamiliaTerapeutica }))}>
              <SelectTrigger id="med-familia" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {familiasTerapeuticas.map((fa) => <SelectItem key={fa} value={fa}>{fa}</SelectItem>)}
              </SelectContent>
            </Select>
          </Campo>
          <Campo id="med-criticidade" label="Criticidade">
            <Select value={form.criticidade} onValueChange={(v) => setForm((f) => ({ ...f, criticidade: v as Medicamento["criticidade"] }))}>
              <SelectTrigger id="med-criticidade" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {criticidades.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Campo>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label htmlFor="med-essencial" className="text-sm">Item essencial</Label>
            <p className="text-xs text-muted-foreground">Faz parte da lista de essenciais (RENAME/REMUME).</p>
          </div>
          <Switch id="med-essencial" checked={form.essencial} onCheckedChange={(v) => setForm((f) => ({ ...f, essencial: v }))} />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancelar}>Cancelar</Button>
          <Button type="submit" disabled={salvando}>
            {salvando ? "Salvando…" : ehEdicao ? "Salvar" : "Criar medicamento"}
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
