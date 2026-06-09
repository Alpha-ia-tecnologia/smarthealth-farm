import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { rotuloMes } from "@/data"
import type { PontoSerie } from "@/types"
import { fmtMilhar } from "@/lib/format"

const config: ChartConfig = {
  realizado: { label: "Realizado", color: "var(--chart-1)" },
  previsto: { label: "Previsto", color: "var(--chart-2)" },
}

/**
 * Comparativo Realizado × Previsto — gráfico de linhas duplas (segmentos retos
 * com marcadores). A região sem dado realizado é destacada como "Previsão".
 */
export function ForecastChart({ serie, height = 300 }: { serie: PontoSerie[]; height?: number }) {
  const data = serie.map((p) => ({ ...p, mes: rotuloMes[p.periodo] ?? p.periodo }))
  const corteIdx = data.findIndex((d) => d.realizado == null)
  const corte = corteIdx >= 0 ? data[corteIdx].mes : undefined
  const ultimo = data[data.length - 1]?.mes

  return (
    <div className="space-y-3">
      <ChartContainer config={config} style={{ height }} className="w-full">
        <LineChart data={data} margin={{ left: 4, right: 12, top: 14, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={10} fontSize={11} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={42}
            fontSize={11}
            tickFormatter={(v) => fmtMilhar(v as number)}
          />

          {/* região de previsão (sem realizado) */}
          {corte && (
            <ReferenceArea
              x1={corte}
              x2={ultimo}
              fill="var(--muted-foreground)"
              fillOpacity={0.05}
              ifOverflow="extendDomain"
              label={{
                value: "Previsão",
                position: "insideTopRight",
                fontSize: 10,
                fill: "var(--muted-foreground)",
                offset: 8,
              }}
            />
          )}
          {corte && <ReferenceLine x={corte} stroke="var(--border)" strokeWidth={1.5} />}

          <ChartTooltip
            cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3", strokeOpacity: 0.5 }}
            content={<ChartTooltipContent indicator="dot" />}
          />

          <Line
            type="linear"
            dataKey="realizado"
            name="Realizado"
            stroke="var(--chart-1)"
            strokeWidth={2.5}
            dot={{ r: 2.5, fill: "var(--chart-1)", strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
            connectNulls={false}
          />
          <Line
            type="linear"
            dataKey="previsto"
            name="Previsto"
            stroke="var(--chart-2)"
            strokeWidth={2.5}
            strokeDasharray="6 4"
            dot={{ r: 2.5, fill: "var(--chart-2)", strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
            connectNulls
          />
        </LineChart>
      </ChartContainer>

      {/* legenda */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-5 rounded-full" style={{ backgroundColor: "var(--chart-1)" }} />
          Realizado
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-0 w-5 border-t-2 border-dashed"
            style={{ borderColor: "var(--chart-2)" }}
          />
          Previsto
        </span>
      </div>
    </div>
  )
}
