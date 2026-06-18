import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
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
import { MapaRede, type PontoMapa } from "@/components/charts/MapaRede"
import { useInsumos } from "@/hooks/use-insumos"
import { useUnidades } from "@/hooks/use-unidades"
import { useCriarTransferencia, useEditarRecomendacao } from "@/hooks/use-recomendacoes"
import { ApiError } from "@/lib/api"
import { estoqueApi } from "@/lib/estoque"
import { economiaManual, type Recomendacao } from "@/lib/recomendacoes"
import { fmtMoeda, fmtNum } from "@/lib/format"
import { cn } from "@/lib/utils"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Presente = edição de uma pendente; ausente = criação de nova transferência. */
  recomendacao?: Recomendacao | null
}

/**
 * Modal para **criar** uma transferência (redistribuição) entre unidades ou **editar** uma
 * recomendação ainda pendente (ajustar a sugestão da IA): insumo, origem → destino e quantidade.
 * Em redistribuição, um mapa do Maranhão acompanha o formulário: clicar nas unidades define
 * origem→destino (com seta animada), em sincronia com os selects; ao escolher um insumo, o mapa
 * colore cada unidade pela condição daquele insumo. A economia estimada é exibida ao vivo.
 * O formulário vive num componente interno que remonta ao abrir (Radix desmonta ao fechar).
 */
export function TransferenciaFormDialog({ open, onOpenChange, recomendacao }: Props) {
  const ehRedistribuicao = recomendacao ? recomendacao.tipo === "Redistribuição" : true
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[92vh] overflow-y-auto",
          ehRedistribuicao ? "sm:max-w-3xl lg:max-w-4xl" : "sm:max-w-md",
        )}
      >
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

  const insumosQuery = useInsumos({ ativo: true })
  const unidadesQuery = useUnidades({ ativo: true })
  const criar = useCriarTransferencia()
  const editar = useEditarRecomendacao()

  const [insumoId, setInsumoId] = useState(recomendacao?.insumoId ?? "")
  const [origemId, setOrigemId] = useState(recomendacao?.unidadeOrigemId ?? "")
  const [destinoId, setDestinoId] = useState(recomendacao?.unidadeDestinoId ?? "")
  const [quantidadeStr, setQuantidadeStr] = useState(
    recomendacao ? String(recomendacao.quantidade) : "",
  )
  const [erros, setErros] = useState<{
    insumo?: string
    origem?: string
    destino?: string
    quantidade?: string
  }>({})

  const quantidade = Number(quantidadeStr)
  const quantidadeValida = Number.isFinite(quantidade) && quantidade > 0
  const economia = economiaManual(quantidadeValida ? quantidade : 0)
  const salvando = criar.isPending || editar.isPending

  const insumos = insumosQuery.data ?? []
  const unidades = (unidadesQuery.data ?? []).filter((u) => u.ativo)

  // Mapa: condição do insumo selecionado por unidade (verde/amarelo/vermelho) ou neutro sem filtro.
  const posicoesQuery = useQuery({
    queryKey: ["estoque", "mapa-transfer", insumoId],
    queryFn: () => estoqueApi.listarPosicoes({ insumoId }, { tamanho: 50 }),
    enabled: Boolean(insumoId),
  })
  const pontosMapa: PontoMapa[] = useMemo(() => {
    const atendidas = unidades.filter((u) => !u.hub)
    if (insumoId && posicoesQuery.data) {
      const porId = new Map(atendidas.map((u) => [u.id, u]))
      return posicoesQuery.data.itens.flatMap((p) => {
        const u = porId.get(p.unidadeId)
        if (!u) return []
        return [
          {
            unidadeId: p.unidadeId,
            sigla: p.unidadeSigla,
            nome: p.unidadeNome,
            municipio: u.municipio,
            status: p.status,
            detalhes: [
              { rotulo: "Em estoque", valor: `${fmtNum(p.quantidade)} un` },
              { rotulo: "Nível crítico", valor: fmtNum(p.nivelCritico) },
            ],
          },
        ]
      })
    }
    return atendidas.map((u) => ({
      unidadeId: u.id,
      sigla: u.sigla,
      nome: u.nome,
      municipio: u.municipio,
      status: "neutro" as const,
      detalhes: [],
    }))
  }, [insumoId, posicoesQuery.data, unidades])

  // Clique no mapa define origem→destino (em sincronia com os selects).
  function aoClicarMapa(id: string | undefined) {
    if (!id) return
    if (id === origemId) return setOrigemId("")
    if (id === destinoId) return setDestinoId("")
    if (!origemId) return setOrigemId(id)
    if (!destinoId) return setDestinoId(id)
    setOrigemId(id)
    setDestinoId("")
  }

  function validar(): boolean {
    const novos: typeof erros = {}
    if (!insumoId) novos.insumo = "Selecione o insumo."
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
          body: { insumoId, unidadeOrigemId: origem, unidadeDestinoId: destinoId, quantidade },
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
        { insumoId, unidadeOrigemId: origemId, unidadeDestinoId: destinoId, quantidade },
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
            ? "Ajuste a recomendação (insumo, unidades e quantidade). Ela segue pendente de aprovação."
            : "Crie uma transferência entre unidades. Ela é registrada como pendente, para aprovação."}
        </DialogDescription>
      </DialogHeader>

      <div className={cn("grid gap-5", ehRedistribuicao && "md:grid-cols-2 md:items-start")}>
        <form
          id="transf-form"
          onSubmit={aoSubmeter}
          className={cn("space-y-4", ehRedistribuicao && "md:order-2")}
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="transf-insumo">Insumo</Label>
            <Select value={insumoId} onValueChange={setInsumoId}>
              <SelectTrigger id="transf-insumo" className="w-full" aria-invalid={Boolean(erros.insumo)}>
                <SelectValue placeholder="Selecione o insumo" />
              </SelectTrigger>
              <SelectContent>
                {insumos.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.nome} <span className="text-muted-foreground">({m.codigo})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {erros.insumo && <p className="text-xs text-destructive">{erros.insumo}</p>}
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
        </form>

        {ehRedistribuicao && (
          <div className="md:order-1">
            <MapaRede
              pontos={pontosMapa}
              origemId={origemId}
              destinoId={destinoId}
              onSelecionar={aoClicarMapa}
            />
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Clique numa unidade para a <span className="font-medium text-foreground">origem</span> e em
              outra para o <span className="font-medium text-foreground">destino</span>.
            </p>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancelar} disabled={salvando}>
          Cancelar
        </Button>
        <Button type="submit" form="transf-form" disabled={salvando}>
          {salvando ? "Salvando…" : ehEdicao ? "Salvar alterações" : "Criar transferência"}
        </Button>
      </DialogFooter>
    </>
  )
}
