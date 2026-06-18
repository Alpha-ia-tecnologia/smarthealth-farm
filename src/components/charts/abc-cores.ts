import type { ClasseAbc } from "@/lib/estoque"

/** Cores por classe da Curva ABC — A em destaque (primário), B intermediário (teal), C neutro. */
export const COR_CLASSE: Record<ClasseAbc, string> = {
  A: "var(--chart-1)",
  B: "var(--chart-2)",
  C: "var(--muted-foreground)",
}
