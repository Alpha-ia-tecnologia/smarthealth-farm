import { Bar, CartesianGrid, Cell, ComposedChart, Line, ReferenceLine, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { fmtMilhar } from "@/lib/format"
import type { CurvaAbcItem } from "@/lib/estoque"
import { COR_CLASSE } from "@/components/charts/abc-cores"

const config: ChartConfig = {
  valorConsumo: { label: "Valor de consumo (R$)", color: "var(--chart-1)" },
  acumuladoPct: { label: "Acumulado (%)", color: "var(--chart-4)" },
}

/**
 * Curva ABC (Pareto): barras = valor de consumo por insumo (decrescente, coloridas por classe);
 * linha = % acumulado (eixo direito), com a referência em 80%. RF-EST.
 */
export function AbcChart({ itens, height = 300 }: { itens: CurvaAbcItem[]; height?: number }) {
  const data = itens.map((i) => ({
    codigo: i.insumoCodigo,
    valorConsumo: i.valorConsumo,
    acumuladoPct: i.acumuladoPct,
    classe: i.classe,
  }))

  return (
    <div className="space-y-3">
    <ChartContainer config={config} style={{ height }} className="w-full">
      <ComposedChart data={data} margin={{ left: 4, right: 8, top: 12, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="codigo" tickLine={false} axisLine={false} tick={false} height={8} />
        <YAxis
          yAxisId="valor"
          tickLine={false}
          axisLine={false}
          width={48}
          fontSize={11}
          tickFormatter={(v) => fmtMilhar(v as number)}
        />
        <YAxis
          yAxisId="pct"
          orientation="right"
          domain={[0, 100]}
          tickLine={false}
          axisLine={false}
          width={38}
          fontSize={11}
          tickFormatter={(v) => `${v}%`}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ReferenceLine
          yAxisId="pct"
          y={80}
          stroke="var(--chart-3)"
          strokeDasharray="5 4"
          label={{ value: "80%", position: "right", fontSize: 10, fill: "var(--chart-3)" }}
        />
        <Bar yAxisId="valor" dataKey="valorConsumo" radius={[3, 3, 0, 0]} maxBarSize={20}>
          {data.map((d, i) => (
            <Cell key={i} fill={COR_CLASSE[d.classe]} />
          ))}
        </Bar>
        <Line
          yAxisId="pct"
          type="monotone"
          dataKey="acumuladoPct"
          stroke="var(--chart-4)"
          strokeWidth={2.5}
          dot={false}
        />
      </ComposedChart>
    </ChartContainer>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1 text-xs text-muted-foreground">
        <LegendaClasse cor={COR_CLASSE.A} rotulo="Classe A · vitais" />
        <LegendaClasse cor={COR_CLASSE.B} rotulo="Classe B · intermediários" />
        <LegendaClasse cor={COR_CLASSE.C} rotulo="Classe C · cauda" />
        <span className="ml-auto inline-flex items-center gap-1.5">
          <span className="h-0 w-4 border-t-2 border-dashed" style={{ borderColor: "var(--chart-4)" }} />
          Acumulado %
        </span>
      </div>
    </div>
  )
}

function LegendaClasse({ cor, rotulo }: { cor: string; rotulo: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: cor }} />
      {rotulo}
    </span>
  )
}
