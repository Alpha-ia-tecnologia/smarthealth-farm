import { useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { Boxes, Building2, KeyRound, Pencil, Plus, Power, Settings2, SlidersHorizontal, UserPlus, Users } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { KpiCard } from "@/components/shared/KpiCard"
import { Section } from "@/components/shared/Section"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { DataTable } from "@/components/shared/DataTable"
import { AreaAtualizavel } from "@/components/shared/AreaAtualizavel"
import { ErroConsulta } from "@/components/shared/ErroConsulta"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UsuarioFormDialog } from "@/components/admin/UsuarioFormDialog"
import { RedefinirSenhaDialog } from "@/components/admin/RedefinirSenhaDialog"
import { UnidadeFormDialog } from "@/components/admin/UnidadeFormDialog"
import { InsumoFormDialog } from "@/components/admin/InsumoFormDialog"
import { ItensCategoriaDialog } from "@/components/admin/ItensCategoriaDialog"
import { useAlterarStatusUsuario, useUsuarios } from "@/hooks/use-usuarios"
import { useAlterarStatusUnidade, useUnidades } from "@/hooks/use-unidades"
import { useInsumos } from "@/hooks/use-insumos"
import { useDebounce } from "@/hooks/use-debounce"
import { useAuth } from "@/context/auth"
import { categoriasInsumo } from "@/lib/insumos"
import { ApiError } from "@/lib/api"
import type { CategoriaInsumo, PerfilUsuario, Unidade, Usuario } from "@/types"
import { fmtNum, fmtDataHora } from "@/lib/format"

const PERFIS: PerfilUsuario[] = ["Operador", "Gestor", "TI"]
const TODOS = "__todos__"

const iniciais = (n: string) => n.split(" ").map((x) => x[0]).slice(0, 2).join("")

export default function AdminPage() {
  return (
    <>
      <PageHeader
        icon={<Settings2 className="size-5" />}
        title="Administração e Gestão de Usuários"
        info="Área para administrar o sistema: criar e gerenciar usuários e seus perfis de acesso, cadastrar as unidades de saúde, manter o catálogo de insumos e ajustar as configurações gerais da plataforma."
        description="Autenticação, perfis de acesso, cadastro de unidades, itens e categorias terapêuticas, e parametrização institucional."
      />
      <KpisAdmin />
      <Tabs defaultValue="usuarios">
        <TabsList>
          <TabsTrigger value="usuarios">Usuários & Perfis</TabsTrigger>
          <TabsTrigger value="cadastros">Cadastros</TabsTrigger>
          <TabsTrigger value="parametros">Parâmetros</TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="pt-4">
          <AbaUsuarios />
        </TabsContent>

        <TabsContent value="cadastros" className="pt-4">
          <AbaCadastros />
        </TabsContent>

        <TabsContent value="parametros" className="pt-4">
          <AbaParametros />
        </TabsContent>
      </Tabs>
    </>
  )
}

/** KPIs do topo, alimentados pela API (usuários ativos, catálogo). */
function KpisAdmin() {
  const usuarios = useUsuarios()
  const unidades = useUnidades({ ativo: true })
  const insumos = useInsumos({ ativo: true })

  const lista = usuarios.data ?? []
  const ativos = lista.filter((u) => u.ativo).length

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Usuários ativos" value={usuarios.data ? `${ativos}/${lista.length}` : ""} carregando={usuarios.isPending} icon={Users} accent="primary" info="Quantos usuários estão habilitados a acessar o sistema, em relação ao total cadastrado. Usuários inativos não conseguem entrar." />
      <KpiCard label="Unidades cadastradas" value={unidades.data ? fmtNum(unidades.data.length) : ""} carregando={unidades.isPending} icon={Building2} accent="teal" info="Número de unidades de saúde (hospitais e estabelecimentos da rede) registradas e ativas no sistema." />
      <KpiCard label="Itens no catálogo" value={insumos.data ? fmtNum(insumos.data.length) : ""} carregando={insumos.isPending} icon={Boxes} accent="primary" info="Total de insumos ativos cadastrados no catálogo da instituição." />
      <KpiCard label="Categorias de insumo" value={fmtNum(categoriasInsumo.length)} icon={SlidersHorizontal} accent="teal" info="Quantos grupos de insumos com finalidade semelhante (por exemplo, antibióticos ou analgésicos) existem para organizar o catálogo." />
    </div>
  )
}

