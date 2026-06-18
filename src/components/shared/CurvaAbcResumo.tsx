import { cn } from "@/lib/utils"
import { fmtMoeda } from "@/lib/format"
import type { ClasseAbc, ResumoClasseAbc } from "@/lib/estoque"

const ESTILO: Record<ClasseAbc, { dot: string; titulo: string }> = {
  A: { dot: "bg-[var(--chart-1)]", titulo: "Vitais" },
  B: { dot: "bg-[var(--chart-2)]", titulo: "Intermediários" },
  C: { dot: "bg-muted-foreground", titulo: "Cauda" },
}

/** Cartões-resumo das classes A/B/C: % do valor, % dos itens e o valor (R$). Reutilizado nas telas. */
export function CurvaAbcResumo({ resumo }: { resumo: ResumoClasseAbc[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {resumo.map((r) => (
        <div key={r.classe} className="rounded-lg border p-3">
          <div className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", ESTILO[r.classe].dot)} />
            <span className="text-xs font-semibold">Classe {r.classe}</span>
            <span className="ml-auto text-[11px] text-muted-foreground">{ESTILO[r.classe].titulo}</span>
          </div>
          <p className="mt-1.5 tabular font-display text-xl font-bold leading-none">{r.valorPct}%</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            do valor · {r.itens} {r.itens === 1 ? "item" : "itens"} ({r.itensPct}%)
          </p>
          <p className="text-[11px] text-muted-foreground">{fmtMoeda(r.valor)}</p>
        </div>
      ))}
    </div>
  )
}
