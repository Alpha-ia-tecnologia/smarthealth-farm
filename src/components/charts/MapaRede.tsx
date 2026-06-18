import { useEffect, useId, useRef, useState } from "react"
import { MA_PATH, MA_VIEWBOX, projetarMA } from "@/components/charts/mapa-maranhao"
import { coordenadasMunicipio } from "@/lib/municipios-ma"
import type { StatusEstoque } from "@/lib/estoque"
import { cn } from "@/lib/utils"

/** Status de um ponto: condição de estoque ou "neutro" (sem filtro de insumo). */
type PontoStatus = StatusEstoque | "neutro"

const COR_STATUS: Record<PontoStatus, string> = {
  ok: "var(--success)",
  atencao: "var(--warning)",
  critico: "var(--danger)",
  neutro: "var(--muted-foreground)",
}
const ROTULO_STATUS: Record<PontoStatus, string> = {
  ok: "Adequado",
  atencao: "Atenção",
  critico: "Crítico",
  neutro: "Sem filtro de insumo",
}

const [, , W, H] = MA_VIEWBOX.split(" ").map(Number)

/** Um ponto no mapa: uma unidade, sua condição de estoque e os detalhes para o tooltip. */
export interface PontoMapa {
  unidadeId: string
  sigla: string
  nome: string
  municipio: string
  status: PontoStatus
  detalhes: { rotulo: string; valor: string }[]
}

interface Props {
  pontos: PontoMapa[]
  /** Unidade destacada no modo "filtro" (espelha o filtro da tela). */
  unidadeSelecionadaId?: string
  /** Clique num marcador → seleciona/limpa o filtro (modo filtro) ou define origem/destino (modo transferência). */
  onSelecionar?: (unidadeId: string | undefined) => void
  /** Modo transferência: unidade de origem (passar habilita o modo e desenha a seta). */
  origemId?: string
  /** Modo transferência: unidade de destino. */
  destinoId?: string
}

/** Calcula a seta (encurtada nas pontas) entre dois pinos. */
function calcularSeta(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const off = 15
  return { x1: a.x + ux * off, y1: a.y + uy * off, x2: b.x - ux * off, y2: b.y - uy * off }
}

/**
 * Mapa do Maranhão (contorno oficial IBGE em SVG) com um marcador por unidade, posicionado por
 * lat/long. A cor representa a condição de estoque (adequado/atenção/crítico) — ou neutra sem
 * filtro de insumo. Hover/foco mostra os detalhes (tooltip preso dentro do mapa, sem cortar).
 *
 * Dois modos: **filtro** (`unidadeSelecionadaId` + clique alterna o filtro) e **transferência**
 * (`origemId`/`destinoId` + clique define origem→destino, com seta animada entre elas).
 */
