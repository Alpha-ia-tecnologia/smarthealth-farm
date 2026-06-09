import type { ColumnDef } from "@tanstack/react-table"
import { Boxes, Building2, Settings2, SlidersHorizontal, UserPlus, Users } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { KpiCard } from "@/components/shared/KpiCard"
import { Section } from "@/components/shared/Section"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { DataTable } from "@/components/shared/DataTable"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getUnidade, usuarios, unidadesAtendidas, medicamentos, familiasTerapeuticas } from "@/data"
import type { Usuario } from "@/types"
import { fmtNum, fmtDataHora } from "@/lib/format"

const iniciais = (n: string) => n.split(" ").map((x) => x[0]).slice(0, 2).join("")

export default function AdminPage() {
  const ativos = usuarios.filter((u) => u.ativo).length

  const columns: ColumnDef<Usuario>[] = [
    {
      accessorKey: "nome",
      header: "Usuário",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="size-8"><AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">{iniciais(row.original.nome)}</AvatarFallback></Avatar>
          <div>
            <p className="font-medium">{row.original.nome}</p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "perfil",
      header: "Perfil",
      cell: ({ row }) => <Badge variant={row.original.perfil === "Gestor" ? "default" : row.original.perfil === "TI" ? "secondary" : "outline"}>{row.original.perfil}</Badge>,
    },
    { accessorKey: "unidadeId", header: "Unidade", cell: ({ row }) => <span className="text-sm">{row.original.unidadeId ? getUnidade(row.original.unidadeId)?.sigla : "—"}</span> },
    { accessorKey: "ultimoAcesso", header: "Último acesso", cell: ({ row }) => <span className="tabular text-xs text-muted-foreground">{fmtDataHora(row.original.ultimoAcesso)}</span> },
    { accessorKey: "ativo", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.ativo ? "ok" : "neutro"} label={row.original.ativo ? "Ativo" : "Inativo"} /> },
  ]

  return (
    <>
      <PageHeader
        icon={<Settings2 className="size-5" />}
        title="Administração e Gestão de Usuários"
        rf="RF-ADM"
        description="Autenticação, perfis de acesso, cadastro de unidades, itens e famílias terapêuticas, e parametrização institucional."
        actions={<Button><UserPlus className="size-4" /> Novo usuário</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Usuários ativos" value={`${ativos}/${usuarios.length}`} icon={Users} accent="primary" rf="RF-ADM-01" />
        <KpiCard label="Unidades cadastradas" value={fmtNum(unidadesAtendidas.length)} icon={Building2} accent="teal" rf="RF-ADM-02" />
        <KpiCard label="Itens no catálogo" value={fmtNum(medicamentos.length)} icon={Boxes} accent="primary" rf="RF-ADM-02" />
        <KpiCard label="Famílias terapêuticas" value={fmtNum(familiasTerapeuticas.length)} icon={SlidersHorizontal} accent="teal" rf="RF-ADM-02" />
      </div>

      <Tabs defaultValue="usuarios">
        <TabsList>
          <TabsTrigger value="usuarios">Usuários & Perfis</TabsTrigger>
          <TabsTrigger value="cadastros">Cadastros</TabsTrigger>
          <TabsTrigger value="parametros">Parâmetros</TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="pt-4">
          <Section title="Usuários" rf="RF-ADM-01" description="Controle de acesso baseado em perfis (operadores, gestores e equipe de TI).">
            <DataTable columns={columns} data={usuarios} searchKey="x" searchPlaceholder="Buscar usuário…" pageSize={10} />
          </Section>
        </TabsContent>

        <TabsContent value="cadastros" className="pt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Unidades da rede EMSERH" rf="RF-ADM-02" noPadding>
              <div className="divide-y">
                {unidadesAtendidas.map((u) => (
                  <div key={u.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium">{u.nome}</p>
                      <p className="text-xs text-muted-foreground">{u.municipio} · {u.porte} · {u.leitos} leitos</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{u.sigla}</Badge>
                  </div>
                ))}
              </div>
            </Section>
            <Section title="Famílias terapêuticas & itens" rf="RF-ADM-02" noPadding>
              <div className="divide-y">
                {familiasTerapeuticas.map((f) => {
                  const n = medicamentos.filter((m) => m.familia === f).length
                  return (
                    <div key={f} className="flex items-center justify-between px-5 py-3">
                      <p className="text-sm font-medium">{f}</p>
                      <span className="tabular text-xs text-muted-foreground">{n} item(ns)</span>
                    </div>
                  )
                })}
              </div>
            </Section>
          </div>
        </TabsContent>

        <TabsContent value="parametros" className="pt-4">
          <Section title="Parametrização operacional" rf="RF-ADM-03" description="Limiares, regras de redistribuição e horizontes de previsão por usuário autorizado.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { l: "Horizonte de previsão padrão", v: "3", suf: "meses" },
                { l: "Janela de recalibração", v: "30", suf: "dias" },
                { l: "Nível de segurança", v: "1.5", suf: "× crítico" },
                { l: "Limiar de desvio (MAPE)", v: "18", suf: "%" },
                { l: "Antecedência de vencimento", v: "60", suf: "dias" },
                { l: "Cobertura mínima", v: "7", suf: "dias" },
              ].map((p) => (
                <div key={p.l} className="rounded-lg border p-4">
                  <Label className="text-sm">{p.l}</Label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Input defaultValue={p.v} className="w-24 tabular" />
                    <span className="text-xs text-muted-foreground">{p.suf}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button>Salvar parâmetros</Button>
            </div>
          </Section>
        </TabsContent>
      </Tabs>
    </>
  )
}
