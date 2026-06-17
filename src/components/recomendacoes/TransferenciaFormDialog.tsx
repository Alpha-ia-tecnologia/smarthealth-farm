import { useState } from "react"
import { ArrowRight } from "lucide-react"
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
import { useMedicamentos } from "@/hooks/use-medicamentos"
import { useUnidades } from "@/hooks/use-unidades"
import { useCriarTransferencia, useEditarRecomendacao } from "@/hooks/use-recomendacoes"
import { ApiError } from "@/lib/api"
import { economiaManual, type Recomendacao } from "@/lib/recomendacoes"
import { fmtMoeda } from "@/lib/format"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Presente = edição de uma pendente; ausente = criação de nova transferência. */
  recomendacao?: Recomendacao | null
}

/**
 * Modal para **criar** uma transferência (redistribuição) entre unidades ou **editar** uma
 * recomendação ainda pendente (ajustar a sugestão da IA): medicamento, origem → destino e
 * quantidade. A economia estimada é exibida ao vivo (quantidade × 12) e recalculada no servidor.
 * O formulário vive num componente interno que remonta ao abrir (Radix desmonta ao fechar), então
 * o estado nasce dos dados atuais sem `useEffect`.
 */
export function TransferenciaFormDialog({ open, onOpenChange, recomendacao }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <FormularioTransferencia
          recomendacao={recomendacao ?? null}
          onConcluir={() => onOpenChange(false)}
          onCancelar={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function FormularioTransferencia({
  recomendacao,
  onConcluir,
  onCancelar,
}: {
  recomendacao: Recomendacao | null
  onConcluir: () => void
  onCancelar: () => void
}) {
  const ehEdicao = Boolean(recomendacao)
  // Criação é sempre redistribuição; na edição, o tipo da recomendação manda (reposição não tem origem).
  const ehRedistribuicao = recomendacao ? recomendacao.tipo === "Redistribuição" : true

  const medicamentosQuery = useMedicamentos({ ativo: true })
  const unidadesQuery = useUnidades({ ativo: true })
  const criar = useCriarTransferencia()
  const editar = useEditarRecomendacao()

  const [medicamentoId, setMedicamentoId] = useState(recomendacao?.medicamentoId ?? "")
  const [origemId, setOrigemId] = useState(recomendacao?.unidadeOrigemId ?? "")
  const [destinoId, setDestinoId] = useState(recomendacao?.unidadeDestinoId ?? "")
  const [quantidadeStr, setQuantidadeStr] = useState(
    recomendacao ? String(recomendacao.quantidade) : "",
  )
  const [erros, setErros] = useState<{
    medicamento?: string
    origem?: string
    destino?: string
    quantidade?: string
  }>({})

  const quantidade = Number(quantidadeStr)
  const quantidadeValida = Number.isFinite(quantidade) && quantidade > 0
  const economia = economiaManual(quantidadeValida ? quantidade : 0)
  const salvando = criar.isPending || editar.isPending

  const medicamentos = medicamentosQuery.data ?? []
  const unidades = (unidadesQuery.data ?? []).filter((u) => u.ativo)

  function validar(): boolean {
    const novos: typeof erros = {}
    if (!medicamentoId) novos.medicamento = "Selecione o medicamento."
    if (!destinoId) novos.destino = "Selecione a unidade de destino."
    if (ehRedistribuicao) {
      if (!origemId) novos.origem = "Selecione a unidade de origem."
      else if (origemId === destinoId) novos.origem = "A origem deve ser diferente do destino."
    }
    if (!quantidadeValida) novos.quantidade = "Informe uma quantidade maior que zero."
    setErros(novos)
    return Object.keys(novos).length === 0
  }

  function aoErro(erro: unknown) {
    toast.error(erro instanceof ApiError ? erro.message : "Erro inesperado. Tente novamente.")
  }

  function aoSubmeter(evento: React.FormEvent) {
    evento.preventDefault()
    if (!validar()) return
    const origem = ehRedistribuicao ? origemId : null

    if (ehEdicao && recomendacao) {
      editar.mutate(
        {
          id: recomendacao.id,
          body: { medicamentoId, unidadeOrigemId: origem, unidadeDestinoId: destinoId, quantidade },
        },
        {
          onSuccess: () => {
            toast.success("Transferência atualizada.")
            onConcluir()
          },
          onError: aoErro,
        },
      )
    } else {
      criar.mutate(
        { medicamentoId, unidadeOrigemId: origemId, unidadeDestinoId: destinoId, quantidade },
        {
          onSuccess: () => {
            toast.success("Transferência criada (pendente de aprovação).")
            onConcluir()
          },
          onError: aoErro,
        },
      )
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{ehEdicao ? "Editar transferência" : "Nova transferência"}</DialogTitle>
        <DialogDescription>
          {ehEdicao
            ? "Ajuste a recomendação (medicamento, unidades e quantidade). Ela segue pendente de aprovação."
            : "Crie uma transferência entre unidades. Ela é registrada como pendente, para aprovação."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={aoSubmeter} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="transf-medicamento">Medicamento</Label>
          <Select value={medicamentoId} onValueChange={setMedicamentoId}>
            <SelectTrigger id="transf-medicamento" className="w-full" aria-invalid={Boolean(erros.medicamento)}>
              <SelectValue placeholder="Selecione o medicamento" />
            </SelectTrigger>
            <SelectContent>
              {medicamentos.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.nome} <span className="text-muted-foreground">({m.codigo})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {erros.medicamento && <p className="text-xs text-destructive">{erros.medicamento}</p>}
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          {ehRedistribuicao ? (
            <div className="space-y-1.5">
              <Label htmlFor="transf-origem">Origem</Label>
              <Select value={origemId} onValueChange={setOrigemId}>
                <SelectTrigger id="transf-origem" className="w-full" aria-invalid={Boolean(erros.origem)}>
                  <SelectValue placeholder="De…" />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.sigla}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Origem</Label>
              <p className="flex h-9 items-center text-sm text-muted-foreground">Reposição (compra)</p>
            </div>
          )}

          <ArrowRight className="mb-2.5 size-4 shrink-0 text-primary" />

          <div className="space-y-1.5">
            <Label htmlFor="transf-destino">Destino</Label>
            <Select value={destinoId} onValueChange={setDestinoId}>
              <SelectTrigger id="transf-destino" className="w-full" aria-invalid={Boolean(erros.destino)}>
                <SelectValue placeholder="Para…" />
              </SelectTrigger>
              <SelectContent>
                {unidades.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.sigla}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {(erros.origem || erros.destino) && (
          <p className="text-xs text-destructive">{erros.origem ?? erros.destino}</p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="transf-quantidade">Quantidade (unidades)</Label>
          <Input
            id="transf-quantidade"
            type="number"
            min={1}
            value={quantidadeStr}
            onChange={(e) => setQuantidadeStr(e.target.value)}
            aria-invalid={Boolean(erros.quantidade)}
            className="w-40 tabular"
          />
          {erros.quantidade && <p className="text-xs text-destructive">{erros.quantidade}</p>}
        </div>

        {/* Economia estimada — atualiza ao vivo com a quantidade. */}
        <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2.5 text-sm">
          <span className="text-muted-foreground">Economia estimada</span>
          <span className="tabular font-semibold text-success" data-testid="economia-estimada">
            {fmtMoeda(economia)}
          </span>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancelar} disabled={salvando}>
            Cancelar
          </Button>
          <Button type="submit" disabled={salvando}>
            {salvando ? "Salvando…" : ehEdicao ? "Salvar alterações" : "Criar transferência"}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}
