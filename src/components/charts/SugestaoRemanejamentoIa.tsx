import { useState } from "react"
import { AlertTriangle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AnaliseIaPainel } from "@/components/shared/AnaliseIaPainel"
import { useAnaliseIaAuto } from "@/hooks/use-analise-ia"
import { mensagensRemanejamento } from "@/lib/ia-prompts"
import { coordenadasMunicipio } from "@/lib/municipios-ma"
import type { StatusEstoque } from "@/lib/estoque"

/** Dados de uma unidade para o insumo selecionado (entrada da sugestão). */
export interface UnidadeInsumo {
  sigla: string
  municipio: string
  status: StatusEstoque
  quantidade: number
  nivelCritico: number
  consumoMedioDiario: number
}

/** Distância aproximada (km) entre dois municípios via Haversine, ou null se faltar coordenada. */
function distanciaKm(origem: string, destino: string): number | null {
  const a = coordenadasMunicipio(origem)
  const b = coordenadasMunicipio(destino)
  if (!a || !b) return null
  const rad = (g: number) => (g * Math.PI) / 180
  const [lo1, la1] = a
  const [lo2, la2] = b
  const dLat = rad(la2 - la1)
  const dLon = rad(lo2 - lo1)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(la1)) * Math.cos(rad(la2)) * Math.sin(dLon / 2) ** 2
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)))
}

/** Monta o corpo enviado à IA: críticas, doadoras com excedente e distâncias entre elas. */
function montarCorpo(insumoNome: string, criticas: UnidadeInsumo[], doadoras: UnidadeInsumo[]): string {
  const linhasCriticas = criticas.map((u) => {
    const deficit = Math.max(0, u.nivelCritico - u.quantidade)
    return `- ${u.sigla} (${u.municipio}): ${u.quantidade} em estoque, nível crítico ${u.nivelCritico}, déficit ${deficit}, consumo ${u.consumoMedioDiario}/dia.`
  })
  const linhasDoadoras = doadoras.length
    ? doadoras.map(
        (u) => `- ${u.sigla} (${u.municipio}): ${u.quantidade} em estoque, excedente ${u.quantidade - u.nivelCritico}.`,
      )
    : ["- Nenhuma unidade da rede possui excedente disponível."]
  const linhasDistancias = criticas.map((c) => {
    const ordenadas = doadoras
      .map((d) => ({ sigla: d.sigla, km: distanciaKm(d.municipio, c.municipio) }))
      .filter((d): d is { sigla: string; km: number } => d.km != null)
      .sort((a, b) => a.km - b.km)
    const texto = ordenadas.length
      ? ordenadas.map((d) => `${d.sigla} a ${d.km} km`).join("; ")
      : "sem origem com excedente"
    return `- Para ${c.sigla} (${c.municipio}): ${texto}.`
  })
  return [
    `Insumo: ${insumoNome}.`,
    "",
    "Unidades em nível crítico (precisam receber):",
    ...linhasCriticas,
    "",
    "Unidades com excedente (podem enviar):",
    ...linhasDoadoras,
    "",
    "Distâncias aproximadas até cada unidade crítica:",
    ...linhasDistancias,
  ].join("\n")
}

interface Props {
  insumoNome: string
  unidades: UnidadeInsumo[]
}

/**
 * Abaixo do mapa, quando o insumo filtrado tem unidade(s) em nível crítico: aciona a IA para sugerir
 * o melhor remanejamento (origem por proximidade + excedente, quantidade a transferir). O cálculo de
 * críticas/doadoras/distâncias é feito aqui e enviado como contexto; a IA apenas recomenda.
 */
export function SugestaoRemanejamentoIa({ insumoNome, unidades }: Props) {
  const [solicitado, setSolicitado] = useState(false)

  const criticas = unidades.filter((u) => u.status === "critico")
  const doadoras = unidades
    .filter((u) => u.status === "ok" && u.quantidade - u.nivelCritico > 0)
    .sort((a, b) => b.quantidade - b.nivelCritico - (a.quantidade - a.nivelCritico))

  const corpo = montarCorpo(insumoNome, criticas, doadoras)
  // Sem auto-disparo (aberto=false): só geramos ao clicar, evitando chamadas à IA a cada troca.
  const estado = useAnaliseIaAuto(mensagensRemanejamento(corpo), false, null)

  if (criticas.length === 0) return null

  return (
    <div className="mt-4 space-y-3 border-t pt-4">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" />
        <p className="text-sm">
          <span className="font-semibold">{criticas.length}</span>{" "}
          {criticas.length === 1 ? "unidade" : "unidades"} com <span className="font-medium">{insumoNome}</span> em
          nível crítico
          {doadoras.length > 0
            ? ". A IA pode sugerir o melhor remanejamento por proximidade e excedente."
            : ". Sem excedente na rede — a IA pode orientar o ressuprimento central."}
        </p>
      </div>

      {!solicitado ? (
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => {
            setSolicitado(true)
            estado.gerar()
          }}
        >
          <Sparkles className="size-4" />
          Sugerir remanejamento com IA
        </Button>
      ) : (
        <AnaliseIaPainel
          carregando={estado.carregando}
          erro={estado.erro}
          analise={estado.analise}
          onTentarNovamente={estado.gerar}
        />
      )}
    </div>
  )
}
