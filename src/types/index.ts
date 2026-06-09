// Tipos de domínio — Smart Health CAHOSP
// Modelagem alinhada aos Requisitos Funcionais (RF-*).

export type Prioridade = "Essencial" | "Importante" | "Desejável"

export type StatusNivel = "ok" | "atencao" | "critico" | "info"

export type PerfilUsuario = "Operador" | "Gestor" | "TI"

export type FamiliaTerapeutica =
  | "Antibióticos"
  | "Analgésicos"
  | "Antivirais"
  | "Cardiovascular"
  | "Soros e Vacinas"
  | "Insumos Médicos"
  | "Saúde Mental"
  | "Antiparasitários"

export interface Unidade {
  id: string
  nome: string
  sigla: string
  municipio: string
  porte: "Pequeno" | "Médio" | "Grande"
  leitos: number
  conectividade: "Estável" | "Intermitente" | "Precária"
  // RF-DAD-06 — variáveis de contexto
  perfilDemografico: string
}

export interface Medicamento {
  id: string
  nome: string
  apresentacao: string
  familia: FamiliaTerapeutica
  unidadeMedida: string
  criticidade: "Alta" | "Média" | "Baixa"
  essencial: boolean
}

export interface Lote {
  id: string
  medicamentoId: string
  unidadeId: string
  numeroLote: string
  validade: string // ISO date
  quantidade: number
  fabricante: string
}

export type TipoMovimentacao = "Entrada" | "Saída" | "Transferência" | "Ajuste"

export interface Movimentacao {
  id: string
  loteId: string
  medicamentoId: string
  unidadeId: string
  tipo: TipoMovimentacao
  quantidade: number
  data: string // ISO datetime
  responsavel: string
  documento: string
}

export interface PosicaoEstoque {
  medicamentoId: string
  unidadeId: string
  quantidade: number
  nivelCritico: number // calculado a partir da previsão (RF-EST-04)
  estoqueMaximo: number
  consumoMedioDiario: number
  tempoMedioRessuprimentoDias: number // RF-EST-05
}

export interface PontoSerie {
  periodo: string // ex.: "2025-01"
  realizado: number | null
  previsto: number | null
  limiteInferior?: number | null
  limiteSuperior?: number | null
}

export interface Previsao {
  id: string
  medicamentoId: string
  unidadeId: string
  horizonteMeses: number
  mape: number // %
  modelo: string // ex.: "Modelo preditivo híbrido"
  versaoModelo: string // RF-PRV-09
  drift: "Estável" | "Atenção" | "Degradado" // RF-PRV-06
  serie: PontoSerie[]
  atualizadoEm: string
}

export type TipoAlerta = "Desabastecimento" | "Vencimento"

export interface Alerta {
  id: string
  tipo: TipoAlerta
  severidade: "Crítico" | "Alto" | "Médio"
  medicamentoId: string
  unidadeId: string
  mensagem: string
  criadoEm: string
  status: "Aberto" | "Em tratamento" | "Resolvido"
  destinatarios: PerfilUsuario[] // RF-ALE-04
  loteId?: string
  diasParaEvento?: number
}

export type TipoRecomendacao = "Reposição" | "Redistribuição"

export interface Recomendacao {
  id: string
  tipo: TipoRecomendacao
  medicamentoId: string
  unidadeDestinoId: string
  unidadeOrigemId?: string // redistribuição
  quantidade: number
  justificativa: string // RF-REC-04
  origemMotor: "Regras" | "Aprendizado de Máquina" // RF-REC-03
  prioridade: Prioridade
  economiaEstimada: number // R$
  status: "Pendente" | "Aprovada" | "Executada"
  criadoEm: string
}

export interface IndicadorMeta {
  id: string
  nome: string
  unidade: string // %, dias, R$
  baseline: number
  atual: number
  meta: number // valor alvo
  metaReducaoPct: number // RF-IND meta de redução
  melhorMenor: boolean // true = quanto menor melhor
  historico: { periodo: string; valor: number }[]
}

export interface FonteDado {
  id: string
  nome: string
  geracao: string // ex.: "Legado SIH", "API EMSERH v2"
  status: "Sincronizado" | "Atrasado" | "Erro"
  ultimaIngestao: string
  registros: number
  qualidade: number // 0-100 (RF-DAD-04)
  procedencia: string // RF-DAD-07
}

export interface QualidadeFamilia {
  familia: FamiliaTerapeutica
  maturidade: number // 0-100
  completude: number
  consistencia: number
  granularidade: "Diária" | "Semanal" | "Mensal"
  lacunas: number
}

export interface LogAuditoria {
  id: string
  data: string
  usuario: string
  perfil: PerfilUsuario
  acao: string
  recurso: string
  baseLegal?: string // RF-SEG-03
  assistidoPorIA: boolean // RF-SEG-02
  ip: string
}

export interface Usuario {
  id: string
  nome: string
  email: string
  perfil: PerfilUsuario
  unidadeId?: string
  ativo: boolean
  ultimoAcesso: string
}

export interface IntegracaoAPI {
  id: string
  nome: string
  versao: string
  status: "Operacional" | "Degradada" | "Indisponível"
  latenciaMs: number
  ultimaSync: string
  modo: "Online" | "Offline (buffer)" | "Reconciliando"
  registrosBuffer: number
}

export interface ProvedorIA {
  id: string
  nome: string // DeepSeek, OpenAI, Gemini
  ativo: boolean
  papel: "Primário" | "Fallback" | "Standby"
  custoPor1kTokens: number
  chamadasMes: number
  anonimizacao: boolean // RF-SEG-04
}
