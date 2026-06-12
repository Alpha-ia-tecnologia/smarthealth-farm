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
import type {
  Recomendacao,
  ResumoRecomendacoes,
} from "@/lib/recomendacoes"
import type { PainelGerencial, PainelOperacional } from "@/lib/painel"
import type { Indicador, ResumoIndicadores } from "@/lib/indicadores"

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

/** Recomendações de teste: uma redistribuição pendente (IA) e uma reposição aprovada (regras). */
export const recomendacoesTeste: Recomendacao[] = [
  {
    id: "rec-1",
    tipo: "Redistribuição",
    medicamentoId: "med-001",
    medicamentoCodigo: "MED-001",
    medicamentoNome: "Ceftriaxona 1g",
    unidadeDestinoId: "uni-hto",
    unidadeDestinoSigla: "HTO",
    unidadeDestinoNome: "Hospital de Traumatologia e Ortopedia",
    unidadeOrigemId: "uni-hri",
    unidadeOrigemSigla: "HRI",
    unidadeOrigemNome: "Hospital Regional de Imperatriz",
    quantidade: 120,
    justificativa: "Excedente em HRI cobre a ruptura iminente em HTO sem compra emergencial.",
    origemMotor: "Aprendizado de Máquina",
    prioridade: "Essencial",
    economiaEstimada: 8400,
    status: "Pendente",
    criadoEm: "2026-06-10T08:00:00Z",
  },
  {
    id: "rec-2",
    tipo: "Reposição",
    medicamentoId: "med-002",
    medicamentoCodigo: "MED-002",
    medicamentoNome: "Dipirona 500mg/mL",
    unidadeDestinoId: "uni-hri",
    unidadeDestinoSigla: "HRI",
    unidadeDestinoNome: "Hospital Regional de Imperatriz",
    unidadeOrigemId: null,
    unidadeOrigemSigla: null,
    unidadeOrigemNome: null,
    quantidade: 300,
    justificativa: "Reposição dimensionada pela previsão para restaurar o nível de segurança.",
    origemMotor: "Regras",
    prioridade: "Importante",
    economiaEstimada: 2100,
    status: "Aprovada",
    criadoEm: "2026-06-09T10:00:00Z",
  },
]

export const resumoRecomendacoesTeste: ResumoRecomendacoes = {
  pendentes: 1,
  aprovadas: 1,
  executadas: 0,
  economiaPotencial: 10500,
  geradasPorIA: 1,
  taxaAdesao: 50,
  total: 2,
}

/** Indicadores de teste (códigos usados pelo dashboard + lista de indicadores). */
export const indicadoresTeste: Indicador[] = [
  {
    id: "ind-1",
    codigo: "ind-ruptura",
    nome: "Taxa de desabastecimento de essenciais",
    unidade: "%",
    baseline: 18.4,
    atual: 11.2,
    meta: 11.96,
    metaReducaoPct: 35,
    melhorMenor: true,
    progresso: 112,
    atingiu: true,
    variacaoPct: -39,
    historico: [
      { periodo: "2026-04", valor: 13.1 },
      { periodo: "2026-05", valor: 11.2 },
    ],
  },
  {
    id: "ind-2",
    codigo: "ind-vencimento",
    nome: "Perdas por vencimento",
    unidade: "%",
    baseline: 6.1,
    atual: 4.3,
    meta: 4.58,
    metaReducaoPct: 25,
    melhorMenor: true,
    progresso: 118,
    atingiu: true,
    variacaoPct: -30,
    historico: [{ periodo: "2026-05", valor: 4.3 }],
  },
  {
    id: "ind-3",
    codigo: "ind-emergencial",
    nome: "Compras emergenciais",
    unidade: "R$ mil",
    baseline: 1240,
    atual: 812,
    meta: 868,
    metaReducaoPct: 30,
    melhorMenor: true,
    progresso: 115,
    atingiu: true,
    variacaoPct: -35,
    historico: [{ periodo: "2026-05", valor: 812 }],
  },
  {
    id: "ind-4",
    codigo: "ind-mape",
    nome: "Assertividade da previsão (MAPE)",
    unidade: "%",
    baseline: 22.0,
    atual: 11.8,
    meta: 15,
    metaReducaoPct: 0,
    melhorMenor: true,
    progresso: 140,
    atingiu: true,
    variacaoPct: -46,
    historico: [{ periodo: "2026-05", valor: 11.8 }],
  },
  {
    id: "ind-5",
    codigo: "ind-rupturas-evitadas",
    nome: "Desabastecimentos evitados (acum.)",
    unidade: "un",
    baseline: 0,
    atual: 147,
    meta: 120,
    metaReducaoPct: 0,
    melhorMenor: false,
    progresso: 122,
    atingiu: true,
    variacaoPct: null,
    historico: [{ periodo: "2026-05", valor: 147 }],
  },
]