export function MapaRede({ pontos, unidadeSelecionadaId, onSelecionar, origemId, destinoId }: Props) {
  const [hoverId, setHoverId] = useState<string | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [largura, setLargura] = useState(0)
  const setaId = useId()

  // Mede a largura renderizada do mapa para posicionar o tooltip em px (sem estourar as bordas).
  useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(([e]) => setLargura(e.contentRect.width))
    ro.observe(el)
    setLargura(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  const ehTransfer = origemId !== undefined || destinoId !== undefined

  const pinos = pontos.flatMap((p) => {
    const c = coordenadasMunicipio(p.municipio)
    if (!c) return []
    const { x, y } = projetarMA(c[0], c[1])
    return [{ ...p, x, y }]
  })

  const ativa = pinos.find((p) => p.unidadeId === hoverId)
  const origem = pinos.find((p) => p.unidadeId === origemId)
  const destino = pinos.find((p) => p.unidadeId === destinoId)
  const seta = origem && destino && origem.unidadeId !== destino.unidadeId ? calcularSeta(origem, destino) : null
  const temStatus = pinos.some((p) => p.status !== "neutro")

  // Posição do tooltip: em px com clamp horizontal (não vaza); acima/abaixo conforme a latitude.
  let tip: { left: number; width: number; top: string; acima: boolean } | null = null
  if (ativa) {
    const TT_W = largura ? Math.min(208, Math.max(150, largura - 16)) : 208
    const markerPx = largura ? (ativa.x / W) * largura : 0
    const limite = (largura || TT_W + 12) - TT_W - 6
    const left = Math.max(6, Math.min(markerPx - TT_W / 2, limite))
    const yPct = (ativa.y / H) * 100
    const acima = yPct >= 45
    tip = { left, width: TT_W, top: acima ? `calc(${yPct}% - 16px)` : `calc(${yPct}% + 18px)`, acima }
  }

  return (
    <div ref={wrapRef} className="relative w-full">
      <svg
        viewBox={MA_VIEWBOX}
        className="mx-auto h-auto max-h-[60vh] w-full"
        role="img"
        aria-label="Mapa da rede EMSERH no Maranhão, por condição de estoque"
      >
        <path
          d={MA_PATH}
          className="fill-muted stroke-border"
          fillOpacity={0.5}
          strokeWidth={1.4}
          strokeLinejoin="round"
        />

        {/* Seta animada origem → destino (modo transferência) */}
        {seta && (
          <g className="pointer-events-none">
            <defs>
              <marker
                id={setaId}
                markerWidth={14}
                markerHeight={12}
                refX={11}
                refY={6}
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <path d="M0,0 L12,6 L0,12 Z" fill="var(--primary)" />
              </marker>
            </defs>
            <line
              x1={seta.x1}
              y1={seta.y1}
              x2={seta.x2}
              y2={seta.y2}
              stroke="var(--primary)"
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray="9 7"
              markerEnd={`url(#${setaId})`}
              className="seta-fluxo"
            />
          </g>
        )}

        {pinos.map((p) => {
          const cor = COR_STATUS[p.status]
          const ehOrigem = ehTransfer && p.unidadeId === origemId
          const ehDestino = ehTransfer && p.unidadeId === destinoId
          const paginaSelecionada = !ehTransfer && p.unidadeId === unidadeSelecionadaId
          const realcado = ehOrigem || ehDestino || paginaSelecionada
          const ativaId = p.unidadeId === hoverId
          const r = ativaId || realcado ? 11 : 9
          return (
            <g
              key={p.unidadeId}
              transform={`translate(${p.x} ${p.y})`}
              role="button"
              tabIndex={0}
              aria-label={`${p.sigla} — ${p.municipio}: ${ROTULO_STATUS[p.status]}`}
              className="cursor-pointer outline-none"
              onMouseEnter={() => setHoverId(p.unidadeId)}
              onMouseLeave={() => setHoverId((h) => (h === p.unidadeId ? null : h))}
              onFocus={() => setHoverId(p.unidadeId)}
              onBlur={() => setHoverId((h) => (h === p.unidadeId ? null : h))}
              onClick={() =>
                onSelecionar?.(ehTransfer ? p.unidadeId : paginaSelecionada ? undefined : p.unidadeId)
              }
            >
              {paginaSelecionada && (
                <circle r={15} fill={cor} fillOpacity={0.2} className="motion-safe:animate-ping" />
              )}
              {(ehOrigem || ehDestino) && (
                <circle r={14} fill="none" stroke="var(--primary)" strokeWidth={2.5} />
              )}
              <circle r={r} fill={cor} fillOpacity={0.22} stroke={cor} strokeWidth={1.6} />
              <circle r={ativaId || realcado ? 5 : 4} fill={cor} />
              {(ehOrigem || ehDestino) && (
                <text
                  y={-17}
                  textAnchor="middle"
                  fontSize={12}
                  className="fill-foreground font-semibold"
                  style={{ paintOrder: "stroke", stroke: "var(--background)", strokeWidth: 4, strokeLinejoin: "round" }}
                >
                  {ehOrigem ? "Origem" : "Destino"}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* Detalhe da unidade (apenas no hover/foco), preso dentro do mapa */}
      {ativa && tip && (
        <div
          className={cn(
            "pointer-events-none absolute z-20 rounded-lg border bg-popover p-3 text-popover-foreground shadow-md",
            tip.acima && "-translate-y-full",
          )}
          style={{ left: tip.left, top: tip.top, width: tip.width }}
        >
          <p className="text-sm font-semibold">
            {ativa.sigla} <span className="font-normal text-muted-foreground">· {ativa.municipio}</span>
          </p>
          <p className="truncate text-xs text-muted-foreground">{ativa.nome}</p>
          {ativa.detalhes.length > 0 && (
            <dl className="mt-2 space-y-1 text-xs">
              {ativa.detalhes.map((d) => (
                <div key={d.rotulo} className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">{d.rotulo}</dt>
                  <dd className="tabular font-medium">{d.valor}</dd>
                </div>
              ))}
            </dl>
          )}
          {ativa.status !== "neutro" && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ backgroundColor: COR_STATUS[ativa.status] }} />
              <span className="text-xs font-medium">Estoque {ROTULO_STATUS[ativa.status].toLowerCase()}</span>
            </div>
          )}
        </div>
      )}

      {/* Legenda das cores (quando há condição de estoque) ou dica (modo transferência sem insumo) */}
      {temStatus ? (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <Legenda cor="var(--success)" rotulo="Adequado" />
          <Legenda cor="var(--warning)" rotulo="Atenção" />
          <Legenda cor="var(--danger)" rotulo="Crítico" />
        </div>
      ) : (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Selecione um insumo para ver a condição do estoque por unidade.
        </p>
      )}
    </div>
  )
}

function Legenda({ cor, rotulo }: { cor: string; rotulo: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-2.5 rounded-full" style={{ backgroundColor: cor }} />
      {rotulo}
    </span>
  )
}
