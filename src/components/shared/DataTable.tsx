import { useState } from "react"
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, Search } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Paginacao } from "@/components/shared/Paginacao"
import { cn } from "@/lib/utils"

/**
 * Controle server-side: quando presente, paginação, ordenação e busca são conduzidas pelo
 * servidor (a `data` já é a página atual). Sem ele, a tabela opera 100% no cliente.
 */
export interface ControleServidor {
  paginaAtual: number
  tamanhoPagina: number
  totalRegistros: number
  onMudarPagina: (pagina: number) => void
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
  busca: string
  onBuscaChange: (busca: string) => void
}

interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[]
  data: T[]
  searchKey?: string
  searchPlaceholder?: string
  pageSize?: number
  toolbar?: React.ReactNode
  onRowClick?: (row: T) => void
  dense?: boolean
  /** Quando fornecido, a tabela usa paginação/ordenação/busca do servidor. */
  servidor?: ControleServidor
}

export function DataTable<T>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Buscar…",
  pageSize = 10,
  toolbar,
  onRowClick,
  dense,
  servidor,
}: DataTableProps<T>) {
  const noServidor = Boolean(servidor)
  const [sortingLocal, setSortingLocal] = useState<SortingState>([])
  const [filtroLocal, setFiltroLocal] = useState("")

  const table = useReactTable({
    data,
    columns,
    state: servidor
      ? {
          sorting: servidor.sorting,
          pagination: { pageIndex: servidor.paginaAtual, pageSize: servidor.tamanhoPagina },
        }
      : { sorting: sortingLocal, globalFilter: filtroLocal },
    onSortingChange: servidor
      ? (updater) =>
          servidor.onSortingChange(
            typeof updater === "function" ? updater(servidor.sorting) : updater,
          )
      : setSortingLocal,
    onGlobalFilterChange: servidor ? undefined : setFiltroLocal,
    manualPagination: noServidor,
    manualSorting: noServidor,
    manualFiltering: noServidor,
    rowCount: servidor ? servidor.totalRegistros : undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: noServidor ? undefined : getSortedRowModel(),
    getFilteredRowModel: noServidor ? undefined : getFilteredRowModel(),
    getPaginationRowModel: noServidor ? undefined : getPaginationRowModel(),
    initialState: noServidor ? undefined : { pagination: { pageSize } },
  })

  const buscaValor = servidor ? servidor.busca : filtroLocal
  const aoBuscar = servidor ? servidor.onBuscaChange : setFiltroLocal

  const paginaAtual = servidor ? servidor.paginaAtual : table.getState().pagination.pageIndex
  const totalPaginas = servidor
    ? Math.ceil(servidor.totalRegistros / servidor.tamanhoPagina)
    : table.getPageCount()
  const totalRegistros = servidor ? servidor.totalRegistros : table.getFilteredRowModel().rows.length
  const mudarPagina = servidor ? servidor.onMudarPagina : (p: number) => table.setPageIndex(p)

  return (
    <div className="space-y-3">
      {(searchKey || toolbar) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {searchKey ? (
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={buscaValor}
                onChange={(e) => aoBuscar(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-8"
              />
            </div>
          ) : (
            <div />
          )}
          {toolbar}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-muted/40 hover:bg-muted/40">
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  return (
                    <TableHead
                      key={header.id}
                      className={cn("h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground", canSort && "cursor-pointer select-none")}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <span className="inline-flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && <ArrowUpDown className="size-3 opacity-50" />}
                      </span>
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={cn(onRowClick && "cursor-pointer", dense && "[&>td]:py-1.5")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-muted-foreground">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Paginacao
        paginaAtual={paginaAtual}
        totalPaginas={totalPaginas}
        onMudarPagina={mudarPagina}
        totalRegistros={totalRegistros}
      />
    </div>
  )
}