function AbaUsuarios() {
  const { usuario: usuarioAtual } = useAuth()
  const [perfilFiltro, setPerfilFiltro] = useState<string>(TODOS)
  const [ativoFiltro, setAtivoFiltro] = useState<string>(TODOS)
  const [busca, setBusca] = useState("")
  const buscaDebounced = useDebounce(busca, 350)

  const [criando, setCriando] = useState(false)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [redefinindo, setRedefinindo] = useState<Usuario | null>(null)

  const usuariosQuery = useUsuarios({
    perfil: perfilFiltro === TODOS ? undefined : (perfilFiltro as PerfilUsuario),
    ativo: ativoFiltro === TODOS ? undefined : ativoFiltro === "ativos",
    busca: buscaDebounced || undefined,
  })
  const alterarStatus = useAlterarStatusUsuario()

  function aoAlterarStatus(usuario: Usuario) {
    alterarStatus.mutate(
      { id: usuario.id, ativo: !usuario.ativo },
      {
        onSuccess: () => toast.success(usuario.ativo ? "Usuário desativado." : "Usuário ativado."),
        onError: (e) =>
          toast.error(e instanceof ApiError ? e.message : "Erro inesperado. Tente novamente."),
      },
    )
  }

  const columns: ColumnDef<Usuario>[] = [
    {
      accessorKey: "nome",
      header: "Usuário",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">{iniciais(row.original.nome)}</AvatarFallback>
          </Avatar>
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
      cell: ({ row }) => (
        <Badge variant={row.original.perfil === "Admin" || row.original.perfil === "Gestor" ? "default" : row.original.perfil === "TI" ? "secondary" : "outline"}>
          {row.original.perfil}
        </Badge>
      ),
    },
    {
      id: "unidade",
      header: "Unidade",
      enableSorting: false,
      cell: ({ row }) => <span className="text-sm">{row.original.unidadeSigla ?? "—"}</span>,
    },
    {
      accessorKey: "ultimoAcesso",
      header: "Último acesso",
      cell: ({ row }) => (
        <span className="tabular text-xs text-muted-foreground">
          {row.original.ultimoAcesso ? fmtDataHora(row.original.ultimoAcesso) : "—"}
        </span>
      ),
    },
    {
      accessorKey: "ativo",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge status={row.original.ativo ? "ok" : "neutro"} label={row.original.ativo ? "Ativo" : "Inativo"} />
      ),
    },
    {
      id: "acoes",
      header: "Ações",
      enableSorting: false,
      cell: ({ row }) => {
        const u = row.original
        const ehEu = u.id === usuarioAtual?.id
        return (
          <div className="flex items-center gap-1">
            <Button size="xs" variant="outline" onClick={() => setEditando(u)} aria-label={`Editar ${u.nome}`}>
              <Pencil className="size-3" />
              Editar
            </Button>
            <Button size="xs" variant="outline" onClick={() => setRedefinindo(u)} aria-label={`Redefinir senha de ${u.nome}`}>
              <KeyRound className="size-3" />
              Senha
            </Button>
            <Button
              size="xs"
              variant="outline"
              disabled={alterarStatus.isPending || (u.ativo && ehEu)}
              title={u.ativo && ehEu ? "Você não pode desativar a própria conta." : undefined}
              onClick={() => aoAlterarStatus(u)}
              aria-label={`${u.ativo ? "Desativar" : "Ativar"} ${u.nome}`}
            >
              <Power className="size-3" />
              {u.ativo ? "Desativar" : "Ativar"}
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <Section
      title="Usuários"
      info="Lista de pessoas com acesso ao sistema. Aqui você cria novos usuários, edita seus dados, redefine senhas e ativa ou desativa o acesso. Cada usuário tem um perfil que define o que ele pode fazer: operador, gestor ou equipe de TI."
      description="Controle de acesso baseado em perfis (operadores, gestores e equipe de TI)."
      action={
        <Button size="sm" onClick={() => setCriando(true)}>
          <UserPlus className="size-4" /> Novo usuário
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar nome ou e-mail…"
          className="w-full max-w-xs"
          aria-label="Buscar usuário"
        />
        <Select value={perfilFiltro} onValueChange={setPerfilFiltro}>
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
        <Select value={ativoFiltro} onValueChange={setAtivoFiltro}>
          <SelectTrigger size="sm" aria-label="Filtrar por status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os status</SelectItem>
            <SelectItem value="ativos">Ativos</SelectItem>
            <SelectItem value="inativos">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {usuariosQuery.isError ? (
        <ErroConsulta
          mensagem="Não foi possível carregar os usuários."
          onTentarNovamente={() => usuariosQuery.refetch()}
        />
      ) : !usuariosQuery.data ? (
        <div className="flex justify-center py-20">
          <Spinner size={40} label="Carregando usuários" />
        </div>
      ) : usuariosQuery.data.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Nenhum usuário para os filtros selecionados.
        </p>
      ) : (
        <AreaAtualizavel atualizando={usuariosQuery.isFetching}>
          <DataTable columns={columns} data={usuariosQuery.data} pageSize={10} />
        </AreaAtualizavel>
      )}

      <UsuarioFormDialog open={criando} onOpenChange={setCriando} />
      <UsuarioFormDialog
        open={editando !== null}
        onOpenChange={(aberto) => !aberto && setEditando(null)}
        usuario={editando}
      />
      <RedefinirSenhaDialog
        open={redefinindo !== null}
        onOpenChange={(aberto) => !aberto && setRedefinindo(null)}
        usuario={redefinindo}
      />
    </Section>
  )
}

/** Cadastros do catálogo (RF-DAD-06, perfil TI): CRUD de unidades e de insumos por categoria. */
function AbaCadastros() {
  const unidades = useUnidades()
  const insumos = useInsumos()
  const alterarStatusUnidade = useAlterarStatusUnidade()

  const [criandoUnidade, setCriandoUnidade] = useState(false)
  const [editandoUnidade, setEditandoUnidade] = useState<Unidade | null>(null)
  const [criandoInsumo, setCriandoInsumo] = useState(false)
  const [categoriaAberta, setCategoriaAberta] = useState<CategoriaInsumo | null>(null)

  function aoAlterarStatusUnidade(u: Unidade) {
    alterarStatusUnidade.mutate(
      { id: u.id, ativo: !u.ativo },
      {
        onSuccess: () => toast.success(u.ativo ? "Unidade desativada." : "Unidade ativada."),
        onError: (e) =>
          toast.error(e instanceof ApiError ? e.message : "Erro inesperado. Tente novamente."),
      },
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Section
        title="Unidades da rede EMSERH"
        info="Cadastro das unidades de saúde da rede. Você pode adicionar novas unidades, editar seus dados (como município, porte e número de leitos) e ativar ou desativar cada uma."
        action={
          <Button size="sm" onClick={() => setCriandoUnidade(true)}>
            <Plus className="size-4" /> Nova unidade
          </Button>
        }
        noPadding
      >
        {unidades.isError ? (
          <div className="p-5">
            <ErroConsulta mensagem="Não foi possível carregar as unidades." onTentarNovamente={() => unidades.refetch()} />
          </div>
        ) : !unidades.data ? (
          <div className="flex justify-center py-12"><Spinner size={32} label="Carregando unidades" /></div>
        ) : (
          <div className="divide-y">
            {unidades.data.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-2 px-5 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{u.nome}</p>
                    {!u.ativo && <StatusBadge status="neutro" label="Inativa" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{u.municipio} · {u.porte} · {fmtNum(u.leitos)} leitos</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Badge variant="outline" className="text-[10px]">{u.sigla}</Badge>
                  <Button size="xs" variant="outline" onClick={() => setEditandoUnidade(u)} aria-label={`Editar ${u.nome}`}>
                    <Pencil className="size-3" />
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    disabled={alterarStatusUnidade.isPending}
                    onClick={() => aoAlterarStatusUnidade(u)}
                    aria-label={`${u.ativo ? "Desativar" : "Ativar"} ${u.nome}`}
                  >
                    <Power className="size-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Categorias de insumo & itens"
        info="Catálogo de insumos organizado por categoria (grupos de remédios com finalidade parecida). Clique numa categoria para ver e gerenciar os insumos dela, ou use o botão para cadastrar um novo item."
        description="Clique numa categoria para ver e gerenciar os itens."
        action={
          <Button size="sm" onClick={() => setCriandoInsumo(true)}>
            <Plus className="size-4" /> Novo insumo
          </Button>
        }
        noPadding
      >
        {insumos.isError ? (
          <div className="p-5">
            <ErroConsulta mensagem="Não foi possível carregar o catálogo." onTentarNovamente={() => insumos.refetch()} />
          </div>
        ) : !insumos.data ? (
          <div className="flex justify-center py-12"><Spinner size={32} label="Carregando catálogo" /></div>
        ) : (
          <div className="divide-y">
            {categoriasInsumo.map((f) => {
              const n = insumos.data.filter((m) => m.categoria === f).length
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setCategoriaAberta(f)}
                  className="flex w-full cursor-pointer items-center justify-between px-5 py-3 text-left transition-colors hover:bg-muted/50"
                >
                  <p className="text-sm font-medium">{f}</p>
                  <span className="tabular text-xs text-muted-foreground">{fmtNum(n)} item(ns)</span>
                </button>
              )
            })}
          </div>
        )}
      </Section>

      <UnidadeFormDialog open={criandoUnidade} onOpenChange={setCriandoUnidade} />
      <UnidadeFormDialog
        open={editandoUnidade !== null}
        onOpenChange={(aberto) => !aberto && setEditandoUnidade(null)}
        unidade={editandoUnidade}
      />
      <InsumoFormDialog open={criandoInsumo} onOpenChange={setCriandoInsumo} />
      <ItensCategoriaDialog
        open={categoriaAberta !== null}
        onOpenChange={(aberto) => !aberto && setCategoriaAberta(null)}
        categoria={categoriaAberta}
      />
    </div>
  )
}

/** Parametrização operacional — sem endpoint, mantida como referência demonstrativa. */
function AbaParametros() {
  return (
    <Section
      title="Parametrização operacional"
      info="Ajustes que controlam como o sistema faz previsões e dispara alertas — por exemplo, com quantos meses de antecedência prever a demanda ou quando avisar sobre vencimento. Apenas usuários autorizados podem alterar."
      description="Limiares, regras de redistribuição e horizontes de previsão por usuário autorizado."
    >
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
              <Input defaultValue={p.v} disabled className="w-24 tabular" />
              <span className="text-xs text-muted-foreground">{p.suf}</span>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}
