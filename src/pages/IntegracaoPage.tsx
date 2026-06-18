import { useState } from "react"
import { toast } from "sonner"
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  KeyRound,
  Link2,
  type LucideIcon,
  Mail,
  MessageCircle,
  Plug,
  Save,
  Send,
} from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

// Tela ilustrativa (demonstração de UX) — não há backend nem persistência. Cada canal abre uma
// subtela de configuração com os campos típicos; "Salvar" apenas confirma visualmente (toast).

type CanalId = "emserh" | "whatsapp" | "telegram" | "email"

interface Canal {
  id: CanalId
  nome: string
  descricao: string
  icon: LucideIcon
  /** Classes de cor do ícone (fundo + texto), uma identidade por canal. */
  cor: string
}

const canais: Canal[] = [
  {
    id: "emserh",
    nome: "EMSERH",
    descricao: "Barramento de integração com os sistemas da EMSERH (FarmaWeb, e-SUS).",
    icon: Building2,
    cor: "bg-primary/10 text-primary ring-primary/15",
  },
  {
    id: "whatsapp",
    nome: "WhatsApp",
    descricao: "Notificações e alertas operacionais via WhatsApp.",
    icon: MessageCircle,
    cor: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/15 dark:text-emerald-400",
  },
  {
    id: "telegram",
    nome: "Telegram",
    descricao: "Bot do Telegram para alertas e comandos rápidos.",
    icon: Send,
    cor: "bg-sky-500/10 text-sky-600 ring-sky-500/15 dark:text-sky-400",
  },
  {
    id: "email",
    nome: "E-mail",
    descricao: "Envio de relatórios e alertas por e-mail (SMTP).",
    icon: Mail,
    cor: "bg-amber-500/10 text-amber-600 ring-amber-500/15 dark:text-amber-400",
  },
]

export default function IntegracaoPage() {
  const [selecionado, setSelecionado] = useState<CanalId | null>(null)
  const canal = canais.find((c) => c.id === selecionado) ?? null

  return (
    <>
      <PageHeader
        icon={<Plug className="size-5" />}
        title="Integração"
        info="Conecte a plataforma a canais externos para enviar e receber informações: os sistemas da EMSERH e canais de notificação como WhatsApp, Telegram e e-mail."
        description="Escolha um canal para configurar a conexão. Tela de demonstração — as configurações não são persistidas."
      />

      {canal === null ? (
        <GradeCanais aoSelecionar={setSelecionado} />
      ) : (
        <div className="space-y-6">
          <MenuCanais selecionado={canal.id} aoSelecionar={setSelecionado} aoVoltar={() => setSelecionado(null)} />
          <div key={canal.id} className="animate-in fade-in slide-in-from-bottom-3 duration-300">
            <ConfigCanal canal={canal} aoVoltar={() => setSelecionado(null)} />
          </div>
        </div>
      )}
    </>
  )
}

/** Estado inicial: grade de cards grandes, um por canal disponível. */
function GradeCanais({ aoSelecionar }: { aoSelecionar: (id: CanalId) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {canais.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => aoSelecionar(c.id)}
          className="group flex flex-col items-start gap-3 rounded-xl border bg-card p-5 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className={cn("flex size-12 items-center justify-center rounded-xl ring-1 transition-transform group-hover:scale-105", c.cor)}>
            <c.icon className="size-6" />
          </span>
          <div className="space-y-1">
            <p className="font-display text-base font-semibold">{c.nome}</p>
            <p className="text-xs text-muted-foreground">{c.descricao}</p>
          </div>
          <span className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            Configurar <ChevronRight className="size-3.5" />
          </span>
        </button>
      ))}
    </div>
  )
}

