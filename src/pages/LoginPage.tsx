import { useId, useState } from "react"
import { Navigate, useLocation } from "react-router-dom"
import {
  AlertCircle,
  ArrowLeftRight,
  BellRing,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"
import { LogoEmserh } from "@/components/shared/LogoEmserh"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "@/hooks/use-theme"
import { ApiError, useAuth } from "@/context/auth"
import { cn } from "@/lib/utils"

/** Benefícios listados no painel-herói (ícone + texto curto). */
const BENEFICIOS: { icon: LucideIcon; texto: string }[] = [
  { icon: TrendingUp, texto: "Previsão de demanda em tempo real" },
  { icon: BellRing, texto: "Alertas de desabastecimento e vencimento" },
  { icon: ArrowLeftRight, texto: "Reposição e redistribuição entre unidades" },
]

export default function LoginPage() {
  const { status, login } = useAuth()
  const { theme, toggle } = useTheme()
  const location = useLocation()
  const emailId = useId()
  const senhaId = useId()
  const erroId = useId()

  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [lembrar, setLembrar] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Já autenticado: volta para a rota de origem (ou o dashboard).
  if (status === "autenticado") {
    const origem = (location.state as { from?: Location })?.from?.pathname ?? "/"
    return <Navigate to={origem} replace />
  }

  async function aoEnviar(evento: React.FormEvent) {
    evento.preventDefault()
    if (enviando) return

    // Validação no cliente: mensagens claras, sem ida ao servidor para campo vazio.
    const emailLimpo = email.trim()
    if (!emailLimpo || !senha) {
      setErro(
        !emailLimpo && !senha
          ? "Informe seu e-mail e sua senha para entrar."
          : !emailLimpo
            ? "Informe seu e-mail para entrar."
            : "Informe sua senha para entrar.",
      )
      return
    }

    setErro(null)
    setEnviando(true)
    try {
      await login(emailLimpo, senha, lembrar)
      // O redirecionamento acontece no próximo render (status vira "autenticado").
    } catch (e) {
      if (e instanceof ApiError) {
        setErro(
          e.credenciaisInvalidas
            ? "E-mail ou senha incorretos. Verifique e tente novamente."
            : e.codigo === "VALIDACAO"
              ? "Confira o e-mail e a senha e tente novamente."
              : e.message,
        )
      } else {
        setErro("Erro inesperado. Tente novamente em instantes.")
      }
      setEnviando(false)
    }
  }

  return (
    <main className="relative flex min-h-svh flex-col lg:flex-row">
      {/* Alternar tema */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggle}
        aria-label={theme === "dark" ? "Usar tema claro" : "Usar tema escuro"}
        className="absolute right-4 top-4 z-20 text-muted-foreground"
      >
        {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </Button>

      {/* Painel-herói institucional: foto do prédio esmaecida + proposta de valor (oculto no mobile) */}
      <section className="relative hidden overflow-hidden bg-sidebar text-sidebar-foreground lg:flex lg:w-[58%] lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        {/* Foto do prédio da EMSERH ao fundo */}
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/login-hero.png')" }}
        />
        {/* Overlay azul institucional: a foto fica como textura e o texto branco fica legível */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-sidebar/92 via-sidebar/90 to-[color-mix(in_oklch,var(--primary)_60%,var(--sidebar))]/88"
        />
        <div aria-hidden className="absolute inset-0 bg-grid opacity-[0.08]" />

        {/* Topo: marca */}
        <div className="relative">
          <LogoEmserh variant="compact" />
        </div>

        {/* Centro: proposta de valor + benefícios */}
        <div className="relative max-w-xl">
          <p className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-balance xl:text-5xl">
            Previsão que protege o abastecimento
          </p>
          <p className="mt-5 max-w-md text-base leading-relaxed text-sidebar-foreground/80">
            Gestão preditiva da cadeia farmacêutica da CAHOSP — previsão de demanda, controle de
            estoque por lote e alertas, em uma única plataforma.
          </p>

          <ul className="mt-9 space-y-4">
            {BENEFICIOS.map(({ icon: Icone, texto }) => (
              <li key={texto} className="flex items-center gap-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary/15 text-sidebar-primary ring-1 ring-sidebar-primary/25">
                  <Icone className="size-4.5" />
                </span>
                <span className="text-sm font-medium text-sidebar-foreground/90">{texto}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Rodapé */}
        <p className="relative text-xs text-sidebar-foreground/55">
          EMSERH · CAHOSP © 2026. Todos os direitos reservados.
        </p>
      </section>

      {/* Painel do formulário */}
      <section className="relative flex flex-1 flex-col items-center justify-center bg-background px-4 py-12 sm:px-8">
        {/* Brilho suave no topo (mobile, onde o herói não aparece) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[42svh] bg-[radial-gradient(60%_100%_at_50%_0%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_70%)] lg:hidden"
        />

        <div className="relative z-10 w-full max-w-[26rem] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:duration-500">
          {/* Marca oficial */}
          <div className="mb-7 flex flex-col items-center text-center">
            <LogoEmserh variant="full" className="w-52" />
            <p className="mt-3 text-xs font-medium text-muted-foreground">
              Smart Health · Painel de Gestão
            </p>
          </div>

          {/* Cartão de login */}
          <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm sm:p-7">
            <div className="mb-6 space-y-1">
              <h1 className="font-display text-2xl font-bold tracking-tight text-balance">
                Acesse a plataforma
              </h1>
              <p className="text-sm text-muted-foreground">
                Gestão preditiva da cadeia farmacêutica.
              </p>
            </div>

            <form onSubmit={aoEnviar} noValidate className="space-y-4">
              {erro && (
                <div
                  id={erroId}
                  role="alert"
                  className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{erro}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor={emailId}>E-mail</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id={emailId}
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoFocus
                    required
                    placeholder="nome@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={enviando}
                    aria-invalid={erro ? true : undefined}
                    aria-describedby={erro ? erroId : undefined}
                    className="h-11 pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={senhaId}>Senha</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id={senhaId}
                    name="password"
                    type={mostrarSenha ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="Sua senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    disabled={enviando}
                    aria-invalid={erro ? true : undefined}
                    aria-describedby={erro ? erroId : undefined}
                    className="h-11 pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha((v) => !v)}
                    disabled={enviando}
                    aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                    aria-pressed={mostrarSenha}
                    className={cn(
                      "absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors",
                      "hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50",
                    )}
                  >
                    {mostrarSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <Label htmlFor={`${senhaId}-lembrar`} className="cursor-pointer text-muted-foreground">
                  <Switch
                    id={`${senhaId}-lembrar`}
                    checked={lembrar}
                    onCheckedChange={setLembrar}
                    disabled={enviando}
                  />
                  Manter conectado
                </Label>
              </div>

              <Button type="submit" size="lg" disabled={enviando} className="mt-1 w-full">
                {enviando ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Entrando…
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </div>

          {/* Notas institucionais */}
          <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 shrink-0 text-teal" />
            Acesso restrito e auditado conforme a LGPD.
          </p>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            EMSERH · CAHOSP · Plataforma de gestão preditiva farmacêutica
          </p>
        </div>
      </section>
    </main>
  )
}
