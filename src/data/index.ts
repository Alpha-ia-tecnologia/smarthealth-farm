import type {
  Alerta,
  IndicadorMeta,
  Lote,
  LogAuditoria,
  Medicamento,
  Movimentacao,
  PontoSerie,
  PosicaoEstoque,
  Previsao,
  Recomendacao,
  Unidade,
  Usuario,
} from "@/types"
import { medicamentos } from "./medicines"
import { unidades, unidadesAtendidas } from "./units"

export { medicamentos, familiasTerapeuticas } from "./medicines"
export { unidades, unidadesAtendidas } from "./units"

export const HOJE = "2026-06-08"

// ----- PRNG determinístico (mulberry32) p/ dados reprodutíveis -----
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// 12 meses históricos + 3 de previsão
const MESES = [
  "2025-06", "2025-07", "2025-08", "2025-09", "2025-10", "2025-11",
  "2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05",
]
const MESES_PREVISAO = ["2026-06", "2026-07", "2026-08"]
export const rotuloMes: Record<string, string> = {
  "2025-06": "Jun/25", "2025-07": "Jul/25", "2025-08": "Ago/25",
  "2025-09": "Set/25", "2025-10": "Out/25", "2025-11": "Nov/25",
  "2025-12": "Dez/25", "2026-01": "Jan/26", "2026-02": "Fev/26",
  "2026-03": "Mar/26", "2026-04": "Abr/26", "2026-05": "Mai/26",
  "2026-06": "Jun/26", "2026-07": "Jul/26", "2026-08": "Ago/26",
}

// Sazonalidade epidemiológica (RF-DAD-05): pico chuvoso jan-abr no MA
const sazonalidade: Record<string, number> = {
  "2025-06": 0.92, "2025-07": 0.9, "2025-08": 0.94, "2025-09": 1.0,
  "2025-10": 1.05, "2025-11": 1.12, "2025-12": 1.2, "2026-01": 1.35,
  "2026-02": 1.42, "2026-03": 1.38, "2026-04": 1.22, "2026-05": 1.05,
  "2026-06": 0.95, "2026-07": 0.92, "2026-08": 0.95,
}

const medById = new Map(medicamentos.map((m) => [m.id, m]))
const uniById = new Map(unidades.map((u) => [u.id, u]))
export const getMedicamento = (id: string) => medById.get(id)
export const getUnidade = (id: string) => uniById.get(id)

function baseDemanda(med: Medicamento, uni: Unidade) {
  const porte = uni.porte === "Grande" ? 1 : uni.porte === "Médio" ? 0.55 : 0.3
  const base =
    med.familia === "Insumos Médicos" ? 4200 :
    med.familia === "Soros e Vacinas" ? 1800 :
    med.criticidade === "Alta" ? 900 : 1400
  return Math.round(base * porte)
}

// ---------------- Séries / Previsões (RF-PRV) ----------------
function gerarSerie(med: Medicamento, uni: Unidade): PontoSerie[] {
  const r = rng(hash(med.id + uni.id))
  const base = baseDemanda(med, uni)
  const tendencia = 1 + (r() - 0.4) * 0.15
  const pts: PontoSerie[] = []

  // Histórico: realizado x previsto (in-sample) — base do comparativo.
  MESES.forEach((m, i) => {
    const ruido = 1 + (r() - 0.5) * 0.18
    const acc = base * Math.pow(tendencia, i / 12)
    const realizado = Math.round(acc * sazonalidade[m] * ruido)
    const previsto = Math.round(realizado * (1 + (r() - 0.5) * 0.14))
    pts.push({ periodo: m, realizado, previsto })
  })

  // Previsão futura: continuação suave do previsto (sem realizado ainda).
  let prev = pts[pts.length - 1].previsto as number
  let prevSaz = sazonalidade[MESES[MESES.length - 1]]
  MESES_PREVISAO.forEach((m) => {
    const previsto = Math.round(prev * (sazonalidade[m] / prevSaz) * (1 + (r() - 0.5) * 0.05))
    pts.push({ periodo: m, realizado: null, previsto })
    prev = previsto
    prevSaz = sazonalidade[m]
  })
  return pts
}

