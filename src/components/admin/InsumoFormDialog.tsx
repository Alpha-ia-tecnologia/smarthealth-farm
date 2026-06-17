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
import { useAtualizarInsumo, useCriarInsumo } from "@/hooks/use-insumos"
import { criticidades, categoriasInsumo } from "@/lib/insumos"
import { ApiError } from "@/lib/api"
import type { CategoriaInsumo, Insumo } from "@/types"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Presente = edição; ausente = criação. */
  insumo?: Insumo | null
  /** Categoria pré-selecionada ao criar (a partir do modal de itens da categoria). */
  categoriaInicial?: CategoriaInsumo
}

function inicial(insumo: Insumo | null, categoriaInicial?: CategoriaInsumo): Omit<Insumo, "id" | "ativo"> {
  if (insumo) {
    return {
      codigo: insumo.codigo,
      nome: insumo.nome,
      apresentacao: insumo.apresentacao,
      categoria: insumo.categoria,
      unidadeMedida: insumo.unidadeMedida,
      criticidade: insumo.criticidade,
      essencial: insumo.essencial,
    }
  }
  return {
    codigo: "",
    nome: "",
    apresentacao: "",
    categoria: categoriaInicial ?? "Antibióticos",
    unidadeMedida: "",
    criticidade: "Média",
    essencial: false,
  }
}

/** Modal de criação/edição de insumo (RF-DAD-06, perfil TI). Código único (409 → campo código). */
export function InsumoFormDialog({ open, onOpenChange, insumo, categoriaInicial }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <Formulario
          insumo={insumo ?? null}
          categoriaInicial={categoriaInicial}
          onConcluir={() => onOpenChange(false)}
          onCancelar={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function Formulario({
  insumo,
  categoriaInicial,
  onConcluir,
  onCancelar,
}: {
  insumo: Insumo | null
  categoriaInicial?: CategoriaInsumo
  onConcluir: () => void
  onCancelar: () => void
}) {
  const ehEdicao = Boolean(insumo)
  const criar = useCriarInsumo()
  const atualizar = useAtualizarInsumo()

  const [form, setForm] = useState(() => inicial(insumo, categoriaInicial))
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
        setErros((e) => ({ ...e, codigo: "Já existe um insumo com este código." }))
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
      toast.success(ehEdicao ? "Insumo atualizado." : "Insumo criado.")
      onConcluir()
    }
    if (ehEdicao && insumo) {
      atualizar.mutate({ id: insumo.id, body }, { onSuccess: aposSucesso, onError: aoErro })
    } else {
      criar.mutate(body, { onSuccess: aposSucesso, onError: aoErro })
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{ehEdicao ? "Editar insumo" : "Novo insumo"}</DialogTitle>
        <DialogDescription>Item do catálogo farmacêutico.</DialogDescription>
      </DialogHeader>

      <form onSubmit={aoSubmeter} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="ins-codigo" label="Código" erro={erros.codigo}>
            <Input id="ins-codigo" value={form.codigo} onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))} aria-invalid={Boolean(erros.codigo)} aria-describedby={erros.codigo ? "ins-codigo-erro" : undefined} placeholder="INS-031" />
          </Campo>
          <Campo id="ins-unidade" label="Unidade de medida" erro={erros.unidadeMedida}>
            <Input id="ins-unidade" value={form.unidadeMedida} onChange={(e) => setForm((f) => ({ ...f, unidadeMedida: e.target.value }))} aria-invalid={Boolean(erros.unidadeMedida)} aria-describedby={erros.unidadeMedida ? "ins-unidade-erro" : undefined} placeholder="amp, fa, cp…" />
          </Campo>
        </div>

        <Campo id="ins-nome" label="Nome" erro={erros.nome}>
          <Input id="ins-nome" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} aria-invalid={Boolean(erros.nome)} aria-describedby={erros.nome ? "ins-nome-erro" : undefined} />
        </Campo>
        <Campo id="ins-apresentacao" label="Apresentação" erro={erros.apresentacao}>
          <Input id="ins-apresentacao" value={form.apresentacao} onChange={(e) => setForm((f) => ({ ...f, apresentacao: e.target.value }))} aria-invalid={Boolean(erros.apresentacao)} aria-describedby={erros.apresentacao ? "ins-apresentacao-erro" : undefined} placeholder="Frasco-ampola, Comprimido…" />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="ins-categoria" label="Categoria de insumo">
            <Select value={form.categoria} onValueChange={(v) => setForm((f) => ({ ...f, categoria: v as CategoriaInsumo }))}>
              <SelectTrigger id="ins-categoria" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {categoriasInsumo.map((fa) => <SelectItem key={fa} value={fa}>{fa}</SelectItem>)}
              </SelectContent>
            </Select>
          </Campo>
          <Campo id="ins-criticidade" label="Criticidade">
            <Select value={form.criticidade} onValueChange={(v) => setForm((f) => ({ ...f, criticidade: v as Insumo["criticidade"] }))}>
              <SelectTrigger id="ins-criticidade" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {criticidades.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Campo>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label htmlFor="ins-essencial" className="text-sm">Item essencial</Label>
            <p className="text-xs text-muted-foreground">Faz parte da lista de essenciais (RENAME/REMUME).</p>
          </div>
          <Switch id="ins-essencial" checked={form.essencial} onCheckedChange={(v) => setForm((f) => ({ ...f, essencial: v }))} />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancelar}>Cancelar</Button>
          <Button type="submit" disabled={salvando}>
            {salvando ? "Salvando…" : ehEdicao ? "Salvar" : "Criar insumo"}
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
