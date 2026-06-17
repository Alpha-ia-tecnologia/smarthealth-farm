import { useState } from "react"
import { toast } from "sonner"
import { Pencil, Plus, Power } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ErroConsulta } from "@/components/shared/ErroConsulta"
import { InsumoFormDialog } from "@/components/admin/InsumoFormDialog"
import { useAlterarStatusInsumo, useInsumos } from "@/hooks/use-insumos"
import { ApiError } from "@/lib/api"
import type { CategoriaInsumo, Insumo } from "@/types"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoria: CategoriaInsumo | null
}

/** Modal com os itens de uma categoria de insumo (RF-DAD-06). Permite editar, ativar/desativar e criar. */
export function ItensCategoriaDialog({ open, onOpenChange, categoria }: Props) {
  // A consulta só roda com o modal aberto e categoria definida.
  const insumosQuery = useInsumos(categoria ? { categoria } : {})
  const alterarStatus = useAlterarStatusInsumo()
  const [criando, setCriando] = useState(false)
  const [editando, setEditando] = useState<Insumo | null>(null)

  const itens = (insumosQuery.data ?? []).filter((m) => m.categoria === categoria)

  function aoAlterarStatus(m: Insumo) {
    alterarStatus.mutate(
      { id: m.id, ativo: !m.ativo },
      {
        onSuccess: () => toast.success(m.ativo ? "Insumo desativado." : "Insumo ativado."),
        onError: (e) =>
          toast.error(e instanceof ApiError ? e.message : "Erro inesperado. Tente novamente."),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{categoria ?? "Itens"}</DialogTitle>
          <DialogDescription>Itens do catálogo nesta categoria de insumo.</DialogDescription>
        </DialogHeader>

        <div className="flex justify-end">
          <Button size="sm" onClick={() => setCriando(true)}>
            <Plus className="size-4" /> Novo insumo
          </Button>
        </div>

        {categoria && insumosQuery.isError ? (
          <ErroConsulta mensagem="Não foi possível carregar os itens." onTentarNovamente={() => insumosQuery.refetch()} />
        ) : insumosQuery.isPending ? (
          <div className="flex justify-center py-12"><Spinner size={32} label="Carregando itens" /></div>
        ) : itens.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Nenhum item nesta categoria.</p>
        ) : (
          <div className="max-h-[55vh] divide-y overflow-y-auto">
            {itens.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{m.nome}</p>
                    {m.essencial && <Badge variant="secondary" className="text-[10px]">Essencial</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{m.codigo} · {m.apresentacao} · {m.criticidade}</p>
                </div>
                <StatusBadge status={m.ativo ? "ok" : "neutro"} label={m.ativo ? "Ativo" : "Inativo"} />
                <Button size="xs" variant="outline" onClick={() => setEditando(m)} aria-label={`Editar ${m.nome}`}>
                  <Pencil className="size-3" /> Editar
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  disabled={alterarStatus.isPending}
                  onClick={() => aoAlterarStatus(m)}
                  aria-label={`${m.ativo ? "Desativar" : "Ativar"} ${m.nome}`}
                >
                  <Power className="size-3" /> {m.ativo ? "Desativar" : "Ativar"}
                </Button>
              </div>
            ))}
          </div>
        )}

        {categoria && (
          <InsumoFormDialog open={criando} onOpenChange={setCriando} categoriaInicial={categoria} />
        )}
        <InsumoFormDialog
          open={editando !== null}
          onOpenChange={(aberto) => !aberto && setEditando(null)}
          insumo={editando}
        />
      </DialogContent>
    </Dialog>
  )
}
