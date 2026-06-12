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

// Espelha o UnidadeResponse do backend (RF-DAD-06).
export interface Unidade {
  id: string
  nome: string
  sigla: string
  municipio: string
  porte: "Pequeno" | "Médio" | "Grande"
  leitos: number
  conectividade: "Estável" | "Intermitente" | "Precária"
  perfilDemografico: string
  hub: boolean // CAHOSP central (true) vs. unidades atendidas (false)
  ativo: boolean
}

// Espelha o MedicamentoResponse do backend (RF-DAD-06).
export interface Medicamento {
  id: string
  codigo: string // código de negócio (MED-NNN)
  nome: string
  apresentacao: string
  familia: FamiliaTerapeutica
  unidadeMedida: string
  criticidade: "Alta" | "Média" | "Baixa"
  essencial: boolean
  ativo: boolean
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

// Espelha o UsuarioResponse do backend. A unidade de lotação é opcional (RF-ADM-01);
// usuários recém-criados não têm último acesso até o primeiro login.
export interface Usuario {
  id: string
  nome: string
  email: string
  perfil: PerfilUsuario
  unidadeId?: string | null
  unidadeSigla?: string | null
  unidadeNome?: string | null
  ativo: boolean
  ultimoAcesso: string | null
}