// Descrição comum apresentada ao usuário (a composição técnica do ensemble
// fica detalhada no painel "Estratégia de modelagem").
const MODELO_PADRAO = "Modelo preditivo híbrido"

export const previsoes: Previsao[] = []
for (const med of medicamentos) {
  for (const uni of unidadesAtendidas) {
    const r = rng(hash("prev" + med.id + uni.id))
    const serie = gerarSerie(med, uni)
    const mapeBase =
      med.criticidade === "Alta" ? 6 + r() * 6 : 9 + r() * 10
    previsoes.push({
      id: `pv-${med.id}-${uni.id}`,
      medicamentoId: med.id,
      unidadeId: uni.id,
      horizonteMeses: 3,
      mape: Math.round(mapeBase * 10) / 10,
      modelo: MODELO_PADRAO,
      versaoModelo: `v${2 + Math.floor(r() * 3)}.${Math.floor(r() * 9)}`,
      drift: r() > 0.85 ? "Degradado" : r() > 0.7 ? "Atenção" : "Estável",
      serie,
      atualizadoEm: "2026-06-01",
    })
  }
}

export const getPrevisao = (medId: string, uniId: string) =>
  previsoes.find((p) => p.medicamentoId === medId && p.unidadeId === uniId)

// ---------------- Estoque, Lotes, Movimentações (RF-EST) ----------------
const fabricantes = ["Eurofarma", "Hipolabor", "Blau", "Cristália", "Halex Istar", "Teuto", "União Química"]

export const posicoes: PosicaoEstoque[] = []
export const lotes: Lote[] = []
export const movimentacoes: Movimentacao[] = []

let loteSeq = 1
let movSeq = 1
for (const med of medicamentos) {
  for (const uni of unidadesAtendidas) {
    const r = rng(hash("est" + med.id + uni.id))
    const prev = getPrevisao(med.id, uni.id)!
    const ultimoPrevisto =
      prev.serie.find((p) => p.periodo === "2026-06")?.previsto ?? 500
    const consumoDiario = Math.max(1, Math.round((ultimoPrevisto / 30) * (0.9 + r() * 0.2)))
    const lead = Math.round(7 + r() * 22)
    const nivelCritico = Math.round(consumoDiario * (lead + 5))
    const estoqueMaximo = Math.round(consumoDiario * 60)
    // distribuição: alguns em desabastecimento, alguns saudáveis
    const fator = r()
    const quantidade =
      fator < 0.18 ? Math.round(nivelCritico * (0.2 + r() * 0.5)) // crítico
      : fator < 0.32 ? Math.round(nivelCritico * (1 + r() * 0.2)) // atenção
      : Math.round(nivelCritico * (1.4 + r() * 1.4))
    posicoes.push({
      medicamentoId: med.id,
      unidadeId: uni.id,
      quantidade,
      nivelCritico,
      estoqueMaximo,
      consumoMedioDiario: consumoDiario,
      tempoMedioRessuprimentoDias: lead,
    })
    // 1-2 lotes por posição
    const nLotes = 1 + Math.floor(r() * 2)
    let restante = quantidade
    for (let k = 0; k < nLotes; k++) {
      const qLote = k === nLotes - 1 ? restante : Math.round(restante * (0.4 + r() * 0.3))
      restante -= qLote
      // validade: alguns próximos do vencimento
      const venc = r()
      const mesesValidade = venc < 0.2 ? 1 : venc < 0.35 ? 2 : 4 + Math.floor(r() * 18)
      const validade = addMeses("2026-06", mesesValidade)
      const loteId = `L-${String(loteSeq++).padStart(5, "0")}`
      lotes.push({
        id: loteId,
        medicamentoId: med.id,
        unidadeId: uni.id,
        numeroLote: `${med.id.slice(2)}${uni.sigla}${1000 + Math.floor(r() * 8999)}`,
        validade,
        quantidade: Math.max(0, qLote),
        fabricante: fabricantes[Math.floor(r() * fabricantes.length)],
      })
      // movimentações do lote
      const nMov = 2 + Math.floor(r() * 3)
      for (let j = 0; j < nMov; j++) {
        const tipo = j === 0 ? "Entrada" : r() > 0.8 ? "Transferência" : "Saída"
        movimentacoes.push({
          id: `MV-${String(movSeq++).padStart(6, "0")}`,
          loteId,
          medicamentoId: med.id,
          unidadeId: uni.id,
          tipo: tipo as Movimentacao["tipo"],
          quantidade: Math.round(qLote * (0.1 + r() * 0.4)),
          data: `2026-0${3 + Math.floor(r() * 3)}-${String(1 + Math.floor(r() * 27)).padStart(2, "0")}T${String(
            8 + Math.floor(r() * 9),
          ).padStart(2, "0")}:${String(Math.floor(r() * 59)).padStart(2, "0")}:00`,
          responsavel: ["A. Sousa", "M. Lima", "R. Costa", "J. Pereira", "C. Mendes"][Math.floor(r() * 5)],
          documento: `NF-${10000 + Math.floor(r() * 89999)}`,
        })
      }
    }
  }
}

