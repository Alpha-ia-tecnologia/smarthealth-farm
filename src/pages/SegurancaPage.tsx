import { useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { FileLock2, KeyRound, ScrollText, ShieldCheck, Sparkles, UserCog } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { KpiCard } from "@/components/shared/KpiCard"
import { Section } from "@/components/shared/Section"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { DataTable } from "@/components/shared/DataTable"
import { AreaAtualizavel } from "@/components/shared/AreaAtualizavel"
import { ErroConsulta } from "@/components/shared/ErroConsulta"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuditoria, useResumoAuditoria } from "@/hooks/use-auditoria"
import { useDebounce } from "@/hooks/use-debounce"
import { categoriasAuditoria, type AuditoriaFiltros, type LogAuditoria } from "@/lib/auditoria"
import type { PerfilUsuario } from "@/types"
import { fmtNum, fmtData, fmtDataHora } from "@/lib/format"

/** Painel institucional sem endpoint — sinaliza conteúdo de referência. */
const BADGE_ILUSTRATIVO = (
  <Badge variant="outline" className="border-warning/40 bg-warning/10 text-[10px] text-warning">
    Dados ilustrativos
  </Badge>
)

const PERFIS: PerfilUsuario[] = ["Operador", "Gestor", "TI"]
const TODOS = "__todos__"

const matrizAcesso: { recurso: string; perfis: Record<PerfilUsuario, string> }[] = [
  { recurso: "Dashboards e relatórios", perfis: { Operador: "Leitura", Gestor: "Total", TI: "Leitura" } },
  { recurso: "Aprovar recomendações", perfis: { Operador: "—", Gestor: "Total", TI: "—" } },
  { recurso: "Parâmetros e limiares", perfis: { Operador: "—", Gestor: "Edição", TI: "Edição" } },
  { recurso: "Recalibrar modelos de previsão", perfis: { Operador: "—", Gestor: "Total", TI: "—" } },
  { recurso: "Gestão de usuários", perfis: { Operador: "—", Gestor: "—", TI: "Total" } },
  { recurso: "Dados sensíveis (PII)", perfis: { Operador: "Anonimizado", Gestor: "Anonimizado", TI: "Auditoria" } },
]

