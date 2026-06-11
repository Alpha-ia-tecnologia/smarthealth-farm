import { http, HttpResponse } from "msw"
import type { Medicamento, Unidade, Usuario } from "@/types"
import type {
  Lote,
  Movimentacao,
  PosicaoEstoque,
  PosicaoEstoqueDetalhe,
  ResumoEstoque,
} from "@/lib/estoque"
import type { Alerta, LimiarAlerta, ResumoAlertas } from "@/lib/alertas"
import type {
  Previsao,
  PrevisaoDetalhe,
  ResumoPrevisao,
} from "@/lib/previsoes"

/** Usuário padrão devolvido pelos handlers de sucesso. */
export const usuarioTeste: Usuario = {
  id: "11111111-1111-1111-1111-111111111111",
  nome: "Ana Sousa",
  email: "ana@cahosp.local",
  perfil: "Gestor",
  ativo: true,
  ultimoAcesso: "2026-06-10T12:00:00Z",
}

/** Unidades de teste: uma central (hub) e duas atendidas. */
export const unidadesTeste: Unidade[] = [
  {
    id: "uni-cahosp",
    nome: "CAHOSP — Central",
    sigla: "CAHOSP",
    municipio: "São Luís",
    porte: "Grande",
    leitos: 0,
    conectividade: "Estável",
    perfilDemografico: "Hub logístico",
    hub: true,
    ativo: true,
  },
  {
    id: "uni-hto",
    nome: "Hospital de Traumatologia e Ortopedia",
    sigla: "HTO",
    municipio: "São Luís",
    porte: "Grande",
    leitos: 320,
    conectividade: "Estável",
    perfilDemografico: "Trauma",
    hub: false,
    ativo: true,
  },
  {
    id: "uni-hri",
    nome: "Hospital Regional de Imperatriz",
    sigla: "HRI",
    municipio: "Imperatriz",
    porte: "Grande",
    leitos: 280,
    conectividade: "Intermitente",
    perfilDemografico: "Referência regional",
    hub: false,
    ativo: true,
  },
]

/** Medicamentos de teste. */
export const medicamentosTeste: Medicamento[] = [
  {
    id: "med-001",
    codigo: "MED-001",
    nome: "Ceftriaxona 1g",
    apresentacao: "Frasco-ampola",
    familia: "Antibióticos",
    unidadeMedida: "fa",
    criticidade: "Alta",
    essencial: true,
    ativo: true,
  },
  {
    id: "med-002",
    codigo: "MED-002",
    nome: "Dipirona 500mg/mL",
    apresentacao: "Ampola 2mL",
    familia: "Analgésicos",
    unidadeMedida: "amp",
    criticidade: "Média",
    essencial: true,
    ativo: true,
  },
]

/** Posições de estoque de teste (uma crítica, uma ok). */
export const posicoesTeste: PosicaoEstoque[] = [
  {
    id: "pos-1",
    medicamentoId: "med-001",
    medicamentoCodigo: "MED-001",
    medicamentoNome: "Ceftriaxona 1g",
    unidadeId: "uni-hto",
    unidadeSigla: "HTO",
    unidadeNome: "Hospital de Traumatologia e Ortopedia",
    quantidade: 120,
    nivelCritico: 200,
    estoqueMaximo: 600,
    consumoMedioDiario: 10,
    tempoMedioRessuprimentoDias: 15,
    status: "critico",
  },
  {
    id: "pos-2",
    medicamentoId: "med-002",
    medicamentoCodigo: "MED-002",
    medicamentoNome: "Dipirona 500mg/mL",
    unidadeId: "uni-hri",
    unidadeSigla: "HRI",
    unidadeNome: "Hospital Regional de Imperatriz",
    quantidade: 800,
    nivelCritico: 300,
    estoqueMaximo: 900,
    consumoMedioDiario: 12,
    tempoMedioRessuprimentoDias: 9,
    status: "ok",
  },
]

export const resumoEstoqueTeste: ResumoEstoque = {
  itensCriticos: 1,
  lotesProximosVencimento: 3,
  tempoMedioRessuprimentoDias: 12,
  totalUnidadesEstoque: 920,
}

export const lotesTeste: Lote[] = [
  {
    id: "lote-1",
    medicamentoId: "med-001",
    medicamentoNome: "Ceftriaxona 1g",
    unidadeId: "uni-hto",
    unidadeSigla: "HTO",
    numeroLote: "CFX-1001",
    validade: "2026-06-25",
    diasParaVencer: 15,
    quantidade: 40,
    fabricante: "Blau",
  },
  {
    id: "lote-2",
    medicamentoId: "med-002",
    medicamentoNome: "Dipirona 500mg/mL",
    unidadeId: "uni-hri",
    unidadeSigla: "HRI",
    numeroLote: "DIP-2002",
    validade: "2026-08-01",
    diasParaVencer: 52,
    quantidade: 200,
    fabricante: "Teuto",
  },
]