function addMeses(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number)
  const total = (y * 12 + (m - 1)) + n
  const ny = Math.floor(total / 12)
  const nm = (total % 12) + 1
  const dia = 5 + ((y + m + n) % 23)
  return `${ny}-${String(nm).padStart(2, "0")}-${String(dia).padStart(2, "0")}`
}

export const getPosicao = (medId: string, uniId: string) =>
  posicoes.find((p) => p.medicamentoId === medId && p.unidadeId === uniId)

export function statusEstoque(p: PosicaoEstoque): "critico" | "atencao" | "ok" {
  if (p.quantidade < p.nivelCritico) return "critico"
  if (p.quantidade < p.nivelCritico * 1.25) return "atencao"
  return "ok"
}

// dias até vencer (a partir de HOJE)
export function diasAte(dataISO: string): number {
  const [y, m, d] = dataISO.split("T")[0].split("-").map(Number)
  const [hy, hm, hd] = HOJE.split("-").map(Number)
  const a = Date.UTC(y, m - 1, d)
  const b = Date.UTC(hy, hm - 1, hd)
  return Math.round((a - b) / 86400000)
}

// ---------------- Alertas (RF-ALE) ----------------
export const alertas: Alerta[] = []
let alSeq = 1
for (const p of posicoes) {
  const med = getMedicamento(p.medicamentoId)!
  const uni = getUnidade(p.unidadeId)!
  if (statusEstoque(p) === "critico" && med.essencial) {
    const dias = Math.max(1, Math.round(p.quantidade / p.consumoMedioDiario))
    alertas.push({
      id: `AL-${String(alSeq++).padStart(4, "0")}`,
      tipo: "Desabastecimento",
      severidade: dias <= 5 ? "Crítico" : dias <= 10 ? "Alto" : "Médio",
      medicamentoId: med.id,
      unidadeId: uni.id,
      mensagem: `Cobertura de ${dias} dia(s) — abaixo do estoque mínimo (${p.nivelCritico} ${med.unidadeMedida}).`,
      criadoEm: `2026-06-0${1 + (alSeq % 7)}T07:30:00`,
      status: alSeq % 5 === 0 ? "Em tratamento" : "Aberto",
      destinatarios: ["Operador", "Gestor"],
      diasParaEvento: dias,
    })
  }
}
for (const lote of lotes) {
  const dias = diasAte(lote.validade)
  if (dias <= 60 && lote.quantidade > 0) {
    const med = getMedicamento(lote.medicamentoId)!
    alertas.push({
      id: `AL-${String(alSeq++).padStart(4, "0")}`,
      tipo: "Vencimento",
      severidade: dias <= 20 ? "Crítico" : dias <= 40 ? "Alto" : "Médio",
      medicamentoId: lote.medicamentoId,
      unidadeId: lote.unidadeId,
      mensagem: `Lote ${lote.numeroLote} (${lote.quantidade} ${med.unidadeMedida}) vence em ${dias} dia(s).`,
      criadoEm: `2026-06-0${1 + (alSeq % 7)}T09:10:00`,
      status: "Aberto",
      destinatarios: ["Operador"],
      loteId: lote.id,
      diasParaEvento: dias,
    })
  }
}
alertas.sort((a, b) => (a.diasParaEvento ?? 0) - (b.diasParaEvento ?? 0))

