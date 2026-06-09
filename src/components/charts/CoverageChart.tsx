import { cn } from "@/lib/utils"

type Linha = { nome: string; valor: number; status: string; sub?: string }

const COR: Record<string, string> = {
  ok: "var(--success)",
  atencao: "var(--warning)",
  critico: "var(--danger)",
}

const META = 80 // % alvo
const COLS = "grid-cols-[3rem_1fr_3rem]"

/**
 * Cobertura de estoque por unidade — bullet chart executivo:
 * trilha de fundo (escala 0–100%), preenchimento por status,
 * marcador de meta alinhado e valores em coluna.
 */
export function CoverageChart({ data }: { data: Linha[] }) {
  const rows = [...data].sort((a, b) => b.valor - a.valor)
  const cont = {
    ok: rows.filter((r) => r.status === "ok").length,
    atencao: rows.filter((r) => r.status === "atencao").length,
    critico: rows.filter((r) => r.status === "critico").length,
  }

  return (
    <div>
      {/* rótulo da meta (alinhado ao marcador) */}
      <div className={cn("grid gap-3 px-1.5", COLS)}>
        <span />
        <div className="relative h-4 text-[10px]">
          <span
            className="absolute -translate-x-1/2 font-medium text-foreground/55"
            style={{ left: `${META}%` }}
          >
            meta {META}%
          </span>
        </div>
        <span />
      </div>

      <div className="space-y-0.5">
        {rows.map((d) => (
          <div
            key={d.nome}
            className={cn(
              "group grid items-center gap-3 rounded-md px-1.5 py-2 transition-colors hover:bg-muted/40",
              COLS,
            )}
          >
            <span className="truncate text-right text-xs font-medium text-muted-foreground">{d.nome}</span>

            <div className="relative flex h-5 items-center">
              {/* trilha */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{ width: `${d.valor}%`, backgroundColor: COR[d.status] }}
                />
              </div>
              {/* marcador de meta */}
              <span
                className="absolute top-0.5 bottom-0.5 w-px bg-foreground/40"
                style={{ left: `${META}%` }}
                aria-hidden
              />
            </div>

            <span className="flex items-center justify-end gap-1.5">
              <span className="size-1.5 rounded-full" style={{ backgroundColor: COR[d.status] }} />
              <span className="tabular text-sm font-semibold">{d.valor}%</span>
            </span>
          </div>
        ))}
      </div>

      {/* eixo */}
      <div className={cn("mt-1.5 grid gap-3 px-1.5", COLS)}>
        <span />
        <div className="relative h-4 text-[10px] tabular text-muted-foreground/80">
          <span className="absolute left-0">0</span>
          <span className="absolute left-1/2 -translate-x-1/2">50</span>
          <span className="absolute right-0">100%</span>
        </div>
        <span />
      </div>

      {/* legenda com contagem */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t pt-3 text-xs text-muted-foreground">
        <Legenda cor="var(--success)" txt="Adequado ≥ 80%" n={cont.ok} />
        <Legenda cor="var(--warning)" txt="Atenção 60–79%" n={cont.atencao} />
        <Legenda cor="var(--danger)" txt="Crítico < 60%" n={cont.critico} />
      </div>
    </div>
  )
}

function Legenda({ cor, txt, n }: { cor: string; txt: string; n: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-2 rounded-[3px]" style={{ backgroundColor: cor }} />
      {txt}
      <span className="tabular font-semibold text-foreground">{n}</span>
    </span>
  )
}