export const movimentacoesTeste: Movimentacao[] = [
  {
    id: "mov-1",
    loteId: "lote-1",
    numeroLote: "CFX-1001",
    medicamentoId: "med-001",
    medicamentoNome: "Ceftriaxona 1g",
    unidadeId: "uni-hto",
    unidadeSigla: "HTO",
    tipo: "Entrada",
    quantidade: 40,
    dataHora: "2026-06-01T08:30:00Z",
    responsavel: "A. Sousa",
    documento: "NF-12345",
  },
]

export const detalheEstoqueTeste: PosicaoEstoqueDetalhe = {
  posicao: posicoesTeste[0],
  lotes: [lotesTeste[0]],
  movimentacoes: movimentacoesTeste,
}

/** Alertas de teste: um aberto (desabastecimento) e um em tratamento (vencimento). */
export const alertasTeste: Alerta[] = [
  {
    id: "ale-1",
    tipo: "Desabastecimento",
    severidade: "Crítico",
    medicamentoId: "med-001",
    medicamentoCodigo: "MED-001",
    medicamentoNome: "Ceftriaxona 1g",
    unidadeId: "uni-hto",
    unidadeSigla: "HTO",
    unidadeNome: "Hospital de Traumatologia e Ortopedia",
    mensagem: "Cobertura de 3 dia(s) — abaixo do estoque mínimo (200 fa).",
    status: "Aberto",
    destinatarios: ["Operador", "Gestor"],
    loteId: null,
    numeroLote: null,
    diasParaEvento: 3,
    criadoEm: "2026-06-10T08:00:00Z",
  },
  {
    id: "ale-2",
    tipo: "Vencimento",
    severidade: "Alto",
    medicamentoId: "med-002",
    medicamentoCodigo: "MED-002",
    medicamentoNome: "Dipirona 500mg/mL",
    unidadeId: "uni-hri",
    unidadeSigla: "HRI",
    unidadeNome: "Hospital Regional de Imperatriz",
    mensagem: "Lote DIP-2002 (200 amp) vence em 30 dia(s).",
    status: "Em tratamento",
    destinatarios: ["Operador"],
    loteId: "lote-2",
    numeroLote: "DIP-2002",
    diasParaEvento: 30,
    criadoEm: "2026-06-09T10:00:00Z",
  },
]

export const resumoAlertasTeste: ResumoAlertas = {
  ativos: 15, // abertos(12) + emTratamento(3) = desabastecimento(6) + vencimento(9)
  abertos: 12,
  emTratamento: 3,
  desabastecimento: 6,
  vencimento: 9,
  criticos: 4,
  resolvidos: 38, // ativos(15) + resolvidos(38) = total(53)
  total: 53,
}

export const limiaresTeste: LimiarAlerta = {
  percentualEstoqueMinimo: 100,
  coberturaCriticaDias: 5,
  coberturaAltaDias: 10,
  antecedenciaVencimentoDias: 60,
  vencimentoCriticoDias: 20,
  vencimentoAltoDias: 40,
  desabastecimentoAtivo: true,
  vencimentoAtivo: true,
  atualizadoEm: "2026-06-10T12:00:00Z",
}

/** Previsões de teste: uma crítica dentro da meta (estável) e uma fora da meta (degradada). */
export const previsoesTeste: Previsao[] = [
  {
    id: "pv-1",
    medicamentoId: "med-001",
    medicamentoCodigo: "MED-001",
    medicamentoNome: "Ceftriaxona 1g",
    criticidade: "Alta",
    unidadeId: "uni-hto",
    unidadeSigla: "HTO",
    unidadeNome: "Hospital de Traumatologia e Ortopedia",
    horizonteMeses: 3,
    mape: 7.4,
    modelo: "Modelo preditivo híbrido",
    versaoModelo: "v4.2",
    drift: "Estável",
    calibradoEm: "2026-06-01",
  },
  {
    id: "pv-2",
    medicamentoId: "med-002",
    medicamentoCodigo: "MED-002",
    medicamentoNome: "Dipirona 500mg/mL",
    criticidade: "Média",
    unidadeId: "uni-hri",
    unidadeSigla: "HRI",
    unidadeNome: "Hospital Regional de Imperatriz",
    horizonteMeses: 3,
    mape: 18.2,
    modelo: "Modelo preditivo híbrido",
    versaoModelo: "v4.1",
    drift: "Degradado",
    calibradoEm: "2026-05-15",
  },
]