// ---------------- Recomendações (RF-REC) ----------------
export const recomendacoes: Recomendacao[] = []
let recSeq = 1
// Redistribuição: medicamento crítico em uma unidade, excedente em outra
for (const med of medicamentos.filter((m) => m.essencial).slice(0, 18)) {
  const posMed = posicoes.filter((p) => p.medicamentoId === med.id)
  const criticos = posMed.filter((p) => statusEstoque(p) === "critico")
  const excedentes = posMed
    .filter((p) => p.quantidade > p.nivelCritico * 2)
    .sort((a, b) => b.quantidade - a.quantidade)
  if (criticos.length && excedentes.length) {
    const destino = criticos[0]
    const origem = excedentes[0]
    if (origem.unidadeId !== destino.unidadeId) {
      const qtd = Math.round((destino.nivelCritico * 1.5 - destino.quantidade) || destino.nivelCritico)
      recomendacoes.push({
        id: `RC-${String(recSeq++).padStart(4, "0")}`,
        tipo: "Redistribuição",
        medicamentoId: med.id,
        unidadeDestinoId: destino.unidadeId,
        unidadeOrigemId: origem.unidadeId,
        quantidade: Math.max(10, qtd),
        justificativa: `${getUnidade(destino.unidadeId)!.sigla} abaixo do estoque mínimo; ${getUnidade(origem.unidadeId)!.sigla} com excedente. Transferência evita compra emergencial.`,
        origemMotor: recSeq % 3 === 0 ? "Aprendizado de Máquina" : "Regras",
        prioridade: "Essencial",
        economiaEstimada: Math.round(qtd * (12 + (recSeq % 9))),
        status: recSeq % 4 === 0 ? "Aprovada" : "Pendente",
        criadoEm: `2026-06-0${1 + (recSeq % 6)}T08:00:00`,
      })
    }
  }
}
// Reposição: dimensionada pela previsão
for (const p of posicoes.filter((p) => statusEstoque(p) !== "ok").slice(0, 22)) {
  const med = getMedicamento(p.medicamentoId)!
  const qtd = Math.max(20, p.estoqueMaximo - p.quantidade)
  recomendacoes.push({
    id: `RC-${String(recSeq++).padStart(4, "0")}`,
    tipo: "Reposição",
    medicamentoId: med.id,
    unidadeDestinoId: p.unidadeId,
    quantidade: qtd,
    justificativa: `Previsão de demanda indica reposição de ${qtd} ${med.unidadeMedida} para cobrir o horizonte de 30 dias e restaurar o nível de segurança.`,
    origemMotor: "Regras",
    prioridade: med.criticidade === "Alta" ? "Essencial" : "Importante",
    economiaEstimada: Math.round(qtd * (3 + (recSeq % 5))),
    status: recSeq % 5 === 0 ? "Executada" : "Pendente",
    criadoEm: `2026-06-0${1 + (recSeq % 6)}T08:30:00`,
  })
}

// ---------------- Indicadores (RF-IND) ----------------
function serieIndicador(base: number, alvo: number, seed: number) {
  const r = rng(seed)
  return MESES.map((m, i) => {
    const t = i / (MESES.length - 1)
    const valor = base + (alvo - base) * t * (0.7 + r() * 0.5)
    return { periodo: m, valor: Math.round(valor * 10) / 10 }
  })
}