export default function SegurancaPage() {
  const [categoria, setCategoria] = useState<string>(TODOS)
  const [perfil, setPerfil] = useState<string>(TODOS)
  const [ia, setIa] = useState<string>(TODOS)
  const [busca, setBusca] = useState("")
  const buscaDebounced = useDebounce(busca, 350)

  const filtros: AuditoriaFiltros = {
    categoria: categoria === TODOS ? undefined : (categoria as AuditoriaFiltros["categoria"]),
    perfil: perfil === TODOS ? undefined : (perfil as PerfilUsuario),
    assistidoPorIA: ia === TODOS ? undefined : ia === "sim",
    busca: buscaDebounced || undefined,
  }

  const resumoQuery = useResumoAuditoria()
  const auditoriaQuery = useAuditoria(filtros)

  const columns: ColumnDef<LogAuditoria>[] = [
    {
      accessorKey: "data",
      header: "Data/hora",
      cell: ({ row }) => <span className="tabular text-xs">{fmtDataHora(row.original.data)}</span>,
    },
    {
      accessorKey: "usuario",
      header: "Usuário",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.usuario}</p>
          <Badge variant="outline" className="text-[10px]">{row.original.perfil}</Badge>
        </div>
      ),
    },
    {
      accessorKey: "categoria",
      header: "Categoria",
      cell: ({ row }) => <Badge variant="secondary" className="text-[10px]">{row.original.categoria}</Badge>,
    },
    {
      accessorKey: "acao",
      header: "Ação",
      enableSorting: false,
      cell: ({ row }) => <span className="text-sm">{row.original.acao}</span>,
    },
    {
      accessorKey: "recurso",
      header: "Recurso",
      enableSorting: false,
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.recurso}</span>,
    },
    {
      accessorKey: "baseLegal",
      header: "Base legal (LGPD)",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.baseLegal ?? "—"}</span>
      ),
    },
    {
      accessorKey: "assistidoPorIA",
      header: "IA",
      cell: ({ row }) =>
        row.original.assistidoPorIA ? (
          <Badge className="gap-1 bg-primary/15 text-primary text-[10px]"><Sparkles className="size-3" /> Sim</Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ]

  const resumo = resumoQuery.data

  return (
    <>
      <PageHeader
        icon={<ShieldCheck className="size-5" />}
        title="Segurança, Auditoria e Conformidade LGPD"
        rf="RF-SEG"
        description="Proteção de dados sensíveis de saúde, logs de auditoria persistidos, base legal de tratamento e controle de acesso por perfil (Lei nº 13.709/2018)."
      />

      {/* KPIs reais (RF-SEG-02/03/05) */}
      {resumoQuery.isError ? (
        <ErroConsulta
          mensagem="Não foi possível carregar os indicadores de auditoria."
          onTentarNovamente={() => resumoQuery.refetch()}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Eventos auditados" value={resumo ? fmtNum(resumo.total) : ""} carregando={resumoQuery.isPending} icon={ScrollText} accent="primary" hint="logs persistidos" rf="RF-SEG-02" />
          <KpiCard label="Decisões assistidas por IA" value={resumo ? fmtNum(resumo.assistidosPorIa) : ""} carregando={resumoQuery.isPending} icon={Sparkles} accent="teal" hint="inferências registradas" rf="RF-SEG-02" />
          <KpiCard label="Eventos com base legal" value={resumo ? fmtNum(resumo.comBaseLegal) : ""} carregando={resumoQuery.isPending} icon={FileLock2} accent="success" hint="LGPD (art. 7º/12)" rf="RF-SEG-03" />
          <KpiCard label="Última atividade" value={resumo?.ultimaAtividade ? fmtData(resumo.ultimaAtividade) : "—"} carregando={resumoQuery.isPending} icon={ShieldCheck} accent="primary" hint="evento mais recente" rf="RF-SEG-05" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Pilares LGPD — institucional */}
        <Section
          className="lg:col-span-2 h-fit"
          title="Pilares de conformidade"
          rf="RF-SEG-01 · RF-SEG-03 · RF-SEG-04"
          action={BADGE_ILUSTRATIVO}
        >
          <div className="space-y-3">
            {[
              { i: FileLock2, t: "Anonimização de dados sensíveis", d: "Obrigatória antes de qualquer envio a provedores externos de IA.", rf: "RF-SEG-01" },
              { i: KeyRound, t: "AI Gateway desacopla PII", d: "Impede exposição de dados pessoais a serviços externos.", rf: "RF-SEG-04" },
              { i: ScrollText, t: "Base legal e Termo de Compartilhamento", d: "Registra base legal aplicável (item 16.19 do edital).", rf: "RF-SEG-03" },
              { i: UserCog, t: "Controle de acesso por perfil", d: "Conforme política de acesso da EMSERH.", rf: "RF-SEG-06" },
            ].map((p) => (
              <div key={p.t} className="flex gap-3 rounded-lg border p-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success"><p.i className="size-4" /></span>
                <div>
                  <p className="text-sm font-medium">{p.t}</p>
                  <p className="text-xs text-muted-foreground">{p.d}</p>
                  <span className="font-mono text-[10px] text-muted-foreground">{p.rf}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Matriz de acesso (RF-SEG-06) — referência institucional */}
        <Section
          className="lg:col-span-3"
          title="Matriz de controle de acesso"
          rf="RF-SEG-06"
          description="Permissões por perfil de usuário conforme a política da EMSERH."
          action={BADGE_ILUSTRATIVO}
          noPadding
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-2.5 text-left font-semibold">Recurso</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Operador</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Gestor</th>
                  <th className="px-3 py-2.5 text-left font-semibold">TI</th>
                </tr>
              </thead>
              <tbody>
                {matrizAcesso.map((m) => (
                  <tr key={m.recurso} className="border-b last:border-0">
                    <td className="px-5 py-2.5 font-medium">{m.recurso}</td>
                    {PERFIS.map((p) => (
                      <td key={p} className="px-3 py-2.5">
                        <AccessCell value={m.perfis[p]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      {/* Logs de auditoria (RF-SEG-02) — dados reais com filtros server-side */}
      <Section
        title="Logs de auditoria"
        rf="RF-SEG-02 · RF-SEG-05"
        description="Registros persistidos de decisões assistidas por IA e operações relevantes, disponíveis para revisão de conformidade."
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar ação, usuário, recurso…"
            className="w-full max-w-xs"
            aria-label="Buscar na trilha de auditoria"
          />
          <Select value={categoria} onValueChange={setCategoria}>
            <SelectTrigger size="sm" aria-label="Filtrar por categoria">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todas as categorias</SelectItem>
              {categoriasAuditoria.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={perfil} onValueChange={setPerfil}>
            <SelectTrigger size="sm" aria-label="Filtrar por perfil">
              <SelectValue placeholder="Perfil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos os perfis</SelectItem>
              {PERFIS.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={ia} onValueChange={setIa}>
            <SelectTrigger size="sm" aria-label="Filtrar por assistido por IA">
              <SelectValue placeholder="IA" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>IA: todos</SelectItem>
              <SelectItem value="sim">Assistido por IA</SelectItem>
              <SelectItem value="nao">Sem IA</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {auditoriaQuery.isError ? (
          <ErroConsulta
            mensagem="Não foi possível carregar a trilha de auditoria."
            onTentarNovamente={() => auditoriaQuery.refetch()}
          />
        ) : !auditoriaQuery.data ? (
          <div className="flex justify-center py-20">
            <Spinner size={40} label="Carregando auditoria" />
          </div>
        ) : auditoriaQuery.data.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Nenhum evento de auditoria para os filtros selecionados.
          </p>
        ) : (
          <AreaAtualizavel atualizando={auditoriaQuery.isFetching}>
            <DataTable columns={columns} data={auditoriaQuery.data} pageSize={8} dense />
          </AreaAtualizavel>
        )}
      </Section>
    </>
  )
}

function AccessCell({ value }: { value: string }) {
  if (value === "—") return <span className="text-muted-foreground">—</span>
  const tone =
    value === "Total" ? "ok" : value === "Edição" || value === "Auditoria" ? "info" : value === "Anonimizado" ? "atencao" : "neutro"
  return <StatusBadge status={tone as never} label={value} dot={false} />
}
