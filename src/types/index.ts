// Tipos de domínio compartilhados — Smart Health CAHOSP.
// Espelham os DTOs do backend. Tipos específicos de um domínio (estoque, alertas,
// previsões, recomendações…) vivem no serviço correspondente em src/lib/<dominio>.ts.

// "Admin" é superusuário: acumula os poderes de Gestor e TI (ver src/lib/permissoes.ts).
export type PerfilUsuario = "Operador" | "Gestor" | "TI" | "Admin"

export type CategoriaInsumo =
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

// Espelha o InsumoResponse do backend (RF-DAD-06).
export interface Insumo {
  id: string
  codigo: string // código de negócio (INS-NNN)
  nome: string
  apresentacao: string
  categoria: CategoriaInsumo
  unidadeMedida: string
  criticidade: "Alta" | "Média" | "Baixa"
  essencial: boolean
  ativo: boolean
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