export const indicadores: IndicadorMeta[] = [
  {
    id: "ind-ruptura",
    nome: "Taxa de desabastecimento de essenciais",
    unidade: "%",
    baseline: 18.4,
    atual: 11.2,
    meta: 11.96,
    metaReducaoPct: 35,
    melhorMenor: true,
    historico: serieIndicador(18.4, 11.2, 11),
  },
  {
    id: "ind-vencimento",
    nome: "Perdas por vencimento",
    unidade: "%",
    baseline: 6.1,
    atual: 4.3,
    meta: 4.58,
    metaReducaoPct: 25,
    melhorMenor: true,
    historico: serieIndicador(6.1, 4.3, 22),
  },
  {
    id: "ind-emergencial",
    nome: "Compras emergenciais",
    unidade: "R$ mil",
    baseline: 1240,
    atual: 812,
    meta: 868,
    metaReducaoPct: 30,
    melhorMenor: true,
    historico: serieIndicador(1240, 812, 33),
  },
  {
    id: "ind-mape",
    nome: "Assertividade da previsão (MAPE)",
    unidade: "%",
    baseline: 22.0,
    atual: 11.8,
    meta: 15,
    metaReducaoPct: 0,
    melhorMenor: true,
    historico: serieIndicador(22, 11.8, 44),
  },
  {
    id: "ind-ressuprimento",
    nome: "Tempo médio de ressuprimento",
    unidade: "dias",
    baseline: 19.5,
    atual: 13.7,
    meta: 14,
    metaReducaoPct: 0,
    melhorMenor: true,
    historico: serieIndicador(19.5, 13.7, 55),
  },
  {
    id: "ind-rupturas-evitadas",
    nome: "Desabastecimentos evitados (acum.)",
    unidade: "un",
    baseline: 0,
    atual: 147,
    meta: 120,
    metaReducaoPct: 0,
    melhorMenor: false,
    historico: serieIndicador(0, 147, 66),
  },
]

export const getIndicador = (id: string) => indicadores.find((i) => i.id === id)

// ---------------- Segurança / Auditoria (RF-SEG) ----------------
const acoesAudit = [
  { acao: "Aprovou recomendação de redistribuição", recurso: "RC-0003", ia: true, base: "Execução de contrato (art. 7º, V)" },
  { acao: "Exportou relatório estratégico (PDF)", recurso: "Relatório CAHOSP Q2", ia: false, base: "Legítimo interesse (art. 7º, IX)" },
  { acao: "Recalibrou modelo de previsão", recurso: "Previsão m-002@HRI", ia: true, base: "Execução de contrato" },
  { acao: "Alterou limiar de alerta de desabastecimento", recurso: "Parâmetro ALE-desabastecimento", ia: false, base: "Execução de contrato" },
  { acao: "Inferência via AI Gateway (dados anonimizados)", recurso: "AI Gateway · DeepSeek", ia: true, base: "Anonimização (art. 12)" },
  { acao: "Cadastrou novo usuário", recurso: "usuario:operador", ia: false, base: "Execução de contrato" },
  { acao: "Consultou histórico de lote", recurso: "L-00231", ia: false, base: "Controle sanitário" },
]
export const logsAuditoria: LogAuditoria[] = Array.from({ length: 40 }, (_, i) => {
  const r = rng(hash("log" + i))
  const a = acoesAudit[i % acoesAudit.length]
  const perfis: LogAuditoria["perfil"][] = ["Gestor", "Operador", "TI"]
  return {
    id: `LG-${String(1000 + i)}`,
    data: `2026-06-0${1 + (i % 7)}T${String(8 + (i % 10)).padStart(2, "0")}:${String((i * 7) % 59).padStart(2, "0")}:00`,
    usuario: ["Ana Sousa", "Marcos Lima", "Rita Costa", "João Pereira", "Carla Mendes"][i % 5],
    perfil: perfis[i % 3],
    acao: a.acao,
    recurso: a.recurso,
    baseLegal: a.base,
    assistidoPorIA: a.ia,
    ip: `10.${Math.floor(r() * 255)}.${Math.floor(r() * 255)}.${Math.floor(r() * 255)}`,
  }
})

