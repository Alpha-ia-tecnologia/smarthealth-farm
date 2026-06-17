import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  Activity,
  TrendingUp,
  Boxes,
  BellRing,
  ArrowLeftRight,
  FileBarChart,
  DatabaseZap,
  Plug,
  ShieldCheck,
  Settings2,
  Target,
} from "lucide-react"
import type { PerfilUsuario } from "@/types"

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  rf: string // faixa de RFs cobertos
  grupo: "Visão Geral" | "Operação" | "Governança"
  desc: string
  /** Perfis que enxergam o item. Ausente = liberado para qualquer logado. RBAC na UI. */
  perfis?: PerfilUsuario[]
}

export const navItems: NavItem[] = [
  { to: "/", label: "Dashboard Gerencial", icon: LayoutDashboard, rf: "RF-DASH-01 · RF-IND", grupo: "Visão Geral", desc: "Visão consolidada da cadeia farmacêutica" },
  { to: "/operacional", label: "Painel Operacional", icon: Activity, rf: "RF-DASH-02", grupo: "Visão Geral", desc: "Alertas, recomendações e situação por unidade" },
  { to: "/previsao", label: "Previsão de Demanda", icon: TrendingUp, rf: "RF-PRV", grupo: "Operação", desc: "Previsão de consumo e assertividade das estimativas" },
  { to: "/estoque", label: "Estoque & Lotes", icon: Boxes, rf: "RF-EST", grupo: "Operação", desc: "Níveis, rastreabilidade por lote e validade" },
  { to: "/alertas", label: "Alertas", icon: BellRing, rf: "RF-ALE", grupo: "Operação", desc: "Desabastecimento e vencimento — configuração e histórico" },
  { to: "/recomendacoes", label: "Reposição & Redistribuição", icon: ArrowLeftRight, rf: "RF-REC", grupo: "Operação", desc: "Recomendação de reposição entre unidades" },
  { to: "/relatorios", label: "Relatórios", icon: FileBarChart, rf: "RF-DASH-04/07", grupo: "Operação", desc: "Relatórios estratégicos e progresso do projeto" },
  { to: "/ingestao", label: "Ingestão de Dados", icon: DatabaseZap, rf: "RF-DAD", grupo: "Governança", desc: "Fontes, qualidade e anonimização" },
  { to: "/integracao", label: "Integração EMSERH", icon: Plug, rf: "RF-INT", grupo: "Governança", desc: "APIs, sincronização e AI Gateway" },
  { to: "/seguranca", label: "Segurança & LGPD", icon: ShieldCheck, rf: "RF-SEG", grupo: "Governança", desc: "Auditoria, base legal e acesso", perfis: ["Gestor", "TI"] },
  { to: "/admin", label: "Administração", icon: Settings2, rf: "RF-ADM", grupo: "Governança", desc: "Usuários, perfis e parâmetros", perfis: ["TI"] },
  { to: "/indicadores", label: "Indicadores", icon: Target, rf: "RF-IND", grupo: "Governança", desc: "Metas do projeto vs. linha de base" },
]

export const grupos: NavItem["grupo"][] = ["Visão Geral", "Operação", "Governança"]

/** Itens de navegação visíveis para o perfil informado (RBAC na UI). Admin enxerga tudo. */
export function navItemsPara(perfil: PerfilUsuario | null): NavItem[] {
  return navItems.filter(
    (i) => !i.perfis || perfil === "Admin" || (perfil !== null && i.perfis.includes(perfil)),
  )
}
