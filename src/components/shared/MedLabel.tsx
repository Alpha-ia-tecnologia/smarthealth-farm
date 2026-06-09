import { getMedicamento, getUnidade } from "@/data"

export function MedLabel({ id, sub }: { id: string; sub?: boolean }) {
  const m = getMedicamento(id)
  if (!m) return <span>{id}</span>
  return (
    <span className="flex flex-col">
      <span className="font-medium leading-tight">{m.nome}</span>
      {sub && <span className="text-xs text-muted-foreground">{m.familia} · {m.apresentacao}</span>}
    </span>
  )
}

export function UniLabel({ id }: { id: string }) {
  const u = getUnidade(id)
  if (!u) return <span>{id}</span>
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-medium">{u.sigla}</span>
      <span className="text-xs text-muted-foreground">{u.municipio}</span>
    </span>
  )
}