/** Após selecionar, os ícones viram um menu compacto para alternar entre canais. */
function MenuCanais({
  selecionado,
  aoSelecionar,
  aoVoltar,
}: {
  selecionado: CanalId
  aoSelecionar: (id: CanalId) => void
  aoVoltar: () => void
}) {
  return (
    <div className="flex animate-in fade-in slide-in-from-top-2 items-center gap-2 duration-300">
      <Button variant="ghost" size="icon-sm" onClick={aoVoltar} aria-label="Voltar para os canais">
        <ArrowLeft className="size-4" />
      </Button>
      <div className="flex flex-wrap items-center gap-2">
        {canais.map((c) => {
          const ativo = c.id === selecionado
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => aoSelecionar(c.id)}
              aria-pressed={ativo}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                ativo
                  ? "border-primary bg-primary/10 text-primary"
                  : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <c.icon className="size-4" />
              {c.nome}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Subtela de configuração do canal selecionado. */
function ConfigCanal({ canal, aoVoltar }: { canal: Canal; aoVoltar: () => void }) {
  function aoSalvar(e: React.FormEvent) {
    e.preventDefault()
    toast.success(`Configuração de ${canal.nome} salva.`)
  }

  return (
    <form
      onSubmit={aoSalvar}
      className="rounded-xl border bg-card shadow-xs"
      aria-label={`Configuração de ${canal.nome}`}
    >
      <div className="flex items-center gap-3 border-b px-5 py-4">
        <span className={cn("flex size-10 items-center justify-center rounded-lg ring-1", canal.cor)}>
          <canal.icon className="size-5" />
        </span>
        <div>
          <h2 className="font-display text-base font-semibold">Configurar {canal.nome}</h2>
          <p className="text-xs text-muted-foreground">{canal.descricao}</p>
        </div>
      </div>

      <div className="space-y-5 p-5">
        {canal.id === "emserh" && <FormEmserh />}
        {canal.id === "whatsapp" && <FormWhatsApp />}
        {canal.id === "telegram" && <FormTelegram />}
        {canal.id === "email" && <FormEmail />}
      </div>

      <div className="flex justify-end gap-2 border-t px-5 py-4">
        <Button type="button" variant="outline" onClick={aoVoltar}>
          Cancelar
        </Button>
        <Button type="submit">
          <Save className="size-4" /> Salvar configuração
        </Button>
      </div>
    </form>
  )
}

// ── Campos reutilizáveis ───────────────────────────────────────────────────

function Campo({
  id,
  rotulo,
  children,
  dica,
}: {
  id: string
  rotulo: string
  children: React.ReactNode
  dica?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{rotulo}</Label>
      {children}
      {dica && <p className="text-xs text-muted-foreground">{dica}</p>}
    </div>
  )
}

function CampoTexto({
  id,
  rotulo,
  placeholder,
  tipo = "text",
  dica,
}: {
  id: string
  rotulo: string
  placeholder?: string
  tipo?: string
  dica?: string
}) {
  return (
    <Campo id={id} rotulo={rotulo} dica={dica}>
      <Input id={id} type={tipo} placeholder={placeholder} autoComplete="off" />
    </Campo>
  )
}

function LinhaAtivo({ id, rotulo = "Integração ativa" }: { id: string; rotulo?: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <Label htmlFor={id} className="cursor-pointer">
        {rotulo}
      </Label>
      <Switch id={id} defaultChecked aria-label={rotulo} />
    </div>
  )
}

// ── Formulários por canal ──────────────────────────────────────────────────

function FormEmserh() {
  return (
    <>
      <CampoTexto
        id="emserh-url"
        rotulo="URL base da API"
        placeholder="https://api.emserh.ma.gov.br/farmaweb"
        dica="Endpoint do barramento de integração da EMSERH."
      />
      <CampoTexto id="emserh-key" rotulo="Chave de API" tipo="password" placeholder="••••••••••••" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="emserh-sync" rotulo="Intervalo de sincronização">
          <select
            id="emserh-sync"
            defaultValue="15"
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="5">A cada 5 minutos</option>
            <option value="15">A cada 15 minutos</option>
            <option value="30">A cada 30 minutos</option>
            <option value="60">A cada 1 hora</option>
          </select>
        </Campo>
        <CampoTexto id="emserh-unidade" rotulo="Código da unidade" placeholder="CAHOSP-001" />
      </div>
      <LinhaAtivo id="emserh-ativo" />
    </>
  )
}

const provedoresWhatsapp = [
  { id: "evolution", nome: "Evolution API", desc: "Gateway não oficial baseado na Evolution API." },
  { id: "baileys", nome: "Baileys", desc: "Conexão direta via biblioteca Baileys (QR Code)." },
  { id: "oficial", nome: "API Oficial", desc: "WhatsApp Cloud API oficial (Meta)." },
] as const

type ProvedorWhatsapp = (typeof provedoresWhatsapp)[number]["id"]

function FormWhatsApp() {
  const [provedor, setProvedor] = useState<ProvedorWhatsapp>("evolution")
  const ativo = provedoresWhatsapp.find((p) => p.id === provedor)!

  return (
    <>
      <Campo id="wa-provedor" rotulo="Provedor de conexão">
        <div className="grid gap-2 sm:grid-cols-3" role="group" aria-label="Provedor de conexão">
          {provedoresWhatsapp.map((p) => {
            const sel = p.id === provedor
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setProvedor(p.id)}
                aria-pressed={sel}
                className={cn(
                  "rounded-lg border p-3 text-left text-sm transition-colors",
                  sel ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "hover:bg-muted",
                )}
              >
                <p className="font-medium">{p.nome}</p>
              </button>
            )
          })}
        </div>
        <p className="text-xs text-muted-foreground">{ativo.desc}</p>
      </Campo>

      {provedor === "evolution" && (
        <>
          <CampoTexto id="wa-evo-url" rotulo="URL da instância" placeholder="https://evolution.suaempresa.com" />
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoTexto id="wa-evo-inst" rotulo="Nome da instância" placeholder="cahosp" />
            <CampoTexto id="wa-evo-key" rotulo="API Key" tipo="password" placeholder="••••••••" />
          </div>
        </>
      )}

      {provedor === "baileys" && (
        <>
          <CampoTexto id="wa-bai-sessao" rotulo="Nome da sessão" placeholder="cahosp-alertas" />
          <CampoTexto
            id="wa-bai-webhook"
            rotulo="Webhook de eventos"
            placeholder="https://app.cahosp.ma.gov.br/webhooks/whatsapp"
            dica="Após salvar, a conexão exige a leitura de um QR Code para parear o número."
          />
        </>
      )}

      {provedor === "oficial" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoTexto id="wa-of-phone" rotulo="Phone Number ID" placeholder="1234567890" />
            <CampoTexto id="wa-of-business" rotulo="WhatsApp Business Account ID" placeholder="0987654321" />
          </div>
          <CampoTexto id="wa-of-token" rotulo="Token permanente" tipo="password" placeholder="EAAG••••••••" />
          <CampoTexto id="wa-of-verify" rotulo="Token de verificação do webhook" placeholder="cahosp-verify" />
        </>
      )}

      <LinhaAtivo id="wa-ativo" />
    </>
  )
}

function FormTelegram() {
  return (
    <>
      <CampoTexto
        id="tg-token"
        rotulo="Bot Token"
        tipo="password"
        placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
        dica="Token gerado pelo @BotFather ao criar o bot."
      />
      <CampoTexto id="tg-chat" rotulo="Chat ID" placeholder="-1001234567890" dica="ID do grupo ou canal que receberá os alertas." />
      <LinhaAtivo id="tg-ativo" />
    </>
  )
}

function FormEmail() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
        <CampoTexto id="email-host" rotulo="Servidor SMTP" placeholder="smtp.suaempresa.com" />
        <CampoTexto id="email-porta" rotulo="Porta" tipo="number" placeholder="587" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="email-user" rotulo="Usuário">
          <div className="relative">
            <KeyRound className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="email-user" className="pl-8" placeholder="alertas@cahosp.ma.gov.br" autoComplete="off" />
          </div>
        </Campo>
        <CampoTexto id="email-senha" rotulo="Senha" tipo="password" placeholder="••••••••" />
      </div>
      <Campo id="email-remetente" rotulo="Remetente (From)">
        <div className="relative">
          <Link2 className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="email-remetente" className="pl-8" placeholder="CAHOSP <alertas@cahosp.ma.gov.br>" autoComplete="off" />
        </div>
      </Campo>
      <div className="grid gap-3 sm:grid-cols-2">
        <LinhaAtivo id="email-tls" rotulo="Conexão segura (TLS)" />
        <LinhaAtivo id="email-ativo" />
      </div>
    </>
  )
}
