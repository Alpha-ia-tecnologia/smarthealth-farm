import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { fmtMilhar } from "@/lib/format"

/* Sparkline minimalista */
export function Sparkline({
  data,
  color = "var(--chart-1)",
  height = 40,
}: {
  data: { valor: number }[]
  color?: string
  height?: number
}) {
  return (
    <ChartContainer config={{ valor: { color } }} style={{ height }} className="w-full">
      <AreaChart data={data} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
        <defs>
          <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area dataKey="valor" stroke={color} strokeWidth={2} fill="url(#spark)" dot={false} isAnimationActive={false} />
      </AreaChart>
    </ChartContainer>
  )
}

/* Medidor radial (ex.: assertividade / cobertura) */
export function Gauge({
  value,
  max = 100,
  color = "var(--chart-2)",
  label,
  suffix = "%",
  height = 160,
}: {
  value: number
  max?: number
  color?: string
  label?: string
  suffix?: string
  height?: number
}) {
  const data = [{ name: label ?? "valor", value, fill: color }]
  return (
    <div className="relative">
      <ChartContainer config={{ value: { label: label ?? "" } }} style={{ height }} className="mx-auto w-full">
        <RadialBarChart data={data} startAngle={210} endAngle={-30} innerRadius="68%" outerRadius="100%" barSize={14}>
          <PolarAngleAxis type="number" domain={[0, max]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "var(--muted)" }} />
        </RadialBarChart>
      </ChartContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular font-display text-2xl font-bold" style={{ color }}>
          {value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
          <span className="text-base">{suffix}</span>
        </span>
        {label && <span className="text-[11px] text-muted-foreground">{label}</span>}
      </div>
    </div>
  )
}

/* Barras horizontais (ex.: comparação entre unidades) */
export function BarCompare({
  data,
  color = "var(--chart-1)",
  height = 240,
  colorByStatus,
}: {
  data: { nome: string; valor: number; status?: string }[]
  color?: string
  height?: number
  colorByStatus?: Record<string, string>
}) {
  const config: ChartConfig = { valor: { label: "Valor", color } }
  return (
    <ChartContainer config={config} style={{ height }} className="w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
        <XAxis type="number" hide tickFormatter={(v) => fmtMilhar(v as number)} />
        <YAxis type="category" dataKey="nome" width={88} tickLine={false} axisLine={false} fontSize={11} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="valor" radius={[0, 6, 6, 0]} barSize={16}>
          {data.map((d, i) => (
            <Cell key={i} fill={colorByStatus && d.status ? colorByStatus[d.status] ?? color : color} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
