import type { ColumnDef } from "@tanstack/react-table"
import { FileLock2, KeyRound, ScrollText, ShieldCheck, Sparkles, UserCog } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { KpiCard } from "@/components/shared/KpiCard"
import { Section } from "@/components/shared/Section"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { DataTable } from "@/components/shared/DataTable"
import { Badge } from "@/components/ui/badge"
import { logsAuditoria } from "@/data"
import type { LogAuditoria, PerfilUsuario } from "@/types"
import { fmtNum, fmtDataHora } from "@/lib/format"

const matrizAcesso: { recurso: string; perfis: Record<PerfilUsuario, string> }[] = [
  { recurso: "Dashboards e relatórios", perfis: { Operador: "Leitura", Gestor: "Total", TI: "Leitura" } },
  { recurso: "Aprovar recomendações", perfis: { Operador: "—", Gestor: "Total", TI: "—" } },
  { recurso: "Parâmetros e limiares", perfis: { Operador: "—", Gestor: "Edição", TI: "Edição" } },
  { recurso: "Recalibrar modelos de previsão", perfis: { Operador: "—", Gestor: "—", TI: "Total" } },
  { recurso: "Gestão de usuários", perfis: { Operador: "—", Gestor: "—", TI: "Total" } },
  { recurso: "Dados sensíveis (PII)", perfis: { Operador: "Anonimizado", Gestor: "Anonimizado", TI: "Auditoria" } },
]

export default function SegurancaPage() {
  const comIA = logsAuditoria.filter((l) => l.assistidoPorIA).length

  const columns: ColumnDef<LogAuditoria>[] = [
    { accessorKey: "data", header: "Data/hora", cell: ({ row }) => <span className="tabular text-xs">{fmtDataHora(row.original.data)}</span> },
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
    { accessorKey: "acao", header: "Ação", cell: ({ row }) => <span className="text-sm">{row.original.acao}</span> },
    { accessorKey: "recurso", header: "Recurso", cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.recurso}</span> },
    { accessorKey: "baseLegal", header: "Base legal (LGPD)", cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.baseLegal}</span> },
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

  return (
    <>
      <PageHeader
        icon={<ShieldCheck className="size-5" />}
        title="Segurança, Auditoria e Conformidade LGPD"
        rf="RF-SEG"
        description="Proteção de dados sensíveis de saúde, logs de auditoria persistidos, base legal de tratamento e controle de acesso por perfil (Lei nº 13.709/2018)."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Anonimização obrigatória" value="100%" icon={FileLock2} accent="success" hint="antes do envio à IA externa" rf="RF-SEG-01" />
        <KpiCard label="Eventos auditados" value={fmtNum(logsAuditoria.length * 31)} icon={ScrollText} accent="primary" hint="logs persistidos" rf="RF-SEG-02" />
        <KpiCard label="Decisões assistidas por IA" value={fmtNum(comIA * 12)} icon={Sparkles} accent="teal" rf="RF-SEG-02" />
        <KpiCard label="Conformidade" value="Conforme" icon={ShieldCheck} accent="success" hint="revisão periódica" rf="RF-SEG-05" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Pilares LGPD */}
        <Section className="lg:col-span-2 h-fit" title="Pilares de conformidade" rf="RF-SEG-01 · RF-SEG-03 · RF-SEG-04">
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

        {/* Matriz de acesso (RF-SEG-06) */}
        <Section className="lg:col-span-3" title="Matriz de controle de acesso" rf="RF-SEG-06" description="Permissões por perfil de usuário conforme a política da EMSERH." noPadding>
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
                    {(["Operador", "Gestor", "TI"] as PerfilUsuario[]).map((perfil) => (
                      <td key={perfil} className="px-3 py-2.5">
                        <AccessCell value={m.perfis[perfil]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      {/* Logs de auditoria (RF-SEG-02) */}
      <Section title="Logs de auditoria" rf="RF-SEG-02 · RF-SEG-05" description="Registros persistidos de decisões assistidas por IA e operações relevantes, disponíveis para revisão de conformidade.">
        <DataTable columns={columns} data={logsAuditoria} searchKey="x" searchPlaceholder="Buscar ação, usuário, recurso…" pageSize={8} dense />
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