// ---------------- Usuários (RF-ADM) ----------------
export const usuarios: Usuario[] = [
  { id: "us-1", nome: "Ana Sousa", email: "ana.sousa@emserh.ma.gov.br", perfil: "Gestor", unidadeId: "u-cahosp", ativo: true, ultimoAcesso: "2026-06-08T07:42:00" },
  { id: "us-2", nome: "Marcos Lima", email: "marcos.lima@emserh.ma.gov.br", perfil: "Operador", unidadeId: "u-htm", ativo: true, ultimoAcesso: "2026-06-08T06:58:00" },
  { id: "us-3", nome: "Rita Costa", email: "rita.costa@emserh.ma.gov.br", perfil: "Operador", unidadeId: "u-imperatriz", ativo: true, ultimoAcesso: "2026-06-07T17:20:00" },
  { id: "us-4", nome: "João Pereira", email: "joao.pereira@emserh.ma.gov.br", perfil: "TI", ativo: true, ultimoAcesso: "2026-06-08T05:10:00" },
  { id: "us-5", nome: "Carla Mendes", email: "carla.mendes@emserh.ma.gov.br", perfil: "Gestor", unidadeId: "u-caxias", ativo: true, ultimoAcesso: "2026-06-06T14:33:00" },
  { id: "us-6", nome: "Pedro Rocha", email: "pedro.rocha@emserh.ma.gov.br", perfil: "Operador", unidadeId: "u-balsas", ativo: false, ultimoAcesso: "2026-05-28T09:00:00" },
]

// ---------------- Agregações p/ dashboards ----------------
export function resumoUnidade(uniId: string) {
  const pos = posicoes.filter((p) => p.unidadeId === uniId)
  const criticos = pos.filter((p) => statusEstoque(p) === "critico").length
  const atencao = pos.filter((p) => statusEstoque(p) === "atencao").length
  const alertasAtivos = alertas.filter((a) => a.unidadeId === uniId && a.status !== "Resolvido").length
  const cobertura = Math.round(
    (pos.filter((p) => statusEstoque(p) === "ok").length / Math.max(1, pos.length)) * 100,
  )
  return { criticos, atencao, alertasAtivos, cobertura, itens: pos.length }
}

export const totais = {
  itens: medicamentos.length,
  unidades: unidadesAtendidas.length,
  alertasAbertos: alertas.filter((a) => a.status === "Aberto").length,
  alertasRuptura: alertas.filter((a) => a.tipo === "Desabastecimento" && a.status !== "Resolvido").length,
  alertasVencimento: alertas.filter((a) => a.tipo === "Vencimento" && a.status !== "Resolvido").length,
  recomendacoesPendentes: recomendacoes.filter((r) => r.status === "Pendente").length,
  economiaPotencial: recomendacoes.reduce((s, r) => s + r.economiaEstimada, 0),
  itensCriticos: posicoes.filter((p) => statusEstoque(p) === "critico").length,
  lotesProximosVencimento: lotes.filter((l) => l.quantidade > 0 && diasAte(l.validade) <= 60).length,
}

// série agregada de demanda (todas unidades) para o medicamento mais crítico — dashboard
export function serieAgregada(medId: string): PontoSerie[] {
  const sub = previsoes.filter((p) => p.medicamentoId === medId)
  const mapa = new Map<string, PontoSerie>()
  for (const pv of sub) {
    for (const pt of pv.serie) {
      const cur = mapa.get(pt.periodo) ?? {
        periodo: pt.periodo,
        realizado: 0,
        previsto: 0,
        limiteInferior: 0,
        limiteSuperior: 0,
      }
      cur.realizado = pt.realizado == null ? cur.realizado : (cur.realizado ?? 0) + pt.realizado
      cur.previsto = pt.previsto == null ? cur.previsto : (cur.previsto ?? 0) + pt.previsto
      cur.limiteInferior = (cur.limiteInferior ?? 0) + (pt.limiteInferior ?? 0)
      cur.limiteSuperior = (cur.limiteSuperior ?? 0) + (pt.limiteSuperior ?? 0)
      mapa.set(pt.periodo, cur)
    }
  }
  return [...MESES, ...MESES_PREVISAO].map((m) => {
    const v = mapa.get(m)!
    return {
      periodo: m,
      realizado: v.realizado || null,
      previsto: v.previsto || null,
      limiteInferior: v.limiteInferior || null,
      limiteSuperior: v.limiteSuperior || null,
    }
  })
}
