import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { rotuloMes } from "@/data"
import { fmtMilhar } from "@/lib/format"

interface Props {
  data: { periodo: string; valor: number }[]
  color?: string
  meta?: number
  height?: number
  label?: string
}

export function TrendChart({ data, color = "var(--chart-1)", meta, height = 220, label = "Valor" }: Props) {
  const config: ChartConfig = { valor: { label, color } }
  const rows = data.map((d) => ({ ...d, mes: rotuloMes[d.periodo] ?? d.periodo }))
  return (
    <ChartContainer config={config} style={{ height }} className="w-full">
      <AreaChart data={rows} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
        <YAxis tickLine={false} axisLine={false} width={40} fontSize={11} tickFormatter={(v) => fmtMilhar(v as number)} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {meta != null && (
          <ReferenceLine y={meta} stroke="var(--chart-3)" strokeDasharray="5 4" label={{ value: "meta", position: "right", fontSize: 10, fill: "var(--chart-3)" }} />
        )}
        <Area dataKey="valor" stroke={color} strokeWidth={2.5} fill={`url(#grad-${label})`} dot={false} />
      </AreaChart>
    </ChartContainer>
  )
}