export const detalhePrevisaoTeste: PrevisaoDetalhe = {
  previsao: previsoesTeste[0],
  serie: [
    { periodo: "2026-04", realizado: 520, previsto: 500, limiteInferior: 470, limiteSuperior: 530 },
    { periodo: "2026-05", realizado: 560, previsto: 545, limiteInferior: 515, limiteSuperior: 575 },
    { periodo: "2026-06", realizado: null, previsto: 590, limiteInferior: 555, limiteSuperior: 625 },
  ],
}

export const resumoPrevisaoTeste: ResumoPrevisao = {
  mapeMedio: 12.8,
  criticosNaMeta: 1,
  totalCriticos: 1,
  previsoesAtivas: 2,
  itensComDesvio: 1,
}

/** Monta o envelope de sucesso da API (`{ success, data, total? }`). */
export function ok<T>(data: T, total?: number) {
  return total === undefined
    ? { success: true, data }
    : { success: true, data, total }
}

/** Envelope paginado: fatia `itens` por `page`/`size` da URL e devolve o total do conjunto. */
export function paginar<T>(request: Request, itens: T[]) {
  const url = new URL(request.url)
  const page = Number(url.searchParams.get("page") ?? "0")
  const size = Number(url.searchParams.get("size") ?? "20")
  return ok(itens.slice(page * size, page * size + size), itens.length)
}

/** Monta o envelope de erro da API (`{ success: false, error, codigo }`). */
export function erro(mensagem: string, codigo: string) {
  return { success: false, error: mensagem, codigo }
}

/**
 * Handlers padrão (caminho feliz). Casos de erro são definidos por teste via `server.use(...)`.
 * Os caminhos usam curinga inicial para casar com qualquer base URL configurada.
 */
export const handlers = [
  http.post("*/auth/login", () =>
    HttpResponse.json(ok({ usuario: usuarioTeste, token: "jwt-de-teste" })),
  ),
  http.get("*/auth/me", () => HttpResponse.json(ok(usuarioTeste))),
  http.post("*/auth/logout", () =>
    HttpResponse.json(ok("Logout efetuado. Descarte o token no cliente.")),
  ),
  http.get("*/unidades", () => HttpResponse.json(ok(unidadesTeste, unidadesTeste.length))),
  http.get("*/medicamentos", () =>
    HttpResponse.json(ok(medicamentosTeste, medicamentosTeste.length)),
  ),
  // Estoque — específicos antes do genérico (resumo e detalhe vs. lista).
  http.get("*/estoque/resumo", () => HttpResponse.json(ok(resumoEstoqueTeste))),
  http.get("*/estoque/:medicamentoId/:unidadeId", () =>
    HttpResponse.json(ok(detalheEstoqueTeste)),
  ),
  http.get("*/estoque", ({ request }) => HttpResponse.json(paginar(request, posicoesTeste))),
  http.get("*/lotes", ({ request }) => HttpResponse.json(paginar(request, lotesTeste))),
  // Alertas — específicos antes do genérico.
  http.get("*/alertas/resumo", () => HttpResponse.json(ok(resumoAlertasTeste))),
  http.get("*/alertas/limiares", () => HttpResponse.json(ok(limiaresTeste))),
  http.put("*/alertas/limiares", async ({ request }) => {
    const corpo = (await request.json()) as Record<string, unknown>
    return HttpResponse.json(ok({ ...limiaresTeste, ...corpo, atualizadoEm: "2026-06-11T09:00:00Z" }))
  }),
  http.patch("*/alertas/:id/status", async ({ params, request }) => {
    const { status } = (await request.json()) as { status: Alerta["status"] }
    const alerta = alertasTeste.find((a) => a.id === params.id) ?? alertasTeste[0]
    return HttpResponse.json(ok({ ...alerta, status }))
  }),
  http.post("*/alertas/gerar", () =>
    HttpResponse.json(
      ok({
        desabastecimentoGerados: 5,
        vencimentoGerados: 3,
        abertosRenovados: 8,
        totalAtivo: 20,
        mensagem: "8 alerta(s) gerado(s): 5 de desabastecimento e 3 de vencimento.",
      }),
    ),
  ),
  http.get("*/alertas", ({ request }) => HttpResponse.json(paginar(request, alertasTeste))),
  // Previsões — específicos antes do genérico (resumo e detalhe vs. lista).
  http.get("*/previsoes/resumo", () => HttpResponse.json(ok(resumoPrevisaoTeste))),
  http.get("*/previsoes/:medicamentoId/:unidadeId", () =>
    HttpResponse.json(ok(detalhePrevisaoTeste)),
  ),
  http.post("*/previsoes/recalibrar", () =>
    HttpResponse.json(
      ok({
        recalibradas: previsoesTeste.length,
        calibradoEm: "2026-06-11",
        mensagem: previsoesTeste.length + " previsoes recalibradas; drift estabilizado.",
      }),
    ),
  ),
  http.get("*/previsoes", ({ request }) => HttpResponse.json(paginar(request, previsoesTeste))),
]