export const resumoIndicadoresTeste: ResumoIndicadores = {
  total: 5,
  atingidas: 5,
  emProgresso: 0,
}

/** Dashboard gerencial de teste — reusa alertas e recomendações já definidos. */
export const painelGerencialTeste: PainelGerencial = {
  totais: {
    medicamentos: 2,
    unidades: 2,
    alertasAbertos: 12,
    alertasAtivos: 15, // abertos(12) + em tratamento(3) = desabastecimento(6) + vencimento(9)
    alertasDesabastecimento: 6,
    alertasVencimento: 9,
    recomendacoesPendentes: 1,
    economiaPotencial: 10500,
    itensCriticos: 1,
    lotesProximosVencimento: 3,
  },
  coberturaPorUnidade: [
    { nome: "HTO", valor: 58, status: "critico" },
    { nome: "HRI", valor: 86, status: "ok" },
  ],
  serieAgregada: {
    medicamentoId: "med-001",
    medicamentoCodigo: "MED-001",
    medicamentoNome: "Ceftriaxona 1g",
    serie: [
      { periodo: "2026-04", realizado: 980, previsto: 950, limiteInferior: 900, limiteSuperior: 1000 },
      { periodo: "2026-05", realizado: 1040, previsto: 1010, limiteInferior: 960, limiteSuperior: 1060 },
      { periodo: "2026-06", realizado: null, previsto: 1080, limiteInferior: 1020, limiteSuperior: 1140 },
    ],
  },
  alertasRecentes: alertasTeste,
  recomendacoesPendentes: [recomendacoesTeste[0]],
}

/** Painel operacional de teste — reusa totais/alertas/recomendações já definidos. */
export const painelOperacionalTeste: PainelOperacional = {
  totais: painelGerencialTeste.totais,
  unidades: [
    {
      unidadeId: "uni-hto",
      sigla: "HTO",
      nome: "Hospital de Traumatologia e Ortopedia",
      municipio: "São Luís",
      conectividade: "Estável",
      itens: 18,
      criticos: 5,
      atencao: 3,
      alertasAtivos: 7,
      cobertura: 58,
      statusCobertura: "critico",
      statusUnidade: "critico",
    },
    {
      unidadeId: "uni-hri",
      sigla: "HRI",
      nome: "Hospital Regional de Imperatriz",
      municipio: "Imperatriz",
      conectividade: "Intermitente",
      itens: 16,
      criticos: 0,
      atencao: 2,
      alertasAtivos: 2,
      cobertura: 86,
      statusCobertura: "ok",
      statusUnidade: "ok",
    },
  ],
  alertasAtivos: alertasTeste,
  recomendacoesAbertas: recomendacoesTeste,
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
  // Recomendações — específicos antes do genérico.
  http.get("*/recomendacoes/resumo", () => HttpResponse.json(ok(resumoRecomendacoesTeste))),
  http.post("*/recomendacoes/:id/aprovar", ({ params }) => {
    const rec = recomendacoesTeste.find((r) => r.id === params.id) ?? recomendacoesTeste[0]
    return HttpResponse.json(ok({ ...rec, status: "Aprovada" }))
  }),
  http.post("*/recomendacoes/:id/executar", ({ params }) => {
    const rec = recomendacoesTeste.find((r) => r.id === params.id) ?? recomendacoesTeste[0]
    return HttpResponse.json(ok({ ...rec, status: "Executada" }))
  }),
  http.post("*/recomendacoes/gerar", () =>
    HttpResponse.json(
      ok({
        reposicaoGeradas: 4,
        redistribuicaoGeradas: 3,
        pendentesRenovadas: 7,
        totalAtivo: 12,
        mensagem: "7 recomendacao(oes) gerada(s): 4 de reposição e 3 de redistribuição.",
      }),
    ),
  ),
  http.get("*/recomendacoes", ({ request }) => HttpResponse.json(paginar(request, recomendacoesTeste))),
  // Painel — específico antes do genérico (operacional vs. dashboard).
  http.get("*/painel/operacional", () => HttpResponse.json(ok(painelOperacionalTeste))),
  http.get("*/painel", () => HttpResponse.json(ok(painelGerencialTeste))),
  // Indicadores — específicos antes do genérico (resumo e detalhe vs. lista).
  http.get("*/indicadores/resumo", () => HttpResponse.json(ok(resumoIndicadoresTeste))),
  http.get("*/indicadores/:codigo", ({ params }) => {
    const ind = indicadoresTeste.find((i) => i.codigo === params.codigo)
    return ind
      ? HttpResponse.json(ok(ind))
      : HttpResponse.json(erro("Indicador nao encontrado.", "NAO_ENCONTRADO"), { status: 404 })
  }),
  http.get("*/indicadores", () => HttpResponse.json(ok(indicadoresTeste, indicadoresTeste.length))),
]
